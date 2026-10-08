/**
 * ============================================================================
 * CONTROLADOR DA CAMADA DE ANOTAÇÃO / CANETA DE INSTRUTOR (AnnotationController.js)
 * ============================================================================
 * Gerencia o sistema de anotação gráfica sobre a tela do radar ATC para instrução:
 * - Coordenadas geográficas fixas vinculadas ao mapa e radar (Pan & Zoom mantêm o desenho sobre o ponto).
 * - Cursor de lápis ao abrir as anotações e cursor normal (default) na opção Radar.
 * - Ferramentas: Caneta, Marcador (transparente), Borracha (destination-out) e Radar/Ponteiro.
 * - Histórico completo de traços (strokes) com suporte a Desfazer (Ctrl+Z) e Refazer (Ctrl+Y).
 * - Paleta de cores (Branco, Vermelho, Amarelo, Verde, Azul, Laranja + Color Picker).
 * - Seletor contínuo e presets de espessura de traço com preview dinâmico.
 * - Suporte a arrastar e minimizar o painel.
 * ============================================================================
 */

import { state } from '../core/state.js';
import { telaParaDelta, deltaParaTela } from './render.js';

export const CORES_PRESET = [
    { nome: 'Vermelho', valor: '#ff3b30' },
    { nome: 'Amarelo',  valor: '#ffcc00' },
    { nome: 'Verde',    valor: '#34c759' },
    { nome: 'Azul',     valor: '#007aff' },
    { nome: 'Laranja',  valor: '#ff9500' },
    { nome: 'Branco',   valor: '#ffffff' }
];

export const PRESETS_ESPESSURA = [
    { label: 'Fina',   valor: 2 },
    { label: 'Média',  valor: 4 },
    { label: 'Grossa', valor: 8 },
    { label: 'Extra',  valor: 14 }
];

// Cursor SVG de Lápis com a ponta afiada exatamente na coordenada (0, 0)
export const CURSOR_LAPIS = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'><path d='M0 0 L6 2 L19 15 L15 19 L2 6 Z' fill='%23f5a623' stroke='%23000000' stroke-width='1.5' stroke-linejoin='round'/><polygon points='0,0 2.5,0.8 0.8,2.5' fill='%23000000'/><polygon points='2.5,0.8 5,1.7 1.7,5 0.8,2.5' fill='%23fde3a7'/><path d='M16 12 L19 15 L17.5 16.5 L14.5 13.5 Z' fill='%23d0d0d0'/><path d='M17.5 16.5 L19 15 L22 18 L20.5 19.5 Z' fill='%23e74c3c'/></svg>") 0 0, crosshair`;

export class AnnotationController {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.containerPainel = null;
        this.btnToggle = null;
        this.canvasLimpo = true;

        this.estado = {
            aberto: false,
            minimizado: false,
            ferramenta: 'pen',       // 'pen' | 'highlighter' | 'eraser' | 'cursor'
            cor: '#ff3b30',          // Vermelho instrutor por padrão
            espessura: 4,            // 4px por padrão
            desenhando: false,
            tracoAtual: null,
            strokes: [],             // Histórico sequencial de traços com coordenadas delta
            redoStack: [],           // Pilha para refazer
            confirmandoLimpar: false
        };

        this.rafId = null;
        this.arrastandoPainel = false;
        this.posicaoPainel = { x: null, y: null };
        this.offsetArrastoPainel = { x: 0, y: 0 };
    }

    /**
     * Inicializa a camada de canvas e o painel flutuante no DOM.
     */
    inicializar() {
        // Conecta ao state global para sincronização no render loop
        state.annotationController = this;
        window.annotationController = this;

        // 1. Obtém ou cria o Canvas da Camada de Anotação
        this.canvas = document.getElementById('canvasAnotacoes');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'canvasAnotacoes';
            document.body.appendChild(this.canvas);
        }

        this.ctx = this.canvas.getContext('2d');
        this.redimensionarCanvas();

        // 2. Obtém ou cria o Botão de Ativação do Topo
        this.btnToggle = document.getElementById('btnToggleAnotacao');
        if (this.btnToggle) {
            this.btnToggle.addEventListener('mousedown', (e) => e.stopPropagation());
            this.btnToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }

        // 3. Constrói e injeta o Painel Flutuante
        this.construirPainelDOM();

        // 4. Registra ouvintes de eventos de desenho no Canvas
        this.configurarEventosDesenho();

        // 5. Redimensionamento de janela
        window.addEventListener('resize', () => {
            this.redimensionarCanvas();
        });

        // 6. Atualiza cursor e modo inicial
        this.atualizarModoInteracao();
    }

    /**
     * Ajusta dimensões do canvas à janela sem distorcer o histórico de traços.
     */
    redimensionarCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.redesenhar();
    }

    /**
     * Constrói a estrutura HTML do painel flutuante e adiciona ao DOM.
     */
    construirPainelDOM() {
        let painelExistente = document.getElementById('painelAnotacoes');
        if (painelExistente) {
            painelExistente.remove();
        }

        this.containerPainel = document.createElement('div');
        this.containerPainel.id = 'painelAnotacoes';
        this.containerPainel.className = 'painel-anotacao-flutuante';
        this.containerPainel.style.display = 'none';

        // Impede propagação de clique e arraste para o canvas subjacente
        this.containerPainel.addEventListener('mousedown', (e) => e.stopPropagation());

        document.body.appendChild(this.containerPainel);
        this.renderizarConteudoPainel();
    }

    /**
     * Renderiza o conteúdo visual dinâmico do painel de anotações.
     */
    renderizarConteudoPainel() {
        if (!this.containerPainel) return;

        const { ferramenta, cor, espessura, strokes, redoStack, minimizado, confirmandoLimpar } = this.estado;
        const podeDesfazer = strokes.length > 0;
        const podeRefazer = redoStack.length > 0;

        let html = `
            <div class="anotacao-cabecalho" id="anotacaoHeader">
                <div class="anotacao-titulo">
                    <span class="anotacao-icone-titulo">✏</span>
                    <span>ANOTAÇÃO ATC</span>
                </div>
                <div class="anotacao-controles-janela">
                    <button class="anotacao-btn-janela" id="btnMinimizarAnotacao" title="${minimizado ? 'Expandir' : 'Recolher'}">${minimizado ? '□' : '_'}</button>
                    <button class="anotacao-btn-janela btn-fechar-janela" id="btnFecharAnotacao" title="Fechar painel [P]">✕</button>
                </div>
            </div>
        `;

        if (!minimizado) {
            html += `
                <div class="anotacao-corpo">
                    <!-- 1. BARRA DE FERRAMENTAS -->
                    <div class="anotacao-secao">
                        <div class="anotacao-barra-ferramentas">
                            <button class="btn-tool-atc ${ferramenta === 'pen' ? 'ativo' : ''}" data-tool="pen" title="Caneta sólida [Cursor de lápis]">
                                <span class="tool-icon">✏</span>
                                <span class="tool-label">Caneta</span>
                            </button>
                            <button class="btn-tool-atc ${ferramenta === 'highlighter' ? 'ativo' : ''}" data-tool="highlighter" title="Marcador translúcido [Destaque]">
                                <span class="tool-icon">🖊</span>
                                <span class="tool-label">Marcador</span>
                            </button>
                            <button class="btn-tool-atc ${ferramenta === 'eraser' ? 'ativo' : ''}" data-tool="eraser" title="Borracha [Apaga anotações]">
                                <span class="tool-icon">🧽</span>
                                <span class="tool-label">Borracha</span>
                            </button>
                            <button class="btn-tool-atc ${ferramenta === 'cursor' ? 'ativo' : ''}" data-tool="cursor" title="Modo Radar [Cursor normal para interagir com o mapa]">
                                <span class="tool-icon">🖱</span>
                                <span class="tool-label">Radar</span>
                            </button>
                        </div>
                    </div>

                    <!-- 2. AÇÕES DE HISTÓRICO: DESFAZER / REFAZER / LIMPAR -->
                    <div class="anotacao-secao">
                        <div class="anotacao-acoes-historico">
                            <button class="btn-acao-atc ${podeDesfazer ? '' : 'desabilitado'}" id="btnDesfazerAnotacao" title="Desfazer traço [Ctrl+Z]">
                                ↶ Desfazer
                            </button>
                            <button class="btn-acao-atc ${podeRefazer ? '' : 'desabilitado'}" id="btnRefazerAnotacao" title="Refazer traço [Ctrl+Y]">
                                ↷ Refazer
                            </button>
                            <button class="btn-acao-atc btn-limpar-atc ${strokes.length > 0 ? '' : 'desabilitado'}" id="btnLimparAnotacoes" title="Apagar todas as anotações">
                                🗑 Limpar
                            </button>
                        </div>
                        ${confirmandoLimpar ? `
                            <div class="anotacao-confirmacao-limpar">
                                <span>Apagar todas as anotações?</span>
                                <div class="confirmacao-limpar-botoes">
                                    <button class="btn-confirma-sim" id="btnConfirmaLimparSim">Sim, apagar</button>
                                    <button class="btn-confirma-nao" id="btnConfirmaLimparNao">Cancelar</button>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- 3. SELEÇÃO DE CORES -->
                    <div class="anotacao-secao">
                        <div class="anotacao-subtitulo">
                            <span>COR:</span>
                            <span class="preview-cor-badge" style="background-color: ${cor};"></span>
                        </div>
                        <div class="anotacao-paleta-cores">
                            ${CORES_PRESET.map(c => `
                                <button class="btn-cor-swatch ${cor.toLowerCase() === c.valor.toLowerCase() ? 'selecionada' : ''}" 
                                        data-color="${c.valor}" 
                                        title="${c.nome}" 
                                        style="background-color: ${c.valor};">
                                </button>
                            `).join('')}
                            <label class="btn-color-picker-label" title="Cor personalizada">
                                <span>🎨</span>
                                <input type="color" id="inputCorCustomizada" value="${cor}" class="input-color-escondido">
                            </label>
                        </div>
                    </div>

                    <!-- 4. SELEÇÃO DE ESPESSURA -->
                    <div class="anotacao-secao">
                        <div class="anotacao-subtitulo">
                            <span>ESPESSURA:</span>
                            <span class="anotacao-valor-espessura">${espessura}px</span>
                        </div>
                        <div class="anotacao-presets-espessura">
                            ${PRESETS_ESPESSURA.map(p => `
                                <button class="btn-preset-espessura ${espessura === p.valor ? 'ativo' : ''}" data-size="${p.valor}">
                                    ${p.label} (${p.valor}px)
                                </button>
                            `).join('')}
                        </div>
                        <div class="anotacao-slider-container">
                            <input type="range" id="sliderEspessura" min="1" max="24" step="1" value="${espessura}" class="slider-espessura-atc">
                        </div>
                    </div>
                </div>
            `;
        }

        this.containerPainel.innerHTML = html;
        this.vincularEventosPainel();
    }

    /**
     * Vincula listeners de cliques e interações aos botões e controles do painel.
     */
    vincularEventosPainel() {
        if (!this.containerPainel) return;

        // Cabeçalho e arrasto do painel
        const header = document.getElementById('anotacaoHeader');
        if (header) {
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('button')) return;
                this.arrastandoPainel = true;
                const rect = this.containerPainel.getBoundingClientRect();
                this.offsetArrastoPainel = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            });
        }

        // Botões de minimizar e fechar
        const btnMin = document.getElementById('btnMinimizarAnotacao');
        if (btnMin) {
            btnMin.addEventListener('click', (e) => {
                e.stopPropagation();
                this.estado.minimizado = !this.estado.minimizado;
                this.renderizarConteudoPainel();
            });
        }

        const btnFechar = document.getElementById('btnFecharAnotacao');
        if (btnFechar) {
            btnFechar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.fechar();
            });
        }

        if (this.estado.minimizado) return;

        // Seleção de ferramentas
        const toolBtns = this.containerPainel.querySelectorAll('.btn-tool-atc');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tool = btn.dataset.tool;
                if (tool) {
                    this.selecionarFerramenta(tool);
                }
            });
        });

        // Desfazer / Refazer
        const btnDesfazer = document.getElementById('btnDesfazerAnotacao');
        if (btnDesfazer) {
            btnDesfazer.addEventListener('click', (e) => {
                e.stopPropagation();
                this.desfazer();
            });
        }

        const btnRefazer = document.getElementById('btnRefazerAnotacao');
        if (btnRefazer) {
            btnRefazer.addEventListener('click', (e) => {
                e.stopPropagation();
                this.refazer();
            });
        }

        // Limpar tudo
        const btnLimpar = document.getElementById('btnLimparAnotacoes');
        if (btnLimpar) {
            btnLimpar.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.estado.strokes.length > 0) {
                    this.estado.confirmandoLimpar = true;
                    this.renderizarConteudoPainel();
                }
            });
        }

        const btnConfirmaSim = document.getElementById('btnConfirmaLimparSim');
        if (btnConfirmaSim) {
            btnConfirmaSim.addEventListener('click', (e) => {
                e.stopPropagation();
                this.limparTudo();
            });
        }

        const btnConfirmaNao = document.getElementById('btnConfirmaLimparNao');
        if (btnConfirmaNao) {
            btnConfirmaNao.addEventListener('click', (e) => {
                e.stopPropagation();
                this.estado.confirmandoLimpar = false;
                this.renderizarConteudoPainel();
            });
        }

        // Paleta de Cores
        const colorBtns = this.containerPainel.querySelectorAll('.btn-cor-swatch');
        colorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const color = btn.dataset.color;
                if (color) {
                    this.definirCor(color);
                }
            });
        });

        const inputColor = document.getElementById('inputCorCustomizada');
        if (inputColor) {
            inputColor.addEventListener('input', (e) => {
                this.definirCor(e.target.value);
            });
            inputColor.addEventListener('change', (e) => {
                this.definirCor(e.target.value);
            });
        }

        // Presets de Espessura
        const presetBtns = this.containerPainel.querySelectorAll('.btn-preset-espessura');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const size = parseInt(btn.dataset.size, 10);
                if (size) {
                    this.definirEspessura(size);
                }
            });
        });

        // Slider de Espessura
        const slider = document.getElementById('sliderEspessura');
        if (slider) {
            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                this.definirEspessura(val, false);
            });
            slider.addEventListener('change', (e) => {
                const val = parseInt(e.target.value, 10);
                this.definirEspessura(val, true);
            });
        }
    }

    /**
     * Gerencia ouvintes de movimento do mouse para arrasto da janela do painel.
     */
    configurarEventosPainelArrasto() {
        window.addEventListener('mousemove', (e) => {
            if (this.arrastandoPainel && this.containerPainel) {
                let novoX = e.clientX - this.offsetArrastoPainel.x;
                let novoY = e.clientY - this.offsetArrastoPainel.y;
                novoX = Math.max(10, Math.min(window.innerWidth - 260, novoX));
                novoY = Math.max(10, Math.min(window.innerHeight - 100, novoY));
                this.containerPainel.style.left = `${novoX}px`;
                this.containerPainel.style.top = `${novoY}px`;
                this.containerPainel.style.right = 'auto';
                this.posicaoPainel = { x: novoX, y: novoY };
            }
        });

        window.addEventListener('mouseup', () => {
            this.arrastandoPainel = false;
        });
    }

    /**
     * Alterna a visibilidade do painel (Tecla P ou Botão de topo).
     */
    toggle() {
        if (this.estado.aberto) {
            this.fechar();
        } else {
            this.abrir();
        }
    }

    /**
     * Abre o painel e ativa o modo de anotação com cursor de lápis.
     */
    abrir() {
        this.estado.aberto = true;
        this.estado.confirmandoLimpar = false;
        if (this.containerPainel) {
            this.containerPainel.style.display = 'block';
            if (this.posicaoPainel.x === null) {
                this.containerPainel.style.right = '15px';
                this.containerPainel.style.top = '60px';
                this.containerPainel.style.left = 'auto';
            }
        }
        if (this.btnToggle) {
            this.btnToggle.classList.add('ativo');
        }

        // Ao abrir as anotações, ativa por padrão a Caneta com cursor de lápis
        if (this.estado.ferramenta === 'cursor') {
            this.estado.ferramenta = 'pen';
        }

        this.configurarEventosPainelArrasto();
        this.atualizarModoInteracao();
        this.renderizarConteudoPainel();
    }

    /**
     * Fecha o painel, desativa interceptação de cliques do mouse,
     * restaura o cursor normal e PRESERVA todos os desenhos fixados no mapa.
     */
    fechar() {
        this.estado.aberto = false;
        this.estado.confirmandoLimpar = false;
        if (this.containerPainel) {
            this.containerPainel.style.display = 'none';
        }
        if (this.btnToggle) {
            this.btnToggle.classList.remove('ativo');
        }

        // Desativa a captura de cliques do mouse na camada para liberar o radar
        this.atualizarModoInteracao();
    }

    estaAberto() {
        return this.estado.aberto;
    }

    /**
     * Seleciona uma ferramenta ativa ('pen' | 'highlighter' | 'eraser' | 'cursor').
     */
    selecionarFerramenta(ferramenta) {
        this.estado.ferramenta = ferramenta;
        this.atualizarModoInteracao();
        this.renderizarConteudoPainel();
    }

    /**
     * Define a cor ativa para novas anotações.
     */
    definirCor(cor) {
        this.estado.cor = cor;
        // Se estiver na borracha ou no radar, escolher cor reativa a caneta com cursor de lápis
        if (this.estado.ferramenta === 'eraser' || this.estado.ferramenta === 'cursor') {
            this.estado.ferramenta = 'pen';
        }
        this.atualizarModoInteracao();
        this.renderizarConteudoPainel();
    }

    /**
     * Define a espessura ativa em pixels.
     */
    definirEspessura(espessura, reRenderizar = true) {
        this.estado.espessura = Math.max(1, Math.min(30, espessura));
        this.atualizarCursorFeedback();
        if (reRenderizar) {
            this.renderizarConteudoPainel();
        } else {
            const label = this.containerPainel?.querySelector('.anotacao-valor-espessura');
            if (label) label.textContent = `${this.estado.espessura}px`;
        }
    }

    /**
     * Atualiza o estado de interceptação de cliques e cursor:
     * - Se ferramenta for caneta/marcador: cursor vira lápis e desenha sobre o mapa.
     * - Se ferramenta for 'cursor' (Radar) ou painel fechado: cursor fica normal (default) e libera o mapa.
     */
    atualizarModoInteracao() {
        if (!this.canvas) return;

        const modoDesenhoAtivo = this.estado.aberto && this.estado.ferramenta !== 'cursor';

        if (modoDesenhoAtivo) {
            this.canvas.style.pointerEvents = 'auto';
            this.atualizarCursorFeedback();
        } else {
            // Em modo Radar (ponteiro) ou com painel fechado, cursor normal e radar 100% interativo
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.cursor = 'default';
            if (state.canvas) {
                state.canvas.style.cursor = 'default';
            }
        }
    }

    /**
     * Aplica o cursor visual solicitado:
     * - Caneta e Marcador: Cursor de lápis afiado.
     * - Borracha: Círculo nítido com borda preta indicando o raio de apagamento.
     * - Radar: Cursor padrão.
     */
    atualizarCursorFeedback() {
        if (!this.canvas) return;

        const { ferramenta, espessura } = this.estado;

        if (ferramenta === 'eraser') {
            const r = Math.max(6, Math.min(24, Math.round(espessura * 1.5)));
            const diam = r * 2 + 6;
            const center = diam / 2;
            const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${diam}' height='${diam}' viewBox='0 0 ${diam} ${diam}' fill='none'>` +
                        `<circle cx='${center}' cy='${center}' r='${r}' stroke='%23ffffff' stroke-width='3' stroke-opacity='0.6'/>` +
                        `<circle cx='${center}' cy='${center}' r='${r}' stroke='%23000000' stroke-width='1.5' fill='rgba(0, 0, 0, 0.32)'/>` +
                        `<circle cx='${center}' cy='${center}' r='1.2' fill='%23000000'/>` +
                        `</svg>`;
            const cursorUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${center} ${center}, crosshair`;
            this.canvas.style.cursor = cursorUrl;
            if (state.canvas) state.canvas.style.cursor = cursorUrl;
        } else if (ferramenta === 'highlighter' || ferramenta === 'pen') {
            // Cursor de lápis
            this.canvas.style.cursor = CURSOR_LAPIS;
            if (state.canvas) state.canvas.style.cursor = CURSOR_LAPIS;
        } else {
            // Modo Radar: cursor normal
            this.canvas.style.cursor = 'default';
            if (state.canvas) state.canvas.style.cursor = 'default';
        }
    }

    /**
     * Configura ouvintes de mouse no Canvas de Anotações para desenho geográfico contínuo.
     */
    configurarEventosDesenho() {
        if (!this.canvas) return;

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Somente botão esquerdo
            if (!this.estado.aberto || this.estado.ferramenta === 'cursor') return;

            e.preventDefault();
            this.iniciarTraço(e.clientX, e.clientY);
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.estado.desenhando) return;
            this.adicionarPonto(e.clientX, e.clientY);
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button !== 0) return;
            if (this.estado.desenhando) {
                this.finalizarTraço();
            }
        });
    }

    /**
     * Inicia um novo traço convertendo a coordenada de tela para coordenada geográfica (deltaLat, deltaLon).
     */
    iniciarTraço(x, y) {
        this.estado.desenhando = true;
        const ptGeo = telaParaDelta(x, y);

        this.estado.tracoAtual = {
            tool: this.estado.ferramenta,
            color: this.estado.cor,
            size: this.estado.espessura,
            points: [ptGeo]
        };
        this.solicitarRedesenho();
    }

    /**
     * Registra novos pontos ao mover o mouse convertidos para o referencial geográfico do radar.
     */
    adicionarPonto(x, y) {
        if (!this.estado.tracoAtual) return;
        const pts = this.estado.tracoAtual.points;
        const ptGeo = telaParaDelta(x, y);
        const ult = pts[pts.length - 1];

        // Filtro de distância delta mínima para evitar pontos redundantes
        if (ult && Math.hypot(ptGeo.deltaLon - ult.deltaLon, ptGeo.deltaLat - ult.deltaLat) < 0.00005) return;

        pts.push(ptGeo);
        this.solicitarRedesenho();
    }

    /**
     * Finaliza o traço atual e adiciona ao histórico.
     */
    finalizarTraço() {
        if (!this.estado.desenhando || !this.estado.tracoAtual) return;

        this.estado.desenhando = false;
        if (this.estado.tracoAtual.points.length > 0) {
            this.estado.strokes.push(this.estado.tracoAtual);
            // Ao criar novo traço, limpa a pilha de refazer (Redo)
            this.estado.redoStack = [];
        }
        this.estado.tracoAtual = null;
        this.solicitarRedesenho();
        this.renderizarConteudoPainel();
    }

    /**
     * Desfaz o último traço (Caneta, Marcador ou Borracha).
     */
    desfazer() {
        if (this.estado.strokes.length === 0) return;
        const removido = this.estado.strokes.pop();
        this.estado.redoStack.push(removido);
        this.redesenhar();
        this.renderizarConteudoPainel();
    }

    /**
     * Refaz o último traço desfeito.
     */
    refazer() {
        if (this.estado.redoStack.length === 0) return;
        const recuperado = this.estado.redoStack.pop();
        this.estado.strokes.push(recuperado);
        this.redesenhar();
        this.renderizarConteudoPainel();
    }

    /**
     * Apaga todas as anotações e reseta o histórico.
     */
    limparTudo() {
        this.estado.strokes = [];
        this.estado.redoStack = [];
        this.estado.tracoAtual = null;
        this.estado.confirmandoLimpar = false;
        this.redesenhar();
        this.renderizarConteudoPainel();
    }

    /**
     * Solicita redesenho sincronizado com a taxa de atualização do monitor (RAF).
     */
    solicitarRedesenho() {
        if (this.rafId) return;
        this.rafId = requestAnimationFrame(() => {
            this.rafId = null;
            this.redesenhar();
        });
    }

    /**
     * Renderiza todo o histórico de traços projetando suas coordenadas geográficas para a tela atual.
     * Acompanha perfeitamente o Pan e Zoom do radar sem atraso visual.
     */
    redesenhar() {
        if (!this.ctx || !this.canvas) return;

        // Se não há traços e nem está desenhando, limpa se necessário e sai
        if (this.estado.strokes.length === 0 && !this.estado.tracoAtual) {
            if (this.canvasLimpo) return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.canvasLimpo = true;
            return;
        }

        this.canvasLimpo = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Renderiza os traços salvos no histórico projetados nas coordenadas atuais
        for (const stroke of this.estado.strokes) {
            this.renderizarStrokeIndividual(this.ctx, stroke);
        }

        // 2. Renderiza o traço em tempo real sob o cursor
        if (this.estado.tracoAtual) {
            this.renderizarStrokeIndividual(this.ctx, this.estado.tracoAtual);
        }
    }

    /**
     * Desenha um traço específico projetando cada ponto geográfico (deltaLat, deltaLon) para píxeis na tela.
     */
    renderizarStrokeIndividual(ctx, stroke) {
        if (!stroke || !stroke.points || stroke.points.length === 0) return;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.tool === 'eraser') {
            // A Borracha utiliza destination-out para apagar APENAS os traços da camada
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = Math.max(4, stroke.size * 3);
        } else if (stroke.tool === 'highlighter') {
            // O Marcador é translúcido com opacidade controlada
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.35;
            ctx.strokeStyle = stroke.color;
            ctx.fillStyle = stroke.color;
            ctx.lineWidth = Math.max(4, stroke.size * 2.5);
        } else {
            // Caneta sólida normal
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = stroke.color;
            ctx.fillStyle = stroke.color;
            ctx.lineWidth = stroke.size;
        }

        const pts = stroke.points;
        if (pts.length === 1) {
            // Ponto único (clique sem arrasto)
            const ptTela = this.projetarPontoParaTela(pts[0]);
            const raio = (stroke.tool === 'eraser') ? (ctx.lineWidth / 2) : Math.max(1.5, ctx.lineWidth / 2);
            ctx.beginPath();
            ctx.arc(ptTela.x, ptTela.y, raio, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Interpolação suave projetando cada ponto geográfico
            const p0 = this.projetarPontoParaTela(pts[0]);
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);

            for (let i = 1; i < pts.length; i++) {
                const prev = this.projetarPontoParaTela(pts[i - 1]);
                const curr = this.projetarPontoParaTela(pts[i]);
                const midX = (prev.x + curr.x) / 2;
                const midY = (prev.y + curr.y) / 2;
                ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
            }
            const pUlt = this.projetarPontoParaTela(pts[pts.length - 1]);
            ctx.lineTo(pUlt.x, pUlt.y);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Converte o ponto armazenado (geográfico deltaLat/deltaLon ou tela) para a coordenada atual da tela.
     */
    projetarPontoParaTela(pt) {
        if (pt.deltaLat !== undefined && pt.deltaLon !== undefined) {
            return deltaParaTela(pt);
        }
        return pt;
    }
}

// Exporta instância única singleton
export const annotationController = new AnnotationController();
