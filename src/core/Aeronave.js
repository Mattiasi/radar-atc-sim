import { state } from './state.js';
import { latCentro, lonCentro, correcaoLon, calcularRumoDistancia, geoParaDelta } from '../utils/utils.js';
import { restricoesFixos, fixosNavegacao, aerodromos, obterNiveisSpawn, isFixoIAC, getRunwayData, obterRestricaoFixoParaAeronave, cartasNavegacao } from '../data/data.js';
import { getAircraftPerformance } from '../data/PerformanceDB.js';
import { windManager } from '../physics/windManager.js';
import { calculateWindCorrectionAngle, normalizeHeading } from '../physics/windMath.js';
import { PilotAgent } from '../agents/pilotEngine.js';
import { VirtualPilot } from '../agents/VirtualPilot.js';
import { FlightDynamicsEngine } from '../physics/FlightDynamicsEngine.js';
import { DESCENT_MODES, authorize_approach, cancel_approach, update_approach_vertical_profile, findFirstIACFix, getFixAltitudeFt } from '../controllers/ApproachProfileManager.js';
import { updateLNAV, updateLateralPhysics, updateFlyByProtection } from '../controllers/LNAVController.js';
import { updateVNAV } from '../controllers/VNAVController.js';
import { update_ils_tracking, getRunwayILS, calculateILSGeometry, ILS_LATERAL_MODES, ILS_VERTICAL_MODES } from '../controllers/ILSController.js';
import { verificarTouchdown, processarRolloutESumico } from '../controllers/LandingRolloutManager.js';
import { commandParser } from '../agents/CommandParser.js';
import {
    calcularVelocidadeAlvoEnergia,
    calcularDistanciaDesaceleracao,
    FLIGHT_ENERGY_STATES,
    ENERGY_LEVELS,
    findFAF,
    calcularAlongTrackDistanceToFAF,
    executarMissedApproach
} from '../controllers/ApproachEnergyManager.js';

/**
 * Classe principal que modela o comportamento físico, cinemático e lógico de cada aeronave.
 * 
 * Funciona como uma Máquina de Estados Finitos (FSM) com cinemática contínua:
 * - LNAV (Lateral Navigation): Segue sequências de waypoints (STAR) com antecipação de curvas (Fly-By).
 * - VNAV (Vertical Navigation): Calcula Top of Descent (TOD), perfis de descida de 3° e respeita restrições de cartas.
 * - Controle Dinâmico de Velocidade: Gestão baseada em Distance-To-Go / DME, performance individual, tráfego precedente e instruções ATC.
 * - Simulação Humana (PilotAgent): Comandos do controlador ATC são processados pela cabine virtual com gestão por canais e tempos cognitivos realistas.
 */
/**
 * Versão "Padrão Ouro" (Linear Assimétrica + Razão Vertical + Ruído Atmosférico)
 * Utiliza as taxas individuais de aceleração e desaceleração de cada aeronave definidas em PerformanceDB.js,
 * moduladas dinamicamente pela atitude de voo (razão vertical) e superfícies aerodinâmicas (speedbrakes):
 * 
 * @param {Aeronave|Object} ac - Instância da aeronave ou objeto de estado cinemático
 * @param {number} [dt] - Delta time em segundos
 */
export function calcularTaxaDesacel(ac) {
    const perf = ac.perf || getAircraftPerformance(ac.tipo);
    const baseDesacel = (ac.taxaDesacel !== undefined) ? ac.taxaDesacel : (perf.taxaDesacel || perf.decelerationRate || 1.2);
    const vs = (ac.verticalSpeed !== undefined) ? ac.verticalSpeed : (ac.currentVS || 0);

    // Dilema Descer vs. Desacelerar (Seção 9):
    // Gravidade penaliza a desaceleração proporcionalmente à razão de descida
    let penalidadeVS = 0;
    if (vs < -200) {
        penalidadeVS = Math.min(0.95, (-vs / 1000) * 0.42);
    }

    let taxa = Math.max(0.15, baseDesacel - penalidadeVS);
    if (ac.speedbrakes) taxa += 0.85;
    if (ac.flaps) taxa += 0.40;
    if (ac.gearDown || ac.tremDePouso) taxa += 0.55;

    return taxa;
}

export function calcularTaxaAcel(ac) {
    const perf = ac.perf || getAircraftPerformance(ac.tipo);
    const baseAcel = (ac.taxaAcel !== undefined) ? ac.taxaAcel : (perf.taxaAcel || perf.accelerationRate || 2.0);

    if (ac.verticalSpeed && ac.verticalSpeed < -200) {
        return baseAcel * 1.15; // Gravidade auxiliando aceleração na descida
    } else if (ac.verticalSpeed && ac.verticalSpeed > 200) {
        return baseAcel * 0.85; // Subida consumindo empuxo
    }
    return baseAcel;
}

export function atualizarVelocidadeRealista(ac, dt) {
    const curSpeed = (ac.speed !== undefined) ? ac.speed : ac.vel;
    const tgtSpeed = (ac.targetSpeed !== undefined) ? ac.targetSpeed : ac.velDestino;

    if (curSpeed === tgtSpeed) return;

    let taxa = 0;

    if (curSpeed < tgtSpeed) {
        // ACELERANDO (taxaAcel de data.js modulada pela razão vertical)
        taxa = calcularTaxaAcel(ac); 
    } else {
        // DESACELERANDO (taxaDesacel de data.js modulada pela razão vertical e speedbrakes)
        taxa = calcularTaxaDesacel(ac);
    }

    // Taxa linear sem ruído estocástico de alta frequência
    const taxaEfetiva = taxa;

    // Aplicação linear
    const direcao = Math.sign(tgtSpeed - curSpeed);
    const passo = direcao * taxaEfetiva * dt;

    let novaVel;
    if (Math.abs(tgtSpeed - curSpeed) <= Math.abs(passo)) {
        novaVel = tgtSpeed;
    } else {
        novaVel = curSpeed + passo;
    }

    if (ac.speed !== undefined) ac.speed = novaVel;
    if (ac.vel !== undefined) ac.vel = novaVel;
}

export class Aeronave {
    /**
     * @param {string} callsign - Indicativo de chamada da aeronave (ex: "GLO1234", "PT-ABC").
     * @param {string} tipo - Tipo ICAO da aeronave (ex: "A320", "B738", "E195", "BE40").
     * @param {number} lat - Latitude inicial em formato decimal.
     * @param {number} lon - Longitude inicial em formato decimal.
     * @param {number} proa - Proa magnética inicial em graus (000 a 359).
     * @param {number} vel - Velocidade indicada inicial (IAS) em nós (kt).
     * @param {string} nivAtual - Nível de voo inicial para exibição na etiqueta (ex: "120", "090↓").
     * @param {string} nivAutorizado - Nível autorizado pelo controlador exibido na etiqueta (ex: "070", "VIA").
     * @param {string} dest - Aeródromo de destino (ex: "SBSP").
     * @param {string} [textoLivre=""] - Anotações do controlador inseridas no bloco livre da etiqueta (Scratchpad).
     * @param {Array<string>} [rota=[]] - Lista sequencial de nomes de fixos da STAR (ex: ROTA_PRUMO ou ROTA_OGTAL).
     * @param {string} [cartaNome=null] - Nome opcional da carta/STAR de navegação ativa da aeronave.
     */
    constructor(callsign, tipo, lat, lon, proa, vel, nivAtual, nivAutorizado, dest, textoLivre = "", rota = [], spawnWpIndex = 0, cartaNome = null) {
        // --- 1. IDENTIFICAÇÃO E POSIÇÃO CARTESIANA ---
        this.callsign = callsign; // Identificador ATC
        this.tipo = tipo;         // Modelo da aeronave para determinar coeficientes de desempenho
        this.cartaNome = cartaNome; // Procedimento STAR/IAC ativo da aeronave
        
        // Posição cartesiana em deltas magnéticos relativos ao marco zero do radar (Aeroporto SBSP).
        // Converte coordenadas reais WGS-84 (ou recebe deltas diretamente se já convertidos).
        if (Math.abs(lat) < 5) {
            this.deltaLat = lat;
            this.deltaLon = lon;
        } else {
            const ptDelta = geoParaDelta(lat, lon);
            this.deltaLat = ptDelta.deltaLat;
            this.deltaLon = ptDelta.deltaLon;
        }
        
        // --- 2. PERFIL DE PERFORMANCE CINEMÁTICA ---
        // Coeficientes de aceleração, desaceleração, envelope de aproximação e limites de razão/velocidade
        const perf = getAircraftPerformance(this.tipo);
        this.perf = perf;
        this.taxaAcel = perf.taxaAcel || perf.accelerationRate || 1.8;       // Aceleração máxima (kt/s²)
        this.taxaDesacel = perf.taxaDesacel || perf.decelerationRate || 1.2; // Desaceleração máxima (kt/s²)
        this.maxSpeedTMA = perf.maxSpeedTMA || 260;                          // Teto na TMA (> 25 NM)
        this.minApproachSpeed = perf.minApproachSpeed || 125;                // Vls / velocidade mínima segura
        this.approachSpeed = perf.approachSpeed || 135;                      // Vapp / velocidade de toque
        this.initialAppSpeed = perf.initialAppSpeed || 240;                  // Velocidade entre 25-15 NM
        this.intermediateAppSpeed = perf.intermediateAppSpeed || 200;        // Velocidade entre 15-10 NM
        this.finalAppSpeed = perf.finalAppSpeed || 160;                      // Velocidade entre 10-4 NM
        this.dtg = 99;                                                       // Distance-To-Go atualizado dinamicamente em NM
        this.sugestaoVel = null;                                             // Sugestão de velocidade para apoio ao controlador
        
        // --- 3. NAVEGAÇÃO LATERAL (PROA / HEADING) ---
        this.proa = proa;                        // Proa magnética atual da aeronave (0-359°)
        this.proaDestino = proa;                 // Proa alvo que a aeronave está buscando atingir
        this.curvaForcada = false;               // Flag booleana: ativa quando uma curva pelo arco maior (+) está em execução
        this.direcaoCurva = 0;                   // Sentido atual da curva: -1 (Esquerda), 1 (Direita), 0 (Asas niveladas)
        this.ladoCurvaComandada = null;          // Sentido de curva instruído pelo ATC ('E', 'D' ou null)
        this.modoHolding = null;                 // Estrutura de órbita padrão de 1 min: { ativo, lado, inboundHeading, outboundHeading, fase, timerLeg }
        
        // --- 4. GESTÃO DE VELOCIDADE INDICADA (IAS) ---
        this.vel = vel;                          // Velocidade atual em nós (Ground Speed simulada)
        this.velComando = vel;                   // Velocidade alvo definida pelo LNAV ou instruída pelo ATC
        this.velDestino = vel;                   // Velocidade alvo acrescida de ruídos atmosféricos e oscilações do radar
        this.velManual = false;                  // Flag: true se o ATC fixou velocidade manual (anula reduções automáticas da rota)
        this.speedbrakes = false;                // Flag: speedbrakes / spoilers acionados (aumentam taxa de frenagem)
        this.speedbrakesComando = false;         // Flag: ativado explicitamente via Scratchpad (comando SB)

        // ---------------------------------------------------------------------
        // REGRA DE SPAWN EM FIXO COM RESTRIÇÃO DE ALTITUDE:
        // Se a aeronave nascer em cima de um ponto com restrição de altitude,
        // ela DEVE nascer no nível dessa restrição e já autorizada a descida
        // para a próxima restrição de nível inferior da carta.
        // Exemplo: nasceu em OGTAL (restrição FL 120), nasce no FL 120 e já autorizada FL 090 (restrição de SP099).
        // ---------------------------------------------------------------------
        let fixoSobAero = null;
        let idxFixoSobAero = -1;

        if (rota && rota.length > 0) {
            // 1. Verifica geometricamente se a posição inicial está em cima (<= 2.0 NM) de algum fixo da rota
            if (state.fixos && Object.keys(state.fixos).length > 0) {
                for (let i = 0; i < rota.length; i++) {
                    const nomeFixo = rota[i];
                    const coords = state.fixos[nomeFixo];
                    if (coords) {
                        const dLat = (coords.deltaLat - this.deltaLat) * 60;
                        const dLon = (coords.deltaLon - this.deltaLon) * correcaoLon * 60;
                        const dist = Math.hypot(dLat, dLon);
                        const restPropria = obterRestricaoFixoParaAeronave(nomeFixo, dest, this.cartaNome);
                        if (dist <= 2.0 && restPropria && restPropria.fl !== undefined) {
                            fixoSobAero = nomeFixo;
                            idxFixoSobAero = i;
                            break;
                        }
                    }
                }
            }

            // 2. Fallback se estiver no waypoint 0 e possuir restrição
            if (!fixoSobAero && spawnWpIndex === 0) {
                const restWp0 = obterRestricaoFixoParaAeronave(rota[0], dest, this.cartaNome);
                if (restWp0 && restWp0.fl !== undefined) {
                    // NÃO definir fixoSobAero para evitar avanço prematuro do waypoint
                }
            }
        }

        if (fixoSobAero) {
            const niveisFixo = obterNiveisSpawn(fixoSobAero, rota, dest, this.cartaNome);
            nivAtual = niveisFixo.nivAtual;
            nivAutorizado = niveisFixo.nivAutorizado;

            // Se nasceu em cima do fixo, já completou a passagem por ele;
            // o próximo fixo alvo a perseguir no LNAV é o fixo subsequente na rota.
            if (spawnWpIndex <= idxFixoSobAero && idxFixoSobAero + 1 < rota.length) {
                spawnWpIndex = idxFixoSobAero + 1;
            }

            // Alinha a proa em direção ao próximo fixo se houver coordenadas
            const proxNome = rota[spawnWpIndex];
            if (proxNome && state.fixos && state.fixos[proxNome]) {
                const info = calcularRumoDistancia(this, state.fixos[proxNome]);
                this.proa = parseInt(info.rumo, 10);
                this.proaDestino = this.proa;
                this.track = this.proa;
            }
        } else if ((!nivAtual || !nivAutorizado) && rota && rota.length > 0) {
            const refWp = rota[spawnWpIndex] || rota[0];
            const niveisAuto = obterNiveisSpawn(refWp, rota, dest, this.cartaNome);
            if (!nivAtual) nivAtual = niveisAuto.nivAtual;
            if (!nivAutorizado) nivAutorizado = niveisAuto.nivAutorizado;
        }

        // --- 5. NAVEGAÇÃO VERTICAL (FLIGHT LEVEL / VNAV) ---
        this.nivAtual = nivAtual;                // String formatada para a etiqueta do radar (ex: "055↓")
        this.nivAutorizado = nivAutorizado;      // Clearance textual exibido no radar (ex: "040" ou "VIA")
        this.nivAutorizadoFisico = nivAutorizado;// Alvo numérico de altitude para a física de descida
        this.flAtualNum = parseInt(nivAtual) || 0; // Valor numérico de altitude em Flight Level (ex: FL 55 = 5500 pés)
        this.verticalSpeed = 0;                  // Inicializa nivelado; VNAV modula dinamicamente a razão de descida a partir do TOD

        // --- 6. GESTÃO DE ROTA AUTOMÁTICA (LNAV) E TRANSIÇÕES (FLY-BY) ---
        this.rota = rota;                        // Sequência ordenada de nomes de fixos da carta (STAR)
        this.wpIndex = spawnWpIndex;             // Ponteiro para o waypoint ativo que a aeronave está perseguindo
        this.modoLNAV = (rota && rota.length > 0); // true = seguindo fixos da rota; false = vetorada por proa manual
        this.wpPendente = null;                  // Waypoint direto (DCT) pendente em buffer
        this.wpOffRoute = null;                  // Waypoint fora da rota padrão para voo direto temporário
        this.flyByDist = 0.6;                    // Distância calculada em NM para antecipar a curva antes do fixo
        this.desceuParaWp = {};                  // Registro de histerese: impede interrupção de descidas já iniciadas
        this.flyByProtegido = null;              // Trava de segurança RNAV: { fixoNome, flMinimo, distMin } durante fly-by com restrição de piso
        
        // --- 7. SISTEMA DE ETIQUETAS E CONTROLE OPERACIONAL ATC ---
        this.dest = dest;                        // Destino exibido na etiqueta (ex: "SBSP")
        this.textoLivre = textoLivre;            // Dados brutos digitados pelo operador no Scratchpad
        this.ultimoComandoTexto = "";            // Cache do último texto para evitar re-execução desnecessária de regex
        this.ultimoWpComandadoTexto = null;      // Evita reprocessar o mesmo comando de ponto em loop
        this.ultimoWpComandadoFixo = null;       // Nome do último fixo comandado diretamente via ATC
        this.comandosAtivos = {
            waypoint: null,
            heading: null,
            holding: null,
            speed: null,
            altitude: null,
            approach: null,
            ils: null,
            runway: null,
            restriction: null,
            speedbrakes: null
        };
        
        this.historico = [];                     // Últimas 5 posições cartesianas para desenho dos ecos históricos (rasto)
        this.labelAngle = Math.PI / 4;           // Ângulo polar em radianos da linha guia da etiqueta (Leader line)
        this.labelDist = 40;                     // Distância em píxeis entre o blip da aeronave e a etiqueta
        
        this.gerouSucessor = false;              // Trava do spawner: garante que esta aeronave crie apenas 1 sucessor na esteira
        this.rotaOriginal = null;                // Nome da rota de origem ("OGTAL" ou "PRUMO") para manter a esteira ativa
        this.distTriggerAnt = undefined;         // Distância anterior ao ponto gatilho (para detectar passagem)

        this.squawk = "";                        // Código transponder (muda para "2000" na final para indicar visual)
        this.pousou = false;                     // Flag de ciclo de vida: true remove a aeronave da memória do simulador

        // --- 8. SISTEMA REALISTA DE VENTO E VETORES RESULTANTES DE NAVEGAÇÃO ---
        this.groundSpeed = vel;                  // Velocidade sobre o solo (Ground Speed calculada pelo radar)
        this.track = proa;                       // Trajetória real sobre o solo (Track em graus aeronáuticos)
        this.driftAngle = 0;                     // Ângulo de deriva (Drift Angle = Track - Proa)
        
        let pistaPadrao = null;

        // 0. Se uma carta foi informada (ex: STAR/IAC), busca a cabeceira correspondente nas cartas
        if (cartaNome && typeof cartasNavegacao === 'object' && cartasNavegacao && cartasNavegacao[dest]) {
            for (const [cabKey, cabObj] of Object.entries(cartasNavegacao[dest])) {
                for (const catObj of Object.values(cabObj)) {
                    if (catObj && typeof catObj === 'object' && Object.values(catObj).some(c => c.nome === cartaNome)) {
                        pistaPadrao = cabKey;
                        break;
                    }
                }
                if (pistaPadrao) break;
            }
        }

        // 1. Tenta obter a pista ativa a partir do Video Mapa (radarLayerState)
        if (!pistaPadrao && state.radarLayers && state.radarLayers.activeRunways) {
            const prefixo = dest + "-";
            for (const rwyKey of state.radarLayers.activeRunways) {
                if (rwyKey.startsWith(prefixo)) {
                    const cand = rwyKey.split("-")[1];
                    pistaPadrao = cand;
                    if (cand.length > 2) {
                        break; // Ex: "17R" ou "28L"
                    }
                }
            }
        }

        // Se pistaPadrao for número de grupo (ex: "28" ou "17"), busca a cabeceira específica
        if (pistaPadrao && pistaPadrao.length <= 2 && typeof cartasNavegacao === 'object' && cartasNavegacao && cartasNavegacao[dest]) {
            const match = Object.keys(cartasNavegacao[dest]).find(k => k.startsWith(pistaPadrao));
            if (match) pistaPadrao = match;
        }

        // 2. Fallback caso não haja pista ativa no Video Mapa
        if (!pistaPadrao && Array.isArray(aerodromos)) {
            const aeroData = aerodromos.find(a => a.nome === dest);
            if (aeroData) {
                if (aeroData.pistaPadrao) {
                    pistaPadrao = aeroData.pistaPadrao;
                } else if (aeroData.pistas && aeroData.pistas.length > 0) {
                    const primaryPista = aeroData.pistas[0];
                    if (primaryPista.cabeceiras && Object.keys(primaryPista.cabeceiras).length > 0) {
                        pistaPadrao = Object.keys(primaryPista.cabeceiras)[0];
                    } else {
                        const primaryId = primaryPista.id;
                        pistaPadrao = primaryId.includes('/') ? primaryId.split('/')[0] : primaryId;
                    }
                }
            }
        }
        
        this.pistaAtribuida = pistaPadrao || "17R"; // Cabeceira terminal atribuída para vento local
        this.ventoAtual = { fromDeg: 0, speedKt: 0, vLat: 0, vLon: 0, origem: "GLOBAL" }; // Vento atuante

        // --- 9. PILOT COCKPIT INTERACTION & DYNAMICS ENGINE ---
        this.pilot = new PilotAgent(this);          // Agente de cabine virtual com gestão concorrente por canais
        this.virtualPilot = new VirtualPilot(this); // Piloto virtual determinístico (VNAV, energia e modos verticais)
        this.semRestricoes = false;           // Flag: descida sem restrições intermediárias da STAR ("SR")
        this.velocidadeMinima = false;        // Flag: voando na velocidade mínima apropriada da fase ("MIN")
        this.autorizadoProcedimento = false;  // Flag: autorizado procedimento IAC/aproximação ("APP")
        this.cleared_approach = false;        // Flag canônica: autorização formal de aproximação (Cleared Approach)
        this.descent_mode = DESCENT_MODES.RESTRICTED_DESCENT; // Modo vertical: RESTRICTED_DESCENT, OPEN_DESCENT, APPROACH_PROFILE, GLIDEPATH
        this.hold_altitude_until_waypoint = null; // Trava vertical: fixo onde o nível atual deve ser retido antes de liberar descida subsequente
        this.targetFL = parseInt(this.nivAutorizado) || this.flAtualNum;
        this.target_altitude = this.targetFL * 100; // Altitude alvo em pés físicos contínuos
        this.vertical_floor_altitude = null;  // Trava rígida de segurança em pés que impede perfuração antes do fixo
        this.vertical_floor_fl = null;        // Trava rígida em Flight Level
        this.active_iac = null;               // Carta IAC ativa atribuída
        this.alt = this.flAtualNum * 100;
        this.currentVS = 0;
        this.targetVS = 0;
        this.verticalMode = 'AUTO';
        this.clampedAtStructural = false;
        this.expandida = false;                // Etiqueta expandida (exibe linhas 5 e 6 com callsign verde)
        this.temModificacaoVertical = false;   // True quando o controlador comanda razão customizada/expedite
        this.currentIAS = this.vel;
        this.targetIAS = this.vel;
        this.currentThrust = 0.6;
        this.targetThrust = 0.6;
        this.stallProtectionActive = false;
        this.posicaoRadar = { 
            deltaLat: this.deltaLat, 
            deltaLon: this.deltaLon,
            track: (this.track !== undefined) ? this.track : this.proa,
            proa: this.proa,
            groundSpeed: (this.groundSpeed !== undefined) ? this.groundSpeed : this.vel,
            nivAtual: this.nivAtual,
            currentVS: 0,
            verticalMode: 'AUTO',
            clampedAtStructural: false,
            temModificacaoVertical: false
        }; // Snapshot da varredura radar (0.25 Hz)

        // --- 10. SUBSISTEMA DE APROXIMAÇÃO ILS (LOC & GS) ---
        this.autopilot = {
            lateral_mode: ILS_LATERAL_MODES.HDG,
            vertical_mode: ILS_VERTICAL_MODES.ALT_HOLD,
            ils_authorized: (this.nivAutorizado === "ILS"),
            loc_armed: false,
            loc_captured: false,
            loc_tracked: false,
            gs_armed: false,
            gs_captured: false,
            gs_tracked: false
        };
        this.ils_lateral_mode = ILS_LATERAL_MODES.HDG;
        this.ils_vertical_mode = ILS_VERTICAL_MODES.ALT_HOLD;
        this.ils_authorized = (this.nivAutorizado === "ILS");
        this._on_ground = false;
        this._flight_phase = "IN_FLIGHT";
        this.just_touched_down = false;

        // --- 11. SISTEMA DE ENERGIA E APROXIMAÇÃO BASEADO NO FAF ---
        this.flightEnergyState = FLIGHT_ENERGY_STATES.CRUISE;
        this.energyLevel = ENERGY_LEVELS.NORMAL;
        this.alongTrackDistanceToFAF = null;
        this.energyDebug = null;
        this.missed_approach = false;
        this.gearDown = false;
        this.flaps = false;

        // Se nasceu autorizada VIA e o waypoint atual já pertence à IAC, engaja aproximação
        if (this.nivAutorizado === "VIA" || this.cleared_level === "VIA") {
            const activeWp = (this.rota && this.wpIndex < this.rota.length) ? this.rota[this.wpIndex] : null;
            if (activeWp && isFixoIAC(activeWp, this)) {
                authorize_approach(this);
            }
        }
    }

    get assigned_runway() {
        return this.pistaAtribuida;
    }
    set assigned_runway(val) {
        this.pistaAtribuida = val;
    }

    get cleared_level() {
        return this.nivAutorizado;
    }
    set cleared_level(val) {
        this.nivAutorizado = val;
        this.ils_authorized = (val === "ILS");
        if (this.autopilot) this.autopilot.ils_authorized = this.ils_authorized;
    }

    get on_ground() {
        return Boolean(this._on_ground);
    }
    set on_ground(val) {
        this._on_ground = Boolean(val);
    }

    get flight_phase() {
        return this._flight_phase || (this.pousou ? "LANDED" : "IN_FLIGHT");
    }
    set flight_phase(val) {
        this._flight_phase = val;
        if (val === "LANDED") this._on_ground = true;
    }

    get transponder() {
        const self = this;
        return {
            get code() { return self.squawk; },
            set code(val) { self.squawk = String(val); }
        };
    }

    /**
     * Determina se a aeronave está próxima ou engajada no procedimento de aproximação (AIC / IAC).
     * Requer associação lógica e geométrica com o procedimento (não confunde proximidade com aproximação).
     * @returns {boolean}
     */
    estaProximaDoAIC() {
        const wpAtual = (this.rota && this.rota.length > 0 && this.wpIndex < this.rota.length) 
            ? this.rota[this.wpIndex] 
            : null;
        if (wpAtual && isFixoIAC(wpAtual, this)) return true;
        if (this.wpOffRoute && isFixoIAC(this.wpOffRoute, this)) return true;
        if (this.wpPendente && typeof this.wpPendente === 'string' && isFixoIAC(this.wpPendente, this)) return true;
        if (this.cleared_approach || this.autorizadoProcedimento || this.ils_authorized) {
            if (this.alongTrackDistanceToFAF && this.alongTrackDistanceToFAF.alongTrackNM !== null && this.alongTrackDistanceToFAF.alongTrackNM <= 14.0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Getters e setters para compatibilidade cinemática (ac.speed / ac.actualSpeed / ac.targetSpeed)
     * Atende à Seção 13: Diferenciar velocidade-alvo e velocidade real.
     */
    get speed() {
        return this.vel;
    }
    set speed(val) {
        this.vel = val;
    }

    get actualSpeed() {
        return this.vel;
    }
    set actualSpeed(val) {
        this.vel = val;
    }

    get targetSpeed() {
        return (this.velDestino !== undefined) ? this.velDestino : this.velComando;
    }
    set targetSpeed(val) {
        this.velComando = val;
        this.velDestino = val;
    }

    /**
     * Calcula dinamicamente a distância restante estimada até a cabeceira da pista (Distance-To-Go / DME).
     * Funciona com precisão geométrica e preditiva tanto na rota publicada (STAR)
     * quanto durante vetoração radar (downwind, base, interceptação de final ou direta).
     * Atende rigorosamente às Seções 2, 8 e 9 da Especificação ATC.
     * 
     * @returns {number} Distância restante estimada até o toque em Milhas Náuticas (NM).
     */
    calcularDistanceToGo() {
        const destNome = this.dest || (Array.isArray(aerodromos) && aerodromos[0] ? aerodromos[0].nome : "SBSP");
        const rwy = this.assigned_runway ? this.assigned_runway.replace("/", "") : "";
        const suf = destNome ? destNome.slice(2) : "";
        const thKey = `R${rwy}${suf}`;
        const rwKey = `RW${rwy}`;
        
        const rwData = getRunwayData(this);
        const ptThreshold = (rwData && rwData.threshold)
            ? rwData.threshold
            : (state.fixos[thKey] || state.fixos[rwKey] || state.fixos[destNome] || (state.fixos && Object.values(state.fixos)[0]));
        if (!ptThreshold) return 20.0;

        // Distância euclidiana em linha reta até o limiar
        const infoDireta = calcularRumoDistancia(this, ptThreshold);
        const distDireta = infoDireta.distanciaNM;

        // Rumo magnético da pista de pouso
        let rumoPista = (rwData && rwData.front_course_deg !== undefined) ? rwData.front_course_deg : 170;
        if (!rwData && Array.isArray(aerodromos)) {
            const aeroData = aerodromos.find(a => a.nome === destNome);
            if (aeroData && aeroData.rumoPista !== undefined) {
                rumoPista = aeroData.rumoPista;
            }
        }

        // =====================================================================
        // CASO 1: NAVEGAÇÃO LATERAL EM ROTA PUBLICADA (LNAV ATIVO)
        // =====================================================================
        if (this.modoLNAV && this.rota && this.wpIndex < this.rota.length) {
            let wpAtivoNome = (this.wpOffRoute !== null) ? this.wpOffRoute : this.rota[this.wpIndex];
            let distRota = 0;
            let wpAtivoCoords = state.fixos[wpAtivoNome];

            if (wpAtivoCoords) {
                distRota += calcularRumoDistancia(this, wpAtivoCoords).distanciaNM;

                // Soma as pernas subsequentes da STAR
                const idxInicio = (this.wpOffRoute !== null) ? this.wpIndex : this.wpIndex;
                for (let i = idxInicio; i < this.rota.length - 1; i++) {
                    let p1 = state.fixos[this.rota[i]];
                    let p2 = state.fixos[this.rota[i + 1]];
                    if (p1 && p2) {
                        distRota += calcularRumoDistancia(p1, p2).distanciaNM;
                    }
                }

                // Se a STAR não terminar exatamente na cabeceira, soma do último fixo até ela
                const ultimoFixo = this.rota[this.rota.length - 1];
                if (ultimoFixo !== destNome) {
                    const ultCoords = state.fixos[ultimoFixo];
                    if (ultCoords) {
                        distRota += calcularRumoDistancia(ultCoords, ptThreshold).distanciaNM;
                    }
                }

                return Math.max(distDireta, distRota);
            }
        }

        // =====================================================================
        // CASO 2: VETORAÇÃO RADAR / FORA DA ROTA PUBLICADA (OFF-ROUTE)
        // =====================================================================
        // Geometria analítica no plano cartesiano magnético do radar:
        // O eixo de aproximação estende-se para trás da cabeceira no rumo recíproco (rumoPista + 180°)
        const angReciprocoRad = ((rumoPista + 180) % 360) * (Math.PI / 180);
        const uAppX = Math.sin(angReciprocoRad);
        const uAppY = Math.cos(angReciprocoRad);

        // Vetor do limiar da pista até a posição atual da aeronave em Milhas Náuticas
        const dLat = (this.deltaLat - ptThreshold.deltaLat) * 60;
        const dLon = (this.deltaLon - ptThreshold.deltaLon) * correcaoLon * 60;

        // dAlong: distância longitudinal ao longo do prolongamento do eixo (+ para o setor de aproximação)
        const dAlong = dLon * uAppX + dLat * uAppY;
        // dCross: afastamento lateral ortogonal em relação ao eixo da pista
        const dCross = Math.abs(dLon * (-uAppY) + dLat * uAppX);

        // Componente da proa da aeronave ao longo do eixo de aproximação para a pista:
        // vAlong > 0 indica voo em direção à final/pouso; vAlong < 0 indica afastamento (ex: downwind, abertura de base)
        const angProaRad = (this.proa - rumoPista) * (Math.PI / 180);
        const vAlong = Math.cos(angProaRad);

        let dtgEstimado = distDireta;

        if (dAlong > 0 && vAlong > 0.3) {
            // Aeronave interceptando ou alinhada com a reta final
            dtgEstimado = dAlong + 1.25 * dCross;
        } else {
            // Aeronave em perna do vento (downwind), proa de afastamento ou vetoração indireta:
            // A trajetória restante prevista exige voar até o ponto de curva base (mínimo 10-12 NM na final),
            // percorrer o braço da base lateral e depois a final até o toque (Seção 9).
            const dBaseAlong = Math.max(dAlong, 11.0);
            const distAteBase = Math.abs(dBaseAlong - dAlong);
            const distPernaBase = dCross * 1.25;
            const distFinal = dBaseAlong;
            const allowanceCurvas = 2.5; // NM para manobra e transição de arcos de curva

            dtgEstimado = distAteBase + distPernaBase + distFinal + allowanceCurvas;
        }

        return Math.max(distDireta, dtgEstimado);
    }

    /**
     * Calcula dinamicamente a velocidade-alvo e gerencia a energia da aeronave.
     * 
     * Prioridade estrita de execução (Seção 27):
     * TRAJETÓRIA → FAF → DISTÂNCIA DISPONÍVEL → ENERGIA / V/S → PERFORMANCE → VELOCIDADE-ALVO → ACELERAÇÃO FÍSICA → VELOCIDADE REAL.
     * 
     * Substitui o modelo legado de raio euclidiano da pista por Along-Track Distance to FAF.
     * Atende às Seções 1 a 27 da Especificação ATC.
     * 
     * @param {number} [dtSec=1.0] - Delta time em segundos
     * @returns {number} Velocidade-alvo em nós (KIAS).
     */
    calcularVelocidadeAlvoDinamica(dtSec = 1.0) {
        if (this.on_ground || this.pousou || this.flight_phase === "LANDED") {
            return 0;
        }

        // Atualiza DTG referencial para telemetria
        this.dtg = this.calcularDistanceToGo();

        // GESTÃO DE VELOCIDADE E ENERGIA BASEADA NO FAF (ApproachEnergyManager)
        const vAlvo = calcularVelocidadeAlvoEnergia(this, dtSec);
        this.sugestaoVel = vAlvo;
        return vAlvo;
    }

    /**
     * Atualiza a máquina de estados da órbita padrão (Holding Pattern).
     * Perna padrão: 1 minuto (60 segundos) cada perna reta.
     * Curvas de 180° com taxa padrão para o lado instruído ('E' / '<' ou 'D' / '>').
     * @param {number} dtSec - Delta time em segundos
     */
    atualizarHolding(dtSec) {
        if (!this.modoHolding || !this.modoHolding.ativo) return;
        const hold = this.modoHolding;
        const dirCurva = (hold.lado === 'E') ? -1 : 1;

        this.modoLNAV = false;
        this.wpOffRoute = null;

        switch (hold.fase) {
            case 'TURN_OUTBOUND':
                this.proaDestino = hold.outboundHeading;
                this.direcaoCurva = dirCurva;
                this.curvaForcada = true;
                this.ladoCurvaComandada = hold.lado;
                let difOut = Math.abs(this.proa - hold.outboundHeading);
                if (difOut > 180) difOut = 360 - difOut;
                if (difOut <= 2.5) {
                    this.proa = hold.outboundHeading;
                    hold.fase = 'OUTBOUND_LEG';
                    hold.timerLeg = 0;
                    this.curvaForcada = false;
                    this.direcaoCurva = 0;
                }
                break;

            case 'OUTBOUND_LEG':
                this.proaDestino = hold.outboundHeading;
                this.curvaForcada = false;
                this.direcaoCurva = 0;
                hold.timerLeg += dtSec;
                if (hold.timerLeg >= 60) {
                    hold.fase = 'TURN_INBOUND';
                    hold.timerLeg = 0;
                }
                break;

            case 'TURN_INBOUND':
                this.proaDestino = hold.inboundHeading;
                this.direcaoCurva = dirCurva;
                this.curvaForcada = true;
                this.ladoCurvaComandada = hold.lado;
                let difIn = Math.abs(this.proa - hold.inboundHeading);
                if (difIn > 180) difIn = 360 - difIn;
                if (difIn <= 2.5) {
                    this.proa = hold.inboundHeading;
                    hold.fase = 'INBOUND_LEG';
                    hold.timerLeg = 0;
                    this.curvaForcada = false;
                    this.direcaoCurva = 0;
                }
                break;

            case 'INBOUND_LEG':
                this.proaDestino = hold.inboundHeading;
                this.curvaForcada = false;
                this.direcaoCurva = 0;
                hold.timerLeg += dtSec;
                if (hold.timerLeg >= 60) {
                    hold.fase = 'TURN_OUTBOUND';
                    hold.timerLeg = 0;
                }
                break;
        }
    }

    /**
     * Motor lógico principal (Main Tick). Recebe o delta time e executa
     * sequencialmente algoritmos de navegação preditiva, atrasos, vetores físicos e cinemática de posição.
     * @param {number} dtSec - Delta time em segundos decorrido desde o último frame de cálculo.
     */
    atualizar(dtSec) {
        let navInfo = null;
        let restricaoAlvo = null;

        // =========================================================================
        // SUBSISTEMA ILS (LOC & GS) - EXECUÇÃO DA MÁQUINA DE ESTADOS E RASTREAMENTO
        // =========================================================================
        const runwayILS = getRunwayILS(this);
        update_ils_tracking(this, dtSec, runwayILS);

        const ilsLateralAtivo = this.autopilot && (
            this.autopilot.lateral_mode === ILS_LATERAL_MODES.LOC_CAPTURE ||
            this.autopilot.lateral_mode === ILS_LATERAL_MODES.LOC_TRACK
        );
        if (ilsLateralAtivo) {
            this.modoLNAV = false;
        }

        // =========================================================================
        // ETAPA 1: NAVEGACAO LATERAL AUTOMATICA (LNAV) & TRANSIÇÕES DE WAYPOINT (FLY-BY)
        // =========================================================================
        navInfo = updateLNAV(this, dtSec, state, restricoesFixos);


        // =========================================================================
        // ETAPA 2: PILOT COCKPIT INTERACTION & DYNAMICS ENGINE (DELTA-TIME PURO)
        // -------------------------------------------------------------------------
        // O agente de cabine virtual avança os cronômetros das tarefas ativas
        // nos canais concorrentes (LATERAL, VERTICAL, LONGITUDINAL) proporcionalmente
        // ao dtSec, acoplando os comandos físicos ao atingir o estado EXECUTING.
        // =========================================================================
        if (this.pilot) {
            this.pilot.update(dtSec);
        }

        // =========================================================================
        // ETAPA 3: FISICA DE VOO LATERAL & FLY-BY & ÓRBITA PADRÃO (HLD)
        // =========================================================================
        if (this.modoHolding && this.modoHolding.ativo) {
            this.atualizarHolding(dtSec);
        }
        updateLateralPhysics(this, dtSec);
        updateFlyByProtection(this, state);


        // =========================================================================
        // ETAPA 4: GESTÃO DINÂMICA DE VELOCIDADE (DISTANCE-TO-GO, PERFORMANCE & TRÁFEGO)
        // -------------------------------------------------------------------------
        // Gerenciamento contínuo e realista de velocidade de aproximação (Seções 1 a 23).
        // Baseado em DTG (Distance-to-Go / DME), envelope individual de cada aeronave,
        // tráfego precedente, taxa de aproximação por Ground Speed e prioridade ATC.
        // =========================================================================
        if (this.on_ground || this.pousou || this.flight_phase === "LANDED") {
            this.velDestino = 0;
            this.targetIAS = 0;
            this.currentIAS = this.vel;
            this.velComando = 0;
        } else {
            const velAlvoBase = this.calcularVelocidadeAlvoDinamica(dtSec);
            this.velComando = velAlvoBase;

            // SIMULAÇÃO DE VARIAÇÃO ATMOSFÉRICA REALISTA (DELTA-TIME PURO):
            // Flutuações lentas e sutis (15 a 35 segundos) de ±1 a 2 nós em vez de ruído aleatório em alta frequência (20 Hz),
            // evitando oscilações bruscas e irreais no velocímetro / radar (ex: 250, 251, 250, 251).
            this.timerVariacaoAtmosferica = (this.timerVariacaoAtmosferica || 0) + dtSec;
            if (this.intervaloVariacaoAtmosferica === undefined) {
                this.intervaloVariacaoAtmosferica = 15 + Math.random() * 15;
                this.offsetVentoVel = 0;
            }

            if (this.timerVariacaoAtmosferica >= this.intervaloVariacaoAtmosferica) {
                this.timerVariacaoAtmosferica = 0;
                this.intervaloVariacaoAtmosferica = 18 + Math.random() * 16; // Próximo ciclo em 18 a 34 segundos
                
                const ventoForte = (this.ventoAtual && this.ventoAtual.speedKt > 15);
                const maxDesvio = ventoForte ? 2 : 1;
                
                // 60% de chance de voo calmo cravado (0 kt de desvio), 40% de leve oscilação
                if (Math.random() < 0.40) {
                    this.offsetVentoVel = Math.floor(Math.random() * (maxDesvio * 2 + 1)) - maxDesvio;
                } else {
                    this.offsetVentoVel = 0;
                }
            }

            // Se houver comando explícito de velocidade do ATC (velManual), mantém cravado sem desvio
            if (this.velManual) {
                this.offsetVentoVel = 0;
            }

            this.velDestino = velAlvoBase + (this.offsetVentoVel || 0);
            this.targetIAS = this.velDestino;
            this.currentIAS = this.vel;

            // Aplicação cinemática realista: Linear Assimétrica + Razão Vertical + Ruído Atmosférico (Padrão Ouro)
            atualizarVelocidadeRealista(this, dtSec);
            this.currentIAS = this.vel;
        }

        // =========================================================================
        // ETAPA 5: ATUALIZAÇÃO CINEMÁTICA COM SOMA VETORIAL DE VENTO (FLIGHT DYNAMICS)
        // -------------------------------------------------------------------------
        // Cinemática com vento integrado (Seções 20-26 da Especificação ATC):
        // TAS = IAS * (1 + (alt / 1000) * 0.018)
        // V_ground = V_tas + V_wind
        // A aeronave mantém sua velocidade indicada (IAS) e sua proa (Heading),
        // enquanto o vento atua continuamente no deslocamento sobre o solo (Ground Speed),
        // na trajetória efetiva (Track) e no ângulo de deriva (Drift Angle).
        // =========================================================================
        const windVec = windManager.getWindForAircraft(this);
        this.ventoAtual = windVec;

        // Converte IAS em TAS com altitude real
        this.tas = FlightDynamicsEngine.calcularTAS(this.vel, this.alt || (this.flAtualNum * 100));

        // Vetor resultante com vento (Ground Speed, Track e Ângulo de Deriva)
        const nav = FlightDynamicsEngine.calcularVetorGS(this.tas, this.proa, windVec);
        this.groundSpeed = nav.gs;
        this.track = nav.trackDeg;
        this.driftAngle = nav.driftDeg;

        // Deslocamento cartesiano acumulado em milhas náuticas / deltas:
        const distNMLat = nav.vGroundLat * (dtSec / 3600);
        const distNMLon = nav.vGroundLon * (dtSec / 3600);

        this.deltaLat += distNMLat / 60;
        this.deltaLon += distNMLon / 60 / correcaoLon;

        // =========================================================================
        // ETAPA 6: NAVEGACAO VERTICAL PREDITIVA (VNAV)
        // =========================================================================
        updateVNAV(this, dtSec, state, restricoesFixos);

        // Atualização do Piloto Virtual (VNAV / Modos AUTO, ATC-R, EXPD)
        if (this.virtualPilot) {
            this.virtualPilot.update(dtSec);
        }

        // Atualização do Motor de Dinâmica de Voo e Energia (FlightDynamicsEngine)
        // Aplica suavização de razão (vsAccelRate / jerk control), balanço de energia, spool de empuxo e proteção de stall
        FlightDynamicsEngine.integrarBalancoEnergia(this, this.perf || {}, dtSec);
        FlightDynamicsEngine.atualizarCinematicaVertical(this, this.perf || {}, dtSec);

        // Indicador visual de tendência na etiqueta de dados do radar (↑ subindo, ↓ descendo)
        let sinal = "";
        if (this.currentVS >= 100) sinal = "↑";
        else if (this.currentVS <= -100) sinal = "↓";

        this.nivAtual = Math.round(this.flAtualNum).toString().padStart(3, '0') + sinal;

        // =========================================================================
        // ETAPA 7: GERENCIAMENTO DE POUSO E CICLO DE VIDA (GARBAGE COLLECTION)
        // -------------------------------------------------------------------------
        // Gerenciamento completo e realista de aproximação, toque e solo para
        // aeronaves em aproximação RNAV / VIA e convencionais.
        // As aeronaves sob guiamento ILS têm sua física de solo e toque gerida pelo ILSController.
        // =========================================================================
        const emILS = this.autopilot && (
            (this.autopilot.loc_captured || this.autopilot.gs_captured || 
             this.autopilot.vertical_mode === ILS_VERTICAL_MODES.FLARE || 
             this.autopilot.vertical_mode === ILS_VERTICAL_MODES.TOUCHDOWN) &&
            (this.cleared_level === "ILS" || this.nivAutorizado === "ILS" || this.autopilot.ils_authorized)
        ) && !this.missed_approach;

        if (!emILS) {
            const rwy = getRunwayData(this);
            const rwyElevFt = rwy ? rwy.threshold.elevation_ft : 2631;
            const frontCourse = rwy ? (rwy.front_course_deg || 170) : 170;
            const altFt = (this.alt !== undefined) ? this.alt : (this.flAtualNum * 100);
            const heightAgl = altFt - rwyElevFt;

            let alongTrack = -999;
            let crossTrack = 0;
            let distTh = 999;
            if (rwy) {
                const geom = calculateILSGeometry(this.deltaLat, this.deltaLon, rwy.threshold.deltaLat, rwy.threshold.deltaLon, frontCourse);
                alongTrack = geom.along_track_nm;
                crossTrack = geom.cross_track_nm;
                distTh = geom.distance_nm;
            }

            // Se a aeronave já tocou o solo, gerencia a desaceleração, rolagem e ciclo de vida
            if (this.on_ground) {
                processarRolloutESumico(this, rwy, dtSec, alongTrack);
            } else if (heightAgl <= 500 && !this.missed_approach) {
                const curWp = (this.rota && this.wpIndex < this.rota.length) ? this.rota[this.wpIndex] : null;
                const emAproximacaoFinal = (
                    this.descent_mode === DESCENT_MODES.GLIDEPATH ||
                    this.descent_mode === 'FLARE' ||
                    this.flight_phase === 'APPROACH' ||
                    curWp === this.dest ||
                    (this.rota && this.wpIndex >= this.rota.length - 2) ||
                    distTh <= 2.5
                );

                if (emAproximacaoFinal) {
                    const tocou = verificarTouchdown(this, rwy, dtSec, alongTrack, crossTrack, altFt, heightAgl);
                    if (tocou) {
                        processarRolloutESumico(this, rwy, dtSec, alongTrack);
                    }
                }
            }
        }
    }

    /**
     * Módulo de Parsing do Bloco de Comando ATC via Expressões Regulares (Regex).
     * Interceta manipulações diretas digitadas pelo controlador no Scratchpad:
     * 
     * SINTAXES SUPORTADAS:
     * 1. Proa (Heading):
     *    - "Hxxx": Curva para a proa magnética xxx pelo arco menor (ex: "H090", "H360").
     *    - "Hxxx+": Curva para a proa xxx forçando o arco maior (ex: "H090+").
     * 
     * 2. Velocidade (Speed):
     *    - "xxK": Define a velocidade indicada em dezenas de nós (ex: "21K" = 210 nós, "16K" = 160 nós).
     * 
     * 3. Direto a Fixo (Direct-To / DCT):
     *    - Mnemônicas de 3 letras: "PRU" (PRUMO), "IRP" (IROPU), "LVD" (LUVDI), "GRS" (GERSU),
     *      "URU" (URUTA), "KMG" (KOMGU), "OGT" (OGTAL).
     *    - Nomes completos de fixos: "SP017", "SP099", "SP101", "SP032", "SBSP", etc.
     *    - Se a aeronave estiver vetorada fora de rota e receber um direto para um fixo de STAR,
     *      ela recupera automaticamente a rota completa (ROTA_PRUMO ou ROTA_OGTAL) e reengaja o LNAV.
     */
    analisarComandosTexto() {
        commandParser.parseAndExecuteScratchpad(this, this.textoLivre);
    }
}



