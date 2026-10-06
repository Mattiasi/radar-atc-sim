/**
 * ============================================================================
 * GERENCIADOR DE VENTO DO SIMULADOR (WIND MANAGER)
 * ============================================================================
 * Controla os dois níveis de vento do simulador ATC:
 * 1. Vento Global em rota estratificado por camadas de Nível de Voo (FL).
 * 2. Vento Local específico por aeródromo e cabeceira de pista (SBSP, SBKP, SBGR).
 * 
 * Implementa critérios de transição objetivos (Terminal vs. Rota),
 * dinâmica temporal suave para vento aleatório e persistência no localStorage.
 * ============================================================================
 */

import { state } from '../core/state.js';
import { calcularRumoDistancia } from '../utils/utils.js';
import { aerodromos as dadosAerodromos } from '../data/aerodromos.js';
import { 
    normalizeHeading, 
    windFromDirectionToVector, 
    calculateHeadwindComponent, 
    calculateCrosswindComponent,
    getSectorIndex 
} from './windMath.js';

const STORAGE_KEY = 'ATC_WIND_SETTINGS_V1';
const AERODROMOS_VENTO = ['SBSP', 'SBGR', 'SBKP'];

export class WindManager {
    constructor() {
        // Camadas globais padrão (Seção 4 da Especificação)
        this.camadas = [
            {
                id: 'fl000_050',
                nome: 'FL 000 – FL 050',
                flMin: 0,
                flMax: 50,
                fromDeg: 180,
                speedKt: 5,
                ativo: true,
                aleatorio: false,
                minDeg: 160,
                maxDeg: 210,
                minSpeed: 3,
                maxSpeed: 10,
                gustKt: 0,
                gustFrequency: 0,
                _targetFromDeg: 180,
                _targetSpeedKt: 5
            },
            {
                id: 'fl050_100',
                nome: 'FL 050 – FL 100',
                flMin: 50,
                flMax: 100,
                fromDeg: 190,
                speedKt: 10,
                ativo: true,
                aleatorio: false,
                minDeg: 170,
                maxDeg: 220,
                minSpeed: 5,
                maxSpeed: 15,
                gustKt: 0,
                gustFrequency: 0,
                _targetFromDeg: 190,
                _targetSpeedKt: 10
            },
            {
                id: 'fl100_150',
                nome: 'FL 100 – FL 150',
                flMin: 100,
                flMax: 150,
                fromDeg: 200,
                speedKt: 18,
                ativo: true,
                aleatorio: false,
                minDeg: 180,
                maxDeg: 230,
                minSpeed: 10,
                maxSpeed: 25,
                gustKt: 0,
                gustFrequency: 0,
                _targetFromDeg: 200,
                _targetSpeedKt: 18
            },
            {
                id: 'fl150_200',
                nome: 'FL 150 – FL 200',
                flMin: 150,
                flMax: 200,
                fromDeg: 220,
                speedKt: 25,
                ativo: true,
                aleatorio: false,
                minDeg: 200,
                maxDeg: 250,
                minSpeed: 15,
                maxSpeed: 35,
                gustKt: 0,
                gustFrequency: 0,
                _targetFromDeg: 220,
                _targetSpeedKt: 25
            },
            {
                id: 'fl200_300',
                nome: 'FL 200 – FL 300',
                flMin: 200,
                flMax: 300,
                fromDeg: 240,
                speedKt: 35,
                ativo: true,
                aleatorio: false,
                minDeg: 220,
                maxDeg: 270,
                minSpeed: 20,
                maxSpeed: 50,
                gustKt: 0,
                gustFrequency: 0,
                _targetFromDeg: 240,
                _targetSpeedKt: 35
            }
        ];

        // Aeródromos e cabeceiras individuais 100% data-driven a partir de aerodromos.js
        this.aerodromos = {};
        if (Array.isArray(dadosAerodromos)) {
            for (const a of dadosAerodromos) {
                // Apenas os aeródromos principais da TMA-SP possuem vento local configurável
                if (!AERODROMOS_VENTO.includes(a.nome)) continue;
                const cabMap = {};
                let defaultPista = a.pistaPadrao || null;
                if (a.pistas && Array.isArray(a.pistas)) {
                    for (const pista of a.pistas) {
                        if (pista.cabeceiras) {
                            for (const [rwyKey, cabData] of Object.entries(pista.cabeceiras)) {
                                if (!defaultPista) defaultPista = rwyKey;
                                const rumo = cabData.frontCourseDeg !== undefined ? cabData.frontCourseDeg : (cabData.rumo !== undefined ? cabData.rumo : pista.rumo);
                                let fromDeg = normalizeHeading(rumo + 20);
                                let spd = 5;

                                if (a.nome === "SBSP") {
                                    fromDeg = (rwyKey.startsWith("35")) ? 10 : 190;
                                    spd = 5;
                                } else if (a.nome === "SBKP") {
                                    fromDeg = (rwyKey.startsWith("33")) ? 330 : 150;
                                    spd = 8;
                                } else if (a.nome === "SBGR") {
                                    fromDeg = (rwyKey.startsWith("28")) ? 280 : 100;
                                    spd = 6;
                                }

                                cabMap[rwyKey] = {
                                    rumoPista: rumo,
                                    fromDeg: fromDeg,
                                    speedKt: spd,
                                    aleatorio: false,
                                    minDeg: normalizeHeading(rumo - 20),
                                    maxDeg: normalizeHeading(rumo + 40),
                                    minSpeed: 3,
                                    maxSpeed: 10,
                                    gustKt: 0,
                                    gustFrequency: 0,
                                    _targetFromDeg: fromDeg,
                                    _targetSpeedKt: spd
                                };
                            }
                        }
                    }
                }

                this.aerodromos[a.nome] = {
                    nome: a.nomeCompleto || a.nome,
                    raioNM: a.raioVentoNM || (a.nome === "SBGR" ? 10.0 : 8.0),
                    tetoFL: a.tetoVentoFL || 40,
                    pistaAtiva: defaultPista || (Object.keys(cabMap)[0] || "17R"),
                    cabeceiras: cabMap
                };
            }
        }

        // Carrega configurações prévias do localStorage se existirem
        this.carregar();
    }

    /**
     * Determina o vetor de vento aplicável à aeronave em seu estado atual.
     * 
     * Regra de Prioridade Terminal (Seção 14):
     * 1. Critério Vertical: Altitude <= 4.000 ft (FL <= 40).
     * 2. Critério Horizontal: Distância <= raio operacional do aeródromo (8 NM ou 10 NM).
     * Se ambos forem satisfeitos -> Adota o vento local da cabeceira ativa/atribuída.
     * Caso contrário -> Adota a camada de vento global correspondente ao Flight Level.
     * 
     * @param {Object} aero - Instância da aeronave contendo flAtualNum, deltaLat, deltaLon, dest, pistaAtribuida
     * @returns {Object} Vetor de vento com componentes vx, vy, vLat, vLon, speedKt, fromDeg, toDeg, origem
     */
    getWindForAircraft(aero) {
        if (!aero) return windFromDirectionToVector(0, 0);

        const fl = (typeof aero.flAtualNum === 'number') ? aero.flAtualNum : 0;

        // 1. AVALIAÇÃO TERMINAL LOCAL (Seção 14)
        const aeroDestId = aero.dest;
        const aeroConfig = aeroDestId ? this.aerodromos[aeroDestId] : null;
        const tetoTerminal = aeroConfig ? (aeroConfig.tetoFL || 40) : 40;

        if (fl <= tetoTerminal) {
            // Prioriza o aeródromo de destino da aeronave se cadastrado
            if (aeroConfig && state.fixos && state.fixos[aeroDestId]) {
                const nav = calcularRumoDistancia(aero, state.fixos[aeroDestId]);
                if (nav.distanciaNM <= aeroConfig.raioNM) {
                    return this._obterVentoCabeceira(aeroConfig, aeroDestId, aero);
                }
            } else {
                // Se não tem destino configurado ou não atingiu o destino, verifica se sobrevoa algum outro aeródromo
                for (const [aeroId, config] of Object.entries(this.aerodromos)) {
                    const tetoOutro = config.tetoFL || 40;
                    if (fl <= tetoOutro && state.fixos && state.fixos[aeroId]) {
                        const nav = calcularRumoDistancia(aero, state.fixos[aeroId]);
                        if (nav.distanciaNM <= config.raioNM) {
                            return this._obterVentoCabeceira(config, aeroId, aero);
                        }
                    }
                }
            }
        }

        // 2. AVALIAÇÃO EM ROTA (CAMADA GLOBAL DE NÍVEL DE VOO)
        return this._obterVentoCamadaGlobal(fl);
    }

    /**
     * Extrai e formata o vetor de vento de uma cabeceira de pista de um aeródromo.
     * @private
     */
    _obterVentoCabeceira(aeroConfig, aeroId, aero) {
        // Pista específica atribuída ou pista ativa padrão
        const rwyId = aero.pistaAtribuida || aeroConfig.pistaAtiva;
        const cab = aeroConfig.cabeceiras[rwyId] || Object.values(aeroConfig.cabeceiras)[0];

        const vec = windFromDirectionToVector(cab.fromDeg, cab.speedKt);
        vec.origem = "LOCAL";
        vec.aerodromo = aeroId;
        vec.cabeceira = rwyId;
        vec.rumoPista = cab.rumoPista;
        return vec;
    }

    /**
     * Localiza a camada global de vento correspondente ao Flight Level da aeronave.
     * @private
     */
    _obterVentoCamadaGlobal(fl) {
        for (let i = 0; i < this.camadas.length; i++) {
            const cam = this.camadas[i];
            if (fl >= cam.flMin && fl <= cam.flMax) {
                if (!cam.ativo || cam.speedKt <= 0) {
                    const zeroVec = windFromDirectionToVector(cam.fromDeg, 0);
                    zeroVec.origem = "GLOBAL";
                    zeroVec.camadaId = cam.id;
                    return zeroVec;
                }
                const vec = windFromDirectionToVector(cam.fromDeg, cam.speedKt);
                vec.origem = "GLOBAL";
                vec.camadaId = cam.id;
                return vec;
            }
        }

        // Fallback: se estiver acima da camada máxima, adota a última camada
        if (this.camadas.length > 0) {
            const ultima = this.camadas[this.camadas.length - 1];
            if (fl > ultima.flMax) {
                const vec = windFromDirectionToVector(ultima.fromDeg, ultima.speedKt);
                vec.origem = "GLOBAL";
                vec.camadaId = ultima.id;
                return vec;
            }
        }

        const zeroVec = windFromDirectionToVector(0, 0);
        zeroVec.origem = "GLOBAL";
        return zeroVec;
    }

    /**
     * Atualização temporal contínua e suave para o modo aleatório (Seção 11).
     * O vento varia frações graduais por segundo, sem ruído branco estocástico por frame.
     * 
     * @param {number} dtSec - Delta de tempo transcorrido em segundos (ex: 4s no passo do radar)
     */
    update(dtSec) {
        const dt = Math.max(0.01, dtSec || 4);

        // 1. Atualiza camadas globais com aleatório ativado
        this.camadas.forEach(cam => {
            if (cam.aleatorio && cam.ativo) {
                this._atualizarItemAleatorio(cam, dt);
            }
        });

        // 2. Sincroniza a pista ativa com o Vídeo-Mapa e atualiza o vento local.
        // O vento é UM SÓ por aeródromo (fenômeno físico): a cabeceira ativa define
        // o setor aleatório (sempre contra a proa de pouso) e as demais cabeceiras espelham o valor.
        this.sincronizarComVideoMapa();
        Object.values(this.aerodromos).forEach(aero => {
            const cabAtiva = aero.cabeceiras[aero.pistaAtiva];
            if (!cabAtiva) return;
            const aleatorio = Object.values(aero.cabeceiras).some(c => c.aleatorio);
            if (aleatorio) {
                this._aplicarSetorContraVento(cabAtiva);
                this._atualizarItemAleatorio(cabAtiva, dt);
            }
            Object.values(aero.cabeceiras).forEach(cab => {
                if (cab === cabAtiva) return;
                cab.fromDeg = cabAtiva.fromDeg;
                cab.speedKt = cabAtiva.speedKt;
                cab._targetFromDeg = cabAtiva.fromDeg;
                cab._targetSpeedKt = cabAtiva.speedKt;
            });
        });
    }

    /**
     * Restringe o setor aleatório da cabeceira para que o vento seja sempre de proa
     * (ou de proa com componente cruzada), já que a aeronave pousa contra o vento.
     * @private
     */
    _aplicarSetorContraVento(cab) {
        const rumo = cab.rumoPista || 0;
        cab.minDeg = normalizeHeading(rumo - 40);
        cab.maxDeg = normalizeHeading(rumo + 40);
        if (cab._targetFromDeg !== undefined) {
            const dif = Math.abs(((cab._targetFromDeg - rumo + 540) % 360) - 180);
            if (dif > 40) cab._targetFromDeg = undefined; // força novo alvo dentro do setor
        }
    }

    /**
     * Lê as pistas ativas no Vídeo-Mapa (state.radarLayers.activeRunways, chaves "SBSP-17" / "SBSP-17R")
     * e define a pista ativa de cada aeródromo. Ao trocar de cabeceira, o vento é invertido
     * para soprar contra a nova cabeceira de pouso.
     */
    sincronizarComVideoMapa() {
        const ativas = state.radarLayers && state.radarLayers.activeRunways;
        if (!ativas || ativas.size === 0) return;

        Object.entries(this.aerodromos).forEach(([icao, aero]) => {
            const chaveAtiva = Object.keys(aero.cabeceiras).find(k => {
                const num = k.replace(/[^0-9]/g, '');
                return ativas.has(`${icao}-${k}`) || ativas.has(`${icao}-${num}`);
            });
            if (!chaveAtiva || chaveAtiva === aero.pistaAtiva) return;

            aero.pistaAtiva = chaveAtiva;
            const cab = aero.cabeceiras[chaveAtiva];
            const dif = Math.abs(((cab.fromDeg - cab.rumoPista + 540) % 360) - 180);
            if (dif > 90) {
                // Vento estava de cauda para a nova cabeceira -> passa a ser de proa
                cab.fromDeg = normalizeHeading(cab.rumoPista + (Math.random() * 40 - 20));
            }
            cab._targetFromDeg = undefined;
        });
    }

    /**
     * Interpola suavemente a direção e a velocidade em direção a um alvo aleatório.
     * @private
     */
    _atualizarItemAleatorio(item, dt) {
        // Se ainda não tiver alvo ou estiver muito próximo do alvo, sorteia novo alvo
        if (item._targetFromDeg === undefined || Math.abs(item.fromDeg - item._targetFromDeg) < 0.5) {
            const minD = (item.minDeg !== undefined) ? item.minDeg : 0;
            const maxD = (item.maxDeg !== undefined) ? item.maxDeg : 359;
            item._targetFromDeg = (minD <= maxD)
                ? (minD + Math.random() * (maxD - minD))
                : normalizeHeading(minD + Math.random() * (maxD + 360 - minD));
        }

        if (item._targetSpeedKt === undefined || Math.abs(item.speedKt - item._targetSpeedKt) < 0.3) {
            const minS = (item.minSpeed !== undefined) ? item.minSpeed : 0;
            const maxS = (item.maxSpeed !== undefined) ? item.maxSpeed : 30;
            item._targetSpeedKt = minS + Math.random() * (maxS - minS);
        }

        // Taxas máximas de variação por segundo (suave e realista para tempo real):
        // ~1.0° por segundo de direção, ~0.4 nós por segundo de velocidade
        const maxDegStep = 1.0 * dt;
        const maxSpdStep = 0.4 * dt;

        // Variação angular com menor arco
        let difDeg = item._targetFromDeg - item.fromDeg;
        if (difDeg > 180) difDeg -= 360;
        if (difDeg < -180) difDeg += 360;

        if (Math.abs(difDeg) <= maxDegStep) {
            item.fromDeg = normalizeHeading(item._targetFromDeg);
        } else {
            item.fromDeg = normalizeHeading(item.fromDeg + Math.sign(difDeg) * maxDegStep);
        }

        // Variação de velocidade
        const difSpd = item._targetSpeedKt - item.speedKt;
        if (Math.abs(difSpd) <= maxSpdStep) {
            item.speedKt = Math.max(0, item._targetSpeedKt);
        } else {
            item.speedKt = Math.max(0, item.speedKt + Math.sign(difSpd) * maxSpdStep);
        }
    }

    /**
     * Adiciona uma nova camada global de vento.
     */
    adicionarCamada(flMin, flMax, fromDeg = 180, speedKt = 10) {
        const id = 'camada_' + Date.now();
        this.camadas.push({
            id,
            nome: `FL ${String(flMin).padStart(3, '0')} – FL ${String(flMax).padStart(3, '0')}`,
            flMin: parseInt(flMin, 10),
            flMax: parseInt(flMax, 10),
            fromDeg: normalizeHeading(parseFloat(fromDeg) || 0),
            speedKt: Math.max(0, parseFloat(speedKt) || 0),
            ativo: true,
            aleatorio: false,
            minDeg: normalizeHeading(fromDeg - 20),
            maxDeg: normalizeHeading(fromDeg + 20),
            minSpeed: Math.max(0, speedKt - 5),
            maxSpeed: speedKt + 10,
            gustKt: 0,
            gustFrequency: 0,
            _targetFromDeg: fromDeg,
            _targetSpeedKt: speedKt
        });

        // Mantém camadas ordenadas por flMin
        this.camadas.sort((a, b) => a.flMin - b.flMin);
        this.salvar();
    }

    /**
     * Remove uma camada global existente pelo ID.
     */
    removerCamada(id) {
        if (this.camadas.length <= 1) return false; // Impede remover todas
        this.camadas = this.camadas.filter(c => c.id !== id);
        this.salvar();
        return true;
    }

    /**
     * Atualiza valores de uma camada específica.
     */
    atualizarCamada(id, params = {}) {
        const cam = this.camadas.find(c => c.id === id);
        if (!cam) return;

        if (params.fromDeg !== undefined) {
            cam.fromDeg = normalizeHeading(parseFloat(params.fromDeg) || 0);
            if (!cam.aleatorio) {
                cam.minDeg = normalizeHeading(cam.fromDeg - 20);
                cam.maxDeg = normalizeHeading(cam.fromDeg + 20);
            }
        }
        if (params.speedKt !== undefined) {
            cam.speedKt = Math.max(0, parseFloat(params.speedKt) || 0);
            if (!cam.aleatorio) {
                cam.minSpeed = Math.max(0, cam.speedKt - 5);
                cam.maxSpeed = cam.speedKt + 10;
            }
        }
        if (params.ativo !== undefined) cam.ativo = Boolean(params.ativo);
        if (params.aleatorio !== undefined) {
            const ativando = Boolean(params.aleatorio) && !cam.aleatorio;
            cam.aleatorio = Boolean(params.aleatorio);
            if (ativando) {
                cam.minDeg = normalizeHeading(cam.fromDeg - 25);
                cam.maxDeg = normalizeHeading(cam.fromDeg + 25);
                cam.minSpeed = Math.max(0, cam.speedKt - 5);
                cam.maxSpeed = cam.speedKt + 8;
                cam._targetFromDeg = undefined;
                cam._targetSpeedKt = undefined;
            }
        }
        if (params.flMin !== undefined) cam.flMin = parseInt(params.flMin, 10);
        if (params.flMax !== undefined) cam.flMax = parseInt(params.flMax, 10);

        this.salvar();
    }

    /**
     * Sorteia imediatamente novos valores para a camada global ao ativar o modo aleatório.
     */
    sortearCamada(cam) {
        if (!cam) return;
        const minD = (cam.minDeg !== undefined) ? cam.minDeg : 0;
        const maxD = (cam.maxDeg !== undefined) ? cam.maxDeg : 359;
        const minS = (cam.minSpeed !== undefined) ? cam.minSpeed : 0;
        const maxS = (cam.maxSpeed !== undefined) ? cam.maxSpeed : 30;

        cam.fromDeg = (minD <= maxD)
            ? Math.round(minD + Math.random() * (maxD - minD))
            : Math.round(normalizeHeading(minD + Math.random() * (maxD + 360 - minD)));
        cam.speedKt = Math.round(minS + Math.random() * (maxS - minS));

        cam._targetFromDeg = (minD <= maxD)
            ? (minD + Math.random() * (maxD - minD))
            : normalizeHeading(minD + Math.random() * (maxD + 360 - minD));
        cam._targetSpeedKt = minS + Math.random() * (maxS - minS);
    }

    /**
     * Atualiza parâmetros de uma cabeceira específica de um aeródromo.
     */
    atualizarCabeceira(aeroId, rwyId, params = {}) {
        const aero = this.aerodromos[aeroId];
        if (!aero || !aero.cabeceiras[rwyId]) return;

        const cab = aero.cabeceiras[rwyId];
        if (params.fromDeg !== undefined) cab.fromDeg = normalizeHeading(parseFloat(params.fromDeg) || 0);
        if (params.speedKt !== undefined) cab.speedKt = Math.max(0, parseFloat(params.speedKt) || 0);
        if (params.aleatorio !== undefined) {
            const ativando = Boolean(params.aleatorio) && !cab.aleatorio;
            cab.aleatorio = Boolean(params.aleatorio);
            if (ativando) {
                cab.minDeg = normalizeHeading(cab.fromDeg - 25);
                cab.maxDeg = normalizeHeading(cab.fromDeg + 25);
                cab.minSpeed = Math.max(0, cab.speedKt - 5);
                cab.maxSpeed = cab.speedKt + 8;
                cab._targetFromDeg = undefined;
                cab._targetSpeedKt = undefined;
            }
        }
        if (params.minDeg !== undefined) cab.minDeg = normalizeHeading(parseFloat(params.minDeg) || 0);
        if (params.maxDeg !== undefined) cab.maxDeg = normalizeHeading(parseFloat(params.maxDeg) || 0);
        if (params.minSpeed !== undefined) cab.minSpeed = Math.max(0, parseFloat(params.minSpeed) || 0);
        if (params.maxSpeed !== undefined) cab.maxSpeed = Math.max(0, parseFloat(params.maxSpeed) || 0);

        this.salvar();
    }

    /**
     * Sorteia imediatamente novos valores para a cabeceira ao ativar o modo aleatório.
     */
    sortearCabeceira(cab) {
        if (!cab) return;
        const minD = (cab.minDeg !== undefined) ? cab.minDeg : 0;
        const maxD = (cab.maxDeg !== undefined) ? cab.maxDeg : 359;
        const minS = (cab.minSpeed !== undefined) ? cab.minSpeed : 0;
        const maxS = (cab.maxSpeed !== undefined) ? cab.maxSpeed : 25;

        cab.fromDeg = (minD <= maxD)
            ? Math.round(minD + Math.random() * (maxD - minD))
            : Math.round(normalizeHeading(minD + Math.random() * (maxD + 360 - minD)));
        cab.speedKt = Math.round(minS + Math.random() * (maxS - minS));

        cab._targetFromDeg = cab.fromDeg;
        cab._targetSpeedKt = cab.speedKt;
    }

    /**
     * Salva as configurações atuais no localStorage (Seção 33).
     */
    salvar() {
        try {
            const data = {
                camadas: this.camadas.map(c => ({
                    id: c.id,
                    nome: c.nome,
                    flMin: c.flMin,
                    flMax: c.flMax,
                    fromDeg: c.fromDeg,
                    speedKt: c.speedKt,
                    ativo: c.ativo,
                    aleatorio: c.aleatorio,
                    minDeg: c.minDeg,
                    maxDeg: c.maxDeg,
                    minSpeed: c.minSpeed,
                    maxSpeed: c.maxSpeed
                })),
                aerodromos: {}
            };

            for (const [aeroId, aero] of Object.entries(this.aerodromos)) {
                data.aerodromos[aeroId] = {
                    pistaAtiva: aero.pistaAtiva,
                    cabeceiras: {}
                };
                for (const [rwyId, cab] of Object.entries(aero.cabeceiras)) {
                    data.aerodromos[aeroId].cabeceiras[rwyId] = {
                        fromDeg: cab.fromDeg,
                        speedKt: cab.speedKt,
                        aleatorio: cab.aleatorio
                    };
                }
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
            console.warn('[WindManager] Falha ao persistir no localStorage:', err);
        }
    }

    /**
     * Carrega as configurações do localStorage (Seção 33).
     */
    carregar() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);

            if (Array.isArray(data.camadas) && data.camadas.length > 0) {
                this.camadas = data.camadas.map(c => ({
                    ...c,
                    _targetFromDeg: c.fromDeg,
                    _targetSpeedKt: c.speedKt
                }));
            }

            if (data.aerodromos) {
                for (const [aeroId, aeroSaved] of Object.entries(data.aerodromos)) {
                    if (this.aerodromos[aeroId]) {
                        if (aeroSaved.pistaAtiva) this.aerodromos[aeroId].pistaAtiva = aeroSaved.pistaAtiva;
                        if (aeroSaved.cabeceiras) {
                            for (const [rwyId, cabSaved] of Object.entries(aeroSaved.cabeceiras)) {
                                if (this.aerodromos[aeroId].cabeceiras[rwyId]) {
                                    const cab = this.aerodromos[aeroId].cabeceiras[rwyId];
                                    if (cabSaved.fromDeg !== undefined) cab.fromDeg = cabSaved.fromDeg;
                                    if (cabSaved.speedKt !== undefined) cab.speedKt = cabSaved.speedKt;
                                    if (cabSaved.aleatorio !== undefined) cab.aleatorio = cabSaved.aleatorio;
                                    cab._targetFromDeg = cab.fromDeg;
                                    cab._targetSpeedKt = cab.speedKt;
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('[WindManager] Falha ao carregar do localStorage:', err);
        }
    }
}

// Instância singleton pronta para uso global
export const windManager = new WindManager();
