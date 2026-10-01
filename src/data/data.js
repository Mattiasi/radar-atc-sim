import { dmsParaDecimal, latCentro, lonCentro, geoParaDelta } from '../utils/utils.js';

// Imports from the newly separated data files
import { cartasNavegacao } from './cartas.js';
import { aerodromos } from './aerodromos.js';
import { verticesSetor, estruturaEspacoAereo } from './espacoAereo.js';

export { cartasNavegacao, aerodromos, verticesSetor, estruturaEspacoAereo };

/**
 * Agregação dinâmica para compatibilidade total com o motor do simulador:
 * - fixosNavegacao: lista com todos os fixos, suas coordenadas e cores das cartas
 * - restricoesFixos: dicionário de restrições de nível de voo e altitude
 */
export const fixosNavegacao = [];
export const restricoesFixos = {
    "SBSP": { fl: 26, tipo: "AT" }
};

Object.values(cartasNavegacao).forEach(categoria => {
    Object.values(categoria).forEach(carta => {
        if (carta.fixos) {
            carta.fixos.forEach(f => {
                fixosNavegacao.push({
                    nome: f.nome,
                    lat: f.lat,
                    lon: f.lon,
                    cor: carta.cor,
                    restricao: f.restricao
                });
                if (f.restricao) {
                    restricoesFixos[f.nome] = f.restricao;
                }
            });
        }
    });
});

/**
 * Conjunto de fixos pertencentes a cartas de aproximação por instrumentos (IAC / AIC).
 */
export const fixosIAC = new Set(["LUVDI", "KOMGU", "GERSU", "URUTA", "SP139", "SP017", "SBSP"]);

if (cartasNavegacao && cartasNavegacao.AIC) {
    Object.values(cartasNavegacao.AIC).forEach(carta => {
        if (carta.fixos) {
            carta.fixos.forEach(f => fixosIAC.add(f.nome));
        }
    });
}

/**
 * Retorna true se o fixo pertencer a uma carta de aproximação por instrumentos (IAC / AIC).
 * @param {string} nomeFixo - Nome do fixo / waypoint
 * @returns {boolean}
 */
export function isFixoIAC(nomeFixo) {
    if (!nomeFixo) return false;
    return fixosIAC.has(nomeFixo);
}

/**
 * Constrói dinamicamente a sequência de waypoints de uma rota a partir de qualquer fixo inicial,
 * navegando através do Grafo Direcionado de cartasNavegacao (STAR -> AIC -> Destino).
 * 
 * @param {string} fixoOrigem - Nome do fixo inicial solicitado (ex: "KOMGU", "GERSU", "PRUMO")
 * @param {string} [dest="SBSP"] - Aeródromo de destino da aeronave
 * @returns {Array<string>} Lista ordenada de fixos até o pouso ou fim do procedimento
 */
export function montarRotaAPartirDeFixo(fixoOrigem, dest = "SBSP") {
    if (!fixoOrigem) return [];

    const conexoes = {};
    if (typeof cartasNavegacao === 'object' && cartasNavegacao !== null) {
        Object.values(cartasNavegacao).forEach(categoria => {
            Object.values(categoria).forEach(carta => {
                if (carta.linhas) {
                    carta.linhas.forEach(linha => {
                        for (let i = 0; i < linha.length - 1; i++) {
                            if (!conexoes[linha[i]]) {
                                conexoes[linha[i]] = linha[i + 1];
                            }
                        }
                    });
                }
            });
        });
    }

    const rotaGerada = [fixoOrigem];
    let atual = fixoOrigem;
    const visitados = new Set([fixoOrigem]);

    while (conexoes[atual] && !visitados.has(conexoes[atual])) {
        atual = conexoes[atual];
        rotaGerada.push(atual);
        visitados.add(atual);
    }

    // Conexão Terminal Genérica: Se a rota atingiu o último fixo de um procedimento
    // de aproximação (sem conexão seguinte no grafo), conecta diretamente ao aeródromo de destino
    if (dest && !rotaGerada.includes(dest)) {
        const ult = rotaGerada[rotaGerada.length - 1];
        if (!conexoes[ult]) {
            rotaGerada.push(dest);
        }
    }

    return rotaGerada;
}

/**
 * Retorna uma lista consolidada e única de todos os nomes de fixos cadastrados em cartas de navegação (STAR e AIC).
 * Utilizado para popular dinamicamente os seletores de fixo do Painel de Fluxo e do simulador.
 * 
 * @returns {Array<string>} Lista de nomes de fixos disponíveis
 */
export function obterTodosFixosProcedimentos() {
    const fixosSet = new Set();
    if (cartasNavegacao && typeof cartasNavegacao === 'object') {
        Object.values(cartasNavegacao).forEach(categoria => {
            Object.values(categoria).forEach(carta => {
                if (carta.fixos && Array.isArray(carta.fixos)) {
                    carta.fixos.forEach(f => {
                        if (f && f.nome) fixosSet.add(f.nome);
                    });
                }
            });
        });
    }
    return Array.from(fixosSet);
}

/**
 * Reconstrói a trajetória completa (precedente e posterior) que cruza qualquer fixo escolhido pelo usuário.
 * Permite ao gerador de fluxo recuar dinamicamente no traçado da carta mesmo quando o fixo fica no meio dela.
 * 
 * @param {string} fixoAlvo - Fixo escolhido como referência para o fluxo
 * @param {string} [dest="SBSP"] - Aeródromo de destino
 * @returns {{ rotaCompleta: Array<string>, targetIndex: number }} Trajetória completa e índice do fixo na rota
 */
export function obterTrajetoriaCompletaAteFixo(fixoAlvo, dest = "SBSP") {
    if (!fixoAlvo) return { rotaCompleta: [], targetIndex: -1 };

    // 1. Rota posterior partindo do fixo até a pista de pouso
    const posteriores = montarRotaAPartirDeFixo(fixoAlvo, dest);

    // 2. Grafo inverso de conexões a partir das cartas de navegação
    const conexoesInversas = {};
    if (typeof cartasNavegacao === 'object' && cartasNavegacao !== null) {
        Object.values(cartasNavegacao).forEach(categoria => {
            Object.values(categoria).forEach(carta => {
                if (carta.linhas) {
                    carta.linhas.forEach(linha => {
                        for (let i = 1; i < linha.length; i++) {
                            if (!conexoesInversas[linha[i]]) {
                                conexoesInversas[linha[i]] = linha[i - 1];
                            }
                        }
                    });
                }
            });
        });
    }

    // 3. Caminha regressivamente a partir do fixoAlvo para encontrar fixos anteriores da mesma carta
    const precedentes = [];
    let atual = fixoAlvo;
    const visitados = new Set([fixoAlvo]);

    while (conexoesInversas[atual] && !visitados.has(conexoesInversas[atual])) {
        atual = conexoesInversas[atual];
        precedentes.unshift(atual); // Insere no início para manter a ordem cronológica
        visitados.add(atual);
    }

    // Remove duplicação do fixoAlvo entre precedentes e posteriores
    const rotaCompleta = [...precedentes, ...posteriores];
    const targetIndex = precedentes.length;

    return { rotaCompleta, targetIndex };
}

/**
 * Determina o nível de voo inicial de nascimento (flSpawn) e o nível autorizado de descida (flAutorizado)
 * para uma aeronave que nasce num fixo de procedimento ou ao longo de sua rota.
 * Se o fixo possuir restrição de altitude, a aeronave nasce no nível dessa restrição
 * e recebe autorização para descer até a próxima restrição de nível inferior da carta.
 * 
 * Exemplo: Em OGTAL (restrição FL 120), nasce no FL 120 e autorizado FL 090 (restrição de SP099).
 * 
 * @param {string} fixoAlvo - Nome do fixo de referência do fluxo (ex: "OGTAL", "PRUMO", "KOMGU")
 * @param {Array<string>} [rotaCompleta=[]] - Lista sequencial de fixos da rota
 * @returns {{ nivAtual: string, nivAutorizado: string }} Níveis formatados em 3 dígitos (ex: "120", "090")
 */
export function obterNiveisSpawn(fixoAlvo, rotaCompleta = []) {
    let flSpawn = null;

    // 1. Verifica se o fixo alvo possui restrição direta
    if (fixoAlvo && restricoesFixos[fixoAlvo] && restricoesFixos[fixoAlvo].fl !== undefined) {
        flSpawn = restricoesFixos[fixoAlvo].fl;
    }

    const idxAlvo = Array.isArray(rotaCompleta) ? rotaCompleta.indexOf(fixoAlvo) : -1;

    // 2. Se o fixo alvo não tiver restrição, busca na rota anterior ou posterior
    if (flSpawn === null && idxAlvo >= 0) {
        // Procura para trás na rota
        for (let i = idxAlvo - 1; i >= 0; i--) {
            const rest = restricoesFixos[rotaCompleta[i]];
            if (rest && rest.fl !== undefined) {
                flSpawn = rest.fl;
                break;
            }
        }
        // Se ainda não achou, procura para frente
        if (flSpawn === null) {
            for (let i = idxAlvo; i < rotaCompleta.length; i++) {
                const rest = restricoesFixos[rotaCompleta[i]];
                if (rest && rest.fl !== undefined) {
                    flSpawn = rest.fl;
                    break;
                }
            }
        }
    }

    // Fallback padrão se não houver nenhuma restrição na carta
    if (flSpawn === null) {
        flSpawn = 120;
    }

    // 3. Determina o próximo nível autorizado para descida ao longo da rota (primeira restrição inferior a flSpawn)
    let flAutorizado = null;
    if (Array.isArray(rotaCompleta) && rotaCompleta.length > 0) {
        const startIdx = idxAlvo >= 0 ? idxAlvo + 1 : 0;
        for (let i = startIdx; i < rotaCompleta.length; i++) {
            const rest = restricoesFixos[rotaCompleta[i]];
            if (rest && rest.fl !== undefined && rest.fl < flSpawn) {
                flAutorizado = rest.fl;
                break;
            }
        }
    }

    // Se não encontrou nenhuma restrição inferior subsequente, mantém o nível de spawn
    if (flAutorizado === null) {
        flAutorizado = flSpawn;
    }

    const formatarFL = (fl) => String(Math.round(fl)).padStart(3, '0');

    return {
        nivAtual: formatarFL(flSpawn),
        nivAutorizado: formatarFL(flAutorizado)
    };
}

/**
 * Re-exporta a base única e consolidada de performance aeronáutica a partir de PerformanceDB.js
 */
export { AIRCRAFT_PERFORMANCE, perfisAeronaves, getAircraftPerformance } from './PerformanceDB.js';

export const ROTA_PRUMO = montarRotaAPartirDeFixo("PRUMO", "SBSP");
export const ROTA_OGTAL = montarRotaAPartirDeFixo("OGTAL", "SBSP");

/**
 * Recupera os dados de ILS da cabeceira de um aeródromo de forma genérica e data-driven.
 * @param {string} airportCode - Código do aeródromo (ex: "SBSP", "SBGR")
 * @param {string} runwayId - Identificador da cabeceira (ex: "17R", "35L", "10R", "28L")
 * @returns {Object|null}
 */
export function getRunwayILSData(airportCode, runwayId) {
    const aerodromo = aerodromos.find(a => a.nome === airportCode);
    if (!aerodromo || !aerodromo.pistas) return null;

    for (const pista of aerodromo.pistas) {
        if (!pista.cabeceiras) continue;
        const cabeceira = pista.cabeceiras[runwayId];
        if (cabeceira && cabeceira.ils && cabeceira.ils.enabled) {
            return {
                airport: airportCode,
                runway: runwayId,
                frontCourseDeg: cabeceira.frontCourseDeg !== undefined ? cabeceira.frontCourseDeg : pista.rumo,
                elevacaoFt: cabeceira.elevacaoFt || aerodromo.elevacaoFt,
                ...cabeceira.ils,
                cabeceira: cabeceira,
                pista: pista,
                aerodromo: aerodromo
            };
        }
    }
    return null;
}

/**
 * Obtém os dados de pista e cabeceira física aplicáveis para a aeronave.
 * @param {Object} aircraft - Instância da aeronave
 * @returns {Object|null} { airport, runway, front_course_deg, comp_nm, threshold: { deltaLat, deltaLon, elevation_ft } }
 */
export function getRunwayData(aircraft) {
    if (!aircraft) return null;
    const destName = aircraft.dest || "SBSP";
    const aerodromo = aerodromos.find(a => a.nome === destName) || aerodromos.find(a => a.nome === "SBSP");
    if (!aerodromo) return null;

    let runwayId = aircraft.assigned_runway || aircraft.pistaAtribuida;
    if (!runwayId && aerodromo.pistas && aerodromo.pistas.length > 0) {
        const p0 = aerodromo.pistas[0];
        runwayId = p0.id.includes('/') ? p0.id.split('/')[0] : p0.id;
    }

    const aeroDelta = (aerodromo.lat !== undefined && aerodromo.lon !== undefined)
        ? geoParaDelta(aerodromo.lat, aerodromo.lon)
        : { deltaLat: 0, deltaLon: 0 };

    if (!aerodromo.pistas || aerodromo.pistas.length === 0) {
        return {
            airport: destName,
            runway: runwayId || "DEFAULT",
            front_course_deg: aerodromo.rumoPista || 170,
            comp_nm: 1.0,
            threshold: {
                deltaLat: aeroDelta.deltaLat,
                deltaLon: aeroDelta.deltaLon,
                elevation_ft: aerodromo.elevacaoFt || 2631
            }
        };
    }

    for (const pista of aerodromo.pistas) {
        if (!pista.cabeceiras) continue;
        const cab = pista.cabeceiras[runwayId];
        if (cab) {
            const cabDelta = (cab.lat !== undefined && cab.lon !== undefined)
                ? geoParaDelta(cab.lat, cab.lon)
                : aeroDelta;
            return {
                airport: destName,
                runway: runwayId,
                front_course_deg: cab.frontCourseDeg !== undefined ? cab.frontCourseDeg : pista.rumo,
                comp_nm: pista.comprimentoM ? (pista.comprimentoM / 1852) : (pista.compNM || 1.0),
                threshold: {
                    deltaLat: cabDelta.deltaLat,
                    deltaLon: cabDelta.deltaLon,
                    elevation_ft: cab.elevacaoFt || aerodromo.elevacaoFt || 2631
                }
            };
        }
    }

    // Fallback: primeira cabeceira disponível
    for (const pista of aerodromo.pistas) {
        if (!pista.cabeceiras) continue;
        const firstKey = Object.keys(pista.cabeceiras)[0];
        if (firstKey) {
            const cab = pista.cabeceiras[firstKey];
            const cabDelta = (cab.lat !== undefined && cab.lon !== undefined)
                ? geoParaDelta(cab.lat, cab.lon)
                : aeroDelta;
            return {
                airport: destName,
                runway: firstKey,
                front_course_deg: cab.frontCourseDeg !== undefined ? cab.frontCourseDeg : pista.rumo,
                comp_nm: pista.comprimentoM ? (pista.comprimentoM / 1852) : (pista.compNM || 1.0),
                threshold: {
                    deltaLat: cabDelta.deltaLat,
                    deltaLon: cabDelta.deltaLon,
                    elevation_ft: cab.elevacaoFt || aerodromo.elevacaoFt || 2631
                }
            };
        }
    }

    return null;
}