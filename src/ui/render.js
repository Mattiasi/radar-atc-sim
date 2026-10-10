import { state } from '../core/state.js';
import { correcaoLon, calcularRumoDistancia, geoParaDelta } from '../utils/utils.js';
import { restricoesFixos, fixosNavegacao, aerodromos, estruturaEspacoAereo, cartasNavegacao } from '../data/data.js';
import { scratchpadUI } from './ui.js';
import { renderizarLinha5, renderizarLinha6, estaLinhasExtrasVisiveis } from './RadarTagController.js';

/**
 * Procura um fixo pelo nome e devolve a sua coordenada exata no ecrã (Canvas X/Y).
 * @param {string} nome - Nome do fixo.
 * @returns {Object} Objeto com {x, y} em píxeis.
 */
export function pegarCoordenadaTela(nome) {
    const f = state.fixos[nome];
    if (!f) return { x: 0, y: 0 };
    return deltaParaTela(f);
}

/**
 * Converte coordenadas geográficas relativas (delta lat/lon) para píxeis no ecrã (Canvas).
 * Aplica a escala de zoom, o offset de pan (arraste) e a correção de longitude.
 * @param {Object} pt - Objeto contendo deltaLat e deltaLon.
 */
export function deltaParaTela(pt) {
    const alvo = (pt && pt.posicaoRadar) ? pt.posicaoRadar : pt;
    return {
        x: state.centroX + state.offsetX + (alvo.deltaLon * correcaoLon * state.escala),
        y: state.centroY + state.offsetY - (alvo.deltaLat * state.escala)
    };
}

/**
 * Converte uma posição de clique no ecrã (píxeis) para coordenadas geográficas relativas.
 * Faz o caminho inverso da função deltaParaTela.
 */
export function telaParaDelta(x, y) {
    return {
        deltaLon: (x - state.centroX - state.offsetX) / (correcaoLon * state.escala),
        deltaLat: (state.centroY + state.offsetY - y) / state.escala
    };
}

/**
 * Formata um valor de altitude/nível de restrição.
 * Se >= 90 (FL090 ou superior): retorna no formato "FLxxx" (ex: FL090, FL100, FL140).
 * Se < 90 (abaixo do FL090): retorna em pés (ex: 80 -> 8000', 75 -> 7500', 55 -> 5500').
 * @param {number|string} fl - Nível ou altitude
 * @returns {string}
 */
export function formatarNivelOuAltitude(fl) {
    if (fl === null || fl === undefined) return '';
    const num = Number(fl);
    if (isNaN(num)) return String(fl);
    if (num >= 90) {
        return 'FL' + Math.round(num).toString().padStart(3, '0');
    } else {
        const emPes = num >= 500 ? Math.round(num) : Math.round(num * 100);
        return emPes.toString() + "'";
    }
}

/**
 * Determina se um fixo representa um limiar/cabeceira de pista (ex: RW10R, RWY15, R10RGR, R15KP, etc.).
 * Fixos de pista devem ficar invisíveis no radar (não desenha o triângulo, nome ou restrição sobre o asfalto).
 * @param {string} nome - Nome do fixo
 * @returns {boolean}
 */
export function isFixoDePista(nome) {
    if (!nome || typeof nome !== 'string') return false;
    // Padrão RW ou RWY seguido do número da pista (ex: RW10R, RW15, RWY33, RWY12)
    if (/^RWY?\d{1,2}[LRC]?$/i.test(nome)) return true;
    // Padrão R + número da pista + sufixo de aeródromo ou letra (ex: R10RGR, R17RSP, R15KP, R16SJ, etc.)
    if (/^R\d{2}[LRC]?([A-Z]{2})?$/i.test(nome)) return true;
    return false;
}

/**
 * Hit-Test (Teste de colisão): Verifica se o rato clicou numa aeronave (blip) ou na sua etiqueta.
 * @param {number} telaX - Posição X do clique do rato.
 * @param {number} telaY - Posição Y do clique do rato.
 * @returns {Object|null} A aeronave clicada, ou null se não acertou em nenhuma.
 */
export function pegarAeronaveProxima(telaX, telaY) {
    for (let aero of state.aeronaves) {
        let pt = deltaParaTela(aero);
        
        // 1. Verifica clique direto no "blip" (símbolo do avião) - Raio de 15px
        let dist = Math.hypot(pt.x - telaX, pt.y - telaY);
        if (dist < 15) return aero; 

        // 2. Verifica clique na etiqueta de dados (Bounding Box)
        let isRight = Math.cos(aero.labelAngle) >= 0;
        let lx = pt.x + Math.cos(aero.labelAngle) * aero.labelDist; // Ponto âncora X da etiqueta
        let ly = pt.y - Math.sin(aero.labelAngle) * aero.labelDist; // Ponto âncora Y da etiqueta
        
        const TAG_WIDTH = (aero.isDep && (aero.targetAltFinal || aero.requestedFL)) ? 105 : 95;
        let textX = isRight ? (lx + 12) : (lx - 10 - TAG_WIDTH);
        
        // Define os limites da caixa invisível ao redor do texto
        let minX = textX - 4;
        let maxX = textX + TAG_WIDTH + 8;
        
        // Se o clique caiu dentro do retângulo da etiqueta (engloba até a linha 4 quando recolhida, ou linha 6 quando expandida/modificada)
        const linhasExtras = estaLinhasExtrasVisiveis(aero);
        const maxY = linhasExtras ? (ly + 58) : (ly + 28);
        if (telaX >= minX && telaX <= maxX && telaY >= ly - 25 && telaY <= maxY) return aero;
    }
    return null;
}

/**
 * Converte a posição na tela em coordenada geográfica relativa, com atração magnética
 * restrita exclusivamente a aeronaves (plot/símbolo ou etiqueta de dados).
 * Em qualquer outro ponto do radar, retorna a posição livre sem atração magnética.
 * 
 * @param {number} telaX - Posição X na tela
 * @param {number} telaY - Posição Y na tela
 * @returns {Object} Objeto com { tipo, aero, nome, delta }
 */
export function pegarPontoProximo(telaX, telaY) {
    let aero = pegarAeronaveProxima(telaX, telaY);
    if (aero) {
        return { tipo: 'aero', aero: aero, nome: aero.callsign, delta: aero };
    }
    return { tipo: 'posicao', aero: null, nome: null, delta: telaParaDelta(telaX, telaY) };
}

/**
 * Hit-Test: Verifica se o rato clicou numa linha de vetor de medição ou no seu bloco de dados.
 * @param {number} telaX - Posição X do clique do rato.
 * @param {number} telaY - Posição Y do clique do rato.
 * @returns {number} O índice do vetor em state.vetoresFixos, ou -1 se não acertou em nenhum.
 */
export function pegarVetorProximo(telaX, telaY) {
    let menorDist = Infinity;
    let indiceEncontrado = -1;
    const RAIO_TOLERANCIA = 10; // Tolerância de 10 píxeis ao redor da linha

    for (let i = 0; i < state.vetoresFixos.length; i++) {
        const v = state.vetoresFixos[i];
        let oDelta = v.aeroOrigem ? (v.aeroOrigem.posicaoRadar || v.aeroOrigem) : v.origem;
        let dDelta = v.aeroDestino ? (v.aeroDestino.posicaoRadar || v.aeroDestino) : v.destino;
        if (!oDelta || !dDelta) continue;

        const oTela = deltaParaTela(oDelta);
        const dTela = deltaParaTela(dDelta);

        // 1. Distância euclidiana ponto-segmento de reta
        let dx = dTela.x - oTela.x;
        let dy = dTela.y - oTela.y;
        let lenSq = dx * dx + dy * dy;
        let distLinha;
        if (lenSq === 0) {
            distLinha = Math.hypot(telaX - oTela.x, telaY - oTela.y);
        } else {
            let t = Math.max(0, Math.min(1, ((telaX - oTela.x) * dx + (telaY - oTela.y) * dy) / lenSq));
            let projX = oTela.x + t * dx;
            let projY = oTela.y + t * dy;
            distLinha = Math.hypot(telaX - projX, telaY - projY);
        }

        // 2. Bounding Box do bloco de texto com informações no fim da linha (Rumo, Distância, ETA)
        let clicouTexto = (telaX >= dTela.x + 8 && telaX <= dTela.x + 65 &&
                           telaY >= dTela.y - 25 && telaY <= dTela.y + 35);

        if (distLinha <= RAIO_TOLERANCIA || clicouTexto) {
            let dEfetiva = clicouTexto ? 0 : distLinha;
            if (dEfetiva < menorDist) {
                menorDist = dEfetiva;
                indiceEncontrado = i;
            }
        }
    }
    return indiceEncontrado;
}

/**
 * Desenha as linhas tracejadas que representam os limites da ATCSMAC.
 * Padrão: Traços de 1 NM, espaçados em 1 NM, com um ponto (".") intercalado a 0.5 NM.
 */
export function desenharLinhaATCSMAC(caminhoArray) {
    if (caminhoArray.length < 2) return;
    const umNM = state.escala / 60;
    const dashPx = 1.0 * umNM;
    const dotPx = 2.0;
    const gapPx = Math.max(1, 0.5 * umNM - dotPx / 2);

    state.ctx.strokeStyle = '#000000'; 
    state.ctx.lineWidth = 1.5; 
    state.ctx.setLineDash([dashPx, gapPx, dotPx, gapPx]);
    
    state.ctx.beginPath(); 
    state.ctx.moveTo(pegarCoordenadaTela(caminhoArray[0]).x, pegarCoordenadaTela(caminhoArray[0]).y);
    for (let i = 1; i < caminhoArray.length; i++) {
        state.ctx.lineTo(pegarCoordenadaTela(caminhoArray[i]).x, pegarCoordenadaTela(caminhoArray[i]).y);
    }
    state.ctx.stroke(); 
    state.ctx.setLineDash([]); // Restaura para linha contínua para os desenhos seguintes
}

/**
 * Desenha a fronteira externa dos limites da Terminal (TMA) em linha contínua branca.
 * Mantém estilo contínuo branco sem controle de brilho/opacidade no vídeo mapa.
 * @param {Array<string>} caminhoArray - Array ordenado dos nomes dos vértices TMA
 */
export function desenharLimiteTMA(caminhoArray) {
    if (!caminhoArray || caminhoArray.length < 2) return;
    const p0 = pegarCoordenadaTela(caminhoArray[0]);
    if (!p0) return;

    state.ctx.save();
    state.ctx.strokeStyle = '#ffffff'; // Linha branca
    state.ctx.lineWidth = 1.5;
    state.ctx.setLineDash([]);        // Linha contínua
    state.ctx.globalAlpha = 1.0;       // Brilho fixo / sem opção de controle de opacidade

    state.ctx.beginPath();
    state.ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < caminhoArray.length; i++) {
        const pt = pegarCoordenadaTela(caminhoArray[i]);
        if (pt) state.ctx.lineTo(pt.x, pt.y);
    }
    state.ctx.stroke();
    state.ctx.restore();
}

/**
 * Calcula o ponto central de um polígono (área restrita/setor) e escreve o texto de altitude lá dentro.
 */
export function escreverAltitudeArea(pontosFronteira, altitudeTexto) {
    let somaX = 0; let somaY = 0; let numPontos = pontosFronteira.length;
    
    // Soma as coordenadas de todos os vértices do polígono
    for (let i = 0; i < numPontos; i++) {
        const pt = pegarCoordenadaTela(pontosFronteira[i]);
        somaX += pt.x; 
        somaY += pt.y;
    }
    
    // Desenha o texto exatamente na média aritmética (centro) dos vértices
    state.ctx.fillStyle = '#000000'; 
    state.ctx.font = 'bold 16px Arial'; 
    state.ctx.textAlign = 'center'; 
    state.ctx.textBaseline = 'middle';
    state.ctx.fillText(altitudeTexto, somaX / numPontos, somaY / numPontos);
    
    // Restaura alinhamento padrão
    state.ctx.textAlign = 'left'; 
    state.ctx.textBaseline = 'alphabetic';
}

/**
 * Desenha uma linha contínua ou tracejada de rota no radar (ex: STARs contínuas, SIDs tracejadas).
 * @param {Array} caminhoArray - Array de identificadores dos fixos da rota.
 * @param {string} cor - Cor em formato hexadecimal ou rgba.
 * @param {boolean|Array<number>} [tracejada=false] - Se deve ser tracejada ou array de padrão [dash, gap].
 */
export function desenharCaminho(caminhoArray, cor, tracejada = false) {
    state.ctx.strokeStyle = cor; 
    state.ctx.lineWidth = 1; 
    if (tracejada) {
        state.ctx.setLineDash(Array.isArray(tracejada) ? tracejada : [6, 6]);
    } else {
        state.ctx.setLineDash([]);
    }
    state.ctx.beginPath();
    state.ctx.moveTo(pegarCoordenadaTela(caminhoArray[0]).x, pegarCoordenadaTela(caminhoArray[0]).y);
    for (let i = 1; i < caminhoArray.length; i++) {
        state.ctx.lineTo(pegarCoordenadaTela(caminhoArray[i]).x, pegarCoordenadaTela(caminhoArray[i]).y);
    }
    state.ctx.stroke();
    if (tracejada) {
        state.ctx.setLineDash([]);
    }
}

/**
 * Desenha pequenas marcações (ticks) ao longo de uma rota para indicar a distância restante até um fixo.
 * @param {Array} caminhoArray - Sequência da rota.
 * @param {string} fixoOrigem - Fixo alvo final (o marco zero).
 * @param {Array} alvosNM - Array de distâncias a marcar (ex: [10, 20, 30]).
 */
export function desenharMarcasMilhagem(caminhoArray, fixoOrigem, alvosNM, cor, labels = null) {
    const idxOrigem = caminhoArray.indexOf(fixoOrigem);
    if (idxOrigem === -1) return;
    
    let accDist = 0; 
    let alvoIndex = 0; 
    let pAtual = state.fixos[caminhoArray[idxOrigem]];
    
    // Caminha pela rota de trás para a frente a partir do fixo
    for (let i = idxOrigem - 1; i >= 0; i--) {
        if (alvoIndex >= alvosNM.length) break;
        
        let pProximo = state.fixos[caminhoArray[i]];
        let dLat = pProximo.deltaLat - pAtual.deltaLat; 
        let dLon = pProximo.deltaLon - pAtual.deltaLon;
        let distSeg = Math.sqrt(Math.pow(dLat * 60, 2) + Math.pow(dLon * correcaoLon * 60, 2));

        // Desenha marcações se a distância alvo cair dentro deste segmento da rota
        while (alvoIndex < alvosNM.length && accDist + distSeg >= alvosNM[alvoIndex]) {
            let proporcao = (alvosNM[alvoIndex] - accDist) / distSeg;
            let ptTela = deltaParaTela({ 
                deltaLat: pAtual.deltaLat + dLat * proporcao, 
                deltaLon: pAtual.deltaLon + dLon * proporcao 
            });
            
            // Calcula um ângulo perpendicular (90 graus) à rota para desenhar o texto da milhagem ao lado
            let perp = Math.atan2(deltaParaTela(pProximo).y - deltaParaTela(pAtual).y, deltaParaTela(pProximo).x - deltaParaTela(pAtual).x) + Math.PI / 2;
            
            // Desenha a bolinha e o texto
            state.ctx.fillStyle = cor; 
            state.ctx.beginPath(); 
            state.ctx.arc(ptTela.x, ptTela.y, 4, 0, Math.PI * 2); 
            state.ctx.fill();
            state.ctx.font = 'bold 12px Arial'; 
            let texto = labels && labels[alvoIndex] !== undefined ? labels[alvoIndex].toString() : alvosNM[alvoIndex].toString();
            state.ctx.fillText(texto, ptTela.x + Math.cos(perp) * 12 - 6, ptTela.y + Math.sin(perp) * 12 + 4);
            
            alvoIndex++;
        }

        // Se faltar marcações e já acabaram os fixos da rota, prolonga a linha num vetor reto imaginário
        if (i === 0 && alvoIndex < alvosNM.length) {
            let propTotal = (alvosNM[alvosNM.length - 1] - (accDist + distSeg)) / distSeg;
            if (propTotal > 0) {
                let telaExt = deltaParaTela({ 
                    deltaLat: pProximo.deltaLat + dLat * propTotal, 
                    deltaLon: pProximo.deltaLon + dLon * propTotal 
                });
                let telaUltimo = deltaParaTela(pProximo);
                
                // Desenha linha prolongada tracejada
                state.ctx.strokeStyle = cor; 
                state.ctx.lineWidth = 1; 
                state.ctx.setLineDash([5, 5]); 
                state.ctx.beginPath(); 
                state.ctx.moveTo(telaUltimo.x, telaUltimo.y); 
                state.ctx.lineTo(telaExt.x, telaExt.y); 
                state.ctx.stroke(); 
                state.ctx.setLineDash([]); 

                while (alvoIndex < alvosNM.length) {
                    let propExt = (alvosNM[alvoIndex] - (accDist + distSeg)) / distSeg;
                    let ptTela = deltaParaTela({ 
                        deltaLat: pProximo.deltaLat + dLat * propExt, 
                        deltaLon: pProximo.deltaLon + dLon * propExt 
                    });
                    let perp = Math.atan2(telaExt.y - telaUltimo.y, telaExt.x - telaUltimo.x) + Math.PI / 2;
                    
                    state.ctx.fillStyle = cor; 
                    state.ctx.beginPath(); 
                    state.ctx.arc(ptTela.x, ptTela.y, 4, 0, Math.PI * 2); 
                    state.ctx.fill();
                    state.ctx.font = 'bold 12px Arial'; 
            let texto = labels && labels[alvoIndex] !== undefined ? labels[alvoIndex].toString() : alvosNM[alvoIndex].toString();
            state.ctx.fillText(texto, ptTela.x + Math.cos(perp) * 12 - 6, ptTela.y + Math.sin(perp) * 12 + 4);
                    alvoIndex++;
                }
            }
        }
        accDist += distSeg; pAtual = pProximo;
    }
}

/**
 * Desenha arcos de circunferência associados a um procedimento (ex: Point Merge System em STARs).
 * @param {Array<Object>|Object} arcosConfig - Configuração dos arcos
 * @param {string} corPadrao - Cor padrão herdada do procedimento
 */
export function desenharArcosCarta(arcosConfig, corPadrao = '#ffff00') {
    if (!arcosConfig) return;
    const arcosArray = Array.isArray(arcosConfig) ? arcosConfig : [arcosConfig];
    const umNM = state.escala / 60;

    arcosArray.forEach(cfg => {
        let centroPt = null;
        if (typeof cfg.centro === 'string') {
            centroPt = pegarCoordenadaTela(cfg.centro);
        } else if (cfg.centro && typeof cfg.centro === 'object') {
            if (cfg.centro.lat !== undefined && cfg.centro.lon !== undefined) {
                centroPt = deltaParaTela(geoParaDelta(cfg.centro.lat, cfg.centro.lon));
            } else if (cfg.centro.x !== undefined && cfg.centro.y !== undefined) {
                centroPt = cfg.centro;
            }
        }

        if (!centroPt || (centroPt.x === 0 && centroPt.y === 0 && !state.fixos[cfg.centro])) return;

        const raios = Array.isArray(cfg.raiosNM) ? cfg.raiosNM : (cfg.raioNM !== undefined ? [cfg.raioNM] : []);
        const rumoIni = cfg.rumoInicial !== undefined ? cfg.rumoInicial : 0;
        const abertura = cfg.aberturaGraus !== undefined ? cfg.aberturaGraus : 360;

        // Conversão de rumo magnético para radianos de Canvas.
        // Rumo 000° aponta para -Y (Norte no radar) -> ângulo Canvas: -90°
        // Rumo 090° aponta para +X (Leste no radar) -> ângulo Canvas: 0°
        const anguloInicialRad = (rumoIni - 90) * (Math.PI / 180);
        const anguloFinalRad = (rumoIni + abertura - 90) * (Math.PI / 180);

        const corPadraoArco = cfg.cor || corPadrao;
        const dashPattern = cfg.dashPattern || [2, 4];
        const coresPorRaio = cfg.coresPorRaio || {};

        state.ctx.save();
        state.ctx.lineWidth = cfg.lineWidth || 1.2;
        state.ctx.setLineDash(dashPattern);

        raios.forEach(rNM => {
            const rPx = rNM * umNM;
            if (rPx <= 0) return;
            const corRaio = coresPorRaio[rNM] || corPadraoArco;
            state.ctx.strokeStyle = corRaio;
            state.ctx.beginPath();
            state.ctx.arc(centroPt.x, centroPt.y, rPx, anguloInicialRad, anguloFinalRad, false);
            state.ctx.stroke();
        });

        state.ctx.setLineDash([]);
        state.ctx.restore();
    });
}

/**
 * Função orquestradora para desenhar toda a base estática do ecrã do radar
 * (mapa, limites, rotas, fixos e respetivas restrições).
 */
export function desenharMapaBase() {
    // 0. Limites da Terminal (TMA) - Linha contínua branca fixa, sem controle de brilho
    if (estruturaEspacoAereo.limiteTMA) {
        desenharLimiteTMA(estruturaEspacoAereo.limiteTMA);
    }

    // 1 e 2. Linhas tracejadas e altitudes da ATCSMAC (com controle reativo de opacidade)
    const alphaATCSMAC = (state.radarLayers && state.radarLayers.opacity && state.radarLayers.opacity.ATCSMAC !== undefined)
        ? state.radarLayers.opacity.ATCSMAC
        : 0.0;

    if (alphaATCSMAC > 0.01) {
        state.ctx.save();
        state.ctx.globalAlpha = alphaATCSMAC;

        estruturaEspacoAereo.linhasFronteira.forEach(linha => desenharLinhaATCSMAC(linha));
        estruturaEspacoAereo.setoresAltitude.forEach(setor => {
            escreverAltitudeArea(setor.vertices, setor.altitude);
        });

        state.ctx.restore();
    }

    // 3. Rotas e linhas configuradas nas cartas (STAR, SID, IAC)
    if (cartasNavegacao && state.radarLayers) {
        Object.entries(cartasNavegacao).forEach(([aerodromoKey, aerodromo]) => {
            Object.entries(aerodromo).forEach(([cabeceiraKey, cabeceira]) => {
                const runwayKey = `${aerodromoKey}-${cabeceiraKey}`;
                const numPista = cabeceiraKey.replace(/[^0-9]/g, '');
                const groupKey = `${aerodromoKey}-${numPista}`;
                const estaAtiva = Boolean(state.radarLayers.activeRunways && (state.radarLayers.activeRunways.has(groupKey) || state.radarLayers.activeRunways.has(runwayKey)));
                // Se a cabeceira não estiver ativa, oculta imediatamente
                if (!estaAtiva) return;

                Object.entries(cabeceira).forEach(([catKey, categoria]) => {
                    const catType = (catKey === 'AIC' || catKey === 'IAC') ? 'IAC' : catKey;
                    const alpha = state.radarLayers.opacity[catType] !== undefined ? state.radarLayers.opacity[catType] : 0.8;
                    if (alpha <= 0.01) return;

                    if (categoria && typeof categoria === 'object') {
                        Object.values(categoria).forEach(carta => {
                            if (state.radarLayers.activeCharts && state.radarLayers.activeCharts.size > 0) {
                                if (!state.radarLayers.activeCharts.has(carta.nome)) return;
                            }
                            if (carta.linhas && carta.cor) {
                                state.ctx.save();
                                state.ctx.globalAlpha = alpha;
                                const isTracejada = (catType === 'SID') || Boolean(carta.tracejada);
                                const dashPattern = carta.dashPattern || (isTracejada ? [6, 6] : false);
                                carta.linhas.forEach(linha => {
                                    if (linha && typeof linha === 'object' && !Array.isArray(linha) && linha.rota) {
                                        desenharCaminho(linha.rota, linha.cor || carta.cor, linha.dashPattern || dashPattern);
                                    } else {
                                        desenharCaminho(linha, carta.cor, dashPattern);
                                    }
                                });
                                state.ctx.restore();
                            }
                            if (carta.arcos) {
                                state.ctx.save();
                                // Opacidade reduzida para os pontilhados dos arcos (ex: 60% do alpha da STAR)
                                const alphaArcos = alpha * 0.6;
                                state.ctx.globalAlpha = alphaArcos;
                                desenharArcosCarta(carta.arcos, carta.cor || '#ffff00');
                                state.ctx.restore();
                            }
                        });
                    }
                });
            });
        });
    }

    // 4. Eixos prolongados de pista (Data-Driven: desenha os prolongamentos definidos em data.js)
    const aptX = state.centroX + state.offsetX; 
    const aptY = state.centroY + state.offsetY;

    aerodromos.forEach(aero => {
        const pt = (aero.nome === "SBSP") 
            ? { x: aptX, y: aptY } 
            : pegarCoordenadaTela(aero.nome);

        if (!pt) return;

        // 1. Prolongamento compartilhado no nível do aeródromo (ex: SBSP centralizado nas pistas)
        if (aero.prolongamento) {
            const rumo = aero.prolongamento.rumo !== undefined 
                ? aero.prolongamento.rumo 
                : (aero.rumoPista || 170);
            desenharProlongamentoPista(pt.x, pt.y, rumo, {
                compNM: aero.compNM || (aero.pistas && aero.pistas[0] ? aero.pistas[0].compNM : 1.0),
                sepY: 0,
                sepX: 0,
                cabeceiras: (aero.pistas && aero.pistas[0]) ? aero.pistas[0].cabeceiras : undefined,
                ...aero.prolongamento
            });
        }

        // 2. Prolongamentos específicos por pista (caso configurado individualmente)
        if (aero.pistas) {
            aero.pistas.forEach(pista => {
                if (pista.prolongamento) {
                    const rumo = pista.rumo !== undefined ? pista.rumo : (aero.rumoPista || 120);
                    desenharProlongamentoPista(pt.x, pt.y, rumo, {
                        compNM: pista.compNM,
                        sepY: pista.sepY,
                        sepYNM: pista.sepYNM,
                        sepX: pista.sepX,
                        sepXNM: pista.sepXNM,
                        cabeceiras: pista.cabeceiras,
                        ...pista.prolongamento
                    });
                }
            });
        }
    });

    // 5. Marcas de milhagem (Data-Driven: lido dinamicamente das cartas ativas com opacidade respectiva)
    if (cartasNavegacao && state.radarLayers) {
        Object.entries(cartasNavegacao).forEach(([aerodromoKey, aerodromo]) => {
            Object.entries(aerodromo).forEach(([cabeceiraKey, cabeceira]) => {
                const runwayKey = `${aerodromoKey}-${cabeceiraKey}`;
                const numPista = cabeceiraKey.replace(/[^0-9]/g, '');
                const groupKey = `${aerodromoKey}-${numPista}`;
                const estaAtiva = Boolean(state.radarLayers.activeRunways && (state.radarLayers.activeRunways.has(groupKey) || state.radarLayers.activeRunways.has(runwayKey)));
                if (!estaAtiva) return;

                Object.entries(cabeceira).forEach(([catKey, categoria]) => {
                    const catType = (catKey === 'AIC' || catKey === 'IAC') ? 'IAC' : catKey;
                    const alpha = state.radarLayers.opacity[catType] !== undefined ? state.radarLayers.opacity[catType] : 0.8;
                    if (alpha <= 0.01) return;

                    if (categoria && typeof categoria === 'object') {
                        Object.values(categoria).forEach(carta => {
                            if (state.radarLayers.activeCharts && state.radarLayers.activeCharts.size > 0) {
                                if (!state.radarLayers.activeCharts.has(carta.nome)) return;
                            }
                            if (carta.marcasMilhagem) {
                                state.ctx.save();
                                state.ctx.globalAlpha = alpha;
                                const marcasArray = Array.isArray(carta.marcasMilhagem) ? carta.marcasMilhagem : [carta.marcasMilhagem];
                                marcasArray.forEach(marca => {
                                    desenharMarcasMilhagem(
                                        marca.rota, 
                                        marca.pontoZero, 
                                        marca.distancias, 
                                        carta.cor || '#ff9900',
                                        marca.textos
                                    );
                                });
                                state.ctx.restore();
                            }
                        });
                    }
                });
            });
        });
    }

    // 6. Desenho exclusivo dos fixos de navegação pertencentes às cabeceiras e cartas ativas (com opacidade por procedimento)
    if (cartasNavegacao && state.radarLayers) {
        const fixosParaDesenhar = new Map();

        Object.entries(cartasNavegacao).forEach(([aerodromoKey, aerodromo]) => {
            Object.entries(aerodromo).forEach(([cabeceiraKey, cabeceira]) => {
                const runwayKey = `${aerodromoKey}-${cabeceiraKey}`;
                const numPista = cabeceiraKey.replace(/[^0-9]/g, '');
                const groupKey = `${aerodromoKey}-${numPista}`;
                const estaAtiva = Boolean(state.radarLayers.activeRunways && (state.radarLayers.activeRunways.has(groupKey) || state.radarLayers.activeRunways.has(runwayKey)));
                if (!estaAtiva) return;

                Object.entries(cabeceira).forEach(([catKey, categoria]) => {
                    const catType = (catKey === 'AIC' || catKey === 'IAC') ? 'IAC' : catKey;
                    const alpha = state.radarLayers.opacity[catType] !== undefined ? state.radarLayers.opacity[catType] : 0.8;
                    if (alpha <= 0.01) return;

                    if (categoria && typeof categoria === 'object') {
                        Object.values(categoria).forEach(carta => {
                            if (state.radarLayers.activeCharts && state.radarLayers.activeCharts.size > 0) {
                                if (!state.radarLayers.activeCharts.has(carta.nome)) return;
                            }
                            if (carta.fixos && Array.isArray(carta.fixos)) {
                                carta.fixos.forEach(f => {
                                    if (!f || !f.nome) return;
                                    const nome = f.nome;
                                    if (isFixoDePista(nome)) return; // Fixos de pista são mantidos invisíveis no radar
                                    const existente = fixosParaDesenhar.get(nome);
                                    if (existente) {
                                        existente.alpha = Math.max(existente.alpha, alpha);
                                        if (!existente.restricao && f.restricao) {
                                            existente.restricao = f.restricao;
                                        }
                                    } else {
                                        fixosParaDesenhar.set(nome, {
                                            nome: nome,
                                            cor: carta.cor || '#ff9900',
                                            restricao: f.restricao || null,
                                            alpha: alpha
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            });
        });

        fixosParaDesenhar.forEach(fixoObj => {
            const nome = fixoObj.nome;
            if (isFixoDePista(nome)) return; // Garantia adicional de invisibilidade
            const pt = pegarCoordenadaTela(nome);
            if (!pt || (pt.x === 0 && pt.y === 0 && !state.fixos[nome])) return;
            const corFixo = fixoObj.cor || '#ff9900';

            state.ctx.save();
            state.ctx.globalAlpha = fixoObj.alpha;

            // Triângulo do fixo
            state.ctx.fillStyle = corFixo;
            state.ctx.beginPath(); 
            state.ctx.moveTo(pt.x, pt.y - 5); 
            state.ctx.lineTo(pt.x + 5, pt.y + 4); 
            state.ctx.lineTo(pt.x - 5, pt.y + 4); 
            state.ctx.fill();

            // Nome do fixo
            state.ctx.font = '10px monospace'; 
            state.ctx.fillStyle = corFixo;
            state.ctx.fillText(nome, pt.x + 8, pt.y + 4);

            // Restrições de altitude da carta
            const res = fixoObj.restricao;
            if (res && res.fl !== null && res.fl !== undefined) {
                let txtFl = '';
                if (res.tipo === "WINDOW") {
                    const maxStr = formatarNivelOuAltitude(res.flMax || res.fl);
                    const minStr = formatarNivelOuAltitude(res.fl);
                    txtFl = `${maxStr}-${minStr}`;
                } else {
                    txtFl = formatarNivelOuAltitude(res.fl);
                    if (res.tipo === "ABOVE") txtFl += "+";
                    else if (res.tipo === "BELOW") txtFl += "-";
                }

                if (txtFl) {
                    state.ctx.font = '10px monospace';
                    state.ctx.fillStyle = '#000000';
                    state.ctx.fillText(txtFl, pt.x + 8, pt.y + 16);
                }
            }

            state.ctx.restore();
        });
    }

    // 7. Aeródromos e suas pistas (Data-Driven: renderização genérica a partir de aerodromos em data.js)
    aerodromos.forEach(aero => {
        const pt = (aero.nome === "SBSP") 
            ? { x: aptX, y: aptY } 
            : pegarCoordenadaTela(aero.nome);
        if (pt) {
            desenharSimboloPista(pt.x, pt.y, aero);
        }
    });
}

/**
 * Desenha os tracejados de prolongamento de um eixo de pista (aproximação/decolagem).
 * Totalmente configurável por parâmetros: quantidade de traços, comprimento, espaçamento e afastamento.
 * 
 * @param {number} cx - Centro X do aeródromo na tela
 * @param {number} cy - Centro Y do aeródromo na tela
 * @param {number} rumo - Rumo magnético da pista
 * @param {Object} [config={}] - Parâmetros do prolongamento
 */
export function desenharProlongamentoPista(cx, cy, rumo, config = {}) {
    const {
        compNM = 1.0,
        sepY = 0,
        sepYNM,
        sepX = 0,
        sepXNM,
        afastamentoNM = 1.0,
        tamanhoTracoNM = 1.0,
        espacoNM = 1.0,
        tracosAntes = 0,
        tracosDepois = 0,
        cor = '#ffffff',
        cabeceiras = null
    } = config;

    if (tracosAntes <= 0 && tracosDepois <= 0) return;

    const umNM = state.escala / 60;
    const cabs = cabeceiras ? Object.values(cabeceiras) : null;

    if (cabs && cabs.length >= 2 && cabs[0].lat !== undefined && cabs[1].lat !== undefined) {
        let cab1 = cabs[0];
        let cab2 = cabs[1];
        const r1 = cab1.rumo !== undefined ? cab1.rumo : (cab1.frontCourseDeg !== undefined ? cab1.frontCourseDeg : 0);
        const r2 = cab2.rumo !== undefined ? cab2.rumo : (cab2.frontCourseDeg !== undefined ? cab2.frontCourseDeg : 0);
        if (r1 > 180 && r2 <= 180) {
            cab1 = cabs[1];
            cab2 = cabs[0];
        }

        const p1 = deltaParaTela(geoParaDelta(cab1.lat, cab1.lon));
        const p2 = deltaParaTela(geoParaDelta(cab2.lat, cab2.lon));
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const compPx = Math.hypot(dx, dy);
        const anguloRad = Math.atan2(dy, dx);

        state.ctx.save();
        state.ctx.translate(p1.x, p1.y);
        state.ctx.rotate(anguloRad);

        state.ctx.strokeStyle = cor;
        state.ctx.lineWidth = 1;
        state.ctx.setLineDash([]);
        state.ctx.beginPath();

        // Tracejados no sentido recuado (aproximação para cabeceira 1, ex: RW10R)
        for (let i = 0; i < tracosAntes; i++) {
            const xInicio = -(afastamentoNM + i * (tamanhoTracoNM + espacoNM)) * umNM;
            const xFim = xInicio - tamanhoTracoNM * umNM;
            state.ctx.moveTo(xInicio, 0);
            state.ctx.lineTo(xFim, 0);
        }

        // Tracejados no sentido de avanço (aproximação/decolagem cabeceira 2, ex: 28L)
        for (let i = 0; i < tracosDepois; i++) {
            const xInicio = compPx + (afastamentoNM + i * (tamanhoTracoNM + espacoNM)) * umNM;
            const xFim = xInicio + tamanhoTracoNM * umNM;
            state.ctx.moveTo(xInicio, 0);
            state.ctx.lineTo(xFim, 0);
        }

        state.ctx.stroke();
        state.ctx.restore();
        return;
    }

    const anguloRad = (rumo - 90) * (Math.PI / 180);
    const sepXPx = (sepXNM !== undefined) ? (sepXNM * umNM) : (sepX || 0);
    const sepYPx = (sepYNM !== undefined) ? (sepYNM * umNM) : (sepY || 0);

    state.ctx.save();
    state.ctx.translate(cx, cy);
    state.ctx.rotate(anguloRad);

    state.ctx.strokeStyle = cor;
    state.ctx.lineWidth = 1;
    state.ctx.setLineDash([]);
    state.ctx.beginPath();

    // Tracejados no sentido recuado (ex: Norte / proa oposta / aproximação final)
    for (let i = 0; i < tracosAntes; i++) {
        const xInicio = sepXPx - (compNM / 2 + afastamentoNM + i * (tamanhoTracoNM + espacoNM)) * umNM;
        const xFim = xInicio - tamanhoTracoNM * umNM;
        state.ctx.moveTo(xInicio, sepYPx);
        state.ctx.lineTo(xFim, sepYPx);
    }

    // Tracejados no sentido de avanço (ex: Sul / rumo da pista / decolagem)
    for (let i = 0; i < tracosDepois; i++) {
        const xInicio = sepXPx + (compNM / 2 + afastamentoNM + i * (tamanhoTracoNM + espacoNM)) * umNM;
        const xFim = xInicio + tamanhoTracoNM * umNM;
        state.ctx.moveTo(xInicio, sepYPx);
        state.ctx.lineTo(xFim, sepYPx);
    }

    state.ctx.stroke();
    state.ctx.restore();
}

/**
 * Desenha o símbolo de um aeródromo e suas pistas de forma data-driven.
 * Renderiza todas as pistas físicas cadastradas em data.js sob o retângulo indicador.
 * 
 * @param {number} cx - Centro X na tela
 * @param {number} cy - Centro Y na tela
 * @param {Object|string} aeroOuNome - Objeto do aeródromo ou nome do mesmo
 * @param {number} [rumoPistaFallback=120] - Rumo fallback caso chamado com string simples
 * @param {string} [cor='#00ffff'] - Cor da borda do retângulo
 */
export function desenharSimboloPista(cx, cy, aeroOuNome, rumoPistaFallback = 120, cor = '#00ffff') {
    const aeroObj = (typeof aeroOuNome === 'object' && aeroOuNome !== null)
        ? aeroOuNome
        : (aerodromos.find(a => a.nome === aeroOuNome) || { nome: aeroOuNome, rumoPista: rumoPistaFallback });

    const nome = aeroObj.nome || aeroOuNome;
    const umNM = state.escala / 60;
    const pistas = aeroObj.pistas || [
        { rumo: aeroObj.rumoPista || rumoPistaFallback, compNM: 1.0, larguraPx: 4.0, sepY: 0, sepX: 0 }
    ];

    // 1. Desenha todas as pistas físicas com seus respectivos rumos e posições relativas
    pistas.forEach(pista => {
        const cabs = pista.cabeceiras ? Object.values(pista.cabeceiras) : null;
        if (cabs && cabs.length >= 2 && cabs[0].lat !== undefined && cabs[1].lat !== undefined) {
            let cab1 = cabs[0];
            let cab2 = cabs[1];
            const r1 = cab1.rumo !== undefined ? cab1.rumo : (cab1.frontCourseDeg !== undefined ? cab1.frontCourseDeg : 0);
            const r2 = cab2.rumo !== undefined ? cab2.rumo : (cab2.frontCourseDeg !== undefined ? cab2.frontCourseDeg : 0);
            if (r1 > 180 && r2 <= 180) {
                cab1 = cabs[1];
                cab2 = cabs[0];
            }
            const p1 = deltaParaTela(geoParaDelta(cab1.lat, cab1.lon));
            const p2 = deltaParaTela(geoParaDelta(cab2.lat, cab2.lon));
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const compPx = Math.hypot(dx, dy);
            const anguloRad = Math.atan2(dy, dx);
            const largPx = pista.larguraPx || 4.0;

            state.ctx.save();
            state.ctx.translate(p1.x, p1.y);
            state.ctx.rotate(anguloRad);
            state.ctx.fillStyle = 'rgb(88, 88, 88)'; // Asfalto
            state.ctx.fillRect(0, -largPx / 2, compPx, largPx);
            state.ctx.restore();
            return;
        }

        const rumo = pista.rumo !== undefined ? pista.rumo : (aeroObj.rumoPista || rumoPistaFallback);
        const anguloRad = (rumo - 90) * (Math.PI / 180);
        const compPx = (pista.compNM !== undefined ? pista.compNM : 1.0) * umNM;
        const largPx = pista.larguraPx || 4.0;
        const sepYPx = (pista.sepYNM !== undefined) ? (pista.sepYNM * umNM) : (pista.sepY || 0);
        const sepXPx = (pista.sepXNM !== undefined) ? (pista.sepXNM * umNM) : (pista.sepX || 0);

        state.ctx.save();
        state.ctx.translate(cx, cy);
        state.ctx.rotate(anguloRad);
        state.ctx.fillStyle = 'rgb(88, 88, 88)'; // Asfalto
        state.ctx.fillRect(sepXPx - compPx / 2, sepYPx - largPx / 2, compPx, largPx);
        state.ctx.restore();
    });

    // 2. Retângulos dos aeródromos SEMPRE na horizontal (20x10 px) mantidos sobrepostos à pista
    const compAero = 20; 
    const largAero = 10;  
    
    state.ctx.strokeStyle = cor; 
    state.ctx.lineWidth = 2; 
    state.ctx.strokeRect(cx - compAero / 2, cy - largAero / 2, compAero, largAero); 
    state.ctx.fillStyle = '#444444'; 
    state.ctx.fillRect(cx - compAero / 2 + 1, cy - largAero / 2 + 1, compAero - 2, largAero - 2); 

    // 3. Nome do aeródromo
    state.ctx.fillStyle = '#000000'; 
    state.ctx.font = 'bold 10px monospace'; 
    state.ctx.fillText(nome, cx + 14, cy - 8);
}

/**
 * Desenha as linhas de vetoração/medição (criadas pelo utilizador com a tecla 'O' e 'F').
 */
export function desenharVetores() {
    const tracaLinha = (vetorObj, cor, selecionado) => {
        // Se ancorou num avião, obtém o snapshot de 4s da varredura do radar (posicaoRadar)
        // para que a posição da linha, rumo, distância e ETA atualizem estritamente a cada 4 segundos
        let oDelta = vetorObj.aeroOrigem ? (vetorObj.aeroOrigem.posicaoRadar || vetorObj.aeroOrigem) : vetorObj.origem;
        let dDelta = vetorObj.aeroDestino ? (vetorObj.aeroDestino.posicaoRadar || vetorObj.aeroDestino) : vetorObj.destino;
        let aeroHover = null;
        if (!dDelta) {
            dDelta = telaParaDelta(state.mouseTelaX, state.mouseTelaY);
            aeroHover = pegarAeronaveProxima(state.mouseTelaX, state.mouseTelaY);
        }
        
        if (!oDelta || !dDelta) return;

        const oTela = deltaParaTela(oDelta); 
        const dTela = deltaParaTela(dDelta);
        
        state.ctx.strokeStyle = cor; 
        state.ctx.lineWidth = selecionado ? 3 : 2; 
        state.ctx.beginPath(); 
        state.ctx.moveTo(oTela.x, oTela.y); 
        state.ctx.lineTo(dTela.x, dTela.y); 
        state.ctx.stroke();

        // Marcadores de início e fim da linha de medição
        state.ctx.beginPath();
        state.ctx.stroke();
        state.ctx.beginPath();
        state.ctx.stroke();

        // Escreve os dados (Proa, Distância) no fim da linha baseados no snapshot de 4s
        const info = calcularRumoDistancia(oDelta, dDelta);
        state.ctx.fillStyle = cor; 
        state.ctx.font = selecionado ? 'bold 14px Arial' : 'bold 13px Arial';
        
        // Evita que o bloco de texto saia pela borda direita do Canvas
        let textX = dTela.x + 12;
        if (textX + 60 > state.canvas.width) {
            textX = dTela.x - 65;
        }

        state.ctx.fillText(info.rumo.toString(), textX, dTela.y - 10);
        state.ctx.fillText(info.distancia.toString(), textX, dTela.y + 6);
        
        // Se a origem ou o destino for um avião em movimento (fixado via clique/F no alvo ou etiqueta), calcula o tempo em minutos baseado na Ground Speed do radar (4s)
        const aeroRef = vetorObj.aeroOrigem || vetorObj.aeroDestino || aeroHover;
        if (aeroRef) {
            const snap = aeroRef.posicaoRadar || aeroRef;
            const gsRadar = (snap.groundSpeed !== undefined && snap.groundSpeed > 0)
                ? snap.groundSpeed
                : (aeroRef.groundSpeed || aeroRef.vel || 0);
            if (gsRadar > 0) {
                let tempoMin = (info.distanciaNM / gsRadar) * 60;
                state.ctx.fillText(tempoMin.toFixed(1), textX, dTela.y + 22);
            }
        }
    };
    
    // Desenha todos os vetores guardados
    state.vetoresFixos.forEach((v, index) => { 
        tracaLinha(v, index === state.vetorSelecionadoIndex ? '#ff9900' : '#000000', index === state.vetorSelecionadoIndex); 
    });
    
    // Desenha o vetor em criação (agarrado ao cursor do rato)
    if (state.vetorAtivo) tracaLinha(state.vetorAtivo, '#ff9900', true); 
}

/**
 * Função de Renderização Principal do Simulador. 
 * É chamada a cada frame (via requestAnimationFrame no main.js) para redesenhar o Canvas inteiro.
 */
export function desenharRadar() {
    try {
        // 1. Limpa o ecrã com a cor de fundo (cinza escuro)
        state.ctx.fillStyle = '#808080'; 
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
        
        // 2. Desenha o chão estático do radar
        desenharMapaBase();

        // 3. Renderiza todas as aeronaves em voo
   state.aeronaves.forEach(aero => {
        let pt = deltaParaTela(aero);
        
        // Define a cor base de toda a simbologia do radar para esta aeronave
        let corRadar = (aero.squawk === "2000") ? 'hsl(0, 3%, 78%)' : '#000000';

        // 1. Desenha o rasto histórico (pontinhos)
        aero.historico.forEach(histPt => {
            let hTela = deltaParaTela(histPt);
            state.ctx.fillStyle = corRadar; 
            state.ctx.beginPath(); 
            state.ctx.arc(hTela.x, hTela.y, 1.5, 0, Math.PI * 2); 
            state.ctx.fill();
        });

        // 2. Desenha o Plot / Blip (Círculo com X)
        state.ctx.strokeStyle = corRadar; 
        state.ctx.lineWidth = 1;
        state.ctx.beginPath(); 
        state.ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2); 
        state.ctx.stroke(); 
        state.ctx.beginPath(); 
        state.ctx.moveTo(pt.x - 3.5, pt.y - 3.5); state.ctx.lineTo(pt.x + 3.5, pt.y + 3.5);
        state.ctx.moveTo(pt.x + 3.5, pt.y - 3.5); state.ctx.lineTo(pt.x - 3.5, pt.y + 3.5); 
        state.ctx.stroke(); 
        
        // 3. Desenha o Paliteiro (Speed Vector Line / Traço Líder do Radar ao longo do Track)
        if (state.minutosPaliteiro > 0) {
            const radarSnap = aero.posicaoRadar || aero;
            let trackAng = (radarSnap.track !== undefined) ? radarSnap.track : ((aero.track !== undefined) ? aero.track : aero.proa);
            let gs = (radarSnap.groundSpeed !== undefined) ? radarSnap.groundSpeed : ((aero.groundSpeed !== undefined) ? aero.groundSpeed : aero.vel);
            let radTrack = trackAng * (Math.PI / 180);
            let predNM = (gs / 60) * state.minutosPaliteiro; 
            let ptPred = deltaParaTela({ 
                deltaLat: radarSnap.deltaLat + (predNM / 60) * Math.cos(radTrack), 
                deltaLon: radarSnap.deltaLon + (predNM / 60 / correcaoLon) * Math.sin(radTrack) 
            });
            state.ctx.beginPath(); 
            state.ctx.moveTo(pt.x + 5 * Math.cos(radTrack - Math.PI/2), pt.y + 5 * Math.sin(radTrack - Math.PI/2)); 
            state.ctx.lineTo(ptPred.x, ptPred.y); 
            state.ctx.stroke();
        }

        // 4. Calcula e desenha a Linha Guia (Leader Line) até a etiqueta
        let isRight = Math.cos(aero.labelAngle) >= 0; 
        let dir = isRight ? 1 : -1; 
        let lx = pt.x + Math.cos(aero.labelAngle) * aero.labelDist; 
        let ly = pt.y - Math.sin(aero.labelAngle) * aero.labelDist;
        
        state.ctx.beginPath(); 
        state.ctx.moveTo(pt.x, pt.y); 
        state.ctx.lineTo(lx, ly); 
        state.ctx.lineTo(lx + 10 * dir, ly); 
        state.ctx.stroke();

        // Configura tipografia do bloco de dados (sempre alinhada à esquerda)
        state.ctx.font = '12px monospace';
        state.ctx.textAlign = 'left'; 
        state.ctx.textBaseline = 'bottom';
        
        const TAG_WIDTH = (aero.isDep && (aero.targetAltFinal || aero.requestedFL)) ? 105 : 95;
        let textX = isRight ? (lx + 12) : (lx - 10 - TAG_WIDTH);
        const radarSnap = aero.posicaoRadar || aero;
        const gsDisplay = Math.round(radarSnap.groundSpeed !== undefined ? radarSnap.groundSpeed : (aero.groundSpeed !== undefined ? aero.groundSpeed : aero.vel));
        const nivDisplay = ((radarSnap.nivAtual !== undefined && radarSnap.nivAtual !== null) ? radarSnap.nivAtual : (aero.nivAtual || "")).toString();
        
        // Renderização para aviões visualmente identificados em fase de pouso final
        if (aero.squawk === "2000") {
            const corSquawk = aero.expandida ? '#00e676' : 'hsl(0, 3%, 78%)'; 
            state.ctx.fillStyle = corSquawk; 
            state.ctx.fillText("2000", textX, ly - 15);
            state.ctx.fillStyle = 'hsl(0, 3%, 78%)'; 
            state.ctx.fillText(nivDisplay.padEnd(5, ' '), textX, ly - 2); 
            state.ctx.fillText(`${gsDisplay.toString().padEnd(5, ' ')}`, textX, ly + 11);
        } else {
            // Renderização padrão em rota
            
            // LINHA 1: Callsign e Tipo de Aeronave (sempre Callsign à esquerda, Tipo à direita)
            const corCallsign = aero.expandida ? '#00e676' : corRadar;
            const callsignTexto = (aero.callsign || "").padEnd(8, ' ');

            state.ctx.fillStyle = corCallsign;
            state.ctx.fillText(callsignTexto, textX, ly - 15);
            state.ctx.fillStyle = corRadar;
            const offsetTipo = state.ctx.measureText(callsignTexto + ' ').width;
            state.ctx.fillText(aero.tipo || "", textX + offsetTipo, ly - 15);
            
            // LINHA 2: Altitude Atual e Altitude Autorizada (sempre Nível Atual à esquerda, Nível Autorizado à direita)
            let offsetNivAut = textX + 45; // Distanciamento horizontal padrão
            state.ctx.fillStyle = corRadar;
            state.ctx.fillText(nivDisplay.padEnd(5, ' '), textX, ly - 2); 
            
            // Desenha fundo de highlight se o menu dropdown deste avião estiver aberto
            if (aero === state.aeroEditandoNivel) { 
                state.ctx.fillStyle = '#004488'; 
                state.ctx.fillRect(offsetNivAut - 2, ly - 14, 28, 14); 
            }
            state.ctx.fillStyle = (aero === state.aeroEditandoNivel) ? '#00ffff' : corRadar; 
            state.ctx.fillText(aero.nivAutorizado, offsetNivAut, ly - 2);
            
            // Nível final para aeronaves decolando (DEP) ao lado do nível autorizado
            if (aero.isDep && (aero.targetAltFinal || aero.requestedFL)) {
                const finalFLNum = aero.targetAltFinal || aero.requestedFL;
                const nivFinalStr = String(finalFLNum).replace(/[^0-9]/g, '').padStart(3, '0');
                const offsetNivFinal = offsetNivAut + Math.max(28, state.ctx.measureText(aero.nivAutorizado).width + 6);
                state.ctx.fillStyle = corRadar;
                state.ctx.fillText(nivFinalStr, offsetNivFinal, ly - 2);
            }
            
            // LINHA 3: Velocidade Computada (Ground Speed) e Destino
            state.ctx.fillStyle = corRadar; 
            state.ctx.fillText(`${gsDisplay.toString().padEnd(5, ' ')} ${aero.dest || ""}`, textX, ly + 11);
        }
        
        // LINHA 4: Scratchpad (Bloco de anotações do controlador e de envio de comandos ao avião)
        state.ctx.fillStyle = corRadar;
        if (aero === state.aeroEditandoTexto) {
            // Atualiza a posição do input HTML encapsulado sobre a etiqueta
            scratchpadUI.posicionar(textX, ly + 13, 'left');
            
            // Desenha um sublinhado azul ciano piscante no canvas para destacar qual avião está ativo
            state.ctx.strokeStyle = '#00ffff'; 
            state.ctx.beginPath(); 
            state.ctx.moveTo(textX, ly + 26); 
            state.ctx.lineTo(textX + 80, ly + 26); 
            state.ctx.stroke();
        } else {
            // A quarta linha exibe textoLivre (apagada fisicamente quando APP ou ILS é selecionado)
            state.ctx.fillText(aero.textoLivre || "", textX, ly + 24);
        }

        // LINHA 5: Proa Real, Proa Autorizada e Velocidade Autorizada
        renderizarLinha5(state.ctx, aero, textX, ly, isRight, aero === state.aeroEditandoProa, aero === state.aeroEditandoVelocidade);

        // LINHA 6: Razão Vertical Mantida e Modo Vertical (AUTO, ATC-R, EXPD)
        // Renderizada em ly + 50 somente se expandida ou sob modificação ativa do controlador
        renderizarLinha6(state.ctx, aero, textX, ly, isRight, aero === state.aeroEditandoRazao);
    });
    
    // 4. No topo de tudo, renderiza vetores ativos criados pelo controlador
    desenharVetores();

    // 5. Renderiza a mira e rótulo de coordenadas (Tecla C)
    desenharMiraCoordenadas();

    // 6. HUD de Telemetria de Energia e Aproximação (Seção 24 - Tecla E)
    desenharHUDEnergiaEAproximacao();

    // 7. Sincroniza Camada de Anotação Fixa no Mapa Geográfico
    if (state.annotationController) {
        state.annotationController.redesenhar();
    }
    } catch (e) {
        console.error("Crash during render:", e);
        state.ctx.fillStyle = '#000000';
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
        state.ctx.fillStyle = '#ff0000';
        state.ctx.font = '20px Arial';
        state.ctx.fillText("CRASH IN RENDER LOOP:", 50, 50);
        state.ctx.font = '14px Arial';
        state.ctx.fillText(e.message, 50, 80);
        if (e.stack) {
            const lines = e.stack.split('\n');
            lines.forEach((line, i) => {
                state.ctx.fillText(line, 50, 110 + (i * 20));
            });
        }
    }
}

/**
 * Renderiza a mira (crosshair) e o rótulo de coordenadas capturado pela ferramenta da Tecla C.
 */
export function desenharMiraCoordenadas() {
    if (!state.pontoCoordenadaCapturado) return;

    const pt = deltaParaTela(state.pontoCoordenadaCapturado);
    const { dmsLat, dmsLon } = state.pontoCoordenadaCapturado;

    state.ctx.save();

    // 1. Mira / Crosshair de Alta Visibilidade (Preto #000000)
    state.ctx.strokeStyle = '#000000';
    state.ctx.fillStyle = '#000000';
    state.ctx.lineWidth = 2;
    state.ctx.setLineDash([]);

    // Círculo central
    state.ctx.beginPath();
    state.ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
    state.ctx.stroke();

    // Ponto central
    state.ctx.beginPath();
    state.ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
    state.ctx.fill();

    // Ticks do crosshair (4 direções)
    state.ctx.beginPath();
    state.ctx.moveTo(pt.x, pt.y - 18);
    state.ctx.lineTo(pt.x, pt.y - 5);
    state.ctx.moveTo(pt.x, pt.y + 5);
    state.ctx.lineTo(pt.x, pt.y + 18);
    state.ctx.moveTo(pt.x - 18, pt.y);
    state.ctx.lineTo(pt.x - 5, pt.y);
    state.ctx.moveTo(pt.x + 5, pt.y);
    state.ctx.lineTo(pt.x + 18, pt.y);
    state.ctx.stroke();

    // 2. Caixa de Texto com as Coordenadas ao lado da mira (Preto sobre fundo claro para máximo contraste)
    const txtLat = dmsLat ? dmsLat.textoDMS : '';
    const txtLon = dmsLon ? dmsLon.textoDMS : '';

    state.ctx.font = 'bold 11px monospace';
    const larguraLat = state.ctx.measureText(txtLat).width;
    const larguraLon = state.ctx.measureText(txtLon).width;
    const boxLargura = Math.max(larguraLat, larguraLon) + 16;
    const boxAltura = 34;

    // Ajusta lado se estiver próximo à borda direita da tela
    let boxX = pt.x + 16;
    if (boxX + boxLargura > state.canvas.width - 10) {
        boxX = pt.x - boxLargura - 16;
    }
    let boxY = pt.y - 17;
    if (boxY < 10) boxY = 10;
    if (boxY + boxAltura > state.canvas.height - 10) boxY = state.canvas.height - boxAltura - 10;

    // Fundo da caixa
    state.ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    state.ctx.fillRect(boxX, boxY, boxLargura, boxAltura);

    // Borda da caixa
    state.ctx.strokeStyle = '#000000';
    state.ctx.lineWidth = 1.5;
    state.ctx.strokeRect(boxX, boxY, boxLargura, boxAltura);

    // Texto das coordenadas
    state.ctx.fillStyle = '#000000';
    state.ctx.textAlign = 'left';
    state.ctx.textBaseline = 'middle';
    state.ctx.fillText(txtLat, boxX + 8, boxY + 10);
    state.ctx.fillText(txtLon, boxX + 8, boxY + 24);

    state.ctx.restore();
}

/**
 * Renderiza o HUD de Telemetria de Energia e Aproximação (Seção 24).
 * Ativado ao pressionar a tecla 'E' ou quando state.mostrarHUDEnergia === true.
 */
export function desenharHUDEnergiaEAproximacao() {
    if (!state.mostrarHUDEnergia) return;
    if (!state.aeronaves || state.aeronaves.length === 0) return;

    // Prioriza aeronave selecionada ou primeira em aproximação
    const aero = state.aeroSelecionada ||
        state.aeronaves.find(a => a.cleared_approach || (a.flightEnergyState && (a.flightEnergyState === 'APPROACH' || a.flightEnergyState === 'FINAL' || a.flightEnergyState === 'VECTOR_TO_APPROACH'))) ||
        state.aeronaves[0];

    if (!aero || !aero.energyDebug) return;

    const dbg = aero.energyDebug;
    state.ctx.save();

    const w = 290;
    const h = 160;
    const x = state.canvas.width - w - 20;
    const y = state.canvas.height - h - 30;

    // Fundo escuro translúcido com borda moderna
    state.ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    state.ctx.fillRect(x, y, w, h);
    state.ctx.strokeStyle = '#38bdf8';
    state.ctx.lineWidth = 1.5;
    state.ctx.strokeRect(x, y, w, h);

    // Título do HUD
    state.ctx.fillStyle = '#38bdf8';
    state.ctx.font = 'bold 11px monospace';
    state.ctx.textAlign = 'left';
    state.ctx.fillText(`APPROACH ENERGY HUD [${aero.callsign}]`, x + 10, y + 16);

    // Linha divisória
    state.ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    state.ctx.beginPath();
    state.ctx.moveTo(x + 10, y + 22);
    state.ctx.lineTo(x + w - 10, y + 22);
    state.ctx.stroke();

    // Informações
    state.ctx.font = '10px monospace';

    const corEstado = (dbg.state === 'FINAL') ? '#4ade80' :
                      (dbg.state === 'APPROACH') ? '#38bdf8' :
                      (dbg.state === 'MISSED_APPROACH') ? '#ef4444' :
                      (dbg.state === 'VECTOR_TO_APPROACH') ? '#fbbf24' : '#cbd5e1';

    const corNivel = (dbg.energyState === 'CRITICAL_ENERGY') ? '#ef4444' :
                     (dbg.energyState === 'HIGH_ENERGY') ? '#fbbf24' :
                     (dbg.energyState === 'LOW_ENERGY') ? '#60a5fa' : '#4ade80';

    let row = y + 36;
    const lh = 15;

    state.ctx.fillStyle = '#94a3b8';
    state.ctx.fillText('STATE:', x + 10, row);
    state.ctx.fillStyle = corEstado;
    state.ctx.fillText(`${dbg.state}`, x + 95, row);
    row += lh;

    state.ctx.fillStyle = '#94a3b8';
    state.ctx.fillText('FAF ID:', x + 10, row);
    state.ctx.fillStyle = '#f8fafc';
    state.ctx.fillText(`${dbg.fafId} (Dest: ${aero.dest || 'SBSP'})`, x + 95, row);
    row += lh;

    state.ctx.fillStyle = '#94a3b8';
    state.ctx.fillText('DIST TO FAF:', x + 10, row);
    state.ctx.fillStyle = '#f8fafc';
    const alongTxt = (dbg.alongTrackDist !== null && dbg.alongTrackDist !== undefined) ? `${dbg.alongTrackDist.toFixed(1)} NM` : (dbg.isSuspended ? 'SUSP' : 'N/A');
    const straightTxt = (dbg.straightDist !== null && dbg.straightDist !== undefined) ? `${dbg.straightDist.toFixed(1)} NM` : 'N/A';
    state.ctx.fillText(`${alongTxt} (Straight: ${straightTxt})`, x + 95, row);
    row += lh;

    state.ctx.fillStyle = '#94a3b8';
    state.ctx.fillText('SPEED (IAS):', x + 10, row);
    state.ctx.fillStyle = '#f8fafc';
    state.ctx.fillText(`ACT: ${Math.round(dbg.actualSpeed)}kt | TGT: ${Math.round(dbg.targetSpeed)}kt`, x + 95, row);
    row += lh;

    state.ctx.fillStyle = '#94a3b8';
    state.ctx.fillText('ENERGY LEVEL:', x + 10, row);
    state.ctx.fillStyle = corNivel;
    state.ctx.fillText(`${dbg.energyState}`, x + 95, row);
    row += lh;

    state.ctx.fillStyle = '#94a3b8';
    state.ctx.fillText('GS / WIND:', x + 10, row);
    state.ctx.fillStyle = '#f8fafc';
    state.ctx.fillText(`GS: ${dbg.gs}kt | WND: ${dbg.wind}`, x + 95, row);
    row += lh;

    state.ctx.fillStyle = '#94a3b8';
    state.ctx.fillText('V/S & DRAG:', x + 10, row);
    state.ctx.fillStyle = '#f8fafc';
    const sbTxt = dbg.speedbrakes ? 'SB:EXT' : 'SB:RET';
    const flTxt = aero.flaps ? 'FLAPS' : 'CLEAN';
    const grTxt = aero.gearDown ? 'GEAR:DN' : 'GEAR:UP';
    state.ctx.fillText(`${dbg.vs} fpm | ${sbTxt} | ${flTxt} | ${grTxt}`, x + 95, row);
    row += lh;

    state.ctx.fillStyle = '#64748b';
    state.ctx.font = '9px monospace';
    state.ctx.fillText('Pressione [E] para alternar HUD de Energia', x + 10, y + h - 5);

    state.ctx.restore();
}





