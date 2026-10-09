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
        this.btnPauseSimulacao = null;
        this.sliderVelocidade = null;
        this.labelVelocidade = null;
        this.btnToggle = null;
        this.painel = null;
        this.btnFechar = null;
        this.aberto = false;

        // DEP and tabs elements
        this.btnAbaARR = null;
        this.btnAbaDEP = null;
        this.conteudoARR = null;
        this.conteudoDEP = null;
        
        this.selAerodromoDep = null;
        this.btnGerarDEP = null;
        this.btnLimparFilaDEP = null;
        this.containerFilaDEP = null;
        this.chkAutoDEP = null;
    }

    inicializar() {
        this.containerEsteiras = document.getElementById('containerEsteiras');
        this.btnAdicionarFluxo = document.getElementById('btnAdicionarFluxo');
        this.btnPauseSimulacao = document.getElementById('btnPauseSimulacao');
        this.sliderVelocidade = document.getElementById('sliderVelocidade');
        this.labelVelocidade = document.getElementById('labelVelocidade');
        this.btnToggle = document.getElementById('btnToggleFluxo');
        this.painel = document.getElementById('painelFluxo');
        this.btnFechar = document.getElementById('btnFecharFluxo');

        // Tabs
        this.btnAbaARR = document.getElementById('btnAbaARR');
        this.btnAbaDEP = document.getElementById('btnAbaDEP');
        this.conteudoARR = document.getElementById('conteudoARR');
        this.conteudoDEP = document.getElementById('conteudoDEP');

        // DEP Controls
        this.selAerodromoDep = document.getElementById('selAerodromoDep');
        this.selIntervaloDep = document.getElementById('selIntervaloDep');
        this.btnGerarDEP = document.getElementById('btnGerarDEP');
        this.btnLimparFilaDEP = document.getElementById('btnLimparFilaDEP');
        this.containerFilaDEP = document.getElementById('containerFilaDEP');
        this.chkAutoSpawnDEP = document.getElementById('chkAutoSpawnDEP');
        this.chkAutoDEP = document.getElementById('chkAutoDEP');

        this.configurarEventosTabs();
        this.configurarEventosDEP();
        this.atualizarIntervaloDEP();

        if (!this.containerEsteiras || !this.painel) return;

        // Botão de Play / Pause da Simulação
        if (this.btnPauseSimulacao) {
            this.btnPauseSimulacao.addEventListener('mousedown', (e) => e.stopPropagation());
            this.btnPauseSimulacao.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePause();
            });
            this.atualizarBotaoPause();
        }

        // Controle de abertura e fechamento retrátil (igual ao controle de vento)
        if (this.btnToggle) {
            this.btnToggle.addEventListener('mousedown', (e) => e.stopPropagation());
            this.btnToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }

        if (this.painel) {
            this.painel.addEventListener('mousedown', (e) => e.stopPropagation());
        }

        if (this.btnFechar) {
            this.btnFechar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.fechar();
            });
        }

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

        // Atalho Escape para fechar se o painel estiver aberto
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.aberto) {
                this.fechar();
            }
        });

        this.renderizarEsteiras();
        window.painelFluxoUI = this;
    }

    configurarEventosTabs() {
        if (!this.btnAbaARR || !this.btnAbaDEP) return;
        
        this.btnAbaARR.addEventListener('click', (e) => {
            e.stopPropagation();
            this.btnAbaARR.classList.add('ativa');
            this.btnAbaDEP.classList.remove('ativa');
            this.conteudoARR.style.display = 'block';
            this.conteudoDEP.style.display = 'none';
        });

        this.btnAbaDEP.addEventListener('click', (e) => {
            e.stopPropagation();
            this.btnAbaDEP.classList.add('ativa');
            this.btnAbaARR.classList.remove('ativa');
            this.conteudoDEP.style.display = 'block';
            this.conteudoARR.style.display = 'none';
            this.renderizarFilaDEP();
        });
    }

    configurarEventosDEP() {
        if (this.selAerodromoDep) {
            this.selAerodromoDep.addEventListener('change', (e) => {
                state.configDep.aerodromoSelecionado = e.target.value;
                this.atualizarIntervaloDEP();
                this.renderizarFilaDEP();
            });
            this.selAerodromoDep.addEventListener('mousedown', (e) => e.stopPropagation());
        }

        if (this.selIntervaloDep) {
            this.selIntervaloDep.addEventListener('change', (e) => {
                const aero = state.configDep.aerodromoSelecionado || 'SBGR';
                if (!state.configDep.intervalosPorAerodromo) {
                    state.configDep.intervalosPorAerodromo = { SBGR: 2, SBKP: 2, SBSP: 2 };
                }
                state.configDep.intervalosPorAerodromo[aero] = parseInt(e.target.value, 10);
            });
            this.selIntervaloDep.addEventListener('mousedown', (e) => e.stopPropagation());
        }

        if (this.btnGerarDEP) {
            this.btnGerarDEP.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof window.gerarNovaDEP === 'function') {
                    window.gerarNovaDEP();
                } else {
                    console.warn("gerarNovaDEP não implementada no engine.js");
                }
                this.renderizarFilaDEP();
            });
            this.btnGerarDEP.addEventListener('mousedown', (e) => e.stopPropagation());
        }

        if (this.btnLimparFilaDEP) {
            this.btnLimparFilaDEP.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm("Deseja limpar as partidas? Isso removerá as aeronaves da fila e quaisquer partidas ativas no radar.")) {
                    state.configDep.fila = [];
                    state.configDep.ultimaAeronaveDecolada = null;
                    state.configDep.ultimasGeracoesTempoSimulado = {};
                    state.configDep.ultimaDecolagemTempoSimuladoPorPista = {};
                    state.aeronaves = state.aeronaves.filter(a => !a.isDep);
                    this.renderizarFilaDEP();
                }
            });
            this.btnLimparFilaDEP.addEventListener('mousedown', (e) => e.stopPropagation());
        }

        if (this.chkAutoSpawnDEP) {
            this.chkAutoSpawnDEP.checked = Boolean(state.configDep.geracaoAutomatica);
            this.chkAutoSpawnDEP.addEventListener('change', (e) => {
                state.configDep.geracaoAutomatica = e.target.checked;
            });
            this.chkAutoSpawnDEP.addEventListener('mousedown', (e) => e.stopPropagation());
        }

        if (this.chkAutoDEP) {
            this.chkAutoDEP.checked = Boolean(state.configDep.decolagemAutomatica);
            this.chkAutoDEP.addEventListener('change', (e) => {
                state.configDep.decolagemAutomatica = e.target.checked;
            });
            this.chkAutoDEP.addEventListener('mousedown', (e) => e.stopPropagation());
        }
    }

    atualizarIntervaloDEP() {
        if (!this.selIntervaloDep) return;
        const aero = state.configDep.aerodromoSelecionado || 'SBGR';
        if (!state.configDep.intervalosPorAerodromo) {
            state.configDep.intervalosPorAerodromo = { SBGR: 2, SBKP: 2, SBSP: 2 };
        }
        const val = state.configDep.intervalosPorAerodromo[aero] || 2;
        this.selIntervaloDep.value = String(val);
    }

    renderizarFilaDEP() {
        if (!this.containerFilaDEP) return;
        this.atualizarIntervaloDEP();
        if (this.chkAutoSpawnDEP) this.chkAutoSpawnDEP.checked = Boolean(state.configDep.geracaoAutomatica);
        if (this.chkAutoDEP) this.chkAutoDEP.checked = Boolean(state.configDep.decolagemAutomatica);
        this.containerFilaDEP.innerHTML = '';
        
        const aeroSelecionado = state.configDep.aerodromoSelecionado;
        if (this.selAerodromoDep && this.selAerodromoDep.value !== aeroSelecionado) {
            this.selAerodromoDep.value = aeroSelecionado;
        }

        const fila = state.configDep.fila.filter(a => a.aero === aeroSelecionado && a.status === 'aguardando');

        if (fila.length === 0) {
            this.containerFilaDEP.innerHTML = '<div style="color:#666; font-size:12px; padding:10px;">Nenhuma aeronave aguardando partida.</div>';
            return;
        }

        fila.forEach(dep => {
            const div = document.createElement('div');
            div.className = 'linha-esteira';
            div.style.justifyContent = 'space-between';
            div.style.padding = '5px';
            div.style.borderBottom = '1px solid #333';
            
            const infoDiv = document.createElement('div');
            infoDiv.style.display = 'flex';
            infoDiv.style.flexDirection = 'column';
            infoDiv.innerHTML = `
                <span style="color:#aaa; font-weight:bold;">${dep.id} (${dep.category.toUpperCase()})</span>
                <span style="color:#888; font-size:10px;">RWY ${dep.runway} - ${dep.sid} - FL${dep.requestedFL || ''}</span>
            `;
            
            const actDiv = document.createElement('div');
            actDiv.style.display = 'flex';
            actDiv.style.gap = '4px';

            if (dep.aero === 'SBGR' && dep.setorSaida === 'Norte' && !dep.coordenacaoFeita) {
                const btnCoord = document.createElement('button');
                btnCoord.textContent = 'COORD APP';
                btnCoord.style.fontSize = '9px';
                btnCoord.style.backgroundColor = '#444';
                btnCoord.style.color = '#fff';
                btnCoord.style.border = '1px solid #777';
                btnCoord.style.cursor = 'pointer';
                btnCoord.onclick = () => {
                    dep.coordenacaoFeita = true;
                    this.renderizarFilaDEP();
                };
                actDiv.appendChild(btnCoord);
            } else if (dep.aero === 'SBKP') {
                const ultima = state.configDep.ultimaAeronaveDecolada;
                const mesmoGrupo = ultima && (ultima.grupoDep === dep.grupoDep);
                if (ultima && mesmoGrupo && ultima.category === 'piston' && (dep.category === 'jet' || dep.category === 'turboprop') && !dep.coordenacaoFeita) {
                    const btnCoord = document.createElement('button');
                    btnCoord.textContent = 'COORD APP';
                    btnCoord.style.fontSize = '9px';
                    btnCoord.style.backgroundColor = '#444';
                    btnCoord.style.color = '#fff';
                    btnCoord.style.border = '1px solid #777';
                    btnCoord.style.cursor = 'pointer';
                    btnCoord.onclick = () => {
                        dep.coordenacaoFeita = true;
                        this.renderizarFilaDEP();
                    };
                    actDiv.appendChild(btnCoord);
                }
            }

            const btnDecolar = document.createElement('button');
            btnDecolar.textContent = 'AUTORIZAR';
            btnDecolar.style.fontSize = '10px';
            btnDecolar.style.backgroundColor = '#006600';
            btnDecolar.style.color = '#fff';
            btnDecolar.style.border = '1px solid #00ff00';
            btnDecolar.style.cursor = 'pointer';
            btnDecolar.onclick = () => {
                if (typeof window.tentarDecolar === 'function') {
                    window.tentarDecolar(dep);
                } else {
                    alert("Função tentarDecolar não implementada.");
                }
            };
            
            actDiv.appendChild(btnDecolar);
            
            div.appendChild(infoDiv);
            div.appendChild(actDiv);
            
            this.containerFilaDEP.appendChild(div);
        });
    }

    toggle() {
        if (this.aberto) {
            this.fechar();
        } else {
            this.abrir();
        }
    }

    abrir() {
        this.aberto = true;
        if (this.painel) this.painel.style.display = 'block';
        if (this.btnToggle) this.btnToggle.classList.add('ativo');
        this.renderizarEsteiras();
        window.painelFluxoUI = this;
    }

    fechar() {
        this.aberto = false;
        if (this.painel) this.painel.style.display = 'none';
        if (this.btnToggle) this.btnToggle.classList.remove('ativo');
    }

    estaAberto() {
        return this.aberto;
    }

    togglePause() {
        state.pausado = !state.pausado;
        this.atualizarBotaoPause();
    }

    atualizarBotaoPause() {
        if (!this.btnPauseSimulacao) return;
        if (state.pausado) {
            this.btnPauseSimulacao.classList.add('pausado');
            this.btnPauseSimulacao.title = "Retomar Simulação (Play)";
            this.btnPauseSimulacao.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6,4 20,12 6,20"></polygon>
                </svg>
            `;
        } else {
            this.btnPauseSimulacao.classList.remove('pausado');
            this.btnPauseSimulacao.title = "Pausar Simulação (Pause)";
            this.btnPauseSimulacao.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="5" y="4" width="4" height="16" rx="1"></rect>
                    <rect x="15" y="4" width="4" height="16" rx="1"></rect>
                </svg>
            `;
        }
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
        window.painelFluxoUI = this;
    }

    _removerEsteira(id) {
        state.configFluxo.esteiras = state.configFluxo.esteiras.filter(e => e.id !== id);
        this.renderizarEsteiras();
        window.painelFluxoUI = this;
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
        this.textoOriginal = '';
    }

    inicializar() {
        this.el = document.getElementById('inputTextoLivre');
        if (!this.el) return;

        // Impede que o clique no input se propague para o canvas subjacente
        this.el.addEventListener('mousedown', (e) => e.stopPropagation());

        // Atualiza a etiqueta da aeronave visualmente em tempo real enquanto o usuário digita
        this.el.addEventListener('input', () => {
            if (this.aeroAtiva) {
                this.aeroAtiva.textoLivre = this.el.value.toUpperCase();
            }
        });

        // Controle de teclas dentro do input: Enter para validar/confirmar, Escape para cancelar
        this.el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.confirmar();
                desenharRadar();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelar();
                desenharRadar();
            }
        });
    }

    /**
     * Abre o input e o conecta a uma aeronave alvo.
     * @param {Object} aero - Instância da Aeronave selecionada.
     */
    abrir(aero) {
        if (!this.el) return;

        // Se havia outra aeronave sendo editada sem confirmação por Enter, cancela e reverte
        if (this.aeroAtiva && this.aeroAtiva !== aero) {
            this.cancelar();
        }

        this.aeroAtiva = aero;
        this.textoOriginal = aero.textoLivre || '';
        state.aeroEditandoTexto = aero;

        this.el.value = this.textoOriginal;
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
     * Confirma o texto digitado (Enter), valida e processa os comandos de voo da aeronave.
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
     * Cancela a edição fechando o input e restaurando o texto anterior caso não tenha pressionado Enter.
     */
    cancelar() {
        if (!this.el) return;

        if (this.aeroAtiva) {
            this.aeroAtiva.textoLivre = this.textoOriginal;
        }

        this.fechar();
    }

    /**
     * Esconde o input e limpa as referências de edição.
     */
    fechar() {
        if (!this.el) return;
        this.el.style.display = 'none';
        this.aeroAtiva = null;
        this.textoOriginal = '';
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
                        if (aero.proaEscolhidaViaPainel === 'HLD') {
                            flightCommandService.resumeRoute(aero);
                            aero.proaEscolhidaViaPainel = null;
                            aero.ladoCurvaViaPainel = null;
                        } else {
                            flightCommandService.setHolding(aero, lado);
                            aero.proaEscolhidaViaPainel = 'HLD';
                            aero.ladoCurvaViaPainel = lado;
                        }
                    } else {
                        const proaNum = parseInt(hdg, 10);
                        const lado = this.ladoCurva; // 'E', 'D' ou null
                        if (aero.proaEscolhidaViaPainel === proaNum && (!lado || aero.ladoCurvaViaPainel === lado)) {
                            flightCommandService.resumeRoute(aero);
                            aero.proaEscolhidaViaPainel = null;
                            aero.ladoCurvaViaPainel = null;
                        } else {
                            flightCommandService.setHeading(aero, proaNum, lado || false);
                            aero.proaEscolhidaViaPainel = proaNum;
                            aero.ladoCurvaViaPainel = lado || null;

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
                        flightCommandService.setSpeed(aero, 'AUTO');
                        aero.velEscolhidaViaPainel = null;
                    } else if (spd === 'MIN') {
                        if (aero.velEscolhidaViaPainel === 'MIN') {
                            flightCommandService.setSpeed(aero, 'AUTO');
                            aero.velEscolhidaViaPainel = null;
                        } else {
                            flightCommandService.setSpeed(aero, 'MIN');
                            aero.velEscolhidaViaPainel = 'MIN';
                        }
                    } else {
                        const numSpd = parseInt(spd, 10);
                        if (aero.velEscolhidaViaPainel === numSpd) {
                            flightCommandService.setSpeed(aero, 'AUTO');
                            aero.velEscolhidaViaPainel = null;
                        } else {
                            flightCommandService.setSpeed(aero, numSpd);
                            aero.velEscolhidaViaPainel = numSpd;
                        }
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





