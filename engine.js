import { state } from './state.js';
import { latCentro, lonCentro, correcaoLon, calcularRumoDistancia, geoParaDelta, deltaParaGeo } from './utils.js';
import { fixosNavegacao, aerodromos, verticesSetor, ROTA_OGTAL, ROTA_PRUMO } from './data.js';
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
 * 
 * @param {Array} caminhoArray - Array com a sequência de fixos da rota
 * @param {string} fixoAlvo - O fixo de referência (ex: "OGTAL")
 * @param {number} milhasDesejadas - Distância em milhas náuticas a recuar
 * @returns {Object|null} Coordenadas (lat, lon), rumo inicial e próximo fixo (wpIndex)
 */
export function calcularPontoNaMilhagem(caminhoArray, fixoAlvo, milhasDesejadas) {
    let idx = caminhoArray.indexOf(fixoAlvo);
    if (idx === -1) return null;

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
    const cenario = Math.floor(Math.random() * 3); 

    // Spawn no setor Sul/OGTAL
    if (cenario === 0 || cenario === 2) {
        let spawnNorte = calcularPontoNaMilhagem(ROTA_OGTAL, "OGTAL", 2);
        if (spawnNorte) {
            let vel = Math.floor(Math.random() * (250 - 230 + 1)) + 230; 
            let dados = gerarDadosAeronave();
            let aero1 = new Aeronave(
                dados.callsign, dados.tipo, 
                spawnNorte.lat, spawnNorte.lon, spawnNorte.rumo, vel, 
                "120", "090", "SBSP", "", ROTA_OGTAL, spawnNorte.wpIndex
            );
            aero1.rotaOriginal = "OGTAL";
            state.aeronaves.push(aero1);
        }
    }

    // Spawn no setor Norte/PRUMO (IROPU)
    if (cenario === 1 || cenario === 2) {
        let spawnOeste = calcularPontoNaMilhagem(ROTA_PRUMO, "IROPU", 2);
        if (spawnOeste) {
            let vel = Math.floor(Math.random() * (250 - 230 + 1)) + 230; 
            let dados = gerarDadosAeronave();
            let aero2 = new Aeronave(
                dados.callsign, dados.tipo, 
                spawnOeste.lat, spawnOeste.lon, spawnOeste.rumo, vel, 
                "120", "090", "SBSP", "", ROTA_PRUMO, spawnOeste.wpIndex
            );
            aero2.rotaOriginal = "PRUMO";
            state.aeronaves.push(aero2);
        }
    }
}

/**
 * O coração da geração contínua de tráfego (Spawning System).
 * Lê os inputs do "Painel de Fluxo" (separação em NM) e cria um novo avião
 * sempre que o avião da frente cruza um limite específico, simulando uma fila de espera/esteira contínua.
 */
export function gerenciarEsteiraDeTrafego() {
    // 1. Lê o estado atual da esteira a partir do estado global (sem tocar no DOM)
    const { ogtalAtivo, prumoAtivo, sepOgtal, sepPrumo } = state.configFluxo;

    // Rastreadores para garantir que o setor não fique vazio
    let vivosOgtal = false;
    let vivosPrumo = false;

    // 2. Loop por todas as aeronaves para verificar "Triggers" (gatilhos de spawn)
    state.aeronaves.forEach(aero => {
        // Se a aeronave pertence a uma rota contínua e ainda não "pariu" o avião de trás
        if (aero.rotaOriginal && !aero.gerouSucessor) {
            if (aero.rotaOriginal === "OGTAL") vivosOgtal = true;
            if (aero.rotaOriginal === "PRUMO") vivosPrumo = true;

            // Define qual é o fixo gatilho desta rota
            let triggerFix = aero.rotaOriginal === "OGTAL" ? "OGTAL" : "IROPU";
            
            // Calcula a distância do avião atual até o fixo gatilho
            let distTrigger = calcularRumoDistancia(aero, state.fixos[triggerFix]).distanciaNM;
            
            // Inicializa a distância no primeiro frame
            if (aero.distTriggerAnt === undefined) aero.distTriggerAnt = distTrigger;
            
            // Lógica de passagem: O avião passou o fixo? 
            // Ou ficou a menos de 1NM, ou a distância começou a aumentar (passou reto)
            let passou = false;
            if (distTrigger <= 1.0) passou = true; 
            else if (distTrigger > aero.distTriggerAnt && aero.distTriggerAnt < 10) passou = true; 

            aero.distTriggerAnt = distTrigger;

            // Se o avião atual bloqueou o fixo gatilho, ele aciona a criação do próximo avião
            if (passou) {
                aero.gerouSucessor = true; 
                
                let ativo = aero.rotaOriginal === "OGTAL" ? ogtalAtivo : prumoAtivo;
                
                if (ativo) {
                    let separacaoBase = aero.rotaOriginal === "OGTAL" ? sepOgtal : sepPrumo;
                    let rotaArray = aero.rotaOriginal === "OGTAL" ? ROTA_OGTAL : ROTA_PRUMO;
                    
                    // Adiciona uma pequena aleatoriedade humana (0 a 2NM extra) na separação
                    let margem = Math.random() * 2.0;
                    
                    // Calcula a milhagem exata lá para trás onde o novo avião deve nascer
                    let separacaoReal = separacaoBase + distTrigger + margem;
                    let spawnPt = calcularPontoNaMilhagem(rotaArray, triggerFix, separacaoReal);
                    
                    if (spawnPt) {
                        let vel = Math.floor(Math.random() * (250 - 230 + 1)) + 230;
                        let dados = gerarDadosAeronave();
                        
                        let novaAero = new Aeronave(
                            dados.callsign, dados.tipo, 
                            spawnPt.lat, spawnPt.lon, spawnPt.rumo, vel, 
                            "120", "090", "SBSP", "", rotaArray, spawnPt.wpIndex
                        );
                        
                        // Passa a "herança" da rota para a nova aeronave manter o ciclo vivo
                        novaAero.rotaOriginal = aero.rotaOriginal; 
                        state.aeronaves.push(novaAero);
                        
                        if (aero.rotaOriginal === "OGTAL") vivosOgtal = true;
                        if (aero.rotaOriginal === "PRUMO") vivosPrumo = true;
                    }
                }
            }
        }
    });

    // 3. Fallbacks de Emergência (Deadlock Prevention)
    // Se o operador ligou o fluxo, mas o céu está vazio (ou o último avião da fila foi deletado/pousou),
    // o código injeta artificialmente um avião novo para reiniciar a esteira.
    if (ogtalAtivo && !vivosOgtal) {
        let margem = Math.random() * 2.0;
        let spawnPt = calcularPontoNaMilhagem(ROTA_OGTAL, "OGTAL", sepOgtal + margem);
        if(spawnPt) {
             let dados = gerarDadosAeronave();
             let novaAero = new Aeronave(dados.callsign, dados.tipo, spawnPt.lat, spawnPt.lon, spawnPt.rumo, 240, "120", "090", "SBSP", "", ROTA_OGTAL, spawnPt.wpIndex);
             novaAero.rotaOriginal = "OGTAL";
             state.aeronaves.push(novaAero);
        }
    }
    if (prumoAtivo && !vivosPrumo) {
        let margem = Math.random() * 2.0;
        let spawnPt = calcularPontoNaMilhagem(ROTA_PRUMO, "IROPU", sepPrumo + margem);
        if(spawnPt) {
             let dados = gerarDadosAeronave();
             let novaAero = new Aeronave(dados.callsign, dados.tipo, spawnPt.lat, spawnPt.lon, spawnPt.rumo, 240, "120", "090", "SBSP", "", ROTA_PRUMO, spawnPt.wpIndex);
             novaAero.rotaOriginal = "PRUMO";
             state.aeronaves.push(novaAero);
        }
    }
}