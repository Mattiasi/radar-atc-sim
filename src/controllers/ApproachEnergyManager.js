/**
 * ============================================================================
 * GERENCIADOR DE VELOCIDADE, ENERGIA E APROXIMAÇÃO BASEADO EM FAF
 * (ApproachEnergyManager.js)
 * ============================================================================
 * Substitui o modelo legado de raio circular euclidiano em torno da pista por:
 * 1. Referência geométrica centrada no FAF (Final Approach Fix) e trajetória.
 * 2. Distância Along-Track até o FAF ao longo da rota / vetor de aproximação.
 * 3. Máquina de estados de voo:
 *    - CRUISE, DESCENT, ARRIVAL, VECTOR_TO_APPROACH, APPROACH, FINAL, MISSED_APPROACH.
 * 4. Detecção de trajetória convergente vs. paralela/cruzamento (sem reduções falsas a 7 NM).
 * 5. Suspensão de cálculo do FAF durante vetoração de afastamento (downwind > 90°).
 * 6. Proteção contra overshoot de curva no eixo final (limite de 180-200 kt).
 * 7. Restrição global regulatória abaixo do FL100 (máximo 250 kt com antecipação).
 * 8. Cinemática contínua sem teleportação:
 *    d = (V_current² - V_target²) / (2 * a_eff) * (GS / IAS)
 *    com a_eff penalizada pela Razão de Descida (Vertical Speed / gravidade).
 * 9. Gestão de energia virtual (LOW, NORMAL, HIGH, CRITICAL):
 *    - Speedbrakes automáticos em HIGH ENERGY.
 *    - Trem de pouso e flaps antecipados em CRITICAL ENERGY.
 *    - Arremetida autônoma (MISSED APPROACH) se desestabilizado a menos de 2 NM da pista.
 * 10. Prioridade absoluta aos comandos manuais do ATCO ("210 kt").
 * 11. Integração com vento e velocidade de solo (Ground Speed).
 * 12. Arquitetura 100% agnóstica a aeródromos (SBSP, SBGR, SBKP, etc.).
 * 13. Telemetria e HUD de debug estruturado.
 * ============================================================================
 */

import { state } from '../core/state.js';
import { cartasNavegacao, aerodromos, getRunwayData, isFixoIAC } from '../data/data.js';
import { correcaoLon, calcularRumoDistancia, geoParaDelta } from '../utils/utils.js';
import { normalize_angle, calculateILSGeometry, ILS_LATERAL_MODES, ILS_VERTICAL_MODES } from './ILSController.js';
import { getActiveIAC, getFixAltitudeFt, DESCENT_MODES } from './ApproachProfileManager.js';
import { getAircraftPerformance, AIRCRAFT_PERFORMANCE } from '../data/PerformanceDB.js';

/**
 * Estados Lógicos de Voo e Energia (FSM Longitudinal e Operacional)
 */
export const FLIGHT_ENERGY_STATES = {
    CRUISE: 'CRUISE',                         // Em rota / cruzeiro, sem compromisso com aproximação
    DESCENT: 'DESCENT',                       // Em descida, antes da transição da chegada (FL100 max 250 kt)
    ARRIVAL: 'ARRIVAL',                       // Em STAR / rota publicada em direção ao IAF
    VECTOR_TO_APPROACH: 'VECTOR_TO_APPROACH', // Sob vetoração radar em direção ao eixo ou IAF
    APPROACH: 'APPROACH',                     // Convergindo e ingressando na aproximação com foco no FAF
    FINAL: 'FINAL',                           // No segmento final (após FAF ou LOC rastreado)
    MISSED_APPROACH: 'MISSED_APPROACH'        // Arremetida autônoma por desestabilização / excesso de energia
};

/**
 * Níveis de Energia da Aeronave
 */
export const ENERGY_LEVELS = {
    LOW_ENERGY: 'LOW_ENERGY',           // Abaixo do perfil (potência reduzida ou necessidade de empuxo)
    NORMAL: 'NORMAL',                   // No perfil nominal
    HIGH_ENERGY: 'HIGH_ENERGY',         // Acima do perfil -> exige speedbrakes automáticos
    CRITICAL_ENERGY: 'CRITICAL_ENERGY'  // Muito rápida/alta -> arrasto máximo; arremete se < 2 NM da pista
};

/**
 * Localiza de maneira robusta e data-driven o FAF (Final Approach Fix) da aproximação ativa.
 * Suporta metadados da carta (papel: "FAF", isFAF: true), sequenciamento de linhas e fallbacks.
 * 
 * @param {Object} aircraft - Instância da aeronave
 * @returns {Object|null} Dados do FAF { nome, coords, altitudeFt, targetSpeed, distanceToThresholdNM, rwyData }
 */
export function findFAF(aircraft) {
    if (!aircraft) return null;

    const dest = aircraft.dest || "SBSP";
    const rwyData = getRunwayData(aircraft);
    if (!rwyData) return null;

    const iac = aircraft.active_iac || getActiveIAC(aircraft);
    let fafNome = null;
    let fafFixObj = null;

    // 1. Procura no active_iac por fixo com papel "FAF" ou isFAF: true
    if (iac && iac.fixos) {
        fafFixObj = iac.fixos.find(f => f.papel === "FAF" || f.isFAF === true);
        if (fafFixObj) fafNome = fafFixObj.nome;
    }

    // 2. Se não encontrou marcador explícito, busca na linha do IAC que termina na pista:
    // O fixo imediatamente anterior ao limiar (threshold/MAPT) é o FAF por definição ICAO.
    if (!fafNome && iac && iac.linhas) {
        for (const linha of iac.linhas) {
            if (linha.length >= 2) {
                const ult = linha[linha.length - 1];
                if (/^RW\d{2}/i.test(ult) || ult === "RW10R" || ult === "RW17R" || ult === "RW35L" || ult === "RW15" || ult === "RW28L" || ult === "RWY33") {
                    fafNome = linha[linha.length - 2];
                    break;
                }
            }
        }
    }

    // 3. Fallback em cartasNavegacao caso active_iac não esteja instanciada
    if (!fafNome && typeof cartasNavegacao === 'object' && cartasNavegacao[dest]) {
        const rwyId = aircraft.assigned_runway || aircraft.pistaAtribuida || "17R";
        const cab = cartasNavegacao[dest][rwyId];
        if (cab) {
            const grp = cab.IAC || cab.AIC;
            if (grp) {
                for (const c of Object.values(grp)) {
                    if (c.fixos) {
                        const f = c.fixos.find(item => item.papel === "FAF" || item.isFAF === true);
                        if (f) {
                            fafNome = f.nome;
                            fafFixObj = f;
                            break;
                        }
                    }
                }
            }
        }
    }

    // 4. Mapeamento nominal canônico para os principais procedimentos conhecidos
    if (!fafNome) {
        const rwy = (aircraft.assigned_runway || aircraft.pistaAtribuida || "").replace("/", "");
        if (dest === "SBSP" && (rwy === "17R" || rwy === "17")) fafNome = "SP139";
        else if (dest === "SBSP" && (rwy === "35L" || rwy === "35")) fafNome = "SURBU";
        else if (dest === "SBGR" && (rwy === "10R" || rwy === "10L" || rwy === "10")) fafNome = "OPSER";
        else if (dest === "SBGR" && (rwy === "28L" || rwy === "28R" || rwy === "28")) fafNome = "VUSNI";
        else if (dest === "SBKP" && (rwy === "15")) fafNome = "SEBSU";
        else if (dest === "SBKP" && (rwy === "33")) fafNome = "ARNIV";
    }

    if (!fafNome) return null;

    // Obtém coordenadas cartesianas do FAF
    let coords = null;
    if (state.fixos && state.fixos[fafNome]) {
        coords = state.fixos[fafNome];
    } else if (fafFixObj && fafFixObj.lat !== undefined && fafFixObj.lon !== undefined) {
        coords = geoParaDelta(fafFixObj.lat, fafFixObj.lon);
    }

    if (!coords) return null;

    // Altitude de restrição no FAF (em pés)
    const altitudeFt = getFixAltitudeFt(fafNome, iac, aircraft);

    // Distância do FAF até a cabeceira ao longo do prolongamento do eixo (NM)
    const geomFAF = calculateILSGeometry(
        coords.deltaLat,
        coords.deltaLon,
        rwyData.threshold.deltaLat,
        rwyData.threshold.deltaLon,
        rwyData.front_course_deg
    );
    const distanceToThresholdNM = Math.max(0.5, geomFAF.along_track_nm);

    return {
        nome: fafNome,
        coords,
        altitudeFt,
        targetSpeed: 160, // Velocidade padrão ICAO no FAF (160 kt)
        distanceToThresholdNM,
        rwyData
    };
}

/**
 * Calcula a distância Along-Track (ao longo da trajetória) restante até o FAF.
 * NÃO utiliza distância Euclidiana em linha reta.
 * Suspende o cálculo se a aeronave estiver em vetor de afastamento (> 90° em relação ao curso final).
 * 
 * @param {Object} aircraft - Instância da aeronave
 * @param {Object} fafData - Dados do FAF obtidos via findFAF()
 * @returns {Object} Resumo com { alongTrackNM, isConverging, isDiverging, isSuspended, isPastFAF, reason }
 */
export function calcularAlongTrackDistanceToFAF(aircraft, fafData) {
    if (!aircraft || !fafData) {
        return { alongTrackNM: null, isConverging: false, isDiverging: false, isSuspended: true, isPastFAF: false, reason: 'NO_FAF_DATA' };
    }

    const rwyData = fafData.rwyData;
    const thDeltaLat = rwyData.threshold.deltaLat;
    const thDeltaLon = rwyData.threshold.deltaLon;
    const rwyQFU = rwyData.front_course_deg;

    // Geometria analítica da aeronave em relação à cabeceira e ao eixo da pista
    const geom = calculateILSGeometry(
        aircraft.deltaLat,
        aircraft.deltaLon,
        thDeltaLat,
        thDeltaLon,
        rwyQFU
    );

    const acAlongThresholdNM = geom.along_track_nm; // > 0 antes da cabeceira
    const acCrossTrackNM = geom.cross_track_nm;     // afastamento ortogonal do eixo
    const straightDistNM = geom.distance_nm;

    // Distância euclidiana direta da aeronave ao FAF
    const dLatFAF = (aircraft.deltaLat - fafData.coords.deltaLat) * 60;
    const dLonFAF = (aircraft.deltaLon - fafData.coords.deltaLon) * 60 * correcaoLon;
    const straightDistToFAFNM = Math.hypot(dLatFAF, dLonFAF);

    // Diferença angular entre a proa da aeronave e o rumo de aproximação final (QFU)
    const relHeading = Math.abs(normalize_angle(aircraft.proa - rwyQFU));

    // -------------------------------------------------------------------------
    // 1. CASO FINAL: AERONAVE JÁ PASSOU O FAF OU ESTÁ NO SEGMENTO FINAL
    // -------------------------------------------------------------------------
    const fafAlongThresholdNM = fafData.distanceToThresholdNM;
    const estaAlinhadaFinal = Math.abs(acCrossTrackNM) <= 2.5 && relHeading <= 45;
    const jaCruzouFAF = acAlongThresholdNM <= (fafAlongThresholdNM + 0.2);

    if (estaAlinhadaFinal && jaCruzouFAF) {
        return {
            alongTrackNM: 0,
            distanceToThresholdNM: Math.max(0, acAlongThresholdNM),
            isPastFAF: true,
            isConverging: true,
            isDiverging: false,
            isSuspended: false,
            relHeading,
            straightDistNM,
            straightDistToFAFNM,
            crossTrackNM: acCrossTrackNM
        };
    }

    // -------------------------------------------------------------------------
    // 2. CASO AFASTAMENTO: VETORAÇÃO COM PROA DIVERGENTE (> 90°)
    // -------------------------------------------------------------------------
    // Se a aeronave está sendo vetorada (fora do LNAV) e voando perna do vento ou
    // afastando do curso final (ângulo > 90°), SUSPENDER cálculos baseados no FAF.
    const isVectored = !aircraft.modoLNAV;
    if (isVectored && relHeading > 90) {
        return {
            alongTrackNM: null,
            isConverging: false,
            isDiverging: true,
            isSuspended: true,
            isPastFAF: false,
            relHeading,
            reason: 'DIVERGING_HEADING',
            straightDistNM,
            straightDistToFAFNM,
            crossTrackNM: acCrossTrackNM
        };
    }

    // -------------------------------------------------------------------------
    // 3. CASO PARALELA OU CRUZAMENTO LATERAL (NÃO CONFUNDIR PROXIMIDADE COM APROXIMAÇÃO)
    // -------------------------------------------------------------------------
    // Se a aeronave estiver passando paralela à pista (ex: a 7 NM de afastamento lateral)
    // sem autorização de aproximação e sem rota convergindo para o FAF, NÃO entra em APPROACH.
    const semAutorizacaoAproximacao = !aircraft.cleared_approach && !aircraft.autorizadoProcedimento && !aircraft.ils_authorized;
    const afastamentoLateralAlto = Math.abs(acCrossTrackNM) > 3.0;

    // Diferença angular relativa ao rumo da pista (-180 a 180 graus)
    const angleDelta = normalize_angle(aircraft.proa - rwyQFU);
    // Aponta para o eixo: à direita (> 0.5 NM) com proa virada para a esquerda (angleDelta < -5)
    // ou à esquerda (< -0.5 NM) com proa virada para a direita (angleDelta > 5)
    const apontaParaEixo = (acCrossTrackNM > 0.5 && angleDelta < -5) || (acCrossTrackNM < -0.5 && angleDelta > 5);

    if (semAutorizacaoAproximacao && afastamentoLateralAlto && !aircraft.modoLNAV && !apontaParaEixo) {
        return {
            alongTrackNM: null,
            isConverging: false,
            isDiverging: false,
            isSuspended: true,
            isPastFAF: false,
            relHeading,
            reason: 'PARALLEL_OR_CROSSING',
            straightDistNM,
            straightDistToFAFNM,
            crossTrackNM: acCrossTrackNM
        };
    }

    // -------------------------------------------------------------------------
    // 4. CASO LNAV: NAVEGAÇÃO LATERAL EM ROTA PUBLICADA (STAR / IAC)
    // -------------------------------------------------------------------------
    if (aircraft.modoLNAV && aircraft.rota && Array.isArray(aircraft.rota) && aircraft.rota.length > 0) {
        const wpIndex = (typeof aircraft.wpIndex === 'number') ? aircraft.wpIndex : 0;
        const fafIdx = aircraft.rota.indexOf(fafData.nome);

        if (fafIdx !== -1 && fafIdx >= wpIndex) {
            // FAF está explicitamente na rota ativa da aeronave
            let distAlong = 0;
            const wpAtivoNome = (aircraft.wpOffRoute !== null) ? aircraft.wpOffRoute : aircraft.rota[wpIndex];
            const wpAtivoCoords = state.fixos ? state.fixos[wpAtivoNome] : null;

            if (wpAtivoCoords) {
                distAlong += calcularRumoDistancia(aircraft, wpAtivoCoords).distanciaNM;
                for (let i = wpIndex; i < fafIdx; i++) {
                    const p1 = state.fixos[aircraft.rota[i]];
                    const p2 = state.fixos[aircraft.rota[i + 1]];
                    if (p1 && p2) {
                        distAlong += calcularRumoDistancia(p1, p2).distanciaNM;
                    }
                }
                return {
                    alongTrackNM: Math.max(0.1, distAlong),
                    isConverging: true,
                    isDiverging: false,
                    isSuspended: false,
                    isPastFAF: false,
                    relHeading,
                    straightDistNM,
                    straightDistToFAFNM,
                    crossTrackNM: acCrossTrackNM
                };
            }
        } else {
            // A rota da STAR termina antes do FAF (ex: no IAF).
            // Conecta do último fixo da rota até o FAF seguindo o segmento de aproximação
            let distAlong = 0;
            const wpAtivoNome = (aircraft.wpOffRoute !== null) ? aircraft.wpOffRoute : aircraft.rota[wpIndex];
            const wpAtivoCoords = state.fixos ? state.fixos[wpAtivoNome] : null;

            if (wpAtivoCoords) {
                distAlong += calcularRumoDistancia(aircraft, wpAtivoCoords).distanciaNM;
                for (let i = wpIndex; i < aircraft.rota.length - 1; i++) {
                    const p1 = state.fixos[aircraft.rota[i]];
                    const p2 = state.fixos[aircraft.rota[i + 1]];
                    if (p1 && p2) {
                        distAlong += calcularRumoDistancia(p1, p2).distanciaNM;
                    }
                }
                const ultWp = aircraft.rota[aircraft.rota.length - 1];
                const ultCoords = state.fixos[ultWp];
                if (ultCoords) {
                    distAlong += calcularRumoDistancia(ultCoords, fafData.coords).distanciaNM;
                }
                return {
                    alongTrackNM: Math.max(0.1, distAlong),
                    isConverging: true,
                    isDiverging: false,
                    isSuspended: false,
                    isPastFAF: false,
                    relHeading,
                    straightDistNM,
                    straightDistToFAFNM,
                    crossTrackNM: acCrossTrackNM
                };
            }
        }
    }

    // -------------------------------------------------------------------------
    // 5. CASO VETORAÇÃO RADAR CONVERGENTE: INTERCEPTAÇÃO DO EIXO / FAF
    // -------------------------------------------------------------------------
    // A aeronave voa em direção ao eixo com ângulo <= 90°.
    // Calcula o ponto geométrico previsto de interceptação com o prolongamento do eixo.
    const radRel = (relHeading * Math.PI) / 180;
    const sinAng = Math.sin(radRel);
    const cosAng = Math.cos(radRel);

    let distAteEixo = Math.abs(acCrossTrackNM);
    if (sinAng > 0.15) {
        // Hipotenusa até cruzar o eixo
        distAteEixo = Math.abs(acCrossTrackNM) / sinAng;
    }

    // Ponto onde o vetor cruza a linha de centro em relação à cabeceira (NM)
    const cotAng = (sinAng > 0.05) ? (cosAng / sinAng) : 0;
    const alongIntercept = acAlongThresholdNM - Math.abs(acCrossTrackNM) * cotAng;

    let distInterceptAteFAF = 0;
    if (alongIntercept >= fafAlongThresholdNM) {
        distInterceptAteFAF = alongIntercept - fafAlongThresholdNM;
    } else {
        // Intercepta depois do FAF (já no segmento final)
        distInterceptAteFAF = 0;
    }

    const totalAlongTrack = distAteEixo + distInterceptAteFAF;

    return {
        alongTrackNM: Math.max(0.1, totalAlongTrack),
        isConverging: true,
        isDiverging: false,
        isSuspended: false,
        isPastFAF: false,
        relHeading,
        interceptDistNM: distAteEixo,
        straightDistNM,
        straightDistToFAFNM,
        crossTrackNM: acCrossTrackNM
    };
}

/**
 * Calcula a distância física necessária para desacelerar com a fórmula cinemática:
 * d = (V_current² - V_target²) / (2 * a_eff) * (GS / IAS)
 * 
 * Modulada pelo dilema "Descer vs. Desacelerar":
 * A desaceleração é fortemente penalizada pela Razão de Descida (Vertical Speed).
 * 
 * @param {number} vCur - Velocidade indicada atual (KIAS)
 * @param {number} vTgt - Velocidade indicada alvo (KIAS)
 * @param {number} vsFpm - Razão vertical atual em ft/min (ex: -1800)
 * @param {Object} perf - Parâmetros de performance da aeronave
 * @param {number} gs - Velocidade sobre o solo (Ground Speed em nós)
 * @param {boolean} speedbrakes - Se speedbrakes estão abertos
 * @param {boolean} flaps - Se flaps estão estendidos
 * @param {boolean} gearDown - Se o trem de pouso está baixado
 * @returns {Object} { distNM, aEff, timeSec }
 */
export function calcularDistanciaDesaceleracao(vCur, vTgt, vsFpm, perf, gs, speedbrakes = false, flaps = false, gearDown = false) {
    if (vCur <= vTgt) {
        return { distNM: 0, aEff: 1.2, timeSec: 0 };
    }

    const baseDecel = (perf && (perf.taxaDesacel || perf.decelerationRate)) || 1.2; // kt/s² nominal

    // Penalidade pela Razão de Descida (componente longitudinal da gravidade)
    // Em voo nivelado (VS >= -200): desaceleração nominal (1.0 a 1.5 kt/s).
    // Em descida acentuada (-1500 a -2000 ft/min): deceleração cai para 0.2 a 0.4 kt/s sem arrasto extra.
    let penalidadeVS = 0;
    if (vsFpm && vsFpm < -200) {
        penalidadeVS = Math.min(0.95, (-vsFpm / 1000) * 0.42);
    }

    let aEff = Math.max(0.15, baseDecel - penalidadeVS);

    // Incremento por superfícies de arrasto adicionais
    if (speedbrakes) aEff += 0.85; // Spoilers abertos aumentam a desaceleração
    if (flaps) aEff += 0.40;        // Flaps configurados
    if (gearDown) aEff += 0.55;     // Trem de pouso baixado (parasite drag severo)

    // Tempo necessário para desacelerar no ar (segundos)
    const timeSec = (vCur - vTgt) / aEff;

    // Distância aerodinâmica percorrida no ar em NM:
    // d = (vCur² - vTgt²) / (2 * aEff * 3600)
    const distAirNM = (vCur * vCur - vTgt * vTgt) / (2 * aEff * 3600);

    // Fator Ground Speed / Vento (Seção 20):
    // Vento de cauda (GS > IAS) aumenta a distância sobre o solo necessária para frenagem.
    const gsRatio = (gs && vCur > 50) ? Math.max(0.7, gs / vCur) : 1.0;
    const distGroundNM = distAirNM * gsRatio;

    return {
        distNM: distGroundNM,
        aEff,
        timeSec
    };
}

/**
 * Determina o estado lógico de voo da aeronave (CRUISE, DESCENT, ARRIVAL, VECTOR_TO_APPROACH, APPROACH, FINAL, MISSED_APPROACH).
 * 
 * @param {Object} aircraft - Instância da aeronave
 * @param {Object} alongTrackInfo - Resultado de calcularAlongTrackDistanceToFAF
 * @returns {string} Estado lógico de FLIGHT_ENERGY_STATES
 */
export function determinarEstadoVooEnergia(aircraft, alongTrackInfo) {
    if (aircraft.missed_approach) {
        return FLIGHT_ENERGY_STATES.MISSED_APPROACH;
    }

    if (aircraft.on_ground || aircraft.pousou || aircraft.flight_phase === 'LANDED') {
        return 'LANDED';
    }

    // Se estiver passando paralela/cruzando sem autorização de aproximação, mantém CRUISE ou DESCENT
    if (alongTrackInfo.reason === 'PARALLEL_OR_CROSSING') {
        const estaDescendo = aircraft.verticalSpeed && aircraft.verticalSpeed < -200;
        return estaDescendo ? FLIGHT_ENERGY_STATES.DESCENT : FLIGHT_ENERGY_STATES.CRUISE;
    }

    // Segmento final (estabelecido no ILS/LOC ou após cruzar o FAF)
    const emFinalILS = aircraft.autopilot && (aircraft.autopilot.loc_captured || aircraft.autopilot.loc_tracked);
    if (alongTrackInfo.isPastFAF || emFinalILS) {
        return FLIGHT_ENERGY_STATES.FINAL;
    }

    // Autorizado aproximação ou interceptando o FAF com trajetória convergente
    const autorizadoApp = aircraft.cleared_approach || aircraft.autorizadoProcedimento || (aircraft.autopilot && aircraft.autopilot.ils_authorized);

    if (autorizadoApp && alongTrackInfo.isConverging) {
        return FLIGHT_ENERGY_STATES.APPROACH;
    }

    // Sob vetoração radar
    if (!aircraft.modoLNAV) {
        return FLIGHT_ENERGY_STATES.VECTOR_TO_APPROACH;
    }

    // Em rota publicada (LNAV ativo)
    if (aircraft.modoLNAV && aircraft.rota && aircraft.rota.length > 0) {
        const estaDescendo = aircraft.verticalSpeed && aircraft.verticalSpeed < -200;
        const flAtual = aircraft.flAtualNum || Math.round((aircraft.alt || 10000) / 100);
        if (flAtual < 200 || estaDescendo) {
            return FLIGHT_ENERGY_STATES.ARRIVAL;
        }
    }

    // Descida em rota
    if (aircraft.verticalSpeed && aircraft.verticalSpeed < -200) {
        return FLIGHT_ENERGY_STATES.DESCENT;
    }

    return FLIGHT_ENERGY_STATES.CRUISE;
}

/**
 * Avalia o nível de energia da aeronave (LOW, NORMAL, HIGH, CRITICAL).
 * Dispara ações automáticas do piloto virtual (speedbrakes, gear down) e detecta arremetida.
 * 
 * @param {Object} aircraft - Instância da aeronave
 * @param {number} targetSpeed - Velocidade-alvo calculada
 * @param {Object} alongTrackInfo - Distância e geometria do FAF
 * @param {number} vApp - Velocidade de aproximação final (VAPP)
 * @returns {string} Nível de ENERGY_LEVELS
 */
export function avaliarNivelEnergia(aircraft, targetSpeed, alongTrackInfo, vApp) {
    const curSpeed = (aircraft.actualSpeed !== undefined) ? aircraft.actualSpeed : aircraft.vel;
    const distToThreshold = alongTrackInfo.distanceToThresholdNM || alongTrackInfo.straightDistNM || 10;

    const excessoVel = curSpeed - targetSpeed;

    let nivel = ENERGY_LEVELS.NORMAL;

    if (excessoVel < -15) {
        nivel = ENERGY_LEVELS.LOW_ENERGY;
    } else if (excessoVel <= 8) {
        nivel = ENERGY_LEVELS.NORMAL;
    } else if (excessoVel <= 22) {
        nivel = ENERGY_LEVELS.HIGH_ENERGY;
    } else {
        nivel = ENERGY_LEVELS.CRITICAL_ENERGY;
    }

    // Condição adicional de energia crítica na curta final (< 4 NM da pista e vel > 175 kt)
    if (distToThreshold < 4.0 && curSpeed > 175) {
        nivel = ENERGY_LEVELS.CRITICAL_ENERGY;
    }

    // GESTÃO AUTOMÁTICA DE ARRASTO PELO PILOTO VIRTUAL (Seções 11 e 12):
    if (!aircraft.speedbrakesComando) {
        if (nivel === ENERGY_LEVELS.HIGH_ENERGY || nivel === ENERGY_LEVELS.CRITICAL_ENERGY) {
            // Estende speedbrakes para dissipar energia
            aircraft.speedbrakes = true;
        } else if (excessoVel <= 4) {
            // Retrai speedbrakes quando próximo da velocidade desejada
            aircraft.speedbrakes = false;
        }
    }

    if (nivel === ENERGY_LEVELS.CRITICAL_ENERGY) {
        // Força arrasto máximo: trem de pouso e flaps antecipados
        aircraft.gearDown = true;
        aircraft.flaps = true;
    }

    // DETECÇÃO DE ARREMETIDA AUTÔNOMA (MISSED APPROACH - Seção 4, 12 e 26):
    // Se a aeronave estiver em CRITICAL ENERGY a menos de 2 NM da pista e velocidade ainda > VAPP + 20 kt:
    if (distToThreshold < 2.0 && curSpeed > (vApp + 20) && !aircraft.on_ground && !aircraft.pousou) {
        executarMissedApproach(aircraft);
        nivel = ENERGY_LEVELS.CRITICAL_ENERGY;
    }

    return nivel;
}

/**
 * Executa a manobra autônoma de Arremetida (Missed Approach / Go-Around)
 * quando a aproximação se torna desestabilizada ou excede os critérios de segurança.
 * 
 * @param {Object} aircraft - Instância da aeronave
 */
export function executarMissedApproach(aircraft) {
    if (!aircraft || aircraft.missed_approach) return;

    aircraft.missed_approach = true;
    aircraft.flightEnergyState = FLIGHT_ENERGY_STATES.MISSED_APPROACH;
    aircraft.cleared_approach = false;
    aircraft.autorizadoProcedimento = false;
    aircraft.ils_authorized = false;

    // Desconecta rastreamento de rampa e localizer
    if (aircraft.autopilot) {
        aircraft.autopilot.loc_captured = false;
        aircraft.autopilot.loc_tracked = false;
        aircraft.autopilot.gs_captured = false;
        aircraft.autopilot.gs_tracked = false;
        aircraft.autopilot.lateral_mode = ILS_LATERAL_MODES.HDG;
        aircraft.autopilot.vertical_mode = ILS_VERTICAL_MODES.ALT_HOLD;
    }

    // Piloto virtual aplica potência de arremetida (TOGA) e razão positiva de subida
    aircraft.targetVS = 2200; // ft/min positivo
    aircraft.currentVS = Math.max(1200, (aircraft.currentVS || 0) + 1500);
    aircraft.verticalSpeed = aircraft.targetVS;

    // Altitude de segurança da arremetida (4000 ft para SBSP / SBKP, 5000 ft para SBGR)
    const dest = aircraft.dest || "SBSP";
    const altArremetida = (dest === "SBGR") ? 5000 : 4000;
    aircraft.target_altitude = altArremetida;
    aircraft.targetFL = Math.round(altArremetida / 100);
    aircraft.nivAutorizado = String(aircraft.targetFL).padStart(3, '0');
    aircraft.nivAutorizadoFisico = aircraft.targetFL;

    // Velocidade de subida limpa após arremetida
    const perf = aircraft.perf || getAircraftPerformance(aircraft.tipo);
    const vClimb = (perf.speeds && perf.speeds.vClimb) || 210;
    aircraft.velComando = vClimb;
    aircraft.velDestino = vClimb;
    aircraft.targetSpeed = vClimb;

    // Configuração aerodinâmica: recolhe speedbrakes, mantém asas niveladas na proa da pista
    aircraft.speedbrakes = false;
    aircraft.speedbrakesComando = false;
    aircraft.gearDown = false;

    // Feedback visual na etiqueta do radar (Scratchpad / Texto Livre)
    aircraft.textoLivre = "ARREM";

    console.warn(`[MISSED APPROACH] ${aircraft.callsign}: Aproximação desestabilizada abortada a menos de 2 NM da pista. Arremetida executada com potência TOGA.`);
}

/**
 * ----------------------------------------------------------------------------
 * CÁLCULO PRINCIPAL DE VELOCIDADE-ALVO E GERENCIAMENTO DE ENERGIA
 * ----------------------------------------------------------------------------
 * Executado rigorosamente de trás para frente seguindo o pipeline:
 * TRAJETÓRIA → FAF → DISTÂNCIA DISPONÍVEL → ENERGIA / V/S → PERFORMANCE → VELOCIDADE-ALVO.
 * 
 * Atende às 27 Seções da Especificação ATC:
 * - Não usa `if (dist < X) setSpeed(Y)`
 * - Diferencia targetSpeed e actualSpeed
 * - Não teleporta velocidade
 * - Restringe FL100 a 250 kt
 * - Proteção de overshoot em vetoração
 * 
 * @param {Object} aircraft - Instância da aeronave
 * @param {number} dtSec - Passo de tempo em segundos
 * @returns {number} Velocidade-alvo em nós (KIAS)
 */
export function calcularVelocidadeAlvoEnergia(aircraft, dtSec = 1.0) {
    if (!aircraft) return 250;

    if (aircraft.on_ground || aircraft.pousou || aircraft.flight_phase === 'LANDED') {
        aircraft.flightEnergyState = 'LANDED';
        aircraft.energyLevel = ENERGY_LEVELS.NORMAL;
        return 0;
    }

    const perf = aircraft.perf || getAircraftPerformance(aircraft.tipo) || AIRCRAFT_PERFORMANCE["DEFAULT"];
    const maxSpd = perf.maxSpeedTMA || 260;
    const minSpd = perf.minApproachSpeed || 125;
    const vApp = perf.approachSpeed || 135;
    const curSpeed = (aircraft.actualSpeed !== undefined) ? aircraft.actualSpeed : aircraft.vel;
    const curAlt = (aircraft.alt !== undefined) ? aircraft.alt : ((aircraft.flAtualNum || 100) * 100);
    const gs = aircraft.groundSpeed || aircraft.gs || curSpeed;
    const currentVS = aircraft.verticalSpeed || 0;

    // -------------------------------------------------------------------------
    // 1. IDENTIFICAÇÃO DO FAF E GEOMETRIA ALONG-TRACK
    // -------------------------------------------------------------------------
    const fafData = findFAF(aircraft);
    const alongTrackInfo = calcularAlongTrackDistanceToFAF(aircraft, fafData);
    aircraft.alongTrackDistanceToFAF = alongTrackInfo;

    // Determina o estado lógico de voo da aeronave
    const estadoVoo = determinarEstadoVooEnergia(aircraft, alongTrackInfo);
    aircraft.flightEnergyState = estadoVoo;

    // -------------------------------------------------------------------------
    // 2. PRIORIDADE OPERACIONAL MÁXIMA: ARREMETIDA (MISSED APPROACH)
    // -------------------------------------------------------------------------
    if (estadoVoo === FLIGHT_ENERGY_STATES.MISSED_APPROACH) {
        const vClimb = (perf.speeds && perf.speeds.vClimb) || 210;
        aircraft.targetSpeed = vClimb;
        aircraft.energyLevel = ENERGY_LEVELS.NORMAL;
        return vClimb;
    }

    // -------------------------------------------------------------------------
    // 3. COMANDO MANUAL DO ATCO ("21K" / "210 KT" / "MIN") - SEÇÃO 18
    // -------------------------------------------------------------------------
    // Comandos manuais do controlador têm prioridade absoluta.
    // Exceção estrita de segurança operacional: ao ingressar na curta final (< 4 NM da pista),
    // o piloto virtual deve configurar aeronave e desacelerar gradualmente para VAPP para pousar.
    const distToThreshold = alongTrackInfo.distanceToThresholdNM || alongTrackInfo.straightDistNM || 99;

    if (aircraft.velocidadeMinima) {
        const vCleanMin = (perf.speeds && perf.speeds.vCleanMin) || 210;
        const vAppMin = (perf.speeds && perf.speeds.vAppMin) || vApp;

        if (distToThreshold >= 4.0 && !alongTrackInfo.isPastFAF) {
            aircraft.targetSpeed = vCleanMin;
            return vCleanMin;
        } else {
            // Curta final: desaceleração suave para Vapp
            const fatorFinal = Math.max(0, Math.min(1, (distToThreshold - 1.0) / 3.0));
            const velTrans = vApp + fatorFinal * (vAppMin - vApp);
            const vAlvo = Math.round(velTrans);
            aircraft.targetSpeed = vAlvo;
            return vAlvo;
        }
    }

    if (aircraft.velManual) {
        if (distToThreshold >= 4.0 && !alongTrackInfo.isPastFAF) {
            const vComandoClamp = Math.max(minSpd, Math.min(maxSpd, aircraft.velComando));
            aircraft.targetSpeed = vComandoClamp;
            return vComandoClamp;
        } else {
            // Curta final (< 4 NM): transição suave para Vapp para garantir toque seguro
            const fatorFinal = Math.max(0, Math.min(1, (distToThreshold - 1.0) / 3.0));
            const velTeto = Math.min(aircraft.velComando, perf.finalAppSpeed || 170);
            const velTrans = vApp + fatorFinal * (velTeto - vApp);
            const vAlvo = Math.max(minSpd, Math.min(maxSpd, Math.round(velTrans)));
            aircraft.targetSpeed = vAlvo;
            return vAlvo;
        }
    }

    // -------------------------------------------------------------------------
    // 4. RESTRIÇÃO GLOBAL REGULATÓRIA: ABAIXO DE FL100 (10.000 FT) MÁX 250 KT (SEÇÃO 7)
    // -------------------------------------------------------------------------
    // Ao cruzar 10.000 pés descendo, a velocidade máxima regulamentar é de 250 kt.
    // O sistema antecipa a desaceleração para cruzar o FL100 a 250 kt (a menos que SR esteja ativo).
    let limiteFL100 = Infinity;
    if (!aircraft.semRestricoes) {
        if (curAlt <= 10000) {
            limiteFL100 = 250;
        } else if (curAlt <= 13000 && currentVS < -300 && curSpeed > 250) {
            // Antecipação cinemática da perda de altitude até 10.000 ft
            const altRestanteFt = curAlt - 10000;
            const tempoDescidaSec = (altRestanteFt / Math.abs(currentVS)) * 60;
            const decelReq = calcularDistanciaDesaceleracao(curSpeed, 250, currentVS, perf, gs);
            if (decelReq.timeSec >= tempoDescidaSec * 0.85) {
                limiteFL100 = 250;
            }
        }
    }

    // -------------------------------------------------------------------------
    // 5. PROTEÇÃO CONTRA OVERSHOOT EM VETORAÇÃO (SEÇÃO 17 - RAIO DE CURVA)
    // -------------------------------------------------------------------------
    // Em VECTOR_TO_APPROACH ao interceptar o eixo (crossTrack <= 5.0 NM e convergindo),
    // a velocidade deve ser restrita a 180-200 kt para que o raio de curva não vare o eixo.
    let limiteOvershoot = Infinity;
    if (estadoVoo === FLIGHT_ENERGY_STATES.VECTOR_TO_APPROACH && alongTrackInfo.isConverging) {
        const cross = Math.abs((alongTrackInfo.crossTrackNM !== undefined && alongTrackInfo.crossTrackNM !== null) ? alongTrackInfo.crossTrackNM : 99);
        if (cross <= 5.0 || (alongTrackInfo.interceptDistNM && alongTrackInfo.interceptDistNM <= 6.0)) {
            limiteOvershoot = 190;
        }
    }

    // -------------------------------------------------------------------------
    // 6. GESTÃO DE VELOCIDADE POR ESTADO DE VOO
    // -------------------------------------------------------------------------
    let vCalculada = maxSpd;

    switch (estadoVoo) {
        case FLIGHT_ENERGY_STATES.CRUISE:
            // Aeronave em rota livre / voando paralela: mantém velocidade comandada ou de cruzeiro
            vCalculada = (aircraft.velComando && aircraft.velComando >= 240)
                ? aircraft.velComando
                : ((perf.speeds && perf.speeds.vCruise) || maxSpd);
            break;

        case FLIGHT_ENERGY_STATES.DESCENT:
            // Descida em rota antes da TMA
            vCalculada = (aircraft.velComando && aircraft.velComando >= 240)
                ? aircraft.velComando
                : Math.min(maxSpd, 280);
            break;

        case FLIGHT_ENERGY_STATES.ARRIVAL:
            // Em STAR/Chegada: velocidade intermediária na TMA (~240-220 kt)
            vCalculada = perf.initialAppSpeed || 240;
            break;

        case FLIGHT_ENERGY_STATES.VECTOR_TO_APPROACH:
            // Se vetor for divergente (perna do vento), mantém velocidade comandada
            if (alongTrackInfo.isDiverging) {
                vCalculada = (aircraft.velComando && aircraft.velComando >= 200) ? aircraft.velComando : Math.min(maxSpd, 220);
            } else if (alongTrackInfo.isConverging) {
                // Interceptando: planeja perfil de energia antecipado para o FAF
                vCalculada = perf.intermediateAppSpeed || 205;
            } else {
                vCalculada = 220;
            }
            break;

        case FLIGHT_ENERGY_STATES.APPROACH: {
            // -----------------------------------------------------------------
            // PERFIL BASEADO NO FAF (SEÇÃO 14 E 15)
            // -----------------------------------------------------------------
            // A velocidade desejada no FAF é 160 kt (perf.finalAppSpeed).
            // O sistema compara a distância disponível até o FAF (alongTrackNM)
            // com a distância necessária para desacelerar da velocidade atual até 160 kt.
            const vAlvoFAF = perf.finalAppSpeed || 160;
            const distDisponivel = alongTrackInfo.alongTrackNM || 99;

            const decelEstimada = calcularDistanciaDesaceleracao(
                curSpeed,
                vAlvoFAF,
                currentVS,
                perf,
                gs,
                aircraft.speedbrakes,
                aircraft.flaps
            );

            const distNecessaria = decelEstimada.distNM + 0.8; // Margem de segurança de 0.8 NM

            if (distDisponivel > distNecessaria) {
                // Há margem de sobra: mantém velocidade intermediária (~210 kt)
                vCalculada = perf.intermediateAppSpeed || 210;
            } else {
                // Ponto exato de início da desaceleração atingido (Top of Deceleration):
                // Interpolação suave e contínua em direção a 160 kt no FAF
                const progresso = Math.max(0, Math.min(1, distDisponivel / Math.max(1.0, distNecessaria)));
                const vInterpolada = vAlvoFAF + progresso * (curSpeed - vAlvoFAF);
                vCalculada = Math.max(vAlvoFAF, Math.round(vInterpolada));
            }
            break;
        }

        case FLIGHT_ENERGY_STATES.FINAL: {
            // -----------------------------------------------------------------
            // FASE FINAL APÓS O FAF (SEÇÃO 21)
            // -----------------------------------------------------------------
            // A velocidade transita de 160 kt suavemente até VAPP para o pouso.
            const distFinal = alongTrackInfo.distanceToThresholdNM || distToThreshold;
            if (distFinal > 4.0) {
                vCalculada = perf.finalAppSpeed || 160;
            } else if (distFinal > 1.0) {
                // Entre 4 NM e 1 NM: transição gradual para Vapp
                const t = (distFinal - 1.0) / 3.0;
                vCalculada = vApp + t * ((perf.finalAppSpeed || 160) - vApp);
            } else {
                // Menos de 1 NM: estabilizado em Vapp
                vCalculada = vApp;
            }
            break;
        }

        default:
            vCalculada = maxSpd;
            break;
    }

    // Aplicação das restrições regulatórias e limites de overshoot
    let vAlvoFinal = vCalculada;
    if (limiteFL100 !== Infinity) {
        vAlvoFinal = Math.min(vAlvoFinal, limiteFL100);
    }
    if (limiteOvershoot !== Infinity) {
        vAlvoFinal = Math.min(vAlvoFinal, limiteOvershoot);
    }

    // Clamping físico pelos envelopes operacionais da aeronave
    vAlvoFinal = Math.max(minSpd, Math.min(maxSpd, Math.round(vAlvoFinal)));

    // -------------------------------------------------------------------------
    // 7. AVALIAÇÃO DE ENERGIA E AÇÕES DO PILOTO VIRTUAL (SEÇÕES 11 E 12)
    // -------------------------------------------------------------------------
    const nivelEnergia = avaliarNivelEnergia(aircraft, vAlvoFinal, alongTrackInfo, vApp);
    aircraft.energyLevel = nivelEnergia;

    // Se avaliarNivelEnergia disparou arremetida, atualiza velocidade-alvo para subida
    if (aircraft.missed_approach) {
        vAlvoFinal = (perf.speeds && perf.speeds.vClimb) || 210;
        aircraft.flightEnergyState = FLIGHT_ENERGY_STATES.MISSED_APPROACH;
    }

    aircraft.targetSpeed = vAlvoFinal;
    aircraft.sugestaoVel = vAlvoFinal;

    // -------------------------------------------------------------------------
    // 8. TELEMETRIA E HUD DE DEBUG (SEÇÃO 24)
    // -------------------------------------------------------------------------
    aircraft.energyDebug = {
        state: aircraft.flightEnergyState,
        fafId: fafData ? fafData.nome : 'N/A',
        alongTrackDist: alongTrackInfo.alongTrackNM,
        straightDist: alongTrackInfo.straightDistNM,
        targetSpeed: vAlvoFinal,
        actualSpeed: curSpeed,
        energyState: nivelEnergia,
        gs: Math.round(gs),
        wind: aircraft.ventoAtual ? `${aircraft.ventoAtual.speedKt || 0}kt` : '0kt',
        vs: aircraft.verticalSpeed || currentVS,
        speedbrakes: Boolean(aircraft.speedbrakes),
        isSuspended: alongTrackInfo.isSuspended
    };

    return vAlvoFinal;
}
