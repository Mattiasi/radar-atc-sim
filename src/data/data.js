import { dmsParaDecimal, latCentro, lonCentro, geoParaDelta } from '../utils/utils.js';

// Imports from the newly separated data files
import { cartasNavegacao } from './cartas.js?v=2';
import { aerodromos } from './aerodromos.js';
import { verticesSetor, estruturaEspacoAereo } from './espacoAereo.js';
import { radarLayerState } from '../core/state.js';

export { cartasNavegacao, aerodromos, verticesSetor, estruturaEspacoAereo };

/**
 * Agregação dinâmica para compatibilidade total com o motor do simulador:
 * - fixosNavegacao: lista com todos os fixos, suas coordenadas e cores das cartas
 * - restricoesFixos: dicionário de restrições de nível de voo e altitude
 */
export const fixosNavegacao = [
    {nome: "RW10R", lat: dmsParaDecimal(23, 26, 31.70, 'S'), lon: dmsParaDecimal(46, 29, 21.70, 'W')},
    {nome: "R10RGR", lat: dmsParaDecimal(23, 26, 31.70, 'S'), lon: dmsParaDecimal(46, 29, 21.70, 'W')},
    {nome: "R28LGR", lat: dmsParaDecimal(23, 26, 4.26, 'S'), lon: dmsParaDecimal(46, 27, 39.93, 'W')},
    {nome: "R10LGR", lat: dmsParaDecimal(23, 26, 17.76, 'S'), lon: dmsParaDecimal(46, 29, 16.96, 'W')},
    {nome: "R28RGR", lat: dmsParaDecimal(23, 25, 43.91, 'S'), lon: dmsParaDecimal(46, 27, 11.45, 'W')},
    {nome: "R17RSP", lat: dmsParaDecimal(23, 37, 6.61, 'S'), lon: dmsParaDecimal(46, 39, 43.83, 'W')},
    {nome: "R35LSP", lat: dmsParaDecimal(23, 37, 59.81, 'S'), lon: dmsParaDecimal(46, 39, 6.99, 'W')},
    {nome: "R17LSP", lat: dmsParaDecimal(23, 37, 14.64, 'S'), lon: dmsParaDecimal(46, 39, 30.75, 'W')},
    {nome: "R35RSP", lat: dmsParaDecimal(23, 37, 53.65, 'S'), lon: dmsParaDecimal(46, 39, 3.73, 'W')},
    {nome: "R15KP", lat: dmsParaDecimal(23, 0, 16.60, 'S'), lon: dmsParaDecimal(47, 9, 10.00, 'W')},
    {nome: "R33KP", lat: dmsParaDecimal(23, 1, 20.65, 'S'), lon: dmsParaDecimal(47, 7, 39.23, 'W')},
    {nome: "R16SJ", lat: dmsParaDecimal(23, 13, 18.30, 'S'), lon: dmsParaDecimal(45, 52, 21.70, 'W')},
    {nome: "R34SJ", lat: dmsParaDecimal(23, 14, 22.32, 'S'), lon: dmsParaDecimal(45, 51, 17.89, 'W')},
    {nome: "R12MT", lat: dmsParaDecimal(23, 30, 46.70, 'S'), lon: dmsParaDecimal(46, 39, 11.70, 'W')},
    {nome: "R30MT", lat: dmsParaDecimal(23, 30, 53.56, 'S'), lon: dmsParaDecimal(46, 38, 15.62, 'W')},
    {nome: "R18JD", lat: dmsParaDecimal(23, 10, 50.00, 'S'), lon: dmsParaDecimal(46, 57, 20.00, 'W')},
    {nome: "R36JD", lat: dmsParaDecimal(23, 11, 31.93, 'S'), lon: dmsParaDecimal(46, 57, 1.13, 'W')},
    {nome: "R12JH", lat: dmsParaDecimal(23, 25, 56.70, 'S'), lon: dmsParaDecimal(47, 10, 58.30, 'W')},
    {nome: "R30JH", lat: dmsParaDecimal(23, 26, 7.28, 'S'), lon: dmsParaDecimal(47, 9, 31.72, 'W')},
    {nome: "R18CO", lat: dmsParaDecimal(23, 28, 30.00, 'S'), lon: dmsParaDecimal(47, 29, 53.30, 'W')},
    {nome: "R36CO", lat: dmsParaDecimal(23, 29, 14.33, 'S'), lon: dmsParaDecimal(47, 29, 33.36, 'W')},
    {nome: "R16BP", lat: dmsParaDecimal(22, 58, 38.30, 'S'), lon: dmsParaDecimal(46, 32, 43.30, 'W')},
    {nome: "R34BP", lat: dmsParaDecimal(22, 59, 7.01, 'S'), lon: dmsParaDecimal(46, 32, 14.69, 'W')},
    {nome: "R17ST", lat: dmsParaDecimal(23, 56, 0.00, 'S'), lon: dmsParaDecimal(46, 18, 20.00, 'W')},
    {nome: "R35ST", lat: dmsParaDecimal(23, 56, 38.02, 'S'), lon: dmsParaDecimal(46, 17, 53.66, 'W')},
    {nome: "R12AI", lat: dmsParaDecimal(22, 45, 33.30, 'S'), lon: dmsParaDecimal(47, 16, 48.30, 'W')},
    {nome: "R30AI", lat: dmsParaDecimal(22, 45, 38.01, 'S'), lon: dmsParaDecimal(47, 16, 9.74, 'W')},
    {nome: "R16AM", lat: dmsParaDecimal(22, 51, 31.70, 'S'), lon: dmsParaDecimal(47, 7, 13.30, 'W')},
    {nome: "R34AM", lat: dmsParaDecimal(22, 52, 11.17, 'S'), lon: dmsParaDecimal(47, 6, 33.96, 'W')}
];
export const restricoesFixos = {
    "SBSP": { fl: 26, tipo: "AT" },
    "SBGR": { fl: 25, tipo: "AT" }
};
export const restricoesPorDestino = {};

if (cartasNavegacao) {
    Object.entries(cartasNavegacao).forEach(([dest, aerodromo]) => {
        if (!restricoesPorDestino[dest]) {
            restricoesPorDestino[dest] = {};
        }
        Object.values(aerodromo).forEach(cabeceira => {
            Object.values(cabeceira).forEach(categoria => {
                if (categoria) {
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
                                    restricoesPorDestino[dest][f.nome] = f.restricao;
                                }
                            });
                        }
                    });
                }
            });
        });
    });
}

/**
 * Obtém a restrição de altitude e tipo de um fixo específica para o destino e/ou carta de uma aeronave.
 * Se houver restrições diferentes para o mesmo fixo em aeroportos distintos (ex: EDMUS, ENTIT),
 * respeita estritamente o perfil do procedimento do destino da aeronave.
 * 
 * @param {string} fixoNome - Nome do fixo
 * @param {string|Object} [destOuAero=null] - Código ICAO de destino (ex: "SBSP", "SBKP", "SBGR") ou instância de Aeronave
 * @param {string} [cartaNome=null] - Nome opcional da carta ativa
 * @returns {Object|null} Objeto { fl, tipo, flMax? } ou null
 */
export function obterRestricaoFixoParaAeronave(fixoNome, destOuAero = null, cartaNome = null) {
    if (!fixoNome) return null;

    let dest = null;
    let carta = cartaNome;

    if (destOuAero && typeof destOuAero === 'object') {
        dest = destOuAero.dest || destOuAero.destino || null;
        if (!carta) carta = destOuAero.cartaNome || null;
    } else if (typeof destOuAero === 'string') {
        dest = destOuAero;
    }

    if (cartasNavegacao && dest && cartasNavegacao[dest]) {
        for (const cabeceira of Object.values(cartasNavegacao[dest])) {
            for (const categoria of Object.values(cabeceira)) {
                if (!categoria) continue;
                for (const c of Object.values(categoria)) {
                    if (carta && c.nome !== carta) continue;
                    if (c.fixos && Array.isArray(c.fixos)) {
                        const f = c.fixos.find(item => item.nome === fixoNome);
                        if (f && f.restricao) {
                            return f.restricao;
                        }
                    }
                }
            }
        }
    }

    if (dest && restricoesPorDestino[dest] && restricoesPorDestino[dest][fixoNome]) {
        return restricoesPorDestino[dest][fixoNome];
    }

    return restricoesFixos[fixoNome] || null;
}

/**
 * Conjunto de fixos pertencentes a cartas de aproximação por instrumentos (IAC / AIC).
 */
export const fixosIAC = new Set(["LUVDI", "KOMGU", "GERSU", "URUTA", "SP139", "SP017", "SBSP"]);

if (cartasNavegacao) {
    Object.values(cartasNavegacao).forEach(aerodromo => {
        Object.values(aerodromo).forEach(cabeceira => {
            const iacGroup = cabeceira.IAC || cabeceira.AIC;
            if (iacGroup) {
                Object.values(iacGroup).forEach(carta => {
                    if (carta.fixos) {
                        carta.fixos.forEach(f => fixosIAC.add(f.nome));
                    }
                });
            }
        });
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
export function montarRotaAPartirDeFixo(fixoOrigem, dest = "SBSP", cartaNome = null) {
    if (!fixoOrigem) return [];

    const conexoes = {};
    if (typeof cartasNavegacao === 'object' && cartasNavegacao !== null) {
        const aerodromosParaProcessar = (dest && cartasNavegacao[dest]) 
            ? [cartasNavegacao[dest]] 
            : Object.values(cartasNavegacao);

        aerodromosParaProcessar.forEach(aerodromo => {
            Object.values(aerodromo).forEach(cabeceira => {
                Object.values(cabeceira).forEach(categoria => {
                    Object.values(categoria).forEach(carta => {
                        if (carta.linhas) {
                            carta.linhas.forEach(linha => {
                                for (let i = 0; i < linha.length - 1; i++) {
                                    if (cartaNome && carta.nome === cartaNome) { conexoes[linha[i]] = linha[i + 1]; } else if (!conexoes[linha[i]]) {
                                        conexoes[linha[i]] = linha[i + 1];
                                    }
                                }
                            });
                        }
                    });
                });
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

    return rotaGerada;
}

/**
 * Retorna uma lista consolidada e única de todos os nomes de fixos cadastrados em cartas de navegação (STAR e AIC).
 * Utilizado para popular dinamicamente os seletores de fixo do Painel de Fluxo e do simulador.
 * 
 * @returns {Array<string>} Lista de nomes de fixos disponíveis
 */
/**
 * Retorna uma lista consolidada e única de todos os fixos cadastrados em cartas de navegação.
 * Se apenasAtivos for true, filtra estritamente pelas cartas ativas no Vídeo Mapa
 * (tanto a cabeceira quanto a carta/STAR específica precisam estar ativas).
 * 
 * @param {boolean} [apenasAtivos=true]
 * @returns {Array<Object>} Lista de objetos de fixos disponíveis
 */
export function obterTodosFixosProcedimentos(apenasAtivos = true) {
    const fixos = [];
    const fixosUnicos = new Set();
    const filtrarPorAtivas = apenasAtivos && 
                             radarLayerState && 
                             radarLayerState.activeRunways && 
                             radarLayerState.activeRunways.size > 0;

    if (cartasNavegacao && typeof cartasNavegacao === 'object') {
        Object.entries(cartasNavegacao).forEach(([dest, aerodromo]) => {
            Object.entries(aerodromo).forEach(([cabeceiraKey, cabeceira]) => {
                const numPista = cabeceiraKey.replace(/[^0-9]/g, '');
                const groupKey = `${dest}-${numPista}`;
                const runwayKey = `${dest}-${cabeceiraKey}`;
                const cabeceiraAtiva = radarLayerState && radarLayerState.activeRunways && 
                                      (radarLayerState.activeRunways.has(groupKey) || radarLayerState.activeRunways.has(runwayKey));

                if (filtrarPorAtivas && !cabeceiraAtiva) {
                    return; // Ignora cartas de cabeceiras desativadas
                }

                Object.values(cabeceira).forEach(categoria => {
                    Object.values(categoria).forEach(carta => {
                        // Se estiver filtrando por ativas, verifica se a carta em si está ativa (se activeCharts estiver definido)
                        if (filtrarPorAtivas && radarLayerState.activeCharts && radarLayerState.activeCharts.size > 0) {
                            if (!radarLayerState.activeCharts.has(carta.nome)) {
                                return;
                            }
                        }

                        if (carta.fixos && Array.isArray(carta.fixos)) {
                            carta.fixos.forEach(f => {
                                if (f && f.nome) {
                                    const id = f.nome + '|' + dest + '|' + carta.nome;
                                    if (!fixosUnicos.has(id)) {
                                        fixosUnicos.add(id);
                                        fixos.push({
                                            id: id,
                                            nome: f.nome,
                                            dest: dest,
                                            cabeceira: cabeceiraKey,
                                            pistaNum: numPista,
                                            cartaNome: carta.nome,
                                            cor: carta.cor || '#ffffff'
                                        });
                                    }
                                }
                            });
                        }
                    });
                });
            });
        });
    }
    return fixos.sort((a, b) => a.nome.localeCompare(b.nome));
}

/**
 * Retorna o destino ICAO de um fixo e carta específicos.
 * @param {string} fixoNome
 * @param {string} [cartaNome]
 * @returns {string} Código ICAO (ex: "SBSP", "SBGR", "SBKP")
 */
export function obterDestinoPorFixoECarta(fixoNome, cartaNome = null) {
    if (!cartasNavegacao || typeof cartasNavegacao !== 'object') return "SBSP";

    for (const [icao, aerodromo] of Object.entries(cartasNavegacao)) {
        for (const cabeceira of Object.values(aerodromo)) {
            for (const categoria of Object.values(cabeceira)) {
                for (const carta of Object.values(categoria)) {
                    if (cartaNome && carta.nome === cartaNome) {
                        return icao;
                    }
                    if (!cartaNome && carta.fixos && carta.fixos.some(f => f.nome === fixoNome)) {
                        return icao;
                    }
                }
            }
        }
    }
    return "SBSP";
}

/**
 * Verifica se um determinado fixo, destino e carta pertencem a uma cabeceira e carta ativas no vídeo mapa.
 * Garante que nenhuma aeronave seja spawnada em cartas ou cabeceiras inativas.
 * 
 * @param {string} fixoNome 
 * @param {string} dest 
 * @param {string} [cartaNome] 
 * @returns {boolean}
 */
export function isFixoDeCabeceiraAtiva(fixoNome, dest, cartaNome = null) {
    if (!radarLayerState || !radarLayerState.activeRunways || radarLayerState.activeRunways.size === 0) {
        return true;
    }

    if (!cartasNavegacao || !cartasNavegacao[dest]) return false;

    for (const [cabeceiraKey, cabeceira] of Object.entries(cartasNavegacao[dest])) {
        const numPista = cabeceiraKey.replace(/[^0-9]/g, '');
        const groupKey = `${dest}-${numPista}`;
        const runwayKey = `${dest}-${cabeceiraKey}`;
        const estaAtiva = radarLayerState.activeRunways.has(groupKey) || radarLayerState.activeRunways.has(runwayKey);

        if (!estaAtiva) continue;

        for (const categoria of Object.values(cabeceira)) {
            for (const carta of Object.values(categoria)) {
                if (radarLayerState.activeCharts && radarLayerState.activeCharts.size > 0) {
                    if (!radarLayerState.activeCharts.has(carta.nome)) {
                        continue;
                    }
                }

                if (cartaNome && carta.nome === cartaNome) {
                    return true;
                }
                if (!cartaNome && carta.fixos && carta.fixos.some(f => f.nome === fixoNome)) {
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Reconstrói a trajetória completa (precedente e posterior) que cruza qualquer fixo escolhido pelo usuário.
 * Permite ao gerador de fluxo recuar dinamicamente no traçado da carta mesmo quando o fixo fica no meio dela.
 * 
 * @param {string} fixoAlvo - Fixo escolhido como referência para o fluxo
 * @param {string} [dest="SBSP"] - Aeródromo de destino
 * @returns {{ rotaCompleta: Array<string>, targetIndex: number }} Trajetória completa e índice do fixo na rota
 */
export function obterTrajetoriaCompletaAteFixo(fixoAlvo, dest = "SBSP", cartaNome = null) {
    if (!fixoAlvo) return { rotaCompleta: [], targetIndex: -1 };

    // 1. Rota posterior partindo do fixo até a pista de pouso
    const posteriores = montarRotaAPartirDeFixo(fixoAlvo, dest, cartaNome);

    // 2. Grafo inverso de conexões a partir das cartas de navegação
    const conexoesInversas = {};
    if (typeof cartasNavegacao === 'object' && cartasNavegacao !== null) {
        const aerodromosParaProcessar = (dest && cartasNavegacao[dest]) 
            ? [cartasNavegacao[dest]] 
            : Object.values(cartasNavegacao);

        aerodromosParaProcessar.forEach(aerodromo => {
            Object.values(aerodromo).forEach(cabeceira => {
                Object.values(cabeceira).forEach(categoria => {
                    Object.values(categoria).forEach(carta => {
                        if (carta.linhas) {
                            carta.linhas.forEach(linha => {
                                for (let i = 1; i < linha.length; i++) {
                                    if (cartaNome && carta.nome === cartaNome) { conexoesInversas[linha[i]] = linha[i - 1]; } else if (!conexoesInversas[linha[i]]) {
                                        conexoesInversas[linha[i]] = linha[i - 1];
                                    }
                                }
                            });
                        }
                    });
                });
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
 * Se o fixo possuir restrição de altitude para o destino/carta da aeronave, a aeronave nasce no nível dessa restrição
 * e recebe autorização para descer até a próxima restrição de nível inferior da carta.
 * 
 * Exemplo: Em OGTAL (restrição FL 120), nasce no FL 120 e autorizado FL 090 (restrição de SP099).
 * 
 * @param {string} fixoAlvo - Nome do fixo de referência do fluxo (ex: "OGTAL", "PRUMO", "KOMGU")
 * @param {Array<string>} [rotaCompleta=[]] - Lista sequencial de fixos da rota
 * @param {string} [dest=null] - Código ICAO de destino (ex: "SBSP", "SBKP", "SBGR")
 * @param {string} [cartaNome=null] - Nome opcional da carta ativa
 * @returns {{ nivAtual: string, nivAutorizado: string }} Níveis formatados em 3 dígitos (ex: "120", "090")
 */
export function obterNiveisSpawn(fixoAlvo, rotaCompleta = [], dest = null, cartaNome = null) {
    let flSpawn = null;

    // 1. Verifica se o fixo alvo possui restrição direta no procedimento do destino
    const restAlvo = obterRestricaoFixoParaAeronave(fixoAlvo, dest, cartaNome);
    if (restAlvo && restAlvo.fl !== undefined) {
        flSpawn = restAlvo.fl;
    }

    const idxAlvo = Array.isArray(rotaCompleta) ? rotaCompleta.indexOf(fixoAlvo) : -1;

    // 2. Se o fixo alvo não tiver restrição, busca na rota anterior ou posterior
    if (flSpawn === null && idxAlvo >= 0) {
        // Procura para trás na rota
        for (let i = idxAlvo - 1; i >= 0; i--) {
            const rest = obterRestricaoFixoParaAeronave(rotaCompleta[i], dest, cartaNome);
            if (rest && rest.fl !== undefined) {
                flSpawn = rest.fl;
                break;
            }
        }
        // Se ainda não achou, procura para frente
        if (flSpawn === null) {
            for (let i = idxAlvo; i < rotaCompleta.length; i++) {
                const rest = obterRestricaoFixoParaAeronave(rotaCompleta[i], dest, cartaNome);
                if (rest && rest.fl !== undefined) {
                    flSpawn = rest.tipo === "WINDOW" ? (rest.flMax || rest.fl) : rest.fl;
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
            const rest = obterRestricaoFixoParaAeronave(rotaCompleta[i], dest, cartaNome);
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
        nivAutorizado: "VIA"
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