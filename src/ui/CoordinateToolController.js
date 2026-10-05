import { state } from '../core/state.js';
import { telaParaDelta, desenharRadar } from './render.js';
import { deltaParaGeo, decimalParaDMS } from '../utils/utils.js';

/**
 * Cursor crosshair preto em formato SVG com centro exato de coordenadas (hotspot 12, 12).
 * Garante que o cursor do mouse fique 100% preto no Windows e qualquer navegador.
 */
export const CURSOR_CROSSHAIR_PRETO = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='25' height='25' viewBox='0 0 25 25'%3E%3Cline x1='12' y1='0' x2='12' y2='25' stroke='black' stroke-width='2'/%3E%3Cline x1='0' y1='12' x2='25' y2='12' stroke='black' stroke-width='2'/%3E%3C/svg%3E\") 12 12, crosshair";

/**
 * ============================================================================
 * CONTROLADOR DA FERRAMENTA DE COORDENADAS (TECLA C)
 * (CoordinateToolController.js)
 * ============================================================================
 * Permite ao controlador de tráfego aéreo inspecionar e capturar as coordenadas
 * exatas de qualquer ponto do radar em Graus, Minutos e Segundos (DMS):
 * - Ao pressionar a tecla 'C': o cursor vira uma mira (crosshair preto) e o modo é ativado.
 * - Ao clicar com o botão esquerdo: calcula e apresenta as coordenadas em DMS,
 *   DMM (cartas), decimal e formato de código JavaScript dmsParaDecimal.
 * - Ao pressionar 'C' novamente (ou 'Escape' / botão fechar): a função termina.
 * ============================================================================
 */
export class CoordinateToolController {
    constructor() {
        this.bannerEl = null;
        this.cardEl = null;
        this.timeoutFeedback = null;
    }

    inicializar() {
        if (document.getElementById('bannerModoCoordenadas')) return;

        // 1. Banner Superior de Status do Modo Mira
        this.bannerEl = document.createElement('div');
        this.bannerEl.id = 'bannerModoCoordenadas';
        this.bannerEl.className = 'banner-coordenadas-atc';
        this.bannerEl.style.display = 'none';
        this.bannerEl.innerHTML = `
            <span class="icone-mira">⌖</span>
            <span>MIRA DE COORDENADAS ATIVA — Clique no mapa para capturar coordenadas (Pressione <strong>C</strong> para sair)</span>
            <button id="btnFecharBannerCoord" class="btn-fechar-banner" title="Desativar mira (Tecla C)">✕</button>
        `;
        document.body.appendChild(this.bannerEl);

        // 2. Card Flutuante de Exibição das Coordenadas Capturadas
        this.cardEl = document.createElement('div');
        this.cardEl.id = 'cardCoordenadas';
        this.cardEl.className = 'card-coordenadas-atc';
        this.cardEl.style.display = 'none';
        this.cardEl.innerHTML = `
            <div class="card-coordenadas-header">
                <div class="card-coordenadas-titulo">
                    <span class="icone-mira">⌖</span>
                    <span>COORDENADAS CAPTURADAS</span>
                </div>
                <button id="btnFecharCardCoordenadas" class="btn-fechar-coord" title="Fechar (Tecla C)">✕</button>
            </div>
            <div class="card-coordenadas-body">
                <div class="coord-grade-principal">
                    <div class="coord-bloco">
                        <span class="coord-label">LATITUDE (DMS)</span>
                        <span id="coordValorLat" class="coord-valor">--</span>
                    </div>
                    <div class="coord-bloco">
                        <span class="coord-label">LONGITUDE (DMS)</span>
                        <span id="coordValorLon" class="coord-valor">--</span>
                    </div>
                </div>
                <div class="coord-info-extra">
                    <div class="coord-extra-linha">
                        <span class="coord-sublabel">Cartas / DMM:</span>
                        <span id="coordValorDMM" class="coord-subvalor">--</span>
                    </div>
                    <div class="coord-extra-linha">
                        <span class="coord-sublabel">Decimal WGS84:</span>
                        <span id="coordValorDecimal" class="coord-subvalor">--</span>
                    </div>
                </div>
                <div class="coord-codigo-box">
                    <span class="coord-sublabel">Código Javascript:</span>
                    <code id="coordValorCodigo" class="coord-codigo">--</code>
                </div>
                <div class="coord-botoes-acao">
                    <button id="btnCopiarDMS" class="btn-coord-acao">📋 Copiar DMS</button>
                    <button id="btnCopiarCodigo" class="btn-coord-acao">📋 Copiar Código</button>
                </div>
                <div id="coordFeedbackMsg" class="coord-feedback-msg" style="display: none;">
                    ✓ Copiado para a área de transferência!
                </div>
            </div>
        `;
        document.body.appendChild(this.cardEl);

        // Previne que cliques nos painéis propaguem para o canvas abaixo
        [this.bannerEl, this.cardEl].forEach(el => {
            el.addEventListener('mousedown', (e) => e.stopPropagation());
            el.addEventListener('click', (e) => e.stopPropagation());
        });

        // Eventos dos botões de fechar
        document.getElementById('btnFecharBannerCoord')?.addEventListener('click', () => {
            this.desativar();
            desenharRadar();
        });

        document.getElementById('btnFecharCardCoordenadas')?.addEventListener('click', () => {
            this.desativar();
            desenharRadar();
        });

        // Eventos dos botões de cópia
        document.getElementById('btnCopiarDMS')?.addEventListener('click', () => {
            if (!state.pontoCoordenadaCapturado) return;
            const p = state.pontoCoordenadaCapturado;
            const texto = `${p.dmsLat.textoDMS}  ${p.dmsLon.textoDMS}`;
            this._copiarTexto(texto);
        });

        document.getElementById('btnCopiarCodigo')?.addEventListener('click', () => {
            if (!state.pontoCoordenadaCapturado) return;
            const p = state.pontoCoordenadaCapturado;
            const texto = `lat: ${p.dmsLat.codigoJS}, lon: ${p.dmsLon.codigoJS}`;
            this._copiarTexto(texto);
        });
    }

    /**
     * Alterna o estado da ferramenta de coordenadas (ativa/desativa).
     */
    toggle() {
        if (state.modoCoordenadas) {
            this.desativar();
        } else {
            this.ativar();
        }
    }

    /**
     * Ativa o modo de mira de coordenadas.
     */
    ativar() {
        this.inicializar();
        state.modoCoordenadas = true;
        document.body.classList.add('modo-coordenadas-ativo');
        if (state.canvas) {
            state.canvas.style.cursor = CURSOR_CROSSHAIR_PRETO;
        }
        if (this.bannerEl) {
            this.bannerEl.style.display = 'flex';
        }
    }

    /**
     * Encerra e desativa o modo de coordenadas.
     */
    desativar() {
        state.modoCoordenadas = false;
        state.pontoCoordenadaCapturado = null;
        document.body.classList.remove('modo-coordenadas-ativo');
        if (state.canvas) {
            state.canvas.style.cursor = 'default';
        }
        if (this.bannerEl) {
            this.bannerEl.style.display = 'none';
        }
        if (this.cardEl) {
            this.cardEl.style.display = 'none';
        }
    }

    /**
     * Captura o ponto clicado na tela e calcula as coordenadas geográficas em DMS.
     * @param {number} telaX 
     * @param {number} telaY 
     */
    capturar(telaX, telaY) {
        this.inicializar();

        // 1. Converte píxeis de tela em coordenadas relativas do radar
        const delta = telaParaDelta(telaX, telaY);

        // 2. Converte delta radar para latitude e longitude reais WGS-84
        const geo = deltaParaGeo(delta.deltaLat, delta.deltaLon);

        // 3. Converte para Graus, Minutos e Segundos (DMS)
        const dmsLat = decimalParaDMS(geo.lat, true);
        const dmsLon = decimalParaDMS(geo.lon, false);

        // 4. Salva no estado global para renderização contínua no Canvas
        state.pontoCoordenadaCapturado = {
            deltaLat: delta.deltaLat,
            deltaLon: delta.deltaLon,
            lat: geo.lat,
            lon: geo.lon,
            dmsLat,
            dmsLon
        };

        // 5. Atualiza os campos do card flutuante
        const elLat = document.getElementById('coordValorLat');
        const elLon = document.getElementById('coordValorLon');
        const elDMM = document.getElementById('coordValorDMM');
        const elDec = document.getElementById('coordValorDecimal');
        const elCod = document.getElementById('coordValorCodigo');

        if (elLat) elLat.textContent = dmsLat.textoDMS;
        if (elLon) elLon.textContent = dmsLon.textoDMS;
        if (elDMM) elDMM.textContent = `${dmsLat.textoDMM}  ${dmsLon.textoDMM}`;
        if (elDec) elDec.textContent = `${geo.lat.toFixed(6)}, ${geo.lon.toFixed(6)}`;
        if (elCod) elCod.textContent = `lat: ${dmsLat.codigoJS}, lon: ${dmsLon.codigoJS}`;

        // Exibe o card de coordenadas
        if (this.cardEl) {
            this.cardEl.style.display = 'block';
        }

        // 6. Copia automaticamente para a área de transferência no formato DMS padrão
        const textoDMS = `${dmsLat.textoDMS}  ${dmsLon.textoDMS}`;
        this._copiarTexto(textoDMS, true);

        desenharRadar();
    }

    _copiarTexto(texto, automatico = false) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).then(() => {
                this._mostrarFeedback(automatico ? '✓ Coordenadas capturadas e copiadas!' : '✓ Copiado para a área de transferência!');
            }).catch(() => {});
        }
    }

    _mostrarFeedback(msg) {
        const feedbackEl = document.getElementById('coordFeedbackMsg');
        if (!feedbackEl) return;
        feedbackEl.textContent = msg;
        feedbackEl.style.display = 'block';

        if (this.timeoutFeedback) clearTimeout(this.timeoutFeedback);
        this.timeoutFeedback = setTimeout(() => {
            if (feedbackEl) feedbackEl.style.display = 'none';
        }, 3000);
    }
}

export const coordinateToolController = new CoordinateToolController();

