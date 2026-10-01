import { calcularRumoDistancia, correcaoLon } from '../utils/utils.js';
import { DESCENT_MODES, update_approach_vertical_profile } from './ApproachProfileManager.js';
import { ILS_VERTICAL_MODES } from './ILSController.js';
import { isFixoIAC } from '../data/data.js';
import { getAircraftPerformance } from '../data/PerformanceDB.js';

export function updateVNAV(aero, dtSec, state, restricoesFixos) {
    let targetFL = aero.flAtualNum;
    let velBase = aero.gs || aero.tas || aero.vel;
    let razaoNominal = Math.round(velBase * 5.2); 
    let razaoEfetiva = razaoNominal;

    const isVia = (aero.nivAutorizadoFisico === "VIA" || aero.nivAutorizadoFisico === "---");
    const isILS = (aero.nivAutorizadoFisico === "ILS" || aero.cleared_level === "ILS");
    const altClearence = isVia ? 0 : (isILS ? Math.round((aero.altitude_before_ils || (aero.flAtualNum * 100)) / 100) : parseInt(aero.nivAutorizadoFisico, 10));
    const lnavAtivoOuPendente = aero.modoLNAV || (aero.wpPendente !== null);

    const isCapturingOrTrackingGS = aero.autopilot && (
        aero.autopilot.vertical_mode === ILS_VERTICAL_MODES.GS_CAPTURE || 
        aero.autopilot.vertical_mode === ILS_VERTICAL_MODES.GS_TRACK || 
        aero.autopilot.vertical_mode === ILS_VERTICAL_MODES.FLARE || 
        aero.autopilot.vertical_mode === ILS_VERTICAL_MODES.TOUCHDOWN
    );

    if (isCapturingOrTrackingGS) {
        aero.descent_mode = (aero.autopilot.vertical_mode === ILS_VERTICAL_MODES.FLARE) ? 'FLARE' : 'GLIDEPATH';
        aero.verticalMode = 'G/S';
        targetFL = Math.round(aero.alt / 100);
        aero.hold_altitude_until_waypoint = null;
        aero.vertical_floor_altitude = null;
        aero.vertical_floor_fl = null;
    } else if (!isVia && !isILS && !isNaN(altClearence) && altClearence > aero.flAtualNum) {
        targetFL = altClearence;
        const perfRate = (aero.perf && aero.perf.rates && aero.perf.rates.climbNormal) 
            ? aero.perf.rates.climbNormal 
            : 2200;
        razaoEfetiva = perfRate;
        aero.descent_mode = 'CLIMB';
    } else if (isILS || (aero.autopilot && aero.autopilot.vertical_mode === ILS_VERTICAL_MODES.GS_ARM)) {
        targetFL = (!isVia && !isNaN(altClearence) && altClearence > 0) ? Math.min(aero.flAtualNum, altClearence) : aero.flAtualNum;
        razaoEfetiva = razaoNominal;
        aero.verticalMode = 'ALT_HOLD';
        aero.targetVS = 0;
        aero.vertical_floor_altitude = null;
        aero.vertical_floor_fl = null;
        aero.hold_altitude_until_waypoint = null;
    } else if (aero.srAteFixoIAC) {
        // Regra operacional: desce sem restrições direto até a altitude do fixo do IAC voado
        aero.descent_mode = DESCENT_MODES.OPEN_DESCENT;
        aero.verticalMode = 'OP-D';
        const rest = restricoesFixos[aero.srAteFixoIAC];
        const tetoDescida = (rest && rest.fl !== undefined) ? rest.fl : 55;
        if (tetoDescida < aero.flAtualNum) {
            targetFL = tetoDescida;
            razaoEfetiva = razaoNominal;
        } else {
            targetFL = aero.flAtualNum;
        }
    } else if (aero.descent_mode === DESCENT_MODES.GLIDEPATH || aero.descent_mode === 'FLARE') {
        update_approach_vertical_profile(aero, dtSec);
        targetFL = aero.targetFL;
        razaoEfetiva = aero.razaoEfetiva || razaoNominal;
    } else if (aero.cleared_approach || aero.descent_mode === DESCENT_MODES.APPROACH_PROFILE) {
        update_approach_vertical_profile(aero, dtSec);
        targetFL = aero.targetFL;
        razaoEfetiva = aero.razaoEfetiva || razaoNominal;
    } else if (aero.semRestricoes || aero.descent_mode === DESCENT_MODES.OPEN_DESCENT) {
        aero.descent_mode = DESCENT_MODES.OPEN_DESCENT;
        aero.verticalMode = 'OP-D';

        let tetoDescida = altClearence > 0 ? altClearence : 0;

        if (tetoDescida < aero.flAtualNum) {
            targetFL = tetoDescida;
            razaoEfetiva = razaoNominal;
        } else {
            targetFL = aero.flAtualNum;
        }
    } else if (lnavAtivoOuPendente && aero.rota && aero.rota.length > 0) {
        aero.descent_mode = DESCENT_MODES.RESTRICTED_DESCENT;
        aero.verticalMode = 'AUTO';
        
        let startWpIndex = aero.wpIndex;
        let iterWpNome = null;
        let distAcumulada = 0;

        if (aero.wpOffRoute !== null) {
            iterWpNome = aero.wpOffRoute;
            let wpCoords = state.fixos[iterWpNome];
            if (wpCoords) {
                distAcumulada = calcularRumoDistancia(aero, wpCoords).distanciaNM;
            }
        } else if (aero.wpPendente !== null && typeof aero.wpPendente === 'string') {
            iterWpNome = aero.wpPendente;
            let wpCoords = state.fixos[iterWpNome];
            if (wpCoords) {
                distAcumulada = calcularRumoDistancia(aero, wpCoords).distanciaNM;
            }
        } else if (startWpIndex < aero.rota.length) {
            iterWpNome = aero.rota[startWpIndex];
            let wpCoords = state.fixos[iterWpNome];
            if (wpCoords) {
                distAcumulada = calcularRumoDistancia(aero, wpCoords).distanciaNM;
            }
        }

        let iterIndex = startWpIndex;

        if (iterWpNome) {
            let restAtual = restricoesFixos[iterWpNome];
            let pisoAtual = isVia ? 0 : altClearence;
            if (restAtual && restAtual.fl !== undefined && (restAtual.tipo === "AT" || restAtual.tipo === "ABOVE" || restAtual.tipo === "WINDOW")) {
                pisoAtual = Math.max(pisoAtual, restAtual.fl);
            }

            let flCruzeiroSegmento = aero.flAtualNum;
            if (startWpIndex > 0 && aero.rota) {
                const prevWpNome = aero.rota[startWpIndex - 1];
                const prevRest = restricoesFixos[prevWpNome];
                if (prevRest && prevRest.fl !== undefined) {
                    flCruzeiroSegmento = isVia ? prevRest.fl : Math.max(prevRest.fl, altClearence);
                }
            }

            let encontrouDescida = false;
            let temRestricaoAtivaFutura = false;
            let flAlvoFinal = aero.flAtualNum;
            let maiorRazaoNecessaria = 300; // Começa no mínimo para permitir descidas bem suaves
            let highestRestriction = isVia ? 0 : altClearence;

            if (!aero.desceuParaWp) aero.desceuParaWp = {};

            let lookaheadLimit = (iterWpNome && isFixoIAC(iterWpNome)) ? 1 : 2;
            for (let i = 0; i < lookaheadLimit; i++) {
                if (!iterWpNome) break;

                let rest = restricoesFixos[iterWpNome];
                if (rest && rest.fl !== undefined) {
                    let limitFL = rest.fl;
                    let flAlvoFixo = isVia ? limitFL : Math.max(limitFL, altClearence);

                    if (rest.tipo === "BELOW" && aero.flAtualNum <= limitFL) {
                        flAlvoFixo = aero.flAtualNum;
                    }
                    
                    if (rest.tipo === "WINDOW") {
                        let flMax = rest.flMax || limitFL;
                        if (aero.flAtualNum <= flMax && aero.flAtualNum >= limitFL) {
                            flAlvoFixo = aero.flAtualNum;
                        }
                    }

                    if (aero.flyByProtegido && isVia) {
                        let pisoFlyBy = aero.flyByProtegido.flMinimo;
                        flAlvoFixo = Math.max(flAlvoFixo, pisoFlyBy);
                    }

                    if (aero.flAtualNum > flAlvoFixo) {
                        temRestricaoAtivaFutura = true;
                        if (rest.tipo !== "BELOW") {
                            highestRestriction = Math.max(highestRestriction, flAlvoFixo);
                        }

                        let flObrigatorioParaDescer = flAlvoFixo;
                        if (rest.tipo === "ABOVE") {
                            flObrigatorioParaDescer = aero.flAtualNum;
                        } else if (rest.tipo === "WINDOW") {
                            let flMax = rest.flMax || limitFL;
                            flObrigatorioParaDescer = Math.min(aero.flAtualNum, flMax);
                        }
                        
                        let deltaAltFt = (aero.flAtualNum - flObrigatorioParaDescer) * 100;
                        let distTOD = (aero.flAtualNum - flAlvoFixo) * 0.3;

                        let distEfetiva = distAcumulada;
                        if (i === 0) {
                            let flyBy = aero.flyByDist || 0.6;
                            distEfetiva = Math.max(0.1, distAcumulada - flyBy);
                        }

                        let jaIniciou = (i === 0 && Boolean(aero.desceuParaWp[iterWpNome]));
                        let noTOD = true; // Inicia a descida imediatamente após o fixo

                        if (jaIniciou || noTOD) {
                            if (i === 0 && (!aero.flyByProtegido || (aero.rota && iterWpNome !== aero.rota[aero.wpIndex]))) {
                                aero.desceuParaWp[iterWpNome] = true;
                            }

                            let velEfetiva = Math.max(aero.gs || aero.tas || aero.vel, 100);
                            let tempoMin = (distEfetiva / velEfetiva) * 60;
                            let rNec = tempoMin > 0 ? (deltaAltFt / tempoMin) : razaoNominal;

                            const perf = getAircraftPerformance(aero.tipo);
                            let rMin = 300; // Permite uma razão bem suave para descidas contínuas longas
                            let rMax = Math.abs(perf.rates.descentStructuralMax);
                            let rAjustada = Math.min(rMax, Math.max(rMin, rNec));

                            let alvoValido = flAlvoFixo;
                            if (i > 0 && restAtual && (restAtual.tipo === "AT" || restAtual.tipo === "ABOVE")) {
                                alvoValido = Math.max(alvoValido, pisoAtual);
                            }
                            if (aero.flyByProtegido && isVia) {
                                let pisoFlyBy = aero.flyByProtegido.flMinimo;
                                alvoValido = Math.max(alvoValido, pisoFlyBy);
                            }

                            if (alvoValido <= flAlvoFinal) {
                                flAlvoFinal = alvoValido;
                                maiorRazaoNecessaria = Math.max(maiorRazaoNecessaria, rAjustada);
                                encontrouDescida = true;
                            }
                        }
                    }
                }

                if (aero.wpOffRoute !== null && aero.wpPendente === null && i === 0) break;
                if (aero.wpPendente !== null && typeof aero.wpPendente === 'string' && i === 0) break;

                if (aero.rota && iterIndex + 1 < aero.rota.length) {
                    let nextWpNome = aero.rota[iterIndex + 1];
                    let pAtual = state.fixos[iterWpNome];
                    let pProx = state.fixos[nextWpNome];
                    if (pAtual && pProx) {
                        let dLat = pProx.deltaLat - pAtual.deltaLat;
                        let dLon = (pProx.deltaLon - pAtual.deltaLon) * correcaoLon;
                        let distSeg = Math.sqrt(Math.pow(dLat * 60, 2) + Math.pow(dLon * 60, 2));
                        distAcumulada += distSeg;
                    }
                    iterWpNome = nextWpNome;
                    iterIndex++;
                } else {
                    break;
                }
            }

            if (encontrouDescida) {
                targetFL = flAlvoFinal;
                razaoEfetiva = maiorRazaoNecessaria;
            } else if (!isVia && altClearence < aero.flAtualNum) {
                targetFL = highestRestriction;
                razaoEfetiva = razaoNominal;
            } else if (temRestricaoAtivaFutura) {
                targetFL = aero.flAtualNum;
            } else {
                if (aero.flAtualNum > flCruzeiroSegmento) {
                    targetFL = flCruzeiroSegmento;
                    razaoEfetiva = razaoNominal;
                } else {
                    targetFL = aero.flAtualNum;
                }
            }

            if (aero.flyByProtegido && isVia) {
                let pisoFlyBy = aero.flyByProtegido.flMinimo;
                if (targetFL < pisoFlyBy) {
                    targetFL = pisoFlyBy;
                }
            }
        }
    } else if (!isVia && !isNaN(altClearence)) {
        targetFL = altClearence;
        razaoEfetiva = razaoNominal;
    }

    aero.targetFL = targetFL;
    aero.target_altitude = targetFL * 100;
    aero.razaoEfetiva = razaoEfetiva;
}
