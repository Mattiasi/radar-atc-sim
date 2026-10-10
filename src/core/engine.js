import { state, radarLayerState } from './state.js';
import { latCentro, lonCentro, correcaoLon, calcularRumoDistancia, geoParaDelta, deltaParaGeo } from '../utils/utils.js';
import { fixosNavegacao, aerodromos, verticesSetor, ROTA_OGTAL, ROTA_PRUMO, obterTrajetoriaCompletaAteFixo, obterNiveisSpawn, isFixoDeCabeceiraAtiva, obterDestinoPorFixoECarta, cartasNavegacao } from '../data/data.js';
import { Aeronave } from './Aeronave.js';

/**
 * Converte coordenadas geográficas (Latitude/Longitude) de um fixo num sistema cartesiano local.
 * Salva a diferença (delta) em relação ao centro do radar (SBSP) convertida via geoParaDelta
 * para alinhar perfeitamente com a orientação magnética (Norte Magnético para cima) e a pista 17R.
 * @param {string} nome - Nome do fixo (ex: "OGTAL")
 * @param {number} latFixo - Latitude em formato decimal
 * @param {number} lonFixo - Longitude em formato decimal
 */
export function registrarPonto(nome, latFixo, lonFixo) {
    state.fixos[nome] = geoParaDelta(latFixo, lonFixo);
}

/**
 * Carrega a base de dados do espaço aéreo e regista todos os fixos, aeródromos e o aeroporto principal
 * no estado global do simulador. Deve ser chamada uma única vez na inicialização.
 */
export function inicializarEspacoAereo() {
    fixosNavegacao.forEach(p => registrarPonto(p.nome, p.lat, p.lon));
    aerodromos.forEach(p => registrarPonto(p.nome, p.lat, p.lon));
    verticesSetor.forEach(p => registrarPonto(p.nome, p.lat, p.lon));
    registrarPonto("SBSP", latCentro, lonCentro); 
}

/**
 * Função geométrica complexa que "caminha para trás" numa rota para descobrir
 * a coordenada exata de spawn (nascimento) de uma aeronave.
 * Ex: Onde fica um ponto exatamente a 15NM antes de OGTAL na rota ROTA_OGTAL?
 * Se milhasDesejadas <= 0, o ponto retornado é exatamente no fixo alvo, apontando para o próximo fixo.
 * 
 * @param {Array} caminhoArray - Array com a sequência de fixos da rota
 * @param {string} fixoAlvo - O fixo de referência (ex: "OGTAL")
 * @param {number} milhasDesejadas - Distância em milhas náuticas a recuar
 * @returns {Object|null} Coordenadas (lat, lon), rumo inicial e próximo fixo (wpIndex)
 */
export function calcularPontoNaMilhagem(caminhoArray, fixoAlvo, milhasDesejadas) {
    let idx = caminhoArray.indexOf(fixoAlvo);
    if (idx === -1) return null;

    // Se milhasDesejadas for 0 ou negativo, nasce exatamente em cima do fixo alvo
    if (milhasDesejadas <= 0) {
        let pAtual = state.fixos[caminhoArray[idx]];
        if (!pAtual) return null;
        let proximoIdx = (idx + 1 < caminhoArray.length) ? idx + 1 : idx;
        let pProximo = state.fixos[caminhoArray[proximoIdx]];
        let rumo = 0;
        if (pProximo && pProximo !== pAtual) {
            rumo = parseInt(calcularRumoDistancia(pAtual, pProximo).rumo, 10);
        } else if (idx > 0 && state.fixos[caminhoArray[idx - 1]]) {
            rumo = parseInt(calcularRumoDistancia(state.fixos[caminhoArray[idx - 1]], pAtual).rumo, 10);
        }
        let ptGeo = deltaParaGeo(pAtual.deltaLat, pAtual.deltaLon);
        return {
            lat: ptGeo.lat,
            lon: ptGeo.lon,
            rumo: rumo,
            wpIndex: proximoIdx
        };
    }

    let accDist = 0; // Distância acumulada durante a contagem regressiva
    let pAtual = state.fixos[caminhoArray[idx]];

    // Loop regressivo: percorre a rota de trás para a frente a partir do fixo alvo
    for (let i = idx - 1; i >= 0; i--) {
        let pProximo = state.fixos[caminhoArray[i]];
        
        // Calcula a distância do segmento atual usando Pitágoras (ajustado para a curvatura da Terra)
        let dLat = pProximo.deltaLat - pAtual.deltaLat;
        let dLon = pProximo.deltaLon - pAtual.deltaLon;
        let distSeg = Math.sqrt(Math.pow(dLat * 60, 2) + Math.pow(dLon * correcaoLon * 60, 2));

        // Se o ponto desejado cai exatamente no meio deste segmento
        if (accDist + distSeg >= milhasDesejadas) {
            let proporcao = (milhasDesejadas - accDist) / distSeg;
            
            // Interpolação linear para encontrar o X e Y exatos
            let ptDelta = {
                deltaLat: pAtual.deltaLat + dLat * proporcao,
                deltaLon: pAtual.deltaLon + dLon * proporcao
            };
            
            // Calcula qual deve ser a proa do avião ao nascer neste ponto
            let navInfo = calcularRumoDistancia(ptDelta, pAtual);
            let ptGeo = deltaParaGeo(ptDelta.deltaLat, ptDelta.deltaLon);
            return {
                lat: ptGeo.lat,
                lon: ptGeo.lon,
                rumo: parseInt(navInfo.rumo, 10),
                wpIndex: i + 1 // Diz ao avião qual é o próximo fixo que ele deve focar
            };
        }
        accDist += distSeg;
        pAtual = pProximo;
    }

    // Fallback: Se faltou rota para recuar (ex: pediu 30NM mas a rota só tem 20NM),
    // o código projeta uma linha reta imaginária para trás do primeiro fixo
    if (accDist < milhasDesejadas) {
        let pProximo = state.fixos[caminhoArray[0]];
        let pDepois = state.fixos[caminhoArray[1]];
        let dLat = pProximo.deltaLat - pDepois.deltaLat;
        let dLon = pProximo.deltaLon - pDepois.deltaLon;
        let distSeg = Math.sqrt(Math.pow(dLat * 60, 2) + Math.pow(dLon * correcaoLon * 60, 2));

        let proporcaoExtra = (milhasDesejadas - accDist) / distSeg;
        let ptDelta = {
            deltaLat: pProximo.deltaLat + dLat * proporcaoExtra,
            deltaLon: pProximo.deltaLon + dLon * proporcaoExtra
        };
        let navInfo = calcularRumoDistancia(ptDelta, pProximo);
        let ptGeo = deltaParaGeo(ptDelta.deltaLat, ptDelta.deltaLon);
        return {
            lat: ptGeo.lat,
            lon: ptGeo.lon,
            rumo: parseInt(navInfo.rumo, 10),
            wpIndex: 0 
        };
    }
    return null;
}

/**
 * Gera dados aleatórios para novos aviões.
 * Cria 75% de tráfego comercial (Cias Aéreas) e 25% de Aviação Geral (Jatinhos/Turboélices).
 * @returns {Object} { callsign, tipo }
 */
export function gerarDadosAeronave() {
    const isComercial = Math.random() > 0.25; // 75% de probabilidade de ser verdadeiro
    let callsign, tipo;
    
    if (isComercial) {
        const cias = ["GLO", "TAM", "AZU"];
        callsign = cias[Math.floor(Math.random() * cias.length)] + Math.floor(1000 + Math.random() * 9000);
        const tiposComerciais = ["A320", "A20N", "B738", "E195", "E295"];
        tipo = tiposComerciais[Math.floor(Math.random() * tiposComerciais.length)];
    } else {
        const prefixos = ["PT", "PR", "PS"];
        const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let sufixo = "";
        for(let i = 0; i < 3; i++) {
            sufixo += letras.charAt(Math.floor(Math.random() * letras.length));
        }
        callsign = prefixos[Math.floor(Math.random() * prefixos.length)] + sufixo;
        const tiposGA = ["BE40", "C25A", "E50P", "E55P", "B350", "BE20", "BE9L"];
        tipo = tiposGA[Math.floor(Math.random() * tiposGA.length)];
    }
    return { callsign, tipo };
}

/**
 * Injeta o primeiro tráfego no simulador ao carregar a página.
 * O cenário define se nasce um avião no Norte (0), no Oeste (1), ou em ambos (2).
 */
export function carregarTrafegoTeste() {
    if (!state.configFluxo || !Array.isArray(state.configFluxo.esteiras)) return;

    state.configFluxo.esteiras.forEach(esteira => {
        if (!esteira.ativo) return;
        const partes = esteira.fixo.split('|');
        const fixoAlvo = partes[0];
        const destino = partes[1] || state.aeroIdAtivo;
        const cartaNome = partes[2] || null;
        
        // Impede spawn se a cabeceira da carta não estiver ativa no vídeo mapa
        if (!isFixoDeCabeceiraAtiva(fixoAlvo, destino, cartaNome)) return;

        if (!state.fixos[fixoAlvo]) return;

        const { rotaCompleta } = obterTrajetoriaCompletaAteFixo(fixoAlvo, destino, cartaNome);
        if (rotaCompleta && rotaCompleta.length > 0) {
            let spawnPt = calcularPontoNaMilhagem(rotaCompleta, fixoAlvo, 0);
            if (spawnPt) {
                let vel = Math.floor(Math.random() * (250 - 230 + 1)) + 230; 
                let dados = gerarDadosAeronave();
                const niveis = obterNiveisSpawn(fixoAlvo, rotaCompleta, destino, cartaNome);
                let aero = new Aeronave(
                    dados.callsign, dados.tipo, 
                    spawnPt.lat, spawnPt.lon, spawnPt.rumo, vel, 
                    niveis.nivAtual, niveis.nivAutorizado, destino, "", rotaCompleta, spawnPt.wpIndex, cartaNome
                );
                aero.esteiraId = esteira.id;
                aero.fixoOrigem = fixoAlvo;
                aero.rotaOriginal = fixoAlvo;
                aero.dest = destino;
                aero.cartaNome = cartaNome;
                state.aeronaves.push(aero);
            }
        }
    });
}

/**
 * O coração da geração contínua de tráfego (Spawning System Data-Driven).
 * Lê as esteiras ativas configuradas no Painel de Fluxo e cria um novo avião
 * sempre que o avião da frente cruza o fixo de referência, simulando uma fila de espera/esteira contínua
 * perfeitamente alinhada na trajetória da carta e com a separação configurada.
 */
export function gerenciarEsteiraDeTrafego() {
    if (!state.configFluxo || !Array.isArray(state.configFluxo.esteiras)) return;

    state.configFluxo.esteiras.forEach(esteira => {
        if (!esteira.ativo) return;
        const partes = esteira.fixo.split('|');
        const fixoAlvo = partes[0];
        const cartaNome = partes[2] || null;
        let destino = (partes[1] && cartasNavegacao && cartasNavegacao[partes[1]]) 
            ? partes[1] 
            : obterDestinoPorFixoECarta(fixoAlvo, cartaNome);
        if (!destino) destino = "SBSP";
        
        if (!state.fixos[fixoAlvo]) return;

        // Impede spawn e avanço de esteira se a cabeceira da carta não estiver ativa no vídeo mapa
        if (!isFixoDeCabeceiraAtiva(fixoAlvo, destino, cartaNome)) return;

        let vivosNestaEsteira = false;
        let gerouSucessorNesteTick = false;

        // 1. Loop por todas as aeronaves para verificar gatilho de spawn
        state.aeronaves.forEach(aero => {
            const pertenceAEsteira = ((aero.esteiraId === esteira.id && aero.fixoOrigem === fixoAlvo) || (!aero.esteiraId && aero.fixoOrigem === fixoAlvo));

            if (pertenceAEsteira && !aero.pousou) {
                // Apenas aeronaves que AINDA NÃO cruzaram o fixo contam como vivas na fila de espera da esteira
                if (!aero.gerouSucessor) {
                    let distTrigger = calcularRumoDistancia(aero, state.fixos[fixoAlvo]).distanciaNM;
                    if (aero.distTriggerAnt === undefined) aero.distTriggerAnt = distTrigger;

                    // Critérios robustos para detectar que a aeronave cruzou ou liberou o fixo de entrada:
                    // 1. Passou a menos de 1.5 NM do fixo
                    // 2. O índice de waypoint na rota já avançou além do fixo alvo (fly-by completado no LNAV)
                    // 3. Afastando do fixo após ponto de aproximação mínima
                    // 4. Foi vetorada fora da rota (não está mais em LNAV) ou instruída direto para outro fixo (wpOffRoute)
                    // 5. Já está a mais que a separação configurada de distância e se afastando
                    const idxFixoAlvo = (aero.rota && Array.isArray(aero.rota)) ? aero.rota.indexOf(fixoAlvo) : -1;
                    const jaAvancouWp = (idxFixoAlvo !== -1 && aero.wpIndex > idxFixoAlvo);
                    const foiVetorada = (!aero.modoLNAV || aero.wpOffRoute !== null);
                    const afastandoAposPassagem = (distTrigger > aero.distTriggerAnt && aero.distTriggerAnt < (esteira.separacao || 15));
                    const foraDaEsteira = (distTrigger > (esteira.separacao || 15) + 3.0 && distTrigger > aero.distTriggerAnt);

                    let passou = false;
                    if (distTrigger <= 1.5) {
                        passou = true;
                    } else if (jaAvancouWp) {
                        passou = true;
                    } else if (afastandoAposPassagem) {
                        passou = true;
                    } else if (foiVetorada) {
                        passou = true;
                    } else if (foraDaEsteira) {
                        passou = true;
                    }

                    aero.distTriggerAnt = distTrigger;

                    if (passou) {
                        aero.gerouSucessor = true;
                        gerouSucessorNesteTick = true;
                        vivosNestaEsteira = true;

                        // Se a esteira estiver ativa, gera o sucessor respeitando a separação
                        if (esteira.ativo) {
                            const destFinal = aero.dest || destino;
                            const { rotaCompleta } = obterTrajetoriaCompletaAteFixo(fixoAlvo, destFinal, cartaNome);
                            if (rotaCompleta && rotaCompleta.length > 0) {
                                let margem = Math.random() * 2.0;
                                let separacaoReal = (esteira.separacao || 15) + margem;
                                let spawnPt = calcularPontoNaMilhagem(rotaCompleta, fixoAlvo, separacaoReal);

                                if (spawnPt) {
                                    let vel = Math.floor(Math.random() * (250 - 230 + 1)) + 230;
                                    let dados = gerarDadosAeronave();
                                    const targetWp = rotaCompleta[spawnPt.wpIndex] || fixoAlvo;
                                    const niveis = obterNiveisSpawn(targetWp, rotaCompleta, destFinal, cartaNome);
                                    let novaAero = new Aeronave(
                                        dados.callsign, dados.tipo,
                                        spawnPt.lat, spawnPt.lon, spawnPt.rumo, vel,
                                        niveis.nivAtual, niveis.nivAutorizado, destFinal, "", rotaCompleta, spawnPt.wpIndex, cartaNome
                                    );
                                    novaAero.esteiraId = esteira.id;
                                    novaAero.fixoOrigem = fixoAlvo;
                                    novaAero.rotaOriginal = fixoAlvo;
                                    novaAero.dest = destFinal;
                                    novaAero.cartaNome = cartaNome;
                                    state.aeronaves.push(novaAero);
                                }
                            }
                        }
                    } else {
                        // Aeronave ainda a caminho do fixo
                        vivosNestaEsteira = true;
                    }
                }
            }
        });

        // 2. Injeção de Aeronave Inicial:
        // APENAS se a esteira está ligada, não há sucessor gerado neste tick, não há ninguém aguardando cruzar o fixo,
        // E NÃO EXISTE NENHUMA AERONAVE PRÓXIMA DO MARCO ZERO (< 6 NM).
        const temAeroNoMarcoZero = state.aeronaves.some(a => {
            if (a.pousou) return false;
            if (!state.fixos[fixoAlvo]) return false;
            const d = calcularRumoDistancia(a, state.fixos[fixoAlvo]).distanciaNM;
            return d < 6.0;
        });

        if (esteira.ativo && !vivosNestaEsteira && !gerouSucessorNesteTick && !temAeroNoMarcoZero) {
            const { rotaCompleta } = obterTrajetoriaCompletaAteFixo(fixoAlvo, destino, cartaNome);
            if (rotaCompleta && rotaCompleta.length > 0) {
                let spawnPt = calcularPontoNaMilhagem(rotaCompleta, fixoAlvo, 0); // Spawna no marco zero
                if (spawnPt) {
                    let dados = gerarDadosAeronave();
                    const niveis = obterNiveisSpawn(fixoAlvo, rotaCompleta, destino, cartaNome);
                    let novaAero = new Aeronave(
                        dados.callsign, dados.tipo,
                        spawnPt.lat, spawnPt.lon, spawnPt.rumo, 240,
                        niveis.nivAtual, niveis.nivAutorizado, destino, "", rotaCompleta, spawnPt.wpIndex, cartaNome
                    );
                    novaAero.esteiraId = esteira.id;
                    novaAero.fixoOrigem = fixoAlvo;
                    novaAero.rotaOriginal = fixoAlvo;
                    novaAero.dest = destino;
                    novaAero.cartaNome = cartaNome;
                    state.aeronaves.push(novaAero);
                }
            }
        }
    });
}

// --- DEPARTURES ENGINE ---
export function obterAerodromosAtivosDEP() {
    const todos = ['SBGR', 'SBKP', 'SBSP'];
    const ativos = new Set();

    if (radarLayerState && radarLayerState.activeRunways && radarLayerState.activeRunways.size > 0) {
        for (const rwyKey of radarLayerState.activeRunways) {
            for (const aero of todos) {
                if (rwyKey.startsWith(aero)) {
                    ativos.add(aero);
                }
            }
        }
    }

    if (radarLayerState && radarLayerState.activeCharts && radarLayerState.activeCharts.size > 0) {
        for (const aero of todos) {
            const aerodromoCartas = cartasNavegacao[aero];
            if (aerodromoCartas) {
                for (const cabeceira of Object.values(aerodromoCartas)) {
                    if (cabeceira.SID) {
                        for (const [sKey, sObj] of Object.entries(cabeceira.SID)) {
                            if (radarLayerState.activeCharts.has(sObj.nome) || radarLayerState.activeCharts.has(sKey)) {
                                ativos.add(aero);
                            }
                        }
                    }
                }
            }
        }
    }

    if (ativos.size === 0) {
        ativos.add(state.configDep.aerodromoSelecionado || 'SBGR');
    }

    return Array.from(ativos);
}

export function obterPistaAtivaParaDEP(aeroId) {
    const aerodromoCartas = cartasNavegacao[aeroId] || {};
    const todasPistasComSID = Object.keys(aerodromoCartas).filter(p => aerodromoCartas[p].SID && Object.keys(aerodromoCartas[p].SID).length > 0);
    if (todasPistasComSID.length === 0) return null;

    // 1. Prioriza cartas SID ativas no Vídeo Mapa
    if (radarLayerState && radarLayerState.activeCharts && radarLayerState.activeCharts.size > 0) {
        for (const pista of todasPistasComSID) {
            const sids = aerodromoCartas[pista].SID || {};
            for (const [sKey, sObj] of Object.entries(sids)) {
                if (radarLayerState.activeCharts.has(sObj.nome) || radarLayerState.activeCharts.has(sKey)) {
                    return pista;
                }
            }
        }
    }

    // 2. Prioriza cabeceiras/pistas ativas no Vídeo Mapa
    if (radarLayerState && radarLayerState.activeRunways && radarLayerState.activeRunways.size > 0) {
        const pistasAtivas = todasPistasComSID.filter(rwyKey => {
            const numPista = rwyKey.replace(/[^0-9]/g, '');
            const groupKey = `${aeroId}-${numPista}`;
            const runwayKey = `${aeroId}-${rwyKey}`;
            return radarLayerState.activeRunways.has(groupKey) || radarLayerState.activeRunways.has(runwayKey);
        });
        if (pistasAtivas.length > 0) {
            return pistasAtivas[Math.floor(Math.random() * pistasAtivas.length)];
        }
    }

    return todasPistasComSID[Math.floor(Math.random() * todasPistasComSID.length)];
}

export function obterSidsDisponiveisParaDEP(aeroId) {
    if (!aeroId || !cartasNavegacao[aeroId]) return [];

    const aerodromoCartas = cartasNavegacao[aeroId];
    const todasPistasComSID = Object.keys(aerodromoCartas).filter(p => aerodromoCartas[p].SID && Object.keys(aerodromoCartas[p].SID).length > 0);
    if (todasPistasComSID.length === 0) return [];

    // Filtra pistas ativas no Vídeo Mapa para este aeródromo
    let pistasCandidatas = [];
    if (radarLayerState && radarLayerState.activeRunways && radarLayerState.activeRunways.size > 0) {
        pistasCandidatas = todasPistasComSID.filter(rwyKey => {
            const numPista = rwyKey.replace(/[^0-9]/g, '');
            const groupKey = `${aeroId}-${numPista}`;
            const runwayKey = `${aeroId}-${rwyKey}`;
            return radarLayerState.activeRunways.has(groupKey) || radarLayerState.activeRunways.has(runwayKey);
        });
    }

    // Se nenhuma pista específica do aeródromo estiver marcada no vídeo mapa,
    // verifica se alguma carta SID específica está marcada no activeCharts
    if (pistasCandidatas.length === 0 && radarLayerState && radarLayerState.activeCharts && radarLayerState.activeCharts.size > 0) {
        pistasCandidatas = todasPistasComSID.filter(pista => {
            const sids = aerodromoCartas[pista].SID || {};
            return Object.entries(sids).some(([sKey, sObj]) => radarLayerState.activeCharts.has(sObj.nome) || radarLayerState.activeCharts.has(sKey));
        });
    }

    // Fallback: se nenhuma cabeceira estiver ativa no vídeo mapa para este aeródromo,
    // considera todas as pistas com SID deste aeródromo
    if (pistasCandidatas.length === 0) {
        pistasCandidatas = todasPistasComSID;
    }

    const sidsDisponiveis = [];
    const chavesAdicionadas = new Set();

    pistasCandidatas.forEach(rwyKey => {
        const sidsObj = aerodromoCartas[rwyKey].SID || {};
        Object.entries(sidsObj).forEach(([sidKey, sidData]) => {
            if (!sidData || !sidData.nome) return;
            const chaveUnica = `${sidKey}@${rwyKey}`;
            if (!chavesAdicionadas.has(chaveUnica)) {
                chavesAdicionadas.add(chaveUnica);
                sidsDisponiveis.push({
                    key: chaveUnica,
                    sidKey: sidKey,
                    runway: rwyKey,
                    nome: sidData.nome,
                    setorSaida: sidData.setorSaida || '',
                    cor: sidData.cor || '#ff9900'
                });
            }
        });
    });

    return sidsDisponiveis;
}

window.obterSidsDisponiveisParaDEP = obterSidsDisponiveisParaDEP;

window.gerarNovaDEP = function(aerodromoAlvo = null) {
    const aeroId = aerodromoAlvo || state.configDep.aerodromoSelecionado;
    if (!aeroId) return null;

    const sidsDisponiveis = obterSidsDisponiveisParaDEP(aeroId);
    if (!sidsDisponiveis || sidsDisponiveis.length === 0) {
        console.warn(`Nenhuma SID encontrada para ${aeroId}`);
        return null;
    }

    let sidEscolhidaObj = null;
    let pistaEscolhida = null;
    let sidKeyEscolhida = null;

    const sidConfigurada = (state.configDep && state.configDep.sidSelecionadaPorAerodromo) 
        ? state.configDep.sidSelecionadaPorAerodromo[aeroId] 
        : 'AUTO';

    if (sidConfigurada && sidConfigurada !== 'AUTO') {
        const encontrada = sidsDisponiveis.find(s => s.key === sidConfigurada || s.sidKey === sidConfigurada || s.nome === sidConfigurada);
        if (encontrada) {
            pistaEscolhida = encontrada.runway;
            sidKeyEscolhida = encontrada.sidKey;
            sidEscolhidaObj = cartasNavegacao[aeroId][pistaEscolhida].SID[sidKeyEscolhida];
        }
    }

    if (!sidEscolhidaObj) {
        let candidatos = sidsDisponiveis;
        if (radarLayerState && radarLayerState.activeCharts && radarLayerState.activeCharts.size > 0) {
            const ativos = sidsDisponiveis.filter(s => radarLayerState.activeCharts.has(s.nome) || radarLayerState.activeCharts.has(s.sidKey));
            if (ativos.length > 0) {
                candidatos = ativos;
            }
        }
        const escolhida = candidatos[Math.floor(Math.random() * candidatos.length)];
        pistaEscolhida = escolhida.runway;
        sidKeyEscolhida = escolhida.sidKey;
        sidEscolhidaObj = cartasNavegacao[aeroId][pistaEscolhida].SID[sidKeyEscolhida];
    }

    if (!pistaEscolhida || !sidEscolhidaObj) {
        console.warn(`Não foi possível selecionar uma SID válida para ${aeroId}`);
        return null;
    }

    const category = ['jet', 'jet', 'jet', 'turboprop', 'piston'][Math.floor(Math.random() * 5)];
    const prefixos = ['GLO', 'TAM', 'AZU', 'ONE', 'PT'];
    const prefixo = (category === 'piston') ? 'PT' : (category === 'turboprop' ? 'AZU' : prefixos[Math.floor(Math.random() * 4)]);
    const id = prefixo + Math.floor(Math.random() * 9000 + 1000);

    let requestedFL = 260 + Math.floor(Math.random() * 14) * 10; // FL260 to FL400
    if (category === 'piston') requestedFL = 100 + Math.floor(Math.random() * 5) * 10;
    else if (category === 'turboprop') requestedFL = 180 + Math.floor(Math.random() * 9) * 10;

    const novaDEP = {
        id: id,
        aero: aeroId,
        runway: pistaEscolhida,
        sid: sidEscolhidaObj.nome,
        sidKey: sidKeyEscolhida,
        category: category,
        status: 'aguardando', // 'aguardando', 'autorizado', 'em_voo'
        requestedFL: requestedFL,
        isDep: true,
        grupoDep: sidEscolhidaObj.grupoDep,
        setorSaida: sidEscolhidaObj.setorSaida,
        altitudeRestricao: sidEscolhidaObj.altitudeRestricao,
        coordenacaoFeita: false
    };

    state.configDep.fila.push(novaDEP);
    return novaDEP;
};

window.tentarDecolar = function(dep, silencioso = false) {
    if (dep.status !== 'aguardando') return false;

    const tempoSimuladoAtual = state.tempoSimulado || (performance.now() / 1000);
    const chavePista = `${dep.aero}-${dep.runway}`;

    if (!state.configDep.ultimaDecolagemTempoSimuladoPorPista) {
        state.configDep.ultimaDecolagemTempoSimuladoPorPista = {};
    }

    let podeDecolar = true;
    let motivoBloqueio = "";

    // 1. REGRA FUNDAMENTAL: Separação mínima de pista (Runway Occupancy Separation)
    // Respeita o intervalo configurado em minutos para cada aeródromo
    const ultPistaTempo = state.configDep.ultimaDecolagemTempoSimuladoPorPista ? state.configDep.ultimaDecolagemTempoSimuladoPorPista[chavePista] : undefined;
    const intervaloMinutos = (state.configDep.intervalosPorAerodromo && state.configDep.intervalosPorAerodromo[dep.aero]) ? state.configDep.intervalosPorAerodromo[dep.aero] : 2;
    const tempoMinimoPista = intervaloMinutos * 60;
    if (ultPistaTempo !== undefined) {
        const tempoDesdeUltimaPista = tempoSimuladoAtual - ultPistaTempo;
        if (tempoDesdeUltimaPista < tempoMinimoPista) {
            podeDecolar = false;
            motivoBloqueio = `Separação de pista (${intervaloMinutos} min) - Restam ${Math.ceil(tempoMinimoPista - tempoDesdeUltimaPista)}s simulados.`;
        }
    }

    const ultima = state.configDep.ultimaAeronaveDecolada;

    // 2. REGRAS ESPECÍFICAS DE SEPARAÇÃO POR AERÓDROMO E ESTEIRA
    if (podeDecolar && ultima && ultima.aero === dep.aero) {
        const tempoDesdeUltima = tempoSimuladoAtual - (state.configDep.ultimaDecolagemTempoSimulado || 0);
        
        if (dep.aero === "SBKP") {
            const mesmoGrupo = (ultima.grupoDep === dep.grupoDep);
            if (mesmoGrupo && ultima.category === "turboprop" && dep.category === "jet") {
                if (tempoDesdeUltima < 4 * 60) {
                    podeDecolar = false;
                    motivoBloqueio = `Separação por esteira (Turbo/Jato, mesmo grupo) - Restam ${Math.ceil(4 * 60 - tempoDesdeUltima)}s simulados.`;
                }
            } else if (mesmoGrupo && ultima.category === "turboprop" && dep.category === "turboprop") {
                if (tempoDesdeUltima < 2 * 60) {
                    podeDecolar = false;
                    motivoBloqueio = `Separação por esteira (Turbo/Turbo, mesmo grupo) - Restam ${Math.ceil(2 * 60 - tempoDesdeUltima)}s simulados.`;
                }
            } else if (!mesmoGrupo && ultima.category === "piston" && (dep.category === "jet" || dep.category === "turboprop")) {
                if (tempoDesdeUltima < 3 * 60) {
                    podeDecolar = false;
                    motivoBloqueio = `Separação por esteira (Pistão -> Turbo/Jato, grupos diferentes) - Restam ${Math.ceil(3 * 60 - tempoDesdeUltima)}s simulados.`;
                }
            } else if (mesmoGrupo && ultima.category === "piston" && (dep.category === "jet" || dep.category === "turboprop")) {
                if (!dep.coordenacaoFeita) {
                    if (state.configDep.decolagemAutomatica) {
                        if (!dep.coordTimer) dep.coordTimer = tempoSimuladoAtual;
                        const elapsed = tempoSimuladoAtual - dep.coordTimer;
                        if (elapsed >= 5) {
                            dep.coordenacaoFeita = true;
                        } else {
                            podeDecolar = false;
                            motivoBloqueio = "Coordenando com APP-SP para Jato/Turbo após Pistão...";
                        }
                    } else {
                        podeDecolar = false;
                        motivoBloqueio = "Requer coordenação com APP-SP para Jato/Turbo após Pistão no mesmo grupo.";
                    }
                }
            }
        }

        if (dep.aero === "SBGR") {
            const lastAeroObj = state.aeronaves.find(a => a.callsign === ultima.id);
            if (lastAeroObj) {
                if (ultima.setorSaida === "Leste") {
                    if (lastAeroObj.flAtualNum < 60) {
                        podeDecolar = false;
                        motivoBloqueio = `Precedente setor Leste precisa cruzar 6000 ft em subida (atual: FL${Math.round(lastAeroObj.flAtualNum)}).`;
                    }
                } else if (ultima.setorSaida === "Sul") {
                    if (lastAeroObj.flAtualNum < 70) {
                        podeDecolar = false;
                        motivoBloqueio = `Precedente setor Sul precisa cruzar 7000 ft em subida (atual: FL${Math.round(lastAeroObj.flAtualNum)}).`;
                    }
                }
            }
            if (dep.setorSaida === "Norte" && !dep.coordenacaoFeita) {
                if (state.configDep.decolagemAutomatica) {
                    if (!dep.coordTimer) dep.coordTimer = tempoSimuladoAtual;
                    const elapsed = tempoSimuladoAtual - dep.coordTimer;
                    if (elapsed >= 5) {
                        dep.coordenacaoFeita = true;
                    } else {
                        podeDecolar = false;
                        motivoBloqueio = "Coordenando com APP-SP para saída setor Norte...";
                    }
                } else {
                    podeDecolar = false;
                    motivoBloqueio = "Saída setor Norte exige coordenação com APP-SP.";
                }
            }
        }

        if (dep.aero === "SBSP") {
            if (ultima.setorSaida && dep.setorSaida && ultima.setorSaida === dep.setorSaida) {
                if (tempoDesdeUltima < 2 * 60) {
                    podeDecolar = false;
                    motivoBloqueio = `SBSP: 2 minutos de separação para o mesmo setor - Restam ${Math.ceil(2 * 60 - tempoDesdeUltima)}s simulados.`;
                }
            }
        }
    }

    if (podeDecolar) {
        dep.status = "autorizado";
        spawnDEP(dep);
        return true;
    } else {
        if (!silencioso) {
            alert("Decolagem bloqueada: " + motivoBloqueio);
        }
        return false;
    }
};

function spawnDEP(dep) {
    const pistasObj = cartasNavegacao[dep.aero][dep.runway];
    if (!pistasObj || !pistasObj.SID) return;
    const sidInfo = pistasObj.SID[dep.sidKey];
    if (!sidInfo || !sidInfo.fixos || sidInfo.fixos.length === 0) return;

    const startFix = sidInfo.fixos[0];
    const pAtual = state.fixos[startFix.nome] || geoParaDelta(startFix.lat, startFix.lon);
    
    let rumoInicial = 0;
    if (sidInfo.fixos.length > 1) {
        const pProx = state.fixos[sidInfo.fixos[1].nome] || geoParaDelta(sidInfo.fixos[1].lat, sidInfo.fixos[1].lon);
        rumoInicial = parseInt(calcularRumoDistancia(pAtual, pProx).rumo, 10);
    }

    const startGeo = deltaParaGeo(pAtual.deltaLat, pAtual.deltaLon);

    let baseVel = 140;
    let tipoAero = "A320";
    if (dep.category === 'jet') { baseVel = 210; tipoAero = "A320"; }
    if (dep.category === 'turboprop') { baseVel = 160; tipoAero = "AT76"; }
    if (dep.category === 'piston') { baseVel = 120; tipoAero = "C172"; }

    let targetFL = dep.requestedFL;
    let tempAlt = null;
    if (dep.aero === 'SBGR') {
        if (dep.setorSaida === 'Leste') tempAlt = 60;
        if (dep.setorSaida === 'Sul') tempAlt = 70;
    }

    const sidPoints = sidInfo.fixos.map(f => f.nome);
    const aeroData = aerodromos.find(a => a.nome === dep.aero);
    const elevacaoFL = pistasObj.elevacao || (aeroData?.elevacaoFt ? Math.round(aeroData.elevacaoFt / 100) : 25);
    const nivAtualStr = String(elevacaoFL).padStart(3, '0');
    const nivAutStr = String(tempAlt ? tempAlt : targetFL).padStart(3, '0');

    const novaAero = new Aeronave(
        dep.id,
        tipoAero,
        startGeo.lat,
        startGeo.lon,
        rumoInicial,
        baseVel,
        nivAtualStr,
        nivAutStr,
        "",
        "",
        sidPoints,
        1,
        dep.sid,
        true // isDep
    );

    novaAero.isDep = true;
    novaAero.origemAero = dep.aero;
    novaAero.aerodromo = dep.aero;
    novaAero.assigned_runway = dep.runway;
    novaAero.pistaAtribuida = dep.runway;
    novaAero.sid = dep.sid;
    novaAero.cartaNome = dep.sid;
    novaAero.targetAltFinal = targetFL;
    novaAero.requestedFL = targetFL;
    novaAero.tempAltitudeRestriction = tempAlt ? tempAlt * 100 : null;
    novaAero.vertical_floor_altitude = null;
    novaAero.semRestricoes = false;

    state.aeronaves.push(novaAero);
    dep.status = 'em_voo';
    state.configDep.ultimaAeronaveDecolada = dep;
    state.configDep.ultimaDecolagemTick = performance.now();
    const tempoSimAgora = state.tempoSimulado || (performance.now() / 1000);
    state.configDep.ultimaDecolagemTempoSimulado = tempoSimAgora;
    const chavePista = `${dep.aero}-${dep.runway}`;
    if (!state.configDep.ultimaDecolagemTempoSimuladoPorPista) {
        state.configDep.ultimaDecolagemTempoSimuladoPorPista = {};
    }
    state.configDep.ultimaDecolagemTempoSimuladoPorPista[chavePista] = tempoSimAgora;
    
    if (window.painelFluxoUI) {
        window.painelFluxoUI.renderizarFilaDEP();
    }
}

export function gerenciarDecolagensAutomaticas() {
    if (state.pausado) return;

    const tempoSim = state.tempoSimulado || (performance.now() / 1000);
    if (!state.configDep.ultimasGeracoesTempoSimulado) {
        state.configDep.ultimasGeracoesTempoSimulado = {};
    }

    // Trava de segurança: máximo de 12 aeronaves DEP simultâneas no radar
    const totalDepVoando = state.aeronaves.filter(a => a.isDep).length;
    if (totalDepVoando >= 12) {
        return;
    }

    const aerodromosAtivos = obterAerodromosAtivosDEP();

    // 1. GERAÇÃO AUTOMÁTICA
    if (state.configDep.geracaoAutomatica && !state.configDep.geracaoPausada) {
        for (const aeroId of aerodromosAtivos) {
            const aguardando = state.configDep.fila.filter(a => a.aero === aeroId && a.status === 'aguardando');
            const ultGeracao = state.configDep.ultimasGeracoesTempoSimulado[aeroId];
            const intervaloMin = (state.configDep.intervalosPorAerodromo && state.configDep.intervalosPorAerodromo[aeroId]) ? state.configDep.intervalosPorAerodromo[aeroId] : 2;
            const intervaloSegundos = Math.max(60, intervaloMin * 60);

            // Intervalo simulado entre gerações consecutivas baseado na configuração do aeródromo
            const podeGerarPeloTempo = (ultGeracao === undefined) || ((tempoSim - ultGeracao) >= intervaloSegundos);

            // Mantém no máximo 2 aeronaves na fila aguardando por aeródromo
            if (aguardando.length < 2 && podeGerarPeloTempo) {
                window.gerarNovaDEP(aeroId);
                state.configDep.ultimasGeracoesTempoSimulado[aeroId] = tempoSim;
                if (window.painelFluxoUI) {
                    window.painelFluxoUI.renderizarFilaDEP();
                }
            }
        }
    }

    // 2. DECOLAGEM AUTOMÁTICA
    if (state.configDep.decolagemAutomatica) {
        for (const aeroId of aerodromosAtivos) {
            const aguardando = state.configDep.fila.filter(a => a.aero === aeroId && a.status === 'aguardando');
            if (aguardando.length > 0) {
                const proxima = aguardando[0];
                window.tentarDecolar(proxima, true);
            }
        }
    }

    // Limpeza periódica de histórico antigo de partidas
    if (state.configDep.fila.length > 30) {
        state.configDep.fila = state.configDep.fila.filter(a => a.status === 'aguardando' || a === state.configDep.ultimaAeronaveDecolada);
    }
}
