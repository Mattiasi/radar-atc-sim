/**
 * ============================================================================
 * SISTEMA COMPLETO E REALISTA DE APROXIMAÇÃO ILS (ILSController.js)
 * ============================================================================
 * Arquitetura genérica, modular e data-driven para simulação de ILS:
 * - Localizer (LOC): ARM, CAPTURE, TRACK
 * - Glide Slope (GS): ARM, CAPTURE (somente FROM BELOW), TRACK
 * - Cálculo geométrico exato (along-track, cross-track, angular error)
 * - Razão vertical teórica: VS = GS * 101.27 * tan(theta)
 * - Transição suave para FLARE e TOUCHDOWN físico
 * - Transponder 2000 estritamente após o toque
 * - Interoperabilidade total com HDG, NAV, VIA e IAC
 * ============================================================================
 */

import { correcaoLon, geoParaDelta } from '../utils/utils.js';
import { calculateWindCorrectionAngle, normalizeHeading } from '../physics/windMath.js';
import { aerodromos, cartasNavegacao } from '../data/data.js';
import { state } from '../core/state.js';
import { verificarTouchdown, processarRolloutESumico } from './LandingRolloutManager.js';

/**
 * Modos da Máquina de Estados Lateral (Lateral FSM)
 */
export const ILS_LATERAL_MODES = {
    HDG: 'HDG',                 // Voando na proa comandada pelo ATC
    NAV: 'NAV',                 // Navegação lateral existente (LNAV/STAR)
    LOC_ARM: 'LOC_ARM',         // ILS autorizado e em alcance; segue modo anterior até captura
    LOC_CAPTURE: 'LOC_CAPTURE', // Curva progressiva de captura para o eixo da pista
    LOC_TRACK: 'LOC_TRACK'      // Aeronave estabilizada no eixo do Localizer
};

/**
 * Modos da Máquina de Estados Vertical (Vertical FSM)
 */
export const ILS_VERTICAL_MODES = {
    ALT_HOLD: 'ALT_HOLD',       // Mantém altitude autorizada
    DESCENT: 'DESCENT',         // Descida convencional anterior
    GS_ARM: 'GS_ARM',           // GS armado aguardando feixe; mantém altitude autorizada
    GS_CAPTURE: 'GS_CAPTURE',   // Captura progressiva da rampa vindo por baixo
    GS_TRACK: 'GS_TRACK',       // Rastreamento contínuo da rampa de planeio (3.0°)
    FLARE: 'FLARE',             // Arredondamento suave próximo ao toque (<= 50 ft AGL)
    TOUCHDOWN: 'TOUCHDOWN'      // Toque das rodas na pista (on_ground = true, squawk = 2000)
};

/**
 * Parâmetros Operacionais e Geométricos do ILS
 */
export const ILS_CONSTANTS = {
    LOC_CAPTURE_LIMIT_DEG: 2.5,        // Abertura angular máxima do feixe do LOC para captura (graus)
    LOC_NORMAL_INTERCEPT_DEG: 30.0,    // Ângulo de interceptação padrão normal (graus)
    LOC_MAX_INTERCEPT_DEG: 65.0,       // Ângulo de interceptação máximo permitido (graus) ampliado para vetoração ATC realista
    LOC_MAX_DISTANCE_NM: 30.0,         // Alcance do Localizer estendido para 30 NM em cada cabeceira
    GS_ANGLE_DEG: 3.0,                 // Ângulo nominal da rampa de descida (graus)
    GS_MAX_DISTANCE_NM: 30.0,          // Alcance do Glide Slope estendido para 30 NM em cada cabeceira
    GS_CAPTURE_WINDOW_FT: 200.0,       // Janela de captura da rampa FROM BELOW (permite captura robusta sem pular o feixe)
    K_LOC: 25.0,                       // Ganho de correção lateral para o Localizer (graus/NM)
    MAX_INTERCEPT_CORRECTION: 30.0,    // Correção máxima de proa para interceptar o eixo (graus)
    K_GS: 3.2,                         // Ganho proporcional de correção vertical da rampa ((ft/min)/ft)
    FLARE_HEIGHT_AGL_FT: 65.0,         // Altura sobre a cabeceira para início do Flare (pés AGL)
    TOUCHDOWN_TOLERANCE_FT: 8.0        // Tolerância de proximidade vertical com a pista para o toque (pés)
};

/**
 * Normaliza um ângulo para o intervalo [-180, 180] graus.
 * @param {number} angleDeg 
 * @returns {number}
 */
export function normalize_angle(angleDeg) {
    let a = angleDeg % 360;
    while (a > 180) a -= 360;
    while (a <= -180) a += 360;
    return a;
}

/**
 * Calcula a razão vertical exata necessária para voar a rampa do Glide Slope.
 * Fórmula teórica: VS_fpm = GS_kt * 101.27 * tan(theta)
 * @param {number} ground_speed_kt - Velocidade sobre o solo em nós
 * @param {number} [glide_angle_deg=3.0] - Ângulo da rampa em graus
 * @returns {number} Razão vertical teórica em ft/min (valor positivo)
 */
export function calculate_gs_vs(ground_speed_kt, glide_angle_deg = 3.0) {
    const gs_fpm = (ground_speed_kt || 140) * 101.27;
    return gs_fpm * Math.tan(glide_angle_deg * (Math.PI / 180));
}

/**
 * Calcula a geometria precisa da aeronave em relação à cabeceira e ao eixo da pista.
 * 
 * @param {number} acDeltaLat - Coordenada deltaLat da aeronave
 * @param {number} acDeltaLon - Coordenada deltaLon da aeronave
 * @param {number} thDeltaLat - Coordenada deltaLat da cabeceira
 * @param {number} thDeltaLon - Coordenada deltaLon da cabeceira
 * @param {number} frontCourseDeg - Proa magnética de aproximação (QFU / front course)
 * @returns {Object} { along_track_nm, cross_track_nm, distance_nm, angular_error_deg }
 */
export function calculateILSGeometry(acDeltaLat, acDeltaLon, thDeltaLat, thDeltaLon, frontCourseDeg) {
    // Vetor cartesiano da cabeceira até a aeronave em Milhas Náuticas:
    // deltaLat * 60 = NM ao Norte; deltaLon * 60 * correcaoLon = NM a Leste.
    const dLatNM = (acDeltaLat - thDeltaLat) * 60;
    const dLonNM = (acDeltaLon - thDeltaLon) * 60 * correcaoLon;

    const radFC = frontCourseDeg * (Math.PI / 180);
    const sinFC = Math.sin(radFC);
    const cosFC = Math.cos(radFC);

    // along_track_nm:
    // A aproximação ocorre no sentido de frontCourseDeg.
    // Aeronave antes da cabeceira no corredor de aproximação tem along_track_nm > 0.
    // Na vertical da cabeceira, along_track_nm = 0.
    // Após cruzar a cabeceira sobre a pista, along_track_nm < 0.
    const along_track_nm = -(dLonNM * sinFC + dLatNM * cosFC);

    // cross_track_nm:
    // Desvio lateral em relação ao prolongamento do eixo da pista em NM.
    // Positivo = aeronave à direita do eixo (visto de quem voa para a pista).
    // Negativo = aeronave à esquerda do eixo.
    const cross_track_nm = dLonNM * cosFC - dLatNM * sinFC;

    // Distância direta euclidiana em NM até a cabeceira
    const distance_nm = Math.hypot(dLatNM, dLonNM);

    // Erro angular em graus em relação ao feixe do Localizer
    const angular_error_deg = Math.atan2(Math.abs(cross_track_nm), Math.max(along_track_nm, 0.001)) * (180 / Math.PI);

    return {
        along_track_nm,
        cross_track_nm,
        distance_nm,
        angular_error_deg
    };
}

/**
 * Obtém a configuração ILS da cabeceira ativa de forma 100% data-driven.
 * Não utiliza verificações hardcoded por aeroporto ou pista.
 * Suporta qualquer aeródromo configurado em aerodromos.js com cabeceira.ils.enabled = true.
 * 
 * @param {Object} aircraft - Instância da aeronave
 * @returns {Object|null} Configuração ILS da cabeceira ou null se inválida/desabilitada
 */
export function getRunwayILS(aircraft) {
    if (!aircraft || !aircraft.dest) return null;

    const destName = aircraft.dest;
    const aerodromo = aerodromos.find(a => a.nome === destName);
    if (!aerodromo || !aerodromo.pistas) return null;

    // 1. Se atribuído explicitamente via ATC (ex: comando RWY 28L ou ILS 28L)
    let runwayId = aircraft.assigned_runway;

    // 2. Se não foi atribuído explicitamente, descobre a cabeceira a partir da carta STAR/IAC ativa
    if (!runwayId && aircraft.cartaNome && typeof cartasNavegacao === 'object' && cartasNavegacao && cartasNavegacao[destName]) {
        for (const [cabKey, cabObj] of Object.entries(cartasNavegacao[destName])) {
            for (const catObj of Object.values(cabObj)) {
                if (catObj && typeof catObj === 'object' && Object.values(catObj).some(c => c.nome === aircraft.cartaNome)) {
                    runwayId = cabKey;
                    break;
                }
            }
            if (runwayId) break;
        }
    }

    // 3. Se não foi descoberto, descobre a partir dos fixos da rota da aeronave
    if (!runwayId && aircraft.rota && Array.isArray(aircraft.rota) && typeof cartasNavegacao === 'object' && cartasNavegacao && cartasNavegacao[destName]) {
        for (const [cabKey, cabObj] of Object.entries(cartasNavegacao[destName])) {
            const iacGrp = cabObj.IAC || cabObj.AIC;
            if (iacGrp) {
                for (const c of Object.values(iacGrp)) {
                    if (c.fixos && c.fixos.some(f => aircraft.rota.includes(f.nome))) {
                        runwayId = cabKey;
                        break;
                    }
                }
            }
            if (runwayId) break;
        }
    }

    // 4. Se não foi descoberto, verifica as cabeceiras ativas no Vídeo Mapa para este destino
    if (!runwayId && state.radarLayers && state.radarLayers.activeRunways) {
        const prefix = `${destName}-`;
        for (const rwyKey of state.radarLayers.activeRunways) {
            if (rwyKey.startsWith(prefix)) {
                const candidate = rwyKey.split("-")[1];
                for (const pista of aerodromo.pistas) {
                    if (pista.cabeceiras && pista.cabeceiras[candidate] && pista.cabeceiras[candidate].ils && pista.cabeceiras[candidate].ils.enabled) {
                        runwayId = candidate;
                        break;
                    }
                }
                if (runwayId) break;
            }
        }
    }

    // 5. Fallback para pistaAtribuida da aeronave (se tiver ILS habilitado)
    if (!runwayId && aircraft.pistaAtribuida) {
        for (const pista of aerodromo.pistas) {
            if (pista.cabeceiras && pista.cabeceiras[aircraft.pistaAtribuida]) {
                const cab = pista.cabeceiras[aircraft.pistaAtribuida];
                if (cab.ils && cab.ils.enabled) {
                    runwayId = aircraft.pistaAtribuida;
                    break;
                }
            }
        }
    }

    // 6. Se ainda não resolveu, avalia qual cabeceira com ILS a aeronave está convergindo geometricamente
    if (!runwayId) {
        const candidatos = [];
        for (const pista of aerodromo.pistas) {
            if (!pista.cabeceiras) continue;
            for (const [rId, cab] of Object.entries(pista.cabeceiras)) {
                if (cab && cab.ils && cab.ils.enabled) {
                    candidatos.push({ rId, pista, cab });
                }
            }
        }

        if (candidatos.length === 1) {
            runwayId = candidatos[0].rId;
        } else if (candidatos.length > 1) {
            let melhorCand = null;
            let menorErro = Infinity;

            for (const cand of candidatos) {
                const dados = montarDadosILS(aerodromo, cand.pista, cand.cab, cand.rId);
                const geom = calculateILSGeometry(aircraft.deltaLat, aircraft.deltaLon, dados.threshold.deltaLat, dados.threshold.deltaLon, dados.front_course_deg);
                const hdgErr = Math.abs(normalize_angle(dados.front_course_deg - aircraft.proa));
                if (geom.along_track_nm > 0 && hdgErr < 90 && hdgErr < menorErro) {
                    menorErro = hdgErr;
                    melhorCand = cand.rId;
                }
            }

            runwayId = melhorCand || candidatos[0].rId;
        }
    }

    // Valida a cabeceira selecionada e monta os dados ILS
    if (runwayId) {
        for (const pista of aerodromo.pistas) {
            if (!pista.cabeceiras) continue;
            const cabeceira = pista.cabeceiras[runwayId];
            if (cabeceira && cabeceira.ils && cabeceira.ils.enabled) {
                return montarDadosILS(aerodromo, pista, cabeceira, runwayId);
            }
        }
    }

    return null;
}

/**
 * Constrói o objeto de parâmetros ILS geométricos e de solo data-driven.
 */
function montarDadosILS(aerodromo, pista, cabeceira, runwayId) {
    const destName = aerodromo.nome;
    const frontCourse = cabeceira.frontCourseDeg !== undefined ? cabeceira.frontCourseDeg : pista.rumo;
    const compNM = pista.comprimentoM ? (pista.comprimentoM / 1852) : (pista.compNM || 1.0);
    const sepYNM = (pista.sepYNM !== undefined) ? pista.sepYNM : ((pista.sepY || 0) / 60);
    const sepXNM = (pista.sepXNM !== undefined) ? pista.sepXNM : ((pista.sepX || 0) / 60);

    // Centro do aeródromo em deltaLat/deltaLon relativo a SBSP (0,0)
    const aeroDelta = (aerodromo.lat !== undefined && aerodromo.lon !== undefined)
        ? geoParaDelta(aerodromo.lat, aerodromo.lon)
        : { deltaLat: 0, deltaLon: 0 };

    // Centro da pista: deslocamento em NM a partir do centro do aeródromo
    const radRumoPista = (pista.rumo || frontCourse) * (Math.PI / 180);
    const dxCenterNM = sepXNM * Math.sin(radRumoPista) + sepYNM * Math.cos(radRumoPista);
    const dyCenterNM = sepXNM * Math.cos(radRumoPista) - sepYNM * Math.sin(radRumoPista);

    // A cabeceira de pouso (threshold) para o rumo frontCourse
    const radFC = frontCourse * (Math.PI / 180);
    const dxThNM = dxCenterNM - 0.5 * compNM * Math.sin(radFC);
    const dyThNM = dyCenterNM - 0.5 * compNM * Math.cos(radFC);

    // Verifica se há coordenadas geodésicas na cabeceira ou em state.fixos
    const suf = destName ? destName.slice(2) : "";
    const thKey = `R${runwayId.replace("/", "")}${suf}`;
    const rwKey = `RW${runwayId.replace("/", "")}`;
    
    let thDeltaLat, thDeltaLon;
    if (cabeceira && cabeceira.lat !== undefined && cabeceira.lon !== undefined) {
        const cabDelta = geoParaDelta(cabeceira.lat, cabeceira.lon);
        thDeltaLat = cabDelta.deltaLat;
        thDeltaLon = cabDelta.deltaLon;
    } else {
        const targetThFix = (state && state.fixos) ? (state.fixos[thKey] || state.fixos[rwKey]) : null;
        if (targetThFix) {
            thDeltaLat = targetThFix.deltaLat;
            thDeltaLon = targetThFix.deltaLon;
        } else {
            thDeltaLat = aeroDelta.deltaLat + (dyThNM / 60);
            thDeltaLon = aeroDelta.deltaLon + (dxThNM / (60 * correcaoLon));
        }
    }

    return {
        airport: aerodromo.nome,
        runway: runwayId,
        name: `ILS RWY ${runwayId}`,
        threshold: {
            deltaLat: thDeltaLat,
            deltaLon: thDeltaLon,
            elevation_ft: cabeceira.elevacaoFt || aerodromo.elevacaoFt || 2631
        },
        front_course_deg: frontCourse,
        comp_nm: compNM,
        loc_frequency: cabeceira.ils.freq || "109.5",
        gs_angle_deg: cabeceira.ils.gs_angle_deg || ILS_CONSTANTS.GS_ANGLE_DEG,
        loc_max_distance_nm: cabeceira.ils.loc_max_distance_nm || ILS_CONSTANTS.LOC_MAX_DISTANCE_NM || 30.0,
        gs_max_distance_nm: cabeceira.ils.gs_max_distance_nm || ILS_CONSTANTS.GS_MAX_DISTANCE_NM || 30.0,
        loc_capture_angle_deg: cabeceira.ils.loc_capture_angle_deg || ILS_CONSTANTS.LOC_CAPTURE_LIMIT_DEG,
        loc_valid: cabeceira.ils.loc_valid !== false,
        gs_valid: cabeceira.ils.gs_valid !== false,
        ils_enabled: true,
        squawkToque: cabeceira.squawkToque || aerodromo.squawkToque || "2000",
        tempoRolagemAteSquawkSec: cabeceira.tempoRolagemAteSquawkSec || aerodromo.tempoRolagemAteSquawkSec || 4.0,
        distanciaRolagemAteSquawkNM: cabeceira.distanciaRolagemAteSquawkNM || aerodromo.distanciaRolagemAteSquawkNM || 0.20,
        velAtivacaoSquawkKt: cabeceira.velAtivacaoSquawkKt || aerodromo.velAtivacaoSquawkKt || 80,
        velTaxiKt: cabeceira.velTaxiKt || aerodromo.velTaxiKt || 20,
        desaceleracaoSoloKtPorSec: cabeceira.desaceleracaoSoloKtPorSec || aerodromo.desaceleracaoSoloKtPorSec || 5.0,
        tempoEsperaDesaparecerSec: cabeceira.tempoEsperaDesaparecerSec || aerodromo.tempoEsperaDesaparecerSec || 1.5,
        toleranciaVerticalFt: cabeceira.toleranciaVerticalFt || aerodromo.toleranciaVerticalFt || 15.0,
        toleranciaAlinhamentoNM: cabeceira.toleranciaAlinhamentoNM || aerodromo.toleranciaAlinhamentoNM || 0.35
    };
}

/**
 * Função Principal de Rastreamento e Guiamento ILS (update_ils_tracking).
 * Executa passo a passo as 21 etapas da especificação funcional com delta-time rigoroso.
 * 
 * @param {Object} aircraft - Instância da aeronave
 * @param {number} dt - Passo de tempo em segundos
 * @param {Object|null} runway_ils_data - Dados da cabeceira ILS ativa
 */
export function update_ils_tracking(aircraft, dt, runway_ils_data) {
    if (!aircraft || dt <= 0 || aircraft.missed_approach) return;

    // Inicializa a estrutura de autopilot se ainda não existir
    if (!aircraft.autopilot) {
        aircraft.autopilot = {
            lateral_mode: ILS_LATERAL_MODES.HDG,
            vertical_mode: ILS_VERTICAL_MODES.ALT_HOLD,
            ils_authorized: false,
            loc_armed: false,
            loc_captured: false,
            loc_tracked: false,
            gs_armed: false,
            gs_captured: false,
            gs_tracked: false
        };
    }

    // 1. Validar a configuração do ILS
    if (!runway_ils_data || !runway_ils_data.ils_enabled || !runway_ils_data.loc_valid) {
        // Se a aeronave estava em modo ILS e a configuração é inválida, desengaja
        if (aircraft.autopilot.loc_armed || aircraft.autopilot.loc_captured || aircraft.autopilot.loc_tracked) {
            aircraft.autopilot.lateral_mode = ILS_LATERAL_MODES.HDG;
            aircraft.autopilot.loc_armed = false;
            aircraft.autopilot.loc_captured = false;
            aircraft.autopilot.loc_tracked = false;
        }
        if (aircraft.autopilot.gs_armed || aircraft.autopilot.gs_captured || aircraft.autopilot.gs_tracked) {
            aircraft.autopilot.vertical_mode = ILS_VERTICAL_MODES.ALT_HOLD;
            aircraft.autopilot.gs_armed = false;
            aircraft.autopilot.gs_captured = false;
            aircraft.autopilot.gs_tracked = false;
        }
        return;
    }

    // 2. Identificar a cabeceira e parâmetros do feixe
    const th = runway_ils_data.threshold;
    const frontCourse = runway_ils_data.front_course_deg;
    const gsAngle = runway_ils_data.gs_angle_deg || ILS_CONSTANTS.GS_ANGLE_DEG;
    const locMaxDist = Math.max(30.0, runway_ils_data.loc_max_distance_nm || ILS_CONSTANTS.LOC_MAX_DISTANCE_NM || 30.0);
    const gsMaxDist = Math.max(30.0, runway_ils_data.gs_max_distance_nm || ILS_CONSTANTS.GS_MAX_DISTANCE_NM || 30.0);

    // 3. Verificar autorização ATC (cleared_level / nivAutorizado / ils_authorized)
    // Regra Fundamental (Seções 6 e 7): Autorização ILS ocorre estritamente quando cleared_level == "ILS"
    const ils_authorized = Boolean(
        aircraft.cleared_level === "ILS" ||
        aircraft.nivAutorizado === "ILS" ||
        aircraft.ils_authorized ||
        (aircraft.autopilot && aircraft.autopilot.ils_authorized)
    );
    aircraft.autopilot.ils_authorized = ils_authorized;
    aircraft.ils_authorized = ils_authorized;

    // Regra Fundamental (Seção 12): Sem autorização ILS, cruza o feixe mantendo a proa atribuída
    if (!ils_authorized) {
        // Se desautorizado durante aproximação, desengaja o modo ILS
        if (aircraft.autopilot.loc_armed || aircraft.autopilot.loc_captured || aircraft.autopilot.loc_tracked) {
            aircraft.autopilot.lateral_mode = ILS_LATERAL_MODES.HDG;
            aircraft.autopilot.loc_armed = false;
            aircraft.autopilot.loc_captured = false;
            aircraft.autopilot.loc_tracked = false;
        }
        if (aircraft.autopilot.gs_armed || aircraft.autopilot.gs_captured || aircraft.autopilot.gs_tracked) {
            aircraft.autopilot.vertical_mode = ILS_VERTICAL_MODES.ALT_HOLD;
            aircraft.autopilot.gs_armed = false;
            aircraft.autopilot.gs_captured = false;
            aircraft.autopilot.gs_tracked = false;
        }
        return;
    }

    // 4. Calcular distância
    // 5. Calcular along-track
    // 6. Calcular cross-track
    const geom = calculateILSGeometry(aircraft.deltaLat, aircraft.deltaLon, th.deltaLat, th.deltaLon, frontCourse);
    const { along_track_nm, cross_track_nm, distance_nm, angular_error_deg } = geom;

    // 7. Calcular heading error
    const heading_error = normalize_angle(frontCourse - aircraft.proa);
    const track_error = normalize_angle(frontCourse - (aircraft.track !== undefined ? aircraft.track : aircraft.proa));

    // Determina a altitude física da aeronave
    const altFt = (aircraft.alt !== undefined) ? aircraft.alt : (aircraft.flAtualNum * 100);

    // =========================================================================
    // 8. AVALIAR ARMAMENTO DO LOCALIZER (LOC_ARM)
    // =========================================================================
    if (aircraft.autopilot.lateral_mode === ILS_LATERAL_MODES.HDG ||
        aircraft.autopilot.lateral_mode === ILS_LATERAL_MODES.NAV) {
        
        // Condições para armar o LOC:
        // - ILS/APP autorizado
        // - Distância <= loc_max_distance_nm
        // - À frente da cabeceira (along_track_nm > 0.2)
        // - Setor de cobertura do Localizer (~60° angulares OU a menos de 4 NM do prolongamento do eixo)
        if (distance_nm <= locMaxDist && along_track_nm > 0.2 && (angular_error_deg <= 60.0 || Math.abs(cross_track_nm) <= 4.0)) {
            aircraft.autopilot.lateral_mode = ILS_LATERAL_MODES.LOC_ARM;
            aircraft.autopilot.loc_armed = true;
            // O armamento NÃO altera a trajetória nem a proa atual (Seção 8)
        }
    }

    // =========================================================================
    // 9. AVALIAR CAPTURA DO LOCALIZER (LOC_CAPTURE)
    // =========================================================================
    if (aircraft.autopilot.lateral_mode === ILS_LATERAL_MODES.LOC_ARM) {
        // Critérios de captura:
        // - Ângulo de interceptação <= 65° (Seção 16 ampliada para vetoração ATC realista)
        // - Erro angular dentro da largura de captura (<= 2.5°) OU proximidade lateral do eixo (<= 0.8 NM)
        //   OU cruzamento do eixo central (<= 0.35 NM)
        // - Aeronave voando em direção ao eixo (convergindo)
        const intercept_angle = Math.abs(heading_error);
        const anguloValido = (intercept_angle <= (runway_ils_data.loc_max_intercept_deg || ILS_CONSTANTS.LOC_MAX_INTERCEPT_DEG || 65.0));
        const feixeCapturado = (angular_error_deg <= (runway_ils_data.loc_capture_angle_deg || ILS_CONSTANTS.LOC_CAPTURE_LIMIT_DEG))
            || (Math.abs(cross_track_nm) <= 0.8 && along_track_nm > 0.5)
            || (Math.abs(cross_track_nm) <= 0.35 && along_track_nm > 0.2);

        // Verifica se a proa aponta para o eixo (convergência)
        const convergindo = (cross_track_nm > 0.05 && heading_error > -10)
            || (cross_track_nm < -0.05 && heading_error < 10)
            || (Math.abs(cross_track_nm) <= 0.35);

        // Se estiver cruzando diretamente o eixo central (cross_track_nm <= 0.35 NM) com ângulo <= 75°,
        // captura para assegurar que a aeronave NUNCA passe direto pelo curso do localizador
        const cruzandoCentro = (Math.abs(cross_track_nm) <= 0.35 && intercept_angle <= 75.0 && along_track_nm > 0.2);

        if (((anguloValido && feixeCapturado && convergindo) || cruzandoCentro) && distance_nm <= locMaxDist && along_track_nm > 0.2) {
            aircraft.autopilot.lateral_mode = ILS_LATERAL_MODES.LOC_CAPTURE;
            aircraft.autopilot.loc_captured = true;
            aircraft.modoLNAV = false; // Desengaja LNAV; o ILS assume o comando lateral
            aircraft.direcaoCurva = 0; // Reseta trava de curva de vetoração manual (evita giros em 360°)
            if (aircraft.pilot && aircraft.pilot.activeTasks && aircraft.pilot.activeTasks['LATERAL']) {
                aircraft.pilot.activeTasks['LATERAL'].status = 'SUPERSEDED';
            }
        }
    }

    // =========================================================================
    // 10. CONTROLAR LOC_CAPTURE E LOC_TRACK
    // =========================================================================
    if (aircraft.autopilot.lateral_mode === ILS_LATERAL_MODES.LOC_CAPTURE ||
        aircraft.autopilot.lateral_mode === ILS_LATERAL_MODES.LOC_TRACK) {
        
        if (along_track_nm <= 0.1) {
            // Sobre a pista / flare: alinha direto no rumo da pista mantendo correção de vento
            const wind = aircraft.ventoAtual || { fromDeg: 0, speedKt: 0 };
            const wca = calculateWindCorrectionAngle(frontCourse, aircraft.vel || 135, wind.fromDeg, wind.speedKt);
            aircraft.proaDestino = Math.round(normalizeHeading(frontCourse + wca));
        } else {
            // Correção lateral proporcional ao desvio (Seção 18)
            const kLoc = (aircraft.autopilot.lateral_mode === ILS_LATERAL_MODES.LOC_TRACK) ? 30.0 : ILS_CONSTANTS.K_LOC;
            const maxCorr = (aircraft.autopilot.lateral_mode === ILS_LATERAL_MODES.LOC_TRACK) ? 15.0 : ILS_CONSTANTS.MAX_INTERCEPT_CORRECTION;
            const intercept_correction = Math.max(-maxCorr, Math.min(maxCorr, kLoc * cross_track_nm));
            const desired_heading = normalizeHeading(frontCourse - intercept_correction);

            // Adiciona o Ângulo de Correção de Vento (WCA) para manter o Track cravado no eixo
            const wind = aircraft.ventoAtual || { fromDeg: 0, speedKt: 0 };
            const wca = calculateWindCorrectionAngle(desired_heading, aircraft.vel || 150, wind.fromDeg, wind.speedKt);
            aircraft.proaDestino = Math.round(normalizeHeading(desired_heading + wca));
        }

        // Transição LOC_CAPTURE -> LOC_TRACK quando estabilizado no eixo (Seção 19)
        // Usa track_error para compensar o ângulo de correção de vento
        if (aircraft.autopilot.lateral_mode === ILS_LATERAL_MODES.LOC_CAPTURE) {
            if (Math.abs(cross_track_nm) <= 0.20 && Math.abs(track_error) <= 8.0) {
                aircraft.autopilot.lateral_mode = ILS_LATERAL_MODES.LOC_TRACK;
                aircraft.autopilot.loc_tracked = true;
            }
        }
    }

    // =========================================================================
    // 11. AVALIAR ARMAMENTO DO GLIDE SLOPE (GS_ARM)
    // =========================================================================
    // Regra Obrigatória (Seção 24): O GS só pode ser armado após LOC_TRACK!
    if (aircraft.autopilot.lateral_mode === ILS_LATERAL_MODES.LOC_TRACK) {
        if (aircraft.autopilot.vertical_mode === ILS_VERTICAL_MODES.ALT_HOLD ||
            aircraft.autopilot.vertical_mode === ILS_VERTICAL_MODES.DESCENT ||
            aircraft.autopilot.vertical_mode === 'APP' ||
            !aircraft.autopilot.vertical_mode) {
            aircraft.autopilot.vertical_mode = ILS_VERTICAL_MODES.GS_ARM;
            aircraft.autopilot.gs_armed = true;
        }
    }

    // =========================================================================
    // 12. CALCULAR ALTITUDE DA RAMPA DO GLIDE SLOPE
    // =========================================================================
    // Seção 25: distance_ft = distance_nm * 6076.12; glide_height_ft = distance_ft * tan(gs_angle_deg)
    const distance_ft = Math.max(0, along_track_nm) * 6076.12;
    const glide_height_ft = distance_ft * Math.tan(gsAngle * (Math.PI / 180));
    const glide_altitude = th.elevation_ft + glide_height_ft;

    // Erro vertical: positivo = aeronave abaixo da rampa, negativo = aeronave acima da rampa (Seção 26)
    const gs_error_ft = glide_altitude - altFt;

    // =========================================================================
    // 13. VERIFICAR CONDIÇÃO FROM BELOW (SEÇÃO 27)
    // =========================================================================
    // A captura ocorre quando o feixe aproxima (aeronave abaixo da rampa ou na rampa)
    // Permite captura de -50 ft a +200 ft (ou desvio angular <= 0.25° com erro vertical <= 250 ft)
    const angular_gs_error = Math.atan2(Math.abs(gs_error_ft), Math.max(distance_ft, 100)) * (180 / Math.PI);
    const allow_gs_capture = (gs_error_ft >= -50.0 && gs_error_ft <= (ILS_CONSTANTS.GS_CAPTURE_WINDOW_FT || 200.0))
        || (angular_gs_error <= 0.25 && gs_error_ft >= -80.0 && Math.abs(gs_error_ft) <= 250.0);

    // =========================================================================
    // 14. AVALIAR CAPTURA DO GLIDE SLOPE (GS_CAPTURE)
    // =========================================================================
    if (aircraft.autopilot.vertical_mode === ILS_VERTICAL_MODES.GS_ARM) {
        if (allow_gs_capture && along_track_nm > 0.5 && along_track_nm <= gsMaxDist) {
            aircraft.autopilot.vertical_mode = ILS_VERTICAL_MODES.GS_CAPTURE;
            aircraft.autopilot.gs_captured = true;
            aircraft.descent_mode = 'GLIDEPATH';
            aircraft.verticalMode = 'G/S';
            aircraft.hold_altitude_until_waypoint = null;
            aircraft.vertical_floor_altitude = null;
            aircraft.vertical_floor_fl = null;
        }
    }

    // =========================================================================
    // 15. TRANSIÇÃO GS_CAPTURE -> GS_TRACK
    // =========================================================================
    if (aircraft.autopilot.vertical_mode === ILS_VERTICAL_MODES.GS_CAPTURE) {
        if (Math.abs(gs_error_ft) <= 50.0) {
            aircraft.autopilot.vertical_mode = ILS_VERTICAL_MODES.GS_TRACK;
            aircraft.autopilot.gs_tracked = true;
        }
    }

    // =========================================================================
    // 16. CALCULAR VERTICAL SPEED E GUIAR DESCIDA (GS_TRACK)
    // =========================================================================
    if (aircraft.autopilot.vertical_mode === ILS_VERTICAL_MODES.GS_CAPTURE ||
        aircraft.autopilot.vertical_mode === ILS_VERTICAL_MODES.GS_TRACK) {
        
        const gsKt = (aircraft.groundSpeed !== undefined && aircraft.groundSpeed > 50) 
            ? aircraft.groundSpeed 
            : (aircraft.vel || 140);
        // Razão nominal teórica da rampa de 3° baseada na Ground Speed atual (Seção 32)
        const vsNominal = -calculate_gs_vs(gsKt, gsAngle);

        // Correção proporcional ao erro vertical da rampa (Seção 31)
        const vsCorr = Math.max(-400, Math.min(400, ILS_CONSTANTS.K_GS * gs_error_ft));
        const targetVS = vsNominal + vsCorr;

        // Comanda a razão vertical alvo para o motor cinemático
        aircraft.targetVS = Math.max(-2500, Math.min(-200, targetVS));
        aircraft.verticalMode = 'G/S';
        aircraft.descent_mode = 'GLIDEPATH';
        aircraft.hold_altitude_until_waypoint = null;
        aircraft.vertical_floor_altitude = null;
        aircraft.vertical_floor_fl = null;

        // 17. Integração de energia e gestão progressiva de velocidade de aproximação (Seção 33)
        // Reduz gradualmente para a velocidade de aproximação final (Vapp / approachSpeed)
        if (distance_nm <= 10.0 && distance_nm > 4.0) {
            const vFinal = aircraft.finalAppSpeed || 160;
            aircraft.targetIAS = vFinal;
        } else if (distance_nm <= 4.0) {
            const vApp = aircraft.approachSpeed || 135;
            aircraft.targetIAS = vApp;
        }
    }

    // =========================================================================
    // 18. EXECUTAR FLARE (SEÇÃO 45)
    // =========================================================================
    const height_agl = altFt - th.elevation_ft;
    if ((aircraft.autopilot.vertical_mode === ILS_VERTICAL_MODES.GS_TRACK ||
         aircraft.autopilot.vertical_mode === ILS_VERTICAL_MODES.GS_CAPTURE) &&
        height_agl <= ILS_CONSTANTS.FLARE_HEIGHT_AGL_FT &&
        along_track_nm <= 0.5 && along_track_nm >= -1.0) {
        
        aircraft.autopilot.vertical_mode = ILS_VERTICAL_MODES.FLARE;
    }

    if (aircraft.autopilot.vertical_mode === ILS_VERTICAL_MODES.FLARE) {
        // Redução progressiva da razão de descida para toque suave (-120 ft/min)
        const tFlare = Math.max(0, Math.min(1, height_agl / ILS_CONSTANTS.FLARE_HEIGHT_AGL_FT));
        const gsKt = (aircraft.groundSpeed !== undefined && aircraft.groundSpeed > 50) 
            ? aircraft.groundSpeed 
            : (aircraft.vel || 135);
        const vsNominal = -calculate_gs_vs(gsKt, gsAngle);
        aircraft.targetVS = -120 + tFlare * (vsNominal - (-120));
        aircraft.verticalMode = 'G/S';
    }

    // =========================================================================
    // 19. DETECTAR TOUCHDOWN E 20. TRANSPONDER 2000 (SEÇÕES 46 E 47)
    // =========================================================================
    const rwy = runway_ils_data;
    if (aircraft.autopilot.vertical_mode === ILS_VERTICAL_MODES.FLARE ||
        aircraft.autopilot.vertical_mode === ILS_VERTICAL_MODES.GS_TRACK ||
        aircraft.autopilot.vertical_mode === ILS_VERTICAL_MODES.TOUCHDOWN ||
        (along_track_nm <= 0.2 && height_agl <= 65.0)) {
        
        verificarTouchdown(aircraft, rwy, dt, along_track_nm, cross_track_nm, altFt, height_agl);
    }

    // =========================================================================
    // 21. CONCLUIR O POUSO E FÍSICA DE SOLO (SEÇÃO 48)
    // =========================================================================
    if (aircraft.autopilot.vertical_mode === ILS_VERTICAL_MODES.TOUCHDOWN || aircraft.on_ground) {
        processarRolloutESumico(aircraft, rwy, dt, along_track_nm);
    }
}
