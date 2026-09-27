import { state } from './state.js';
import { desenharRadar } from './render.js';
import { painelVentoUI } from './painelVentoUI.js';
import { obterTodosFixosProcedimentos } from './data.js';

/**
 * ============================================================================
 * CONTROLADORES DE INTERFACE E ENCAPSULAMENTO DO DOM (UI CONTROLLERS)
 * ============================================================================
 * Centraliza e encapsula o acesso e a manipulação de elementos HTML do DOM:
 * 1. PainelFluxoController: Gerencia os controles dinâmicos de esteira e fluxo de tráfego.
 * 2. ScratchpadController: Gerencia o input flutuante de texto livre e comandos ATC.
 * 3. MenuNivelController: Gerencia o menu flutuante dropdown de Flight Levels.
 * ============================================================================
 */

/**
 * Encapsula os inputs do painel de fluxo de tráfego (Data-Driven).
 * Lê dinamicamente os fixos das cartas e sincroniza as esteiras ativas no state global.
 */
export class PainelFluxoController {
    constructor() {
        this.containerEsteiras = null;
        this.btnAdicionarFluxo = null;
        this.sliderVelocidade = null;
        this.labelVelocidade = null;
    }

    inicializar() {
        this.containerEsteiras = document.getElementById('containerEsteiras');
        this.btnAdicionarFluxo = document.getElementById('btnAdicionarFluxo');
        this.sliderVelocidade = document.getElementById('sliderVelocidade');
        this.labelVelocidade = document.getElementById('labelVelocidade');

        if (!this.containerEsteiras) return;

        // Se state.configFluxo.esteiras ainda não estiver inicializado
        if (!state.configFluxo.esteiras || !Array.isArray(state.configFluxo.esteiras)) {
            state.configFluxo.esteiras = [
                { id: "esteira_1", ativo: true, fixo: "OGTAL", separacao: 15 },
                { id: "esteira_2", ativo: true, fixo: "PRUMO", separacao: 15 }
            ];
        }

        if (this.btnAdicionarFluxo) {
            this.btnAdicionarFluxo.addEventListener('click', (e) => {
                e.stopPropagation();
                this._adicionarNovaEsteira();
            });
            this.btnAdicionarFluxo.addEventListener('mousedown', (e) => e.stopPropagation());
        }

        if (this.sliderVelocidade && this.labelVelocidade) {
            const atualizarVelocidade = () => {
                const val = parseFloat(this.sliderVelocidade.value);
                state.fatorVelocidade = val;
                this.labelVelocidade.textContent = Number.isInteger(val) ? `${val}x` : `${val.toFixed(1).replace('.', ',')}x`;
            };

            this.sliderVelocidade.addEventListener('input', atualizarVelocidade);
            this.sliderVelocidade.addEventListener('change', atualizarVelocidade);
            this.sliderVelocidade.addEventListener('mousedown', (e) => e.stopPropagation());
            state.fatorVelocidade = parseFloat(this.sliderVelocidade.value) || 1.0;
        }

        this.renderizarEsteiras();
    }

    renderizarEsteiras() {
        if (!this.containerEsteiras) return;
        this.containerEsteiras.innerHTML = '';

        const todosFixos = obterTodosFixosProcedimentos();
        todosFixos.sort();

        const opcoesSeparacao = [5, 8, 10, 12, 15, 18, 20, 25];

        state.configFluxo.esteiras.forEach((esteira) => {
            const linha = document.createElement('div');
            linha.className = 'linha-esteira';
            linha.dataset.id = esteira.id;

            // 1. Checkbox Ativo
            const chkContainer = document.createElement('label');
            chkContainer.className = 'chk-esteira-container';
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.checked = esteira.ativo;
            chk.addEventListener('change', () => {
                esteira.ativo = chk.checked;
            });
            chk.addEventListener('mousedown', (e) => e.stopPropagation());
            chkContainer.appendChild(chk);

            // 2. Select Fixo (qualquer fixo de cartas cadastradas)
            const selFixo = document.createElement('select');
            selFixo.className = 'sel-fixo';
            todosFixos.forEach(nomeFixo => {
                const opt = document.createElement('option');
                opt.value = nomeFixo;
                opt.textContent = nomeFixo;
                if (nomeFixo === esteira.fixo) opt.selected = true;
                selFixo.appendChild(opt);
            });
            selFixo.addEventListener('change', () => {
                esteira.fixo = selFixo.value;
            });
            selFixo.addEventListener('mousedown', (e) => e.stopPropagation());

            // 3. Select Separação (NM)
            const selSep = document.createElement('select');
            selSep.className = 'sel-sep';
            opcoesSeparacao.forEach(milhas => {
                const opt = document.createElement('option');
                opt.value = milhas;
                opt.textContent = `${milhas} NM`;
                if (milhas === esteira.separacao) opt.selected = true;
                selSep.appendChild(opt);
            });
            selSep.addEventListener('change', () => {
                esteira.separacao = parseInt(selSep.value, 10);
            });
            selSep.addEventListener('mousedown', (e) => e.stopPropagation());

            linha.appendChild(chkContainer);
            linha.appendChild(selFixo);
            linha.appendChild(selSep);

            // 4. Botão Remover (se houver mais de 1 esteira)
            if (state.configFluxo.esteiras.length > 1) {
                const btnRemover = document.createElement('button');
                btnRemover.className = 'btn-remover-esteira';
                btnRemover.innerHTML = '&times;';
                btnRemover.title = 'Remover este fluxo';
                btnRemover.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._removerEsteira(esteira.id);
                });
                btnRemover.addEventListener('mousedown', (e) => e.stopPropagation());
                linha.appendChild(btnRemover);
            }

            this.containerEsteiras.appendChild(linha);
        });
    }

    _adicionarNovaEsteira() {
        const todosFixos = obterTodosFixosProcedimentos();
        const fixosUsados = new Set(state.configFluxo.esteiras.map(e => e.fixo));
        let fixoEscolhido = todosFixos.find(f => !fixosUsados.has(f)) || todosFixos[0] || "SP099";

        state.configFluxo.esteiras.push({
            id: 'esteira_' + Date.now(),
            ativo: true,
            fixo: fixoEscolhido,
            separacao: 15
        });

        this.renderizarEsteiras();
    }

    _removerEsteira(id) {
        state.configFluxo.esteiras = state.configFluxo.esteiras.filter(e => e.id !== id);
        this.renderizarEsteiras();
    }
}

/**
 * Encapsula o campo de texto flutuante (Scratchpad) da etiqueta da aeronave.
 * Controla abertura, foco, posicionamento e execução segura de comandos de voo.
 */
export class ScratchpadController {
    constructor() {
        this.el = null;
        this.aeroAtiva = null;
    }

    inicializar() {
        this.el = document.getElementById('inputTextoLivre');
        if (!this.el) return;

        // Impede que o clique no input se propague para o canvas subjacente
        this.el.addEventListener('mousedown', (e) => e.stopPropagation());

        // Atualiza a etiqueta da aeronave em tempo real enquanto o usuário digita
        this.el.addEventListener('input', () => {
            if (this.aeroAtiva) {
                this.aeroAtiva.textoLivre = this.el.value.toUpperCase();
            }
        });

        // Controle de atalhos dentro do input
        this.el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.confirmar();
            } else if (e.key === 'Escape') {
                this.cancelar();
            }
        });
    }

    /**
     * Abre o input e o conecta a uma aeronave alvo.
     * @param {Object} aero - Instância da Aeronave selecionada.
     */
    abrir(aero) {
        if (!this.el) return;

        // Se havia outra aeronave sendo editada, confirma e processa os comandos dela antes de trocar
        if (this.aeroAtiva && this.aeroAtiva !== aero) {
            this.confirmar();
        }

        this.aeroAtiva = aero;
        state.aeroEditandoTexto = aero;

        this.el.value = aero.textoLivre || '';
        this.el.style.display = 'block';
        this.el.focus();

        // Posiciona o cursor de inserção no final do texto
        setTimeout(() => {
            if (this.el) {
                this.el.selectionStart = this.el.selectionEnd = this.el.value.length;
            }
        }, 0);
    }

    /**
     * Posiciona o input no ecrã (chamado a cada frame pelo renderizador para acompanhar a etiqueta).
     */
    posicionar(left, top, textAlign = 'left') {
        if (!this.el || this.el.style.display === 'none') return;
        this.el.style.left = typeof left === 'number' ? `${left}px` : left;
        this.el.style.top = typeof top === 'number' ? `${top}px` : top;
        this.el.style.textAlign = textAlign;
    }

    /**
     * Confirma o texto digitado, dispara o parser de comandos de voo da aeronave e fecha o input.
     */
    confirmar() {
        if (!this.el) return;

        if (this.aeroAtiva) {
            this.aeroAtiva.textoLivre = this.el.value.toUpperCase();
            this.aeroAtiva.analisarComandosTexto();
        }

        this.fechar();
    }

    /**
     * Cancela a edição fechando o input sem aplicar novas alterações.
     */
    cancelar() {
        this.fechar();
    }

    /**
     * Esconde o input e limpa as referências de edição.
     */
    fechar() {
        if (!this.el) return;
        this.el.style.display = 'none';
        this.aeroAtiva = null;
        state.aeroEditandoTexto = null;
    }

    estaAtivo() {
        return Boolean(this.el && this.el.style.display === 'block');
    }
}

/**
 * Encapsula o menu dropdown flutuante de seleção de Flight Levels (FL).
 */
export class MenuNivelController {
    constructor() {
        this.menu = null;
        this.niveis = ["110","105","100","095","090","085","080","075","070","065","060","055","050","045","VIA","---"];
    }

    inicializar() {
        let menuExistente = document.getElementById('menuNivel');
        if (menuExistente) {
            this.menu = menuExistente;
        } else {
            this.menu = document.createElement('div');
            this.menu.id = 'menuNivel';
            document.body.appendChild(this.menu);
        }

        this.menu.innerHTML = '';

        this.niveis.forEach(nv => {
            let item = document.createElement('div');
            item.className = 'menu-item';
            item.innerText = nv;

            item.onmousedown = (e) => {
                if (state.aeroEditandoNivel) {
                    const aero = state.aeroEditandoNivel;
                    aero.nivAutorizado = nv;

                    // Se for diferente do nível atual, programa delay simulando o tempo de resposta do piloto
                    if (aero.nivAutorizadoFisico !== nv && aero.nivAutorizadoPendente !== nv) {
                        aero.nivAutorizadoPendente = nv;
                        aero.delayNivel = Math.floor(Math.random() * 2) + 2;
                    }
                }

                this.fechar();
                desenharRadar();
                e.stopPropagation();
            };

            this.menu.appendChild(item);
        });
    }

    abrir(aero, x, y) {
        if (!this.menu) return;
        state.aeroEditandoNivel = aero;
        this.menu.style.left = (x - 20) + 'px';
        this.menu.style.top = (y + 10) + 'px';
        this.menu.style.display = 'block';
    }

    fechar() {
        if (!this.menu) return;
        this.menu.style.display = 'none';
        state.aeroEditandoNivel = null;
    }

    estaAberto() {
        return Boolean(this.menu && this.menu.style.display === 'block');
    }
}

// Controladores instanciados (Singletons)
export const painelFluxoUI = new PainelFluxoController();
export const scratchpadUI = new ScratchpadController();
export const menuNivelUI = new MenuNivelController();
export { painelVentoUI };

/**
 * Função de inicialização central da camada de interface gráfica DOM.
 */
export function inicializarUI() {
    painelFluxoUI.inicializar();
    scratchpadUI.inicializar();
    menuNivelUI.inicializar();
    painelVentoUI.inicializar();
}
