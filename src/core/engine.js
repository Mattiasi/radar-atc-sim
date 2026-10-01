import { state } from './state.js';
import { latCentro, lonCentro, correcaoLon, calcularRumoDistancia, geoParaDelta, deltaParaGeo } from '../utils/utils.js';
import { fixosNavegacao, aerodromos, verticesSetor, ROTA_OGTAL, ROTA_PRUMO, obterTrajetoriaCompletaAteFixo, obterNiveisSpawn } from '../data/data.js';
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
        const fixoAlvo = esteira.fixo;
        if (!state.fixos[fixoAlvo]) return;

        const { rotaCompleta } = obterTrajetoriaCompletaAteFixo(fixoAlvo, "SBSP");
        if (rotaCompleta && rotaCompleta.length > 0) {
            let spawnPt = calcularPontoNaMilhagem(rotaCompleta, fixoAlvo, 0);
            if (spawnPt) {
                let vel = Math.floor(Math.random() * (250 - 230 + 1)) + 230; 
                let dados = gerarDadosAeronave();
                const niveis = obterNiveisSpawn(fixoAlvo, rotaCompleta);
                let aero = new Aeronave(
                    dados.callsign, dados.tipo, 
                    spawnPt.lat, spawnPt.lon, spawnPt.rumo, vel, 
                    niveis.nivAtual, niveis.nivAutorizado, "SBSP", "", rotaCompleta, spawnPt.wpIndex
                );
                aero.esteiraId = esteira.id;
                aero.fixoOrigem = fixoAlvo;
                aero.rotaOriginal = fixoAlvo;
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
        const fixoAlvo = esteira.fixo;
        if (!state.fixos[fixoAlvo]) return;

        let vivosNestaEsteira = false;

        // 1. Loop por todas as aeronaves para verificar gatilho de spawn
        state.aeronaves.forEach(aero => {
            const pertenceAEsteira = ((aero.esteiraId === esteira.id && aero.fixoOrigem === fixoAlvo) || (!aero.esteiraId && aero.fixoOrigem === fixoAlvo));

            if (pertenceAEsteira && !aero.pousou) {
                // Apenas aeronaves que AINDA NÃO cruzaram o fixo contam como vivas na fila de espera da esteira
                if (!aero.gerouSucessor) {
                    vivosNestaEsteira = true;

                    let distTrigger = calcularRumoDistancia(aero, state.fixos[fixoAlvo]).distanciaNM;
                    if (aero.distTriggerAnt === undefined) aero.distTriggerAnt = distTrigger;

                    let passou = false;
                    if (distTrigger <= 1.0) passou = true;
                    else if (distTrigger > aero.distTriggerAnt && aero.distTriggerAnt < 10) passou = true;

                    aero.distTriggerAnt = distTrigger;

                    if (passou) {
                        aero.gerouSucessor = true;

                        // Se a esteira estiver ativa, gera o sucessor respeitando a separação
                        if (esteira.ativo) {
                            const { rotaCompleta } = obterTrajetoriaCompletaAteFixo(fixoAlvo, aero.dest || "SBSP");
                            if (rotaCompleta && rotaCompleta.length > 0) {
                                let margem = Math.random() * 2.0;
                                let separacaoReal = esteira.separacao + margem;
                                let spawnPt = calcularPontoNaMilhagem(rotaCompleta, fixoAlvo, separacaoReal);

                                if (spawnPt) {
                                    let vel = Math.floor(Math.random() * (250 - 230 + 1)) + 230;
                                    let dados = gerarDadosAeronave();
                                    const targetWp = rotaCompleta[spawnPt.wpIndex] || fixoAlvo;
                                    const niveis = obterNiveisSpawn(targetWp, rotaCompleta);
                                    let novaAero = new Aeronave(
                                        dados.callsign, dados.tipo,
                                        spawnPt.lat, spawnPt.lon, spawnPt.rumo, vel,
                                        niveis.nivAtual, niveis.nivAutorizado, aero.dest || "SBSP", "", rotaCompleta, spawnPt.wpIndex
                                    );
                                    novaAero.esteiraId = esteira.id;
                                    novaAero.fixoOrigem = fixoAlvo;
                                    novaAero.rotaOriginal = fixoAlvo;
                                    state.aeronaves.push(novaAero);
                                }
                            }
                        }
                    }
                }
            }
        });

        // 2. Injeção de Aeronave: se a esteira está ligada e não há ninguém aguardando cruzar o fixo (vivosNestaEsteira = false)
        if (esteira.ativo && !vivosNestaEsteira) {
            const { rotaCompleta } = obterTrajetoriaCompletaAteFixo(fixoAlvo, "SBSP");
            if (rotaCompleta && rotaCompleta.length > 0) {
                let spawnPt = calcularPontoNaMilhagem(rotaCompleta, fixoAlvo, 0); // Spawna no marco zero
                if (spawnPt) {
                    let dados = gerarDadosAeronave();
                    const niveis = obterNiveisSpawn(fixoAlvo, rotaCompleta);
                    let novaAero = new Aeronave(
                        dados.callsign, dados.tipo,
                        spawnPt.lat, spawnPt.lon, spawnPt.rumo, 240,
                        niveis.nivAtual, niveis.nivAutorizado, "SBSP", "", rotaCompleta, spawnPt.wpIndex
                    );
                    novaAero.esteiraId = esteira.id;
                    novaAero.fixoOrigem = fixoAlvo;
                    novaAero.rotaOriginal = fixoAlvo;
                    state.aeronaves.push(novaAero);
                }
            }
        }
    });
}