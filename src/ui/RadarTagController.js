/**
 * ============================================================================
 * CONTROLADOR DA ETIQUETA RADAR E MENU VERTICAL (RadarTagController.js)
 * ============================================================================
 * Responsável por:
 * 1. Formatar a 5ª linha da etiqueta de dados (razão vertical com setas ↑/↓ e modo vertical).
 * 2. Renderizar a 5ª linha no Canvas do radar com destaques e aviso de teto estrutural.
 * 3. Gerenciar o menu interativo de razão vertical (AUTO, INCREASE, DECREASE, EXPEDITE, SET).
 * 4. Aplicar a trava de segurança física (Hard Clamp Rule) no comando SET.
 * ============================================================================
 */

import { state } from '../core/state.js';
import { desenharRadar } from './render.js';
import { getAircraftPerformance } from '../data/PerformanceDB.js';
import { VERTICAL_MODES } from '../agents/VirtualPilot.js';
import { flightCommandService } from '../agents/FlightCommandService.js';

/**
 * Formata a string de razão vertical e modo para a 5ª linha da etiqueta.
 * @param {Object} aero - Instância da aeronave ou snapshot
 * @returns {Object} { textoRazao, textoModo, textoCompleto, clamped }
 */
export function formatarLinhaRazaoModo(aero) {
    if (!aero) return { textoRazao: '---', textoModo: 'AUTO', textoCompleto: '--- AUTO', clamped: false };

    const modo = aero.verticalMode
        || (aero.posicaoRadar && aero.posicaoRadar.verticalMode)
        || VERTICAL_MODES.AUTO;

    // Se estiver em modo de aproximação (APP / G/S) ou autorizado procedimento,
    // a razão e o modo APP não devem aparecer na etiqueta
    if (aero.cleared_approach || aero.autorizadoProcedimento || modo === 'APP' || modo === 'G/S') {
        const temModManual = Boolean(
            aero.temModificacaoVertical ||
            modo === VERTICAL_MODES.ATC_RATE ||
            modo === VERTICAL_MODES.EXPEDITE
        );
        if (!temModManual) {
            return { textoRazao: '', textoModo: '', textoCompleto: '', clamped: false };
        }
    }

    const vs = (aero.currentVS !== undefined) 
        ? aero.currentVS 
        : ((aero.posicaoRadar && aero.posicaoRadar.currentVS !== undefined)
            ? aero.posicaoRadar.currentVS 
            : (aero.verticalSpeed || 0));

    let textoRazao = '---';
    if (vs >= 100) {
        const centena = Math.round(vs / 100);
        textoRazao = `↑${centena}`;
    } else if (vs <= -100) {
        const centena = Math.round(Math.abs(vs) / 100);
        textoRazao = `↓${centena}`;
    }

    const clamped = (aero.clampedAtStructural !== undefined)
        ? aero.clampedAtStructural
        : ((aero.posicaoRadar && aero.posicaoRadar.clampedAtStructural !== undefined)
            ? aero.posicaoRadar.clampedAtStructural
            : false);
    const indicadorClamp = clamped ? '*' : '';

    const textoCompleto = `${textoRazao}${indicadorClamp} ${modo}`;
    return { textoRazao, textoModo: modo, textoCompleto, clamped };
}

/**
 * Verifica se a aeronave possui proa ou velocidade autorizada pelo ATC (diferente do padrão de rota/AUTO).
 * @param {Object} aero - Instância da aeronave
 * @returns {{ temProa: boolean, temVel: boolean, proaAutStr: string, velAutStr: string }}
 */
export function obterEstadoProaVelATC(aero) {
    if (!aero) return { temProa: false, temVel: false, proaAutStr: 'hdg', velAutStr: 'vel' };

    let proaAutStr = 'hdg';
    let temProa = false;
    if (aero.proaEscolhidaViaPainel) {
        if (aero.proaEscolhidaViaPainel === 'HLD') {
            const lado = (aero.ladoCurvaViaPainel === 'E' || (aero.modoHolding && aero.modoHolding.lado === 'E')) ? 'HLD<' : 'HLD>';
            proaAutStr = lado;
            temProa = true;
        } else {
            let pd = parseInt(aero.proaEscolhidaViaPainel, 10);
            if (pd <= 0) pd = 360;
            while (pd > 360) pd -= 360;
            proaAutStr = String(pd).padStart(3, '0');
            temProa = true;
        }
    }

    let velAutStr = 'vel';
    let temVel = false;
    if (aero.velEscolhidaViaPainel) {
        if (aero.velEscolhidaViaPainel === 'MIN') {
            velAutStr = 'MIN';
            temVel = true;
        } else {
            velAutStr = String(Math.round(aero.velEscolhidaViaPainel));
            temVel = true;
        }
    }

    return { temProa, temVel, proaAutStr, velAutStr };
}

/**
 * Determina se as linhas 5 e 6 da etiqueta devem estar visíveis.
 * Regra: Ficam visíveis se a etiqueta estiver expandida pelo controlador (clique no callsign)
 * OU se houver modificação ativa do controlador (proa/vel autorizada, razão vertical customizada / EXPEDITE / clamp).
 * A autorização de aproximação (APP) NÃO torna as linhas visíveis.
 * @param {Object} aero - Instância da aeronave
 * @returns {boolean}
 */
export function estaLinhasExtrasVisiveis(aero) {
    if (!aero) return false;
    if (aero.expandida) return true;

    // Se houver proa ou velocidade autorizada escolhida pelo ATC
    const { temProa, temVel } = obterEstadoProaVelATC(aero);
    if (temProa || temVel) return true;

    const vMode = aero.verticalMode
        || (aero.posicaoRadar && aero.posicaoRadar.verticalMode)
        || VERTICAL_MODES.AUTO;

    // Se estiver em aproximação autorizada / APP, a razão e modo APP não devem aparecer na 6ª linha
    if (aero.cleared_approach || aero.autorizadoProcedimento || vMode === 'APP' || vMode === 'G/S') {
        const temModManual = Boolean(
            aero.temModificacaoVertical ||
            vMode === VERTICAL_MODES.ATC_RATE ||
            vMode === VERTICAL_MODES.EXPEDITE
        );
        if (!temModManual) {
            return false;
        }
    }

    // Apenas modificações manuais do ATC (razão imposta ou expedite) ou clamp contam como modificação
    const ehModificacaoManualATC = Boolean(
        aero.temModificacaoVertical ||
        vMode === VERTICAL_MODES.ATC_RATE ||
        vMode === VERTICAL_MODES.EXPEDITE ||
        aero.clampedAtStructural ||
        (aero.posicaoRadar && aero.posicaoRadar.clampedAtStructural)
    );
    return Boolean(ehModificacaoManualATC);
}

/**
 * Renderiza a 5ª linha da etiqueta radar no Canvas.
 * Formato com 3 espaços horizontais:
 * - 1º espaço: Proa Real mantida pela aeronave (ex: 120, 090)
 * - 2º espaço: Proa Autorizada pelo ATC (ex: 180, ou hdg quando expandida)
 * - 3º espaço: Velocidade Autorizada pelo ATC (ex: 210, MIN, ou vel quando expandida)
 * 
 * Regra:
 * - Se expandida: mostra Proa Real, Proa Aut (ou 'hdg') e Vel Aut (ou 'vel').
 * - Se reduzida: mostra apenas o que foi escolhido no painel (proa e/ou vel); caso contrário fica invisível.
 * 
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D do Canvas
 * @param {Object} aero - Instância da aeronave
 * @param {number} textX - Posição X âncora do texto
 * @param {number} ly - Posição Y âncora da etiqueta
 * @param {boolean} isRight - True se a etiqueta está à direita do blip
 * @param {boolean} [estaSelecionadaProa=false] - True se o menu de proa está aberto
 * @param {boolean} [estaSelecionadaVel=false] - True se o menu de velocidade está aberto
 */
export function renderizarLinha5(ctx, aero, textX, ly, isRight, estaSelecionadaProa = false, estaSelecionadaVel = false) {
    if (!estaLinhasExtrasVisiveis(aero)) return;

    const { temProa, temVel, proaAutStr, velAutStr } = obterEstadoProaVelATC(aero);

    // Se reduzida e não houver proa nem velocidade escolhida no painel, a linha 5 fica invisível
    if (!aero.expandida && !temProa && !temVel) return;

    // 1º Espaço: Proa Real (3 dígitos) atualizada a cada 4 segundos pela varredura do radar
    const radarSnap = aero.posicaoRadar || aero;
    let proaRef = (radarSnap.proa !== undefined && radarSnap.proa !== null) ? radarSnap.proa : aero.proa;
    let proaRealNum = Math.round(proaRef !== undefined ? proaRef : 0);
    if (proaRealNum <= 0) proaRealNum = 360;
    while (proaRealNum > 360) proaRealNum -= 360;
    const proaRealStr = String(proaRealNum).padStart(3, '0');

    const posY = ly + 37;

    ctx.save();
    ctx.font = '11px monospace';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';

    const corPadrao = (aero.squawk === "2000") ? "hsl(0, 3%, 78%)" : (aero.isDep ? "hsl(0, 3%, 78%)" : "#000000");

    // Coluna 1: Proa Real (sempre à esquerda - visível apenas quando expandida)
    const col1X = textX;
    if (aero.expandida) {
        ctx.fillStyle = corPadrao;
        ctx.fillText(proaRealStr, col1X, posY);
    }

    // Coluna 2: Proa Autorizada / HLD (centro)
    // Se expandida: mostra 'hdg' ou a proa escolhida
    // Se reduzida: mostra apenas se houver proa escolhida no painel (caso contrário fica invisível)
    const col2X = textX + 30;
    if (aero.expandida || temProa) {
        if (estaSelecionadaProa) {
            ctx.fillStyle = '#004488';
            ctx.fillRect(col2X - 2, posY - 13, 28, 14);
            ctx.fillStyle = '#00ffff';
        } else {
            ctx.fillStyle = corPadrao;
        }
        ctx.fillText(proaAutStr, col2X, posY);
    }

    // Coluna 3: Velocidade Autorizada (direita)
    // Se expandida: mostra 'vel' ou a velocidade escolhida
    // Se reduzida: mostra apenas se houver vel escolhida no painel (caso contrário fica invisível)
    const col3X = textX + 60;
    if (aero.expandida || temVel) {
        if (estaSelecionadaVel) {
            ctx.fillStyle = '#004488';
            ctx.fillRect(col3X - 2, posY - 13, 28, 14);
            ctx.fillStyle = '#00ffff';
        } else {
            ctx.fillStyle = corPadrao;
        }
        ctx.fillText(velAutStr, col3X, posY);
    }

    ctx.restore();
}

/**
 * Renderiza a 6ª linha na etiqueta de dados no Canvas do radar (Razão vertical e Modo de escolha).
 * As linhas 5 e 6 só são exibidas se expandidas pelo controlador ou se houver modificação ativa.
 * Quando o modo APP estiver ativo, a razão e o modo APP não são renderizados.
 * @param {CanvasRenderingContext2D} ctx - Contexto 2D do Canvas
 * @param {Object} aero - Instância da aeronave
 * @param {number} textX - Posição X âncora do texto
 * @param {number} ly - Posição Y âncora da etiqueta
 * @param {boolean} isRight - True se a etiqueta está desenhada à direita do blip
 * @param {boolean} [estaSelecionada=false] - True se o menu de razão estiver aberto
 */
export function renderizarLinha6(ctx, aero, textX, ly, isRight, estaSelecionada = false) {
    if (!estaLinhasExtrasVisiveis(aero)) return;

    const vMode = (aero.posicaoRadar && aero.posicaoRadar.verticalMode)
        ? aero.posicaoRadar.verticalMode
        : (aero.verticalMode || VERTICAL_MODES.AUTO);

    const temModManualVertical = Boolean(
        aero.temModificacaoVertical ||
        vMode === VERTICAL_MODES.ATC_RATE ||
        vMode === VERTICAL_MODES.EXPEDITE ||
        aero.clampedAtStructural ||
        (aero.posicaoRadar && aero.posicaoRadar.clampedAtStructural)
    );

    // Linha 6 só renderiza se estiver expandida OU se houver modificação vertical manual ativa
    if (!aero.expandida && !temModManualVertical) return;

    // Se a aeronave estiver com aproximação autorizada / modo APP, não renderiza razão e modo APP
    if (aero.cleared_approach || aero.autorizadoProcedimento || vMode === 'APP' || vMode === 'G/S') {
        if (!temModManualVertical) {
            return;
        }
    }

    const { textoCompleto, clamped } = formatarLinhaRazaoModo(aero);
    if (!textoCompleto || !textoCompleto.trim()) return;

    const posX = textX;
    // Linha 1: ly - 15 (Callsign/Tipo)
    // Linha 2: ly - 2 (Alt/CFL)
    // Linha 3: ly + 11 (GS/Dest)
    // Linha 4: ly + 24 (Scratchpad)
    // Linha 5: ly + 37 (Proa Real, Proa Aut, Vel Aut)
    // Linha 6: ly + 50 (Razão Vertical e Modo)
    const posY = ly + 50;

    ctx.save();
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';

    // Se o menu de razão estiver aberto para este avião, desenha caixa de highlight ciano
    if (estaSelecionada) {
        ctx.fillStyle = '#004488';
        ctx.fillRect(posX - 2, posY - 13, 76, 15);
        ctx.fillStyle = '#00ffff';
    } else {
        // O texto permanece preto (#000000) em todos os modos (AUTO, ATC-R, EXPD)
        ctx.fillStyle = (aero.squawk === "2000") ? "hsl(0, 3%, 78%)" : (aero.isDep ? "hsl(0, 3%, 78%)" : "#000000");
    }

    ctx.fillText(textoCompleto, posX, posY);
    ctx.restore();
}

/**
 * Controlador do Menu Dropdown Flutuante de Razão Vertical (ATC Interaction).
 */
export class MenuRazaoController {
    constructor() {
        this.menu = null;
        this.aeroAtiva = null;
        this.inputPrompt = null;
    }

    /**
     * Inicializa o elemento HTML do menu no DOM.
     */
    inicializar() {
        let menuExistente = document.getElementById('menuRazaoVertical');
        if (menuExistente) {
            this.menu = menuExistente;
        } else {
            this.menu = document.createElement('div');
            this.menu.id = 'menuRazaoVertical';
            this.menu.className = 'menu-flutuante-atc';
            document.body.appendChild(this.menu);
        }

        // Estilos essenciais via JS para garantir independência do CSS
        this.menu.style.position = 'absolute';
        this.menu.style.backgroundColor = '#222222';
        this.menu.style.border = '1px solid #00ffff';
        this.menu.style.color = '#ffffff';
        this.menu.style.fontFamily = 'monospace';
        this.menu.style.fontSize = '12px';
        this.menu.style.zIndex = '120';
        this.menu.style.borderRadius = '4px';
        this.menu.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.7)';
        this.menu.style.display = 'none';
        this.menu.style.minWidth = '130px';
        this.menu.style.userSelect = 'none';

        // Impede propagação de clique para o canvas
        this.menu.onmousedown = (e) => e.stopPropagation();

        this.construirOpcoes();
    }

    /**
     * Constrói as 5 opções do menu de razão vertical:
     * 1. AUTO
     * 2. INCREASE (+500 ft/min)
     * 3. DECREASE (-500 ft/min)
     * 4. EXPEDITE
     * 5. SET [Valor]
     */
    construirOpcoes() {
        if (!this.menu) return;
        this.menu.innerHTML = '';

        const criarItem = (rotulo, acao, corDestaque = '#00ffff') => {
            const item = document.createElement('div');
            item.className = 'menu-item-razao';
            item.innerText = rotulo;
            item.style.padding = '6px 10px';
            item.style.cursor = 'pointer';
            item.style.borderBottom = '1px solid rgba(255,255,255,0.1)';

            item.onmouseenter = () => {
                item.style.backgroundColor = corDestaque;
                item.style.color = '#000000';
                item.style.fontWeight = 'bold';
            };
            item.onmouseleave = () => {
                item.style.backgroundColor = 'transparent';
                item.style.color = '#ffffff';
                item.style.fontWeight = 'normal';
            };

            item.onmousedown = (e) => {
                e.stopPropagation();
                if (this.aeroAtiva) {
                    acao(this.aeroAtiva);
                }
                this.fechar();
                desenharRadar();
            };

            return item;
        };

        // 1. AUTO: Reverte para o perfil calculado pelo piloto virtual
        this.menu.appendChild(criarItem('AUTO (VNAV)', (aero) => {
            flightCommandService.setVerticalRate(aero, 'AUTO');
        }, '#00ffff'));

        // 2. INCREASE: Incrementa magnitude em +500 ft/min
        this.menu.appendChild(criarItem('INCREASE (+500)', (aero) => {
            flightCommandService.setVerticalRate(aero, 'INCREASE');
        }, '#76ff03'));

        // 3. DECREASE: Reduz magnitude em -500 ft/min
        this.menu.appendChild(criarItem('DECREASE (-500)', (aero) => {
            flightCommandService.setVerticalRate(aero, 'DECREASE');
        }, '#ffb300'));

        // 4. EXPEDITE: Razão operacional máxima (climbExpedite ou descentExpedite)
        this.menu.appendChild(criarItem('EXPEDITE', (aero) => {
            flightCommandService.setVerticalRate(aero, 'EXPEDITE');
        }, '#ff5252'));

        // 5. SET [Valor]: Entrada numérica com Hard Clamp Rule
        const itemSet = document.createElement('div');
        itemSet.className = 'menu-item-razao';
        itemSet.innerText = 'SET (Custom)...';
        itemSet.style.padding = '6px 10px';
        itemSet.style.cursor = 'pointer';

        itemSet.onmouseenter = () => {
            itemSet.style.backgroundColor = '#00ffff';
            itemSet.style.color = '#000000';
            itemSet.style.fontWeight = 'bold';
        };
        itemSet.onmouseleave = () => {
            itemSet.style.backgroundColor = 'transparent';
            itemSet.style.color = '#ffffff';
            itemSet.style.fontWeight = 'normal';
        };

        itemSet.onmousedown = (e) => {
            e.stopPropagation();
            const aero = this.aeroAtiva;
            this.fechar();
            if (aero) {
                this.abrirPromptSet(aero);
            }
        };

        this.menu.appendChild(itemSet);
    }

    /**
     * Abre prompt modal limpo para digitação da razão no comando SET.
     * Aplica o Hard Clamp Rule imediatamente sobre a entrada do usuário via FlightCommandService.
     * @param {Object} aero - Instância da aeronave
     */
    abrirPromptSet(aero) {
        const perf = getAircraftPerformance(aero.tipo);
        const atual = aero.targetVS || aero.currentVS || (aero.verticalSpeed || -1500);

        const resposta = window.prompt(
            `[SET VERTICAL RATE - ${aero.callsign} (${aero.tipo})]\n` +
            `Digite a razão em ft/min (+ para subida, - para descida).\n` +
            `Teto Estrutural Máximo: +${perf.rates.climbStructuralMax} ft/min / ${perf.rates.descentStructuralMax} ft/min:`,
            atual.toString()
        );

        if (resposta !== null && resposta.trim() !== "") {
            flightCommandService.setVerticalRate(aero, resposta);
            desenharRadar();
        }
    }

    /**
     * Abre o menu ancorado na posição do clique da etiqueta.
     * @param {Object} aero - Aeronave clicada
     * @param {number} x - Coordenada X na tela
     * @param {number} y - Coordenada Y na tela
     */
    abrir(aero, x, y) {
        if (!this.menu) return;
        this.aeroAtiva = aero;
        state.aeroEditandoRazao = aero;
        this.menu.style.left = `${Math.min(window.innerWidth - 150, Math.max(10, x - 20))}px`;
        this.menu.style.top = `${Math.min(window.innerHeight - 170, Math.max(10, y + 10))}px`;
        this.menu.style.display = 'block';
    }

    /**
     * Fecha o menu e desmarca a aeronave em edição de razão.
     */
    fechar() {
        if (!this.menu) return;
        this.menu.style.display = 'none';
        this.aeroAtiva = null;
        state.aeroEditandoRazao = null;
    }

    estaAberto() {
        return Boolean(this.menu && this.menu.style.display === 'block');
    }
}

export const menuRazaoController = new MenuRazaoController();


