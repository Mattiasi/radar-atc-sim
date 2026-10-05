import { state } from '../core/state.js';
import { desenharRadar } from './render.js';
import { painelVentoUI } from './painelVentoUI.js';
import { obterTodosFixosProcedimentos } from '../data/data.js';
import { menuRazaoController } from './RadarTagController.js';
import { flightCommandService } from '../agents/FlightCommandService.js';
import { coordinateToolController } from './CoordinateToolController.js';

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
                { id: "esteira_1", ativo: false, fixo: "OGTAL|SBSP|OGTAL 2A", separacao: 15 },
                { id: "esteira_2", ativo: false, fixo: "VUNOX|SBGR|VUNOX 1A", separacao: 15 }
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

        const todosFixos = obterTodosFixosProcedimentos(true);

        const opcoesSeparacao = [5, 8, 10, 12, 15, 18, 20, 25];

        state.configFluxo.esteiras.forEach((esteira) => {
            const fixoValido = todosFixos.find(obj => obj.id === esteira.fixo || (esteira.fixo && obj.id.startsWith(esteira.fixo)));
            if (fixoValido) {
                esteira.fixo = fixoValido.id;
            } else if (todosFixos.length > 0) {
                esteira.fixo = todosFixos[0].id;
            }

            const linha = document.createElement('div');
            linha.className = 'linha-esteira';
            linha.dataset.id = esteira.id;

            // 1. Checkbox Ativo
            const chkContainer = document.createElement('label');
            chkContainer.className = 'chk-esteira-container';
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.checked = Boolean(esteira.ativo);
            chk.addEventListener('change', () => {
                esteira.ativo = chk.checked;
            });
            chk.addEventListener('mousedown', (e) => e.stopPropagation());
            chkContainer.appendChild(chk);

            // 2. Select Fixo
            const selFixo = document.createElement('select');
            selFixo.className = 'sel-fixo';
            selFixo.style.backgroundColor = '#222';
            selFixo.style.color = '#fff';
            selFixo.style.fontWeight = 'bold';
            
            if (todosFixos.length === 0) {
                const optVazio = document.createElement('option');
                optVazio.value = "";
                optVazio.textContent = "Ative uma cabeceira no Vídeo Mapa";
                optVazio.disabled = true;
                optVazio.selected = true;
                optVazio.style.color = '#888';
                selFixo.appendChild(optVazio);
            } else {
                todosFixos.forEach(obj => {
                    const opt = document.createElement('option');
                    opt.value = obj.id;
                    opt.textContent = `${obj.nome} - [${obj.dest}] RWY ${obj.pistaNum} (${obj.cartaNome})`;
                    opt.style.color = obj.cor;
                    opt.style.fontWeight = 'bold';
                    opt.style.backgroundColor = '#1a1a1a';
                    if (obj.id === esteira.fixo || (esteira.fixo && obj.id.startsWith(esteira.fixo))) opt.selected = true;
                    selFixo.appendChild(opt);
                });
            }
            
            // Set initial color of select based on selected option
            const updateSelectColor = () => {
                const selectedOpt = selFixo.options[selFixo.selectedIndex];
                if (selectedOpt && selectedOpt.style.color) {
                    selFixo.style.color = selectedOpt.style.color;
                }
            };
            updateSelectColor();
            selFixo.addEventListener('change', () => {
                esteira.fixo = selFixo.value;
                updateSelectColor();
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
        const todosFixos = obterTodosFixosProcedimentos(true);
        const fixosUsados = new Set(state.configFluxo.esteiras.map(e => e.fixo));
        let fixoEscolhido = todosFixos.find(f => !fixosUsados.has(f.id));
        let fixoId = fixoEscolhido ? fixoEscolhido.id : (todosFixos[0] ? todosFixos[0].id : "");

        state.configFluxo.esteiras.push({
            id: 'esteira_' + Date.now(),
            ativo: false,
            fixo: fixoId,
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
 * Atualiza, substitui ou remove um token de comando específico (HEADING ou SPEED) no texto do Scratchpad (4ª linha).
 * @param {string} textoAtual - Texto atual do scratchpad
 * @param {'HEADING'|'SPEED'} tipo - Tipo de token a gerenciar
 * @param {string|null} novoToken - Novo token (ex: '180H', '180HE', '210K', 'MIN') ou null/LNAV/AUTO para remover
 * @returns {string} Texto resultante
 */
export function atualizarTokenScratchpad(textoAtual, tipo, novoToken) {
    let partes = (textoAtual || "").trim().split(/\s+/).filter(Boolean);

    if (tipo === 'HEADING') {
        const regexHdg = /^(?:H\d{3}[ED\+]?|\d{3}H[ED\+]?|HLD[<>ED]?)$/i;
        partes = partes.filter(p => !regexHdg.test(p));
        if (novoToken && novoToken !== 'LNAV') {
            partes.push(novoToken.toUpperCase());
        }
    } else if (tipo === 'SPEED') {
        const regexSpd = /^(?:\d{2,3}K|V\d{2,3}|MIN|AUTO)$/i;
        partes = partes.filter(p => !regexSpd.test(p));
        if (novoToken && novoToken !== 'AUTO') {
            partes.push(novoToken.toUpperCase());
        }
    }

    return partes.join(' ');
}

/**
 * Adiciona ou remove um token de uma string delimitada por espaços.
 * @param {string} texto
 * @param {string} token
 * @returns {string}
 */
export function toggleTokenNoTexto(texto, token) {
    let partes = (texto || "").trim().split(/\s+/).filter(Boolean);
    const idx = partes.findIndex(p => p.toUpperCase() === token.toUpperCase());
    if (idx >= 0) {
        partes.splice(idx, 1);
    } else {
        partes.push(token.toUpperCase());
    }
    return partes.join(' ');
}

/**
 * Encapsula o menu dropdown flutuante de seleção de Flight Levels (FL).
 */
export class MenuNivelController {
    constructor() {
        this.menu = null;
        this.niveis = ["440","430","420","410","400","390","380","370","360","350","340","330","320","310","300","290","280","270","260","250","240","230","220","210","200","190","180","170","160","150","145","140","135","130","125","120","115","110","105","100","095","090","085","080","075","070","065","060","055","050","045","042","VIA","ILS","---"];
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

        this.menu.onmousedown = (e) => e.stopPropagation();
        this.menu.innerHTML = '';

        this.niveis.forEach(nv => {
            let item = document.createElement('div');
            item.className = 'menu-item';
            item.innerText = nv;

            item.onmousedown = (e) => {
                if (state.aeroEditandoNivel) {
                    const aero = state.aeroEditandoNivel;

                    if (nv === "SR") {
                        aero.textoLivre = toggleTokenNoTexto(aero.textoLivre, "SR");
                        aero.analisarComandosTexto();
                    } else if (nv === "MIN") {
                        aero.textoLivre = toggleTokenNoTexto(aero.textoLivre, "MIN");
                        aero.analisarComandosTexto();
                    } else {
                        flightCommandService.setLevel(aero, nv, true);
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
        if (typeof menuProaUI !== 'undefined' && menuProaUI && menuProaUI.estaAberto()) menuProaUI.fechar();
        if (typeof menuVelocidadeUI !== 'undefined' && menuVelocidadeUI && menuVelocidadeUI.estaAberto()) menuVelocidadeUI.fechar();
        if (typeof menuRazaoController !== 'undefined' && menuRazaoController && menuRazaoController.estaAberto()) menuRazaoController.fechar();

        this.menu.style.position = 'absolute';
        this.menu.style.zIndex = '100';
        let topPos = y + 10;
        if (topPos + 170 > window.innerHeight) {
            topPos = Math.max(10, y - 170);
        }
        let leftPos = Math.max(10, Math.min(x - 20, window.innerWidth - 75));
        this.menu.style.left = leftPos + 'px';
        this.menu.style.top = topPos + 'px';
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

/**
 * Encapsula o menu dropdown flutuante de seleção de Proas (Headings) e Curva (E/D) - 5ª Linha da Etiqueta.
 */
export class MenuProaController {
    constructor() {
        this.menu = null;
        this.listaEl = null;
        this.btnCurvaE = null;
        this.btnCurvaD = null;
        this.ladoCurva = null; // 'E', 'D', ou null
        this.proas = [];
        // Gera proas de 10 em 10 de 360 a 010, mais LNAV
        for (let hdg = 360; hdg >= 10; hdg -= 10) {
            this.proas.push(String(hdg).padStart(3, '0'));
        }
        this.proas.push('HLD');
    }

    inicializar() {
        let menuExistente = document.getElementById('menuProa');
        if (menuExistente) {
            this.menu = menuExistente;
        } else {
            this.menu = document.createElement('div');
            this.menu.id = 'menuProa';
            document.body.appendChild(this.menu);
        }

        this.menu.style.position = 'absolute';
        this.menu.style.zIndex = '100';
        this.menu.onmousedown = (e) => e.stopPropagation();
        this.menu.innerHTML = '';

        // Lista de proas com rolagem vertical
        this.listaEl = document.createElement('div');
        this.listaEl.className = 'menu-proa-lista';

        this.proas.forEach(hdg => {
            let item = document.createElement('div');
            item.className = 'menu-item';
            item.innerText = hdg;

            item.onmousedown = (e) => {
                if (state.aeroEditandoProa) {
                    const aero = state.aeroEditandoProa;

                    if (hdg === 'HLD') {
                        const lado = this.ladoCurva || 'D';
                        const token = (lado === 'E') ? 'HLD<' : 'HLD>';

                        aero.textoLivre = atualizarTokenScratchpad(aero.textoLivre, 'HEADING', token);
                        if (state.aeroEditandoTexto === aero) {
                            const el = document.getElementById('inputTextoLivre');
                            if (el) el.value = aero.textoLivre;
                        }

                        flightCommandService.setHolding(aero, lado);
                    } else {
                        const proaNum = parseInt(hdg, 10);
                        const lado = this.ladoCurva; // 'E', 'D' ou null
                        let token = `H${hdg}`;
                        if (lado) token += lado;

                        aero.textoLivre = atualizarTokenScratchpad(aero.textoLivre, 'HEADING', token);
                        if (state.aeroEditandoTexto === aero) {
                            const el = document.getElementById('inputTextoLivre');
                            if (el) el.value = aero.textoLivre;
                        }

                        flightCommandService.setHeading(aero, proaNum, lado || false);

                        if (aero.comandosAtivos) {
                            aero.comandosAtivos.heading = {
                                proa: proaNum,
                                ladoMaior: false,
                                direcao: lado,
                                ladoMaiorOuDirecao: lado || false
                            };
                            aero.comandosAtivos.holding = null;
                        }
                    }
                }

                this.fechar();
                desenharRadar();
                e.stopPropagation();
            };

            this.listaEl.appendChild(item);
        });

        this.menu.appendChild(this.listaEl);

        // Rodapé com botões de curva [ E ] e [ D ] lado a lado
        const footerEl = document.createElement('div');
        footerEl.className = 'menu-proa-footer';

        this.btnCurvaE = document.createElement('button');
        this.btnCurvaE.type = 'button';
        this.btnCurvaE.className = 'btn-curva';
        this.btnCurvaE.innerText = 'E';
        this.btnCurvaE.title = 'Curva pela Esquerda';
        this.btnCurvaE.onmousedown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.toggleLadoCurva('E');
        };

        this.btnCurvaD = document.createElement('button');
        this.btnCurvaD.type = 'button';
        this.btnCurvaD.className = 'btn-curva';
        this.btnCurvaD.innerText = 'D';
        this.btnCurvaD.title = 'Curva pela Direita';
        this.btnCurvaD.onmousedown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.toggleLadoCurva('D');
        };

        footerEl.appendChild(this.btnCurvaE);
        footerEl.appendChild(this.btnCurvaD);
        this.menu.appendChild(footerEl);
    }

    toggleLadoCurva(lado) {
        if (this.ladoCurva === lado) {
            this.ladoCurva = null;
        } else {
            this.ladoCurva = lado;
        }
        this.atualizarBotoesCurva();
    }

    atualizarBotoesCurva() {
        if (this.btnCurvaE) {
            this.btnCurvaE.classList.toggle('ativo', this.ladoCurva === 'E');
        }
        if (this.btnCurvaD) {
            this.btnCurvaD.classList.toggle('ativo', this.ladoCurva === 'D');
        }
    }

    abrir(aero, x, y) {
        if (!this.menu) return;
        state.aeroEditandoProa = aero;
        this.ladoCurva = null;
        this.atualizarBotoesCurva();

        if (typeof menuNivelUI !== 'undefined' && menuNivelUI && menuNivelUI.estaAberto()) menuNivelUI.fechar();
        if (typeof menuVelocidadeUI !== 'undefined' && menuVelocidadeUI && menuVelocidadeUI.estaAberto()) menuVelocidadeUI.fechar();
        if (typeof menuRazaoController !== 'undefined' && menuRazaoController && menuRazaoController.estaAberto()) menuRazaoController.fechar();

        this.menu.style.position = 'absolute';
        this.menu.style.zIndex = '100';
        let topPos = y + 10;
        if (topPos + 170 > window.innerHeight) {
            topPos = Math.max(10, y - 170);
        }
        let leftPos = Math.max(10, Math.min(x - 20, window.innerWidth - 75));
        this.menu.style.left = leftPos + 'px';
        this.menu.style.top = topPos + 'px';
        this.menu.style.display = 'block';

        // Rola até a proa atual ou comandada aproximada internamente
        if (this.listaEl && aero) {
            const proaAlvo = Math.round((aero.proaDestino !== null && aero.proaDestino !== undefined && !aero.modoLNAV) ? aero.proaDestino : aero.proa);
            const proaRound = Math.round(proaAlvo / 10) * 10;
            const items = this.listaEl.querySelectorAll('.menu-item');
            for (let el of items) {
                if (parseInt(el.innerText, 10) === proaRound) {
                    this.listaEl.scrollTop = el.offsetTop - (this.listaEl.clientHeight / 2) + (el.clientHeight / 2);
                    break;
                }
            }
        }
    }

    fechar() {
        if (!this.menu) return;
        this.menu.style.display = 'none';
        state.aeroEditandoProa = null;
    }

    estaAberto() {
        return Boolean(this.menu && this.menu.style.display === 'block');
    }
}

/**
 * Encapsula o menu dropdown flutuante de seleção de Velocidades (AUTO, MIN, 160 a 310) - 5ª Linha da Etiqueta.
 */
export class MenuVelocidadeController {
    constructor() {
        this.menu = null;
        this.velocidades = [];
        for (let spd = 310; spd >= 160; spd -= 10) {
            this.velocidades.push(String(spd));
        }
        this.velocidades.push("MIN");
        this.velocidades.push("AUTO");
    }

    inicializar() {
        let menuExistente = document.getElementById('menuVelocidade');
        if (menuExistente) {
            this.menu = menuExistente;
        } else {
            this.menu = document.createElement('div');
            this.menu.id = 'menuVelocidade';
            document.body.appendChild(this.menu);
        }

        this.menu.style.position = 'absolute';
        this.menu.style.zIndex = '100';
        this.menu.onmousedown = (e) => e.stopPropagation();
        this.menu.innerHTML = '';

        this.velocidades.forEach(spd => {
            let item = document.createElement('div');
            item.className = 'menu-item';
            item.innerText = spd;

            item.onmousedown = (e) => {
                if (state.aeroEditandoVelocidade) {
                    const aero = state.aeroEditandoVelocidade;

                    if (spd === 'AUTO') {
                        aero.textoLivre = atualizarTokenScratchpad(aero.textoLivre, 'SPEED', null);
                        flightCommandService.setSpeed(aero, 'AUTO');
                    } else if (spd === 'MIN') {
                        aero.textoLivre = atualizarTokenScratchpad(aero.textoLivre, 'SPEED', 'MIN');
                        flightCommandService.setSpeed(aero, 'MIN');
                    } else {
                        const numSpd = parseInt(spd, 10);
                        const token = `${numSpd}K`;
                        aero.textoLivre = atualizarTokenScratchpad(aero.textoLivre, 'SPEED', token);
                        flightCommandService.setSpeed(aero, numSpd);
                    }

                    if (state.aeroEditandoTexto === aero) {
                        const el = document.getElementById('inputTextoLivre');
                        if (el) el.value = aero.textoLivre;
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
        state.aeroEditandoVelocidade = aero;

        if (typeof menuNivelUI !== 'undefined' && menuNivelUI && menuNivelUI.estaAberto()) menuNivelUI.fechar();
        if (typeof menuProaUI !== 'undefined' && menuProaUI && menuProaUI.estaAberto()) menuProaUI.fechar();
        if (typeof menuRazaoController !== 'undefined' && menuRazaoController && menuRazaoController.estaAberto()) menuRazaoController.fechar();

        this.menu.style.position = 'absolute';
        this.menu.style.zIndex = '100';
        let topPos = y + 10;
        if (topPos + 170 > window.innerHeight) {
            topPos = Math.max(10, y - 170);
        }
        let leftPos = Math.max(10, Math.min(x - 20, window.innerWidth - 75));
        this.menu.style.left = leftPos + 'px';
        this.menu.style.top = topPos + 'px';
        this.menu.style.display = 'block';

        if (aero) {
            const spdAtual = aero.velComando || Math.round(aero.vel);
            const items = this.menu.querySelectorAll('.menu-item');
            for (let el of items) {
                if (parseInt(el.innerText, 10) === spdAtual) {
                    this.menu.scrollTop = el.offsetTop - (this.menu.clientHeight / 2) + (el.clientHeight / 2);
                    break;
                }
            }
        }
    }

    fechar() {
        if (!this.menu) return;
        this.menu.style.display = 'none';
        state.aeroEditandoVelocidade = null;
    }

    estaAberto() {
        return Boolean(this.menu && this.menu.style.display === 'block');
    }
}

// Controladores instanciados (Singletons)
export const painelFluxoUI = new PainelFluxoController();
export const scratchpadUI = new ScratchpadController();
export const menuNivelUI = new MenuNivelController();
export const menuProaUI = new MenuProaController();
export const menuVelocidadeUI = new MenuVelocidadeController();
export { painelVentoUI, menuRazaoController, coordinateToolController };

/**
 * Função de inicialização central da camada de interface gráfica DOM.
 */
export function inicializarUI() {
    painelFluxoUI.inicializar();
    scratchpadUI.inicializar();
    menuNivelUI.inicializar();
    menuRazaoController.inicializar();
    menuProaUI.inicializar();
    menuVelocidadeUI.inicializar();
    painelVentoUI.inicializar();
    coordinateToolController.inicializar();
}

