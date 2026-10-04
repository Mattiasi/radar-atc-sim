import { calcularRumoDistancia } from '../utils/utils.js';
import { normalizeHeading, calculateWindCorrectionAngle } from '../physics/windMath.js';
import { isFixoIAC, obterRestricaoFixoParaAeronave, getRunwayData } from '../data/data.js';
import { ILS_LATERAL_MODES, calculateILSGeometry } from './ILSController.js';
import { authorize_approach, update_approach_vertical_profile, DESCENT_MODES } from './ApproachProfileManager.js';
import { calcularFlyByDistance } from '../physics/FlyByConfig.js';

/**
 * Módulo especializado em Navegação Lateral (LNAV) e transições entre fixos (Fly-By).
 */

export function updateLNAV(aero, dtSec, state, restricoesFixos) {
    let navInfo = null;
    let restricaoAlvo = null;

    const ilsLateralAtivo = aero.autopilot && (
        aero.autopilot.lateral_mode === ILS_LATERAL_MODES.LOC_CAPTURE ||
        aero.autopilot.lateral_mode === ILS_LATERAL_MODES.LOC_TRACK
    );

    if (ilsLateralAtivo) {
        aero.modoLNAV = false;
    }

    if (aero.modoLNAV) {
        let wpNome = null;
        if (aero.wpOffRoute !== null) {
            wpNome = aero.wpOffRoute; 
        } else if (aero.rota && aero.wpIndex < aero.rota.length) {
            wpNome = aero.rota[aero.wpIndex]; 
        }
        
        if (wpNome) {
            let wpCoords = state.fixos[wpNome];
            if (wpCoords) {
                navInfo = calcularRumoDistancia(aero, wpCoords);
                restricaoAlvo = obterRestricaoFixoParaAeronave(wpNome, aero); 

                // Verificação contínua: se voando VIA e rastreando fixo de IAC, autoriza aproximação imediatamente
                const isViaAtivo = (aero.nivAutorizadoFisico === "VIA" || aero.nivAutorizadoFisico === "---" || aero.nivAutorizado === "VIA" || aero.cleared_level === "VIA");
                if (!aero.srAteFixoIAC && isViaAtivo && !aero.cleared_approach) {
                    const activeWp = (aero.rota && aero.wpIndex < aero.rota.length) ? aero.rota[aero.wpIndex] : null;
                    if (isFixoIAC(wpNome, aero) || isFixoIAC(activeWp, aero)) {
                        authorize_approach(aero);
                    }
                }

                const nextWpNome = (aero.wpOffRoute === null && aero.rota && aero.wpIndex + 1 < aero.rota.length)
                    ? aero.rota[aero.wpIndex + 1]
                    : null;
                const nextWpCoords = (nextWpNome && state.fixos) ? state.fixos[nextWpNome] : null;
                const flyByDist = calcularFlyByDistance(wpNome, nextWpNome, wpCoords, nextWpCoords, navInfo, aero);
                aero.flyByDist = flyByDist;
                
                if (navInfo.distanciaNM <= flyByDist) {
                    if (aero.wpOffRoute !== null) {
                        aero.wpOffRoute = null;
                        aero.modoLNAV = false;
                        aero.flyByProtegido = null;
                    } else {
                        if (restricaoAlvo && restricaoAlvo.fl !== undefined && (restricaoAlvo.tipo === "ABOVE" || restricaoAlvo.tipo === "AT" || restricaoAlvo.tipo === "WINDOW")) {
                            aero.flyByProtegido = {
                                fixoNome: wpNome,
                                flMinimo: restricaoAlvo.fl,
                                distMin: navInfo.distanciaNM
                            };
                        }
                        aero.wpIndex++; 
                        
                        // Se estava descendo sem restrições até o fixo do IAC (regra: SR -> VIA):
                        if (aero.srAteFixoIAC) {
                            const fixoAlvoIdx = aero.rota ? aero.rota.indexOf(aero.srAteFixoIAC) : -1;
                            const jaPassouFixo = (wpNome === aero.srAteFixoIAC) || (fixoAlvoIdx !== -1 && aero.wpIndex > fixoAlvoIdx);
                            if (jaPassouFixo) {
                                aero.srAteFixoIAC = null;
                                aero.semRestricoes = false;
                                aero.descent_mode = DESCENT_MODES.APPROACH_PROFILE;
                                authorize_approach(aero);
                            }
                        }

                        const isViaAtivo = (aero.nivAutorizadoFisico === "VIA" || aero.nivAutorizadoFisico === "---" || aero.nivAutorizado === "VIA" || aero.cleared_level === "VIA");
                        if (!aero.srAteFixoIAC && (aero.cleared_approach || isViaAtivo)) {
                            const activeWp = (aero.rota && aero.wpIndex < aero.rota.length) ? aero.rota[aero.wpIndex] : null;
                            if (isFixoIAC(wpNome, aero) || isFixoIAC(activeWp, aero)) {
                                if (!aero.cleared_approach) {
                                    authorize_approach(aero);
                                } else {
                                    update_approach_vertical_profile(aero, dtSec);
                                }
                            }
                        }
                        
                        if (aero.rota && aero.wpIndex < aero.rota.length) {
                            let proxCoords = state.fixos[aero.rota[aero.wpIndex]];
                            if (proxCoords) {
                                let proxNav = calcularRumoDistancia(aero, proxCoords);
                                let rumoProx = parseInt(proxNav.rumo, 10);
                                let wind = aero.ventoAtual || { fromDeg: 0, speedKt: 0 };
                                let wca = calculateWindCorrectionAngle(rumoProx, aero.vel, wind.fromDeg, wind.speedKt);
                                aero.proaDestino = Math.round(normalizeHeading(rumoProx + wca));
                            }
                        }
                    }
                } else {
                    let rumoAlvo = parseInt(navInfo.rumo, 10);
                    let wind = aero.ventoAtual || { fromDeg: 0, speedKt: 0 };
                    let wca = calculateWindCorrectionAngle(rumoAlvo, aero.vel, wind.fromDeg, wind.speedKt);
                    aero.proaDestino = Math.round(normalizeHeading(rumoAlvo + wca));
                }
            }
        }

        // Alinhamento final com o prolongamento/eixo da pista na aproximação final / rolamento
        if (aero.descent_mode === DESCENT_MODES.GLIDEPATH || aero.descent_mode === 'FLARE') {
            const rwy = getRunwayData(aero);
            if (rwy) {
                const geom = calculateILSGeometry(aero.deltaLat, aero.deltaLon, rwy.threshold.deltaLat, rwy.threshold.deltaLon, rwy.front_course_deg);
                const rwyComp = rwy.comp_nm || 1.5;
                const tolLat = rwy.toleranciaAlinhamentoNM || 0.5;
                if (geom.along_track_nm <= 1.5 && geom.along_track_nm >= -(rwyComp + 0.3) && Math.abs(geom.cross_track_nm) <= tolLat) {
                    if (geom.along_track_nm <= 0.0) {
                        aero.proaDestino = rwy.front_course_deg;
                    } else {
                        const corr = Math.max(-10, Math.min(10, -geom.cross_track_nm * 40));
                        aero.proaDestino = Math.round(normalizeHeading(rwy.front_course_deg + corr));
                    }
                }
            }
        }
    }

    return navInfo;
}

export function updateLateralPhysics(aero, dtSec) {
    const ilsLateralAtivo = aero.autopilot && (
        aero.autopilot.lateral_mode === ILS_LATERAL_MODES.LOC_CAPTURE ||
        aero.autopilot.lateral_mode === ILS_LATERAL_MODES.LOC_TRACK
    );

    if (aero.proa !== aero.proaDestino) {
        let taxaCurva = 2.3 * dtSec; 
        let distFaltante;

        const sempreCurto = aero.modoLNAV || ilsLateralAtivo || !aero.curvaForcada;

        if (sempreCurto) {
            let difCurta = aero.proaDestino - aero.proa;
            while (difCurta <= -180) difCurta += 360;
            while (difCurta > 180) difCurta -= 360;
            aero.direcaoCurva = (difCurta > 0) ? 1 : (difCurta < 0 ? -1 : 0);
            distFaltante = Math.abs(difCurta);
        } else {
            if (aero.direcaoCurva === 1) { 
                distFaltante = aero.proaDestino - aero.proa;
                if (distFaltante < 0) distFaltante += 360;
            } else if (aero.direcaoCurva === -1) { 
                distFaltante = aero.proa - aero.proaDestino;
                if (distFaltante < 0) distFaltante += 360;
            } else {
                distFaltante = 0;
            }
        }

        if (distFaltante <= taxaCurva) {
            aero.proa = aero.proaDestino; 
            aero.direcaoCurva = 0; 
            aero.curvaForcada = false;
        } else {
            if (aero.direcaoCurva === 1) {
                aero.proa = (aero.proa + taxaCurva) % 360;
            } else if (aero.direcaoCurva === -1) {
                aero.proa = (aero.proa - taxaCurva + 360) % 360;
            }
        }
    } else {
        aero.direcaoCurva = 0;
        aero.curvaForcada = false;
    }
}

export function updateFlyByProtection(aero, state) {
    if (aero.flyByProtegido) {
        let protCoords = state.fixos[aero.flyByProtegido.fixoNome];
        if (protCoords && aero.modoLNAV) {
            let distProt = calcularRumoDistancia(aero, protCoords).distanciaNM;
            if (distProt < aero.flyByProtegido.distMin) {
                aero.flyByProtegido.distMin = distProt;
            }
            let difProa = Math.abs(aero.proaDestino - aero.proa);
            if (difProa > 180) difProa = 360 - difProa;

            if ((difProa <= 3 && distProt >= aero.flyByProtegido.distMin + 0.05) || distProt >= aero.flyByProtegido.distMin + 0.3) {
                aero.flyByProtegido = null;
            }
        } else {
            aero.flyByProtegido = null;
        }
    }
}

