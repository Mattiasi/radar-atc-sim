import { state } from './state.js';
import { correcaoLon, calcularRumoDistancia } from './utils.js';
import { restricoesFixos, fixosNavegacao, aerodromos, estruturaEspacoAereo, cartasNavegacao } from './data.js';
import { scratchpadUI } from './ui.js';
import { renderizarLinha6, estaLinhasExtrasVisiveis } from './RadarTagController.js';

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
        
        // Define os limites da caixa invisível ao redor do texto
        let minX = isRight ? lx + 5 : lx - 135;
        let maxX = isRight ? lx + 135 : lx - 5;
        
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
        let oDelta = v.aeroOrigem ? v.aeroOrigem : v.origem;
        let dDelta = v.aeroDestino ? v.aeroDestino : v.destino;
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
 * Desenha as linhas tracejadas que representam as bordas da TMA (Área de Controle Terminal).
 */
export function desenharLinhaATCSMAC(caminhoArray) {
    if (caminhoArray.length < 2) return;
    state.ctx.strokeStyle = '#000000'; 
    state.ctx.lineWidth = 1.5; 
    state.ctx.setLineDash([30, 30]); // Padrão tracejado largo
    
    state.ctx.beginPath(); 
    state.ctx.moveTo(pegarCoordenadaTela(caminhoArray[0]).x, pegarCoordenadaTela(caminhoArray[0]).y);
    for (let i = 1; i < caminhoArray.length; i++) {
        state.ctx.lineTo(pegarCoordenadaTela(caminhoArray[i]).x, pegarCoordenadaTela(caminhoArray[i]).y);
    }
    state.ctx.stroke(); 
    state.ctx.setLineDash([]); // Restaura para linha contínua para os desenhos seguintes
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
 * Desenha uma linha contínua de rota no radar (ex: STARs).
 */
export function desenharCaminho(caminhoArray, cor) {
    state.ctx.strokeStyle = cor; 
    state.ctx.lineWidth = 1; 
    state.ctx.beginPath();
    state.ctx.moveTo(pegarCoordenadaTela(caminhoArray[0]).x, pegarCoordenadaTela(caminhoArray[0]).y);
    for (let i = 1; i < caminhoArray.length; i++) {
        state.ctx.lineTo(pegarCoordenadaTela(caminhoArray[i]).x, pegarCoordenadaTela(caminhoArray[i]).y);
    }
    state.ctx.stroke();
}

/**
 * Desenha pequenas marcações (ticks) ao longo de uma rota para indicar a distância restante até um fixo.
 * @param {Array} caminhoArray - Sequência da rota.
 * @param {string} fixoOrigem - Fixo alvo final (o marco zero).
 * @param {Array} alvosNM - Array de distâncias a marcar (ex: [10, 20, 30]).
 */
export function desenharMarcasMilhagem(caminhoArray, fixoOrigem, alvosNM, cor) {
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
            state.ctx.fillText(alvosNM[alvoIndex].toString(), ptTela.x + Math.cos(perp) * 12 - 6, ptTela.y + Math.sin(perp) * 12 + 4);
            
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
                    state.ctx.fillText(alvosNM[alvoIndex].toString(), ptTela.x + Math.cos(perp) * 12 - 6, ptTela.y + Math.sin(perp) * 12 + 4);
                    alvoIndex++;
                }
            }
        }
        accDist += distSeg; pAtual = pProximo;
    }
}

/**
 * Função orquestradora para desenhar toda a base estática do ecrã do radar
 * (mapa, limites, rotas, fixos e respetivas restrições).
 */
export function desenharMapaBase() {
    // 1. Linhas tracejadas dos setores da TMA
    estruturaEspacoAereo.linhasFronteira.forEach(linha => desenharLinhaATCSMAC(linha));

    // 2. Altitudes mínimas de cada setor
    estruturaEspacoAereo.setoresAltitude.forEach(setor => {
        escreverAltitudeArea(setor.vertices, setor.altitude);
    });

    // 3. Rotas e linhas configuradas nas cartas (STAR, SID, AIC)
    if (cartasNavegacao) {
        Object.values(cartasNavegacao).forEach(categoria => {
            Object.values(categoria).forEach(carta => {
                if (carta.linhas && carta.cor) {
                    carta.linhas.forEach(linha => {
                        desenharCaminho(linha, carta.cor);
                    });
                }
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
                        ...pista.prolongamento
                    });
                }
            });
        }
    });

    // 5. Marcas de milhagem
    const corOresu = cartasNavegacao?.STAR?.ORESU_1A?.cor || '#ff9900';
    const corOgtal = cartasNavegacao?.STAR?.OGTAL_2A?.cor || '#ff9900';
    desenharMarcasMilhagem(["PRUMO", "IROPU", "LUVDI", "GERSU", "URUTA", "SP139", "SP017"], "GERSU", [10, 20, 30, 40, 50], corOresu);
    desenharMarcasMilhagem(["OGTAL", "SP099", "SP101", "SP032", "KOMGU", "GERSU"], "GERSU", [10, 20, 30, 40, 50], corOgtal);

    // 6. Desenho exclusivo dos fixos de navegação (sem poluição com pontos PT_xx)
    fixosNavegacao.forEach(fixoObj => {
        const nome = fixoObj.nome;
        const pt = pegarCoordenadaTela(nome);
        const corFixo = fixoObj.cor || '#ff9900';

        // Triângulo do fixo
        state.ctx.fillStyle = corFixo;
        state.ctx.beginPath(); 
        state.ctx.moveTo(pt.x, pt.y - 5); 
        state.ctx.lineTo(pt.x + 5, pt.y + 4); 
        state.ctx.lineTo(pt.x - 5, pt.y + 4); 
        state.ctx.fill();

        // Nome do fixo
        state.ctx.font = '12px Arial'; 
        state.ctx.fillStyle = corFixo;
        state.ctx.fillText(nome, pt.x + 8, pt.y + 4);

        // Restrições de altitude da carta
        if (restricoesFixos[nome]) {
            const res = restricoesFixos[nome];
            if (res.fl > 80) {
                let txtFl = "FL" + res.fl.toString().padStart(3, '0');
                if (res.tipo === "ABOVE") txtFl += "+";
                else if (res.tipo === "BELOW") txtFl += "-";
                
                state.ctx.font = '10px monospace';
                state.ctx.fillStyle = '#000000';
                state.ctx.fillText(txtFl, pt.x + 8, pt.y + 16);
            } 
            if (res.fl < 75) {
                let txtFl = res.fl.toString().padEnd(4, '0') + "'";
                if (res.tipo === "ABOVE") txtFl += "+";
                else if (res.tipo === "BELOW") txtFl += "-";
                state.ctx.font = '10px monospace';
                state.ctx.fillStyle = '#000000';
                state.ctx.fillText(txtFl, pt.x + 8, pt.y + 16);
            }
        }
    });

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
        cor = '#ffffff'
    } = config;

    if (tracosAntes <= 0 && tracosDepois <= 0) return;

    const umNM = state.escala / 60;
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
    state.ctx.font = 'bold 12px Arial'; 
    state.ctx.fillText(nome, cx + 14, cy - 8);
}

/**
 * Desenha as linhas de vetoração/medição (criadas pelo utilizador com a tecla 'O' e 'F').
 */
export function desenharVetores() {
    const tracaLinha = (vetorObj, cor, selecionado) => {
        // Se ancorou num avião, atualiza dinamicamente a posição. Senão usa a coordenada fixa original.
        let oDelta = vetorObj.aeroOrigem ? vetorObj.aeroOrigem : vetorObj.origem;
        // O destino é livre (no cursor do rato) se a linha ainda estiver a ser criada, sem atração magnética
        let dDelta = vetorObj.aeroDestino ? vetorObj.aeroDestino : vetorObj.destino;
        if (!dDelta) {
            dDelta = telaParaDelta(state.mouseTelaX, state.mouseTelaY);
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

        // Escreve os dados (Proa, Distância) no fim da linha
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
        
        // Se a origem for um avião em movimento, calcula o tempo estimado (ETA)
        if (vetorObj.aeroOrigem && vetorObj.aeroOrigem.vel > 0) {
            let tempoMin = (info.distanciaNM / vetorObj.aeroOrigem.vel) * 60;
            state.ctx.fillText(tempoMin.toFixed(1), textX, dTela.y + 22);
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

        // Configura tipografia do bloco de dados
        state.ctx.font = '12px monospace';
        state.ctx.textAlign = isRight ? 'left' : 'right'; 
        state.ctx.textBaseline = 'bottom';
        
        let textX = lx + 12 * dir;
        const radarSnap = aero.posicaoRadar || aero;
        const gsDisplay = Math.round(radarSnap.groundSpeed !== undefined ? radarSnap.groundSpeed : (aero.groundSpeed !== undefined ? aero.groundSpeed : aero.vel));
        const nivDisplay = radarSnap.nivAtual || aero.nivAtual;
        
        // Renderização para aviões visualmente identificados em fase de pouso final
        if (aero.squawk === "2000") {
            const corSquawk = aero.expandida ? '#00e676' : 'hsl(0, 3%, 78%)'; 
            state.ctx.fillStyle = corSquawk; 
            state.ctx.fillText("2000", textX, ly - 15);
            state.ctx.fillStyle = 'hsl(0, 3%, 78%)'; 
            if (isRight) state.ctx.fillText(nivDisplay.padEnd(5, ' '), textX, ly - 2); 
            else state.ctx.fillText(nivDisplay, textX - 35, ly - 2); 
            
            state.ctx.fillText(`${gsDisplay.toString().padEnd(5, ' ')}`, textX, ly + 11);
        } else {
            // Renderização padrão em rota
            
            // LINHA 1: Callsign e Tipo de Aeronave
            // O callsign fica verde (#00e676) se a etiqueta estiver expandida; caso contrário, fica preto (#000000).
            const corCallsign = aero.expandida ? '#00e676' : '#000000';
            const callsignTexto = aero.callsign.padEnd(8, ' ');

            if (isRight) {
                state.ctx.fillStyle = corCallsign;
                state.ctx.fillText(callsignTexto, textX, ly - 15);
                state.ctx.fillStyle = '#000000';
                const offsetTipo = state.ctx.measureText(callsignTexto + ' ').width;
                state.ctx.fillText(aero.tipo, textX + offsetTipo, ly - 15);
            } else {
                state.ctx.fillStyle = '#000000';
                state.ctx.fillText(aero.tipo, textX, ly - 15);
                const offsetTipo = state.ctx.measureText(' ' + aero.tipo).width;
                state.ctx.fillStyle = corCallsign;
                state.ctx.fillText(callsignTexto, textX - offsetTipo, ly - 15);
            }
            
            // LINHA 2: Altitude Atual e Altitude Autorizada
            let offsetNivAut;
            state.ctx.fillStyle = '#000000';
            if (isRight) {
                state.ctx.fillText(nivDisplay.padEnd(5, ' '), textX, ly - 2); 
                offsetNivAut = textX + 45; // Distanciamento horizontal
                
                // Desenha fundo de highlight se o menu dropdown deste avião estiver aberto
                if (aero === state.aeroEditandoNivel) { 
                    state.ctx.fillStyle = '#004488'; 
                    state.ctx.fillRect(offsetNivAut - 2, ly - 14, 28, 14); 
                }
                state.ctx.fillStyle = (aero === state.aeroEditandoNivel) ? '#00ffff' : '#000000'; 
                state.ctx.fillText(aero.nivAutorizado, offsetNivAut, ly - 2);
            } else {
                state.ctx.fillText(nivDisplay, textX - 35, ly - 2); 
                offsetNivAut = textX;
                
                if (aero === state.aeroEditandoNivel) { 
                    state.ctx.fillStyle = '#004488'; 
                    state.ctx.fillRect(offsetNivAut - 25, ly - 14, 28, 14); 
                }
                state.ctx.fillStyle = (aero === state.aeroEditandoNivel) ? '#00ffff' : '#000000'; 
                state.ctx.fillText(aero.nivAutorizado, offsetNivAut, ly - 2);
            }
            
            // LINHA 3: Velocidade Computada (Ground Speed) e Destino
            state.ctx.fillStyle = '#000000'; 
            state.ctx.fillText(`${gsDisplay.toString().padEnd(5, ' ')} ${aero.dest}`, textX, ly + 11);
        }
        
        // LINHA 4: Scratchpad (Bloco de anotações do controlador e de envio de comandos ao avião)
        state.ctx.fillStyle = '#000000';
        if (aero === state.aeroEditandoTexto) {
            // Atualiza a posição do input HTML encapsulado sobre a etiqueta
            scratchpadUI.posicionar(isRight ? textX : (textX - 80), ly + 13, isRight ? 'left' : 'right');
            
            // Desenha um sublinhado azul ciano piscante no canvas para destacar qual avião está ativo
            state.ctx.strokeStyle = '#00ffff'; 
            state.ctx.beginPath(); 
            state.ctx.moveTo(textX, ly + 26); 
            state.ctx.lineTo(isRight ? textX + 80 : textX - 80, ly + 26); 
            state.ctx.stroke();
        } else {
            // Renderiza normalmente o texto anotado na etiqueta
            state.ctx.fillText(aero.textoLivre, textX, ly + 24);
        }

        // LINHA 5: Vazia por enquanto (reservada)
        // LINHA 6: Razão Vertical Mantida e Modo Vertical (AUTO, ATC-R, EXPD)
        // Renderizada em ly + 50 somente se expandida ou sob modificação ativa do controlador
        renderizarLinha6(state.ctx, aero, textX, ly, isRight, aero === state.aeroEditandoRazao);
    });
    
    // 4. No topo de tudo, renderiza vetores ativos criados pelo controlador
    desenharVetores();
}