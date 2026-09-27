/**
 * ============================================================================
 * CONTROLADOR DO PAINEL DE VENTO ATC & INSTRUMENTO CIRCULAR
 * ============================================================================
 * Gerencia a interface de controle meteorológico do simulador:
 * - Camadas Globais por FL (tabela interativa, edição e adição).
 * - Cabeceiras de Pista de SBSP, SBKP e SBGR.
 * - Instrumento circular realista de 12 retângulos (Seções 15-18).
 * - Sincronização contínua com a dinâmica física de vento.
 * ============================================================================
 */

import { state } from './state.js';
import { windManager } from './windManager.js';
import { 
    normalizeHeading, 
    calculateHeadwindComponent, 
    calculateCrosswindComponent, 
    getSectorIndex 
} from './windMath.js';


export class PainelVentoController {
    constructor() {
        this.btnToggle = null;
        this.container = null;
        this.abaAtiva = 'cabeceiras'; // 'cabeceiras' ou 'camadas'
        this.aeroIdAtivo = 'SBSP';
        this.rwyIdAtivo = '17R';
        this.aberto = false;
    }

    inicializar() {
        this.btnToggle = document.getElementById('btnToggleVento');
        this.container = document.getElementById('painelVento');

        if (!this.btnToggle || !this.container) return;

        // Impede que cliques e arrastes no painel ou botão movam a tela de radar
        this.btnToggle.addEventListener('mousedown', (e) => e.stopPropagation());
        this.container.addEventListener('mousedown', (e) => e.stopPropagation());

        this.btnToggle.addEventListener('click', () => {
            this.toggle();
        });

        // Atalho de teclado: Tecla 'W' (Wind)
        window.addEventListener('keydown', (e) => {
            if (state.aeroEditandoTexto || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            if (e.key && e.key.toUpperCase() === 'W') {
                this.toggle();
            }
        });
    }

    toggle() {
        if (this.aberto) this.fechar();
        else this.abrir();
    }

    abrir() {
        this.aberto = true;
        this.container.style.display = 'block';
        this.btnToggle.classList.add('ativo');
        this.renderizar();
    }

    fechar() {
        this.aberto = false;
        this.container.style.display = 'none';
        this.btnToggle.classList.remove('ativo');
    }

    estaAberto() {
        return this.aberto;
    }

    renderizar() {
        if (!this.aberto) return;

        this.container.innerHTML = `
            <div class="cabecalho-vento">
                <h3>SISTEMA DE VENTO ATC</h3>
                <button class="btn-fechar-vento" id="btnFecharVento" title="Fechar [Esc/W]">✕</button>
            </div>
            <div class="abas-vento">
                <button class="aba-btn ${this.abaAtiva === 'cabeceiras' ? 'ativa' : ''}" id="abaTabCabeceiras">CABECEIRAS / RWY</button>
                <button class="aba-btn ${this.abaAtiva === 'camadas' ? 'ativa' : ''}" id="abaTabCamadas">CAMADAS GLOBAIS (FL)</button>
            </div>
            <div id="conteudoAbaVento"></div>
        `;

        const btnFechar = document.getElementById('btnFecharVento');
        if (btnFechar) btnFechar.onclick = () => this.fechar();

        const tabCab = document.getElementById('abaTabCabeceiras');
        if (tabCab) {
            tabCab.onclick = () => {
                this.abaAtiva = 'cabeceiras';
                this.renderizar();
            };
        }

        const tabCam = document.getElementById('abaTabCamadas');
        if (tabCam) {
            tabCam.onclick = () => {
                this.abaAtiva = 'camadas';
                this.renderizar();
            };
        }

        const conteudo = document.getElementById('conteudoAbaVento');
        if (this.abaAtiva === 'cabeceiras') {
            this._renderizarAbaCabeceiras(conteudo);
        } else {
            this._renderizarAbaCamadas(conteudo);
        }
    }

    /**
     * Renderiza a visualização do instrumento circular de 12 retângulos e controles de cabeceira.
     * @private
     */
    _renderizarAbaCabeceiras(el) {
        const aero = windManager.aerodromos[this.aeroIdAtivo];
        if (!aero) return;

        // Se a pista selecionada não pertencer a este aeródromo, reseta para a pista ativa
        if (!aero.cabeceiras[this.rwyIdAtivo]) {
            this.rwyIdAtivo = aero.pistaAtiva || Object.keys(aero.cabeceiras)[0];
        }

        const cab = aero.cabeceiras[this.rwyIdAtivo];
        const rwyList = Object.keys(aero.cabeceiras);

        el.innerHTML = `
            <!-- Seletor de Aeródromos (Pills) -->
            <div class="selecao-pills">
                <button class="pill-btn ${this.aeroIdAtivo === 'SBSP' ? 'ativa' : ''}" data-aero="SBSP">SBSP</button>
                <button class="pill-btn ${this.aeroIdAtivo === 'SBKP' ? 'ativa' : ''}" data-aero="SBKP">SBKP</button>
                <button class="pill-btn ${this.aeroIdAtivo === 'SBGR' ? 'ativa' : ''}" data-aero="SBGR">SBGR</button>
            </div>

            <!-- Seletor de Pistas do Aeródromo Selecionado -->
            <div class="selecao-pills subpills">
                ${rwyList.map(r => `
                    <button class="pill-btn ${this.rwyIdAtivo === r ? 'ativa' : ''}" data-rwy="${r}">RWY ${r}</button>
                `).join('')}
            </div>

            <!-- Caixa Central do Instrumento Circular (12 Segmentos) -->
            <div class="instrumento-box">
                <canvas id="canvasInstrumentoVento" width="220" height="220"></canvas>
                
                <div class="controles-cabeceira">
                    <div class="linha-controle-vento">
                        <label>Direção (°):</label>
                        <input type="range" id="sliderDirVento" min="0" max="359" value="${cab.fromDeg}">
                        <input type="number" id="inputDirVento" min="0" max="359" value="${Math.round(cab.fromDeg)}">
                    </div>
                    <div class="linha-controle-vento">
                        <label>Intensidade (kt):</label>
                        <input type="range" id="sliderSpdVento" min="0" max="45" value="${cab.speedKt}">
                        <input type="number" id="inputSpdVento" min="0" max="60" value="${Math.round(cab.speedKt)}">
                    </div>
                    <div class="linha-controle-vento" style="margin-top: 8px;">
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; width: 100%;">
                            <input type="checkbox" id="chkAleatorioCab" ${cab.aleatorio ? 'checked' : ''}>
                            <span>Variação Contínua Temporal (Aleatória)</span>
                        </label>
                    </div>
                </div>

                <!-- Badges de Decomposição (Headwind & Crosswind) -->
                <div class="badges-componentes">
                    <div class="badge-info">
                        <span class="badge-rotulo">PROA RWY</span>
                        <span class="badge-valor" id="badgeRwyHdg">${String(cab.rumoPista).padStart(3, '0')}°</span>
                    </div>
                    <div class="badge-info">
                        <span class="badge-rotulo">COMP. LONGITUDINAL</span>
                        <span class="badge-valor" id="badgeHeadwind">--</span>
                    </div>
                    <div class="badge-info">
                        <span class="badge-rotulo">COMP. TRAVÉS</span>
                        <span class="badge-valor" id="badgeCrosswind">--</span>
                    </div>
                </div>
            </div>
        `;

        // Eventos dos botões de Aeródromo
        el.querySelectorAll('.selecao-pills button[data-aero]').forEach(btn => {
            btn.onclick = () => {
                this.aeroIdAtivo = btn.getAttribute('data-aero');
                const aeroSel = windManager.aerodromos[this.aeroIdAtivo];
                this.rwyIdAtivo = aeroSel.pistaAtiva || Object.keys(aeroSel.cabeceiras)[0];
                this.renderizar();
            };
        });

        // Eventos dos botões de Pista
        el.querySelectorAll('.subpills button[data-rwy]').forEach(btn => {
            btn.onclick = () => {
                this.rwyIdAtivo = btn.getAttribute('data-rwy');
                this.renderizar();
            };
        });

        // Inputs e Sliders de Direção e Velocidade
        const sliderDir = document.getElementById('sliderDirVento');
        const inputDir = document.getElementById('inputDirVento');
        const sliderSpd = document.getElementById('sliderSpdVento');
        const inputSpd = document.getElementById('inputSpdVento');
        const chkAleat = document.getElementById('chkAleatorioCab');

        const aplicarMudancas = () => {
            const dir = normalizeHeading(parseFloat(inputDir.value) || 0);
            const spd = Math.max(0, parseFloat(inputSpd.value) || 0);
            windManager.atualizarCabeceira(this.aeroIdAtivo, this.rwyIdAtivo, {
                fromDeg: dir,
                speedKt: spd,
                aleatorio: chkAleat.checked
            });
            this._atualizarInstrumentoEDados();
        };

        if (sliderDir && inputDir) {
            sliderDir.oninput = () => {
                inputDir.value = sliderDir.value;
                aplicarMudancas();
            };
            inputDir.onchange = () => {
                sliderDir.value = normalizeHeading(parseInt(inputDir.value, 10) || 0);
                aplicarMudancas();
            };
        }

        if (sliderSpd && inputSpd) {
            sliderSpd.oninput = () => {
                inputSpd.value = sliderSpd.value;
                aplicarMudancas();
            };
            inputSpd.onchange = () => {
                sliderSpd.value = Math.max(0, parseInt(inputSpd.value, 10) || 0);
                aplicarMudancas();
            };
        }

        if (chkAleat) {
            chkAleat.onchange = () => {
                windManager.atualizarCabeceira(this.aeroIdAtivo, this.rwyIdAtivo, { aleatorio: chkAleat.checked });
            };
        }

        // Renderiza o instrumento gráfico na primeira carga
        this._atualizarInstrumentoEDados();
    }

    /**
     * Atualiza o desenho no canvas do instrumento circular e recalcula os componentes de vento.
     * @private
     */
    _atualizarInstrumentoEDados() {
        const canvas = document.getElementById('canvasInstrumentoVento');
        if (!canvas) return;

        const aero = windManager.aerodromos[this.aeroIdAtivo];
        if (!aero) return;
        const cab = aero.cabeceiras[this.rwyIdAtivo];
        if (!cab) return;

        this.desenharInstrumentoCircular(canvas, cab, this.rwyIdAtivo);

        // Decomposição ortogonal (Seção 27 da Especificação)
        const hw = calculateHeadwindComponent(cab.fromDeg, cab.speedKt, cab.rumoPista);
        const cw = calculateCrosswindComponent(cab.fromDeg, cab.speedKt, cab.rumoPista);

        const badgeHw = document.getElementById('badgeHeadwind');
        const badgeCw = document.getElementById('badgeCrosswind');

        if (badgeHw) {
            const hwAbs = Math.abs(hw).toFixed(1);
            if (Math.abs(hw) < 0.2) badgeHw.textContent = `0.0 kt`;
            else if (hw > 0) badgeHw.textContent = `+${hwAbs} kt (Proa)`;
            else badgeHw.textContent = `-${hwAbs} kt (Cauda)`;
            badgeHw.style.color = (hw < -3) ? '#ff5555' : '#00ffff';
        }

        if (badgeCw) {
            const cwAbs = Math.abs(cw).toFixed(1);
            if (Math.abs(cw) < 0.2) badgeCw.textContent = `0.0 kt`;
            else badgeCw.textContent = `${cwAbs} kt (${cw > 0 ? 'Dir' : 'Esq'})`;
        }
    }

    /**
     * Renderiza o Instrumento Circular com exatamente 12 retângulos a cada 30 graus
     * e pista esquemática centralizada (Seções 15, 16, 17 e 18).
     */
    desenharInstrumentoCircular(canvas, cab, rwyId) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const raioSegmentos = 80;

        ctx.clearRect(0, 0, w, h);

        // 1. Círculo de fundo e linha de referência
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, raioSegmentos, 0, Math.PI * 2);
        ctx.stroke();

        // 2. Setor ativo destacado (Seção 17: indiceSetor = round(direcao / 30) % 12)
        const setorAtivo = getSectorIndex(cab.fromDeg);

        // 3. Renderização dos 12 retângulos radiais (Seção 16)
        for (let i = 0; i < 12; i++) {
            const anguloGraus = i * 30; // 0°, 30°, 60°, ... 330°
            // Trigonometria do Canvas: 000° aponta para o Norte (-Y)
            const anguloRad = (anguloGraus - 90) * (Math.PI / 180);
            const px = cx + raioSegmentos * Math.cos(anguloRad);
            const py = cy + raioSegmentos * Math.sin(anguloRad);

            const isAtivo = (i === setorAtivo);

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(anguloRad); // Alinhamento radial do retângulo

            if (isAtivo) {
                // Segmento destacado com cor cheia e brilho neon (Seção 17)
                ctx.fillStyle = '#00ffff';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
                ctx.fillRect(-7, -4, 14, 8);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(-7, -4, 14, 8);
            } else {
                // 11 retângulos translúcidos
                ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
                ctx.shadowBlur = 0;
                ctx.fillRect(-6, -3, 12, 6);
            }
            ctx.restore();

            // Rótulo discreto do ângulo em graus (0, 30, 60... 330)
            const raioTexto = raioSegmentos + 16;
            const tx = cx + raioTexto * Math.cos(anguloRad);
            const ty = cy + raioTexto * Math.sin(anguloRad);

            ctx.fillStyle = isAtivo ? '#00ffff' : 'rgba(255, 255, 255, 0.35)';
            ctx.font = isAtivo ? 'bold 9px monospace' : '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(anguloGraus), tx, ty);
        }

        // 4. Pista esquemática no centro (orientada pelo rumo magnético da pista)
        const rumoPista = cab.rumoPista || 170;
        const anguloPistaRad = (rumoPista - 90) * (Math.PI / 180);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(anguloPistaRad);

        // Asfalto da pista
        ctx.fillStyle = '#262626';
        ctx.fillRect(-38, -8, 76, 16);
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        ctx.strokeRect(-38, -8, 76, 16);

        // Linha de centro tracejada da pista
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(-32, 0);
        ctx.lineTo(32, 0);
        ctx.stroke();
        ctx.restore();

        // 5. Caixa Digital Central (Seção 18)
        const boxW = 86;
        const boxH = 46;

        ctx.fillStyle = 'rgba(12, 16, 20, 0.92)';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.fillRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
        ctx.strokeRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);

        // Linha 1: Proa do vento formatada com 3 dígitos (ex: 190°)
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${String(Math.round(cab.fromDeg)).padStart(3, '0')}°`, cx, cy - 10);

        // Linha 2: Intensidade formatada em nós (ex: 05 kt)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`${String(Math.round(cab.speedKt)).padStart(2, '0')} kt`, cx, cy + 9);

        // 6. Identificação da Cabeceira abaixo do mostrador
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`RWY ${rwyId}`, cx, cy + boxH / 2 + 15);
    }

    /**
     * Renderiza a visualização da tabela de Camadas Globais por Nível de Voo.
     * @private
     */
    _renderizarAbaCamadas(el) {
        el.innerHTML = `
            <table class="tabela-vento">
                <thead>
                    <tr>
                        <th>CAMADA</th>
                        <th>DIR (°)</th>
                        <th>VEL (kt)</th>
                        <th>ALEAT.</th>
                        <th>ATIVO</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="linhasTabelaCamadas">
                    ${windManager.camadas.map(c => `
                        <tr data-id="${c.id}">
                            <td style="color: #aaa;">${c.nome}</td>
                            <td>
                                <input type="number" class="inp-cam-dir" min="0" max="359" value="${Math.round(c.fromDeg)}">
                            </td>
                            <td>
                                <input type="number" class="inp-cam-spd" min="0" max="100" value="${Math.round(c.speedKt)}">
                            </td>
                            <td>
                                <input type="checkbox" class="chk-cam-aleat" ${c.aleatorio ? 'checked' : ''}>
                            </td>
                            <td>
                                <input type="checkbox" class="chk-cam-ativo" ${c.ativo ? 'checked' : ''}>
                            </td>
                            <td>
                                ${windManager.camadas.length > 1 ? `<button class="btn-del-camada" data-del="${c.id}" title="Remover">✕</button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- Formulário para adicionar nova camada -->
            <div class="form-nova-camada">
                <span style="color: #00ffff; font-weight: bold; width: 100%; margin-bottom: 2px;">+ ADICIONAR CAMADA:</span>
                <label>FL Min: <input type="number" id="novoFlMin" min="0" max="600" value="300" step="10"></label>
                <label>FL Max: <input type="number" id="novoFlMax" min="0" max="600" value="400" step="10"></label>
                <label>Dir: <input type="number" id="novoFromDeg" min="0" max="359" value="260"></label>
                <label>Vel: <input type="number" id="novoSpeedKt" min="0" max="120" value="40"></label>
                <button class="btn-add-camada" id="btnSalvarNovaCamada">ADICIONAR</button>
            </div>
        `;

        // Eventos de alteração nas linhas da tabela
        el.querySelectorAll('#linhasTabelaCamadas tr').forEach(tr => {
            const id = tr.getAttribute('data-id');
            const inpDir = tr.querySelector('.inp-cam-dir');
            const inpSpd = tr.querySelector('.inp-cam-spd');
            const chkAleat = tr.querySelector('.chk-cam-aleat');
            const chkAtivo = tr.querySelector('.chk-cam-ativo');
            const btnDel = tr.querySelector('.btn-del-camada');

            const salvarLinha = () => {
                windManager.atualizarCamada(id, {
                    fromDeg: parseInt(inpDir.value, 10) || 0,
                    speedKt: parseInt(inpSpd.value, 10) || 0,
                    aleatorio: chkAleat.checked,
                    ativo: chkAtivo.checked
                });
            };

            if (inpDir) inpDir.onchange = salvarLinha;
            if (inpSpd) inpSpd.onchange = salvarLinha;
            if (chkAleat) chkAleat.onchange = salvarLinha;
            if (chkAtivo) chkAtivo.onchange = salvarLinha;

            if (btnDel) {
                btnDel.onclick = () => {
                    windManager.removerCamada(id);
                    this.renderizar();
                };
            }
        });

        // Botão de Adicionar Camada
        const btnSalvar = document.getElementById('btnSalvarNovaCamada');
        if (btnSalvar) {
            btnSalvar.onclick = () => {
                const flMin = parseInt(document.getElementById('novoFlMin').value, 10) || 0;
                const flMax = parseInt(document.getElementById('novoFlMax').value, 10) || 100;
                const fromDeg = parseInt(document.getElementById('novoFromDeg').value, 10) || 0;
                const speedKt = parseInt(document.getElementById('novoSpeedKt').value, 10) || 0;

                windManager.adicionarCamada(flMin, flMax, fromDeg, speedKt);
                this.renderizar();
            };
        }
    }

    /**
     * Chamado periodicamente ou a cada ciclo de física do radar para atualizar os mostradores
     * caso o modo aleatório contínuo esteja em execução.
     */
    atualizarSeVisivel() {
        if (!this.aberto) return;

        if (this.abaAtiva === 'cabeceiras') {
            const aero = windManager.aerodromos[this.aeroIdAtivo];
            if (aero && aero.cabeceiras[this.rwyIdAtivo]) {
                const cab = aero.cabeceiras[this.rwyIdAtivo];
                if (cab.aleatorio) {
                    const sliderDir = document.getElementById('sliderDirVento');
                    const inputDir = document.getElementById('inputDirVento');
                    const sliderSpd = document.getElementById('sliderSpdVento');
                    const inputSpd = document.getElementById('inputSpdVento');

                    if (sliderDir && inputDir && sliderSpd && inputSpd) {
                        sliderDir.value = cab.fromDeg;
                        inputDir.value = Math.round(cab.fromDeg);
                        sliderSpd.value = cab.speedKt;
                        inputSpd.value = Math.round(cab.speedKt);
                    }
                    this._atualizarInstrumentoEDados();
                }
            }
        }
    }
}

// Instância singleton pronta para uso global
export const painelVentoUI = new PainelVentoController();
