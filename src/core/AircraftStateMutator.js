import { DESCENT_MODES } from '../controllers/ApproachProfileManager.js';

/**
 * ============================================================================
 * MUTADOR CENTRAL DE ESTADO (AircraftStateMutator.js)
 * ============================================================================
 * Implementa o padrão de "State Reducer" para a aeronave.
 * É a ÚNICA entidade autorizada a alterar os Modos Operacionais da aeronave
 * (Piloto Automático, Limites de Velocidade, FMS, LNAV, VNAV).
 * ============================================================================
 */
export const AircraftStateMutator = {

    // ------------------------------------------------------------------------
    // MUTAÇÕES LATERAIS (LNAV / HEADING)
    // ------------------------------------------------------------------------
    
    ativarModoProa(aero, proaMagnética, forcarCurvaLadoMaior = false) {
        aero.modoLNAV = false;
        aero.proaDestino = proaMagnética;
        aero.curvaForcada = forcarCurvaLadoMaior;
        // console.log(`[STATE] ${aero.callsign}: LNAV OFF -> HDG ${proaMagnética}`);
    },

    ativarModoDiretoFixo(aero, alvo, isIndex = false, novaRotaRecalculada = null) {
        if (novaRotaRecalculada) {
            aero.rota = novaRotaRecalculada;
        }
        
        if (isIndex) {
            aero.wpIndex = alvo;
            aero.wpOffRoute = null;
        } else {
            aero.wpOffRoute = alvo;
        }

        aero.modoLNAV = true;
        aero.velManual = false; // LNAV habitualmente assume o perfil de velocidade gerenciada
        aero.flyByProtegido = null;
        aero.desceuParaWp = {};
        // console.log(`[STATE] ${aero.callsign}: LNAV ON -> DCT ${alvo}`);
    },

    // ------------------------------------------------------------------------
    // MUTAÇÕES VERTICAIS E PROCEDIMENTOS (VIA, ILS, FL)
    // ------------------------------------------------------------------------

    definirNivelVoo(aero, nivelString) {
        aero.nivAutorizado = nivelString;
        aero.cleared_level = nivelString;
        aero.nivAutorizadoFisico = nivelString;
        aero.ils_authorized = false;
        aero.cleared_approach = false;
        aero.autorizadoProcedimento = false;
        if (aero.autopilot) aero.autopilot.ils_authorized = false;
        // console.log(`[STATE] ${aero.callsign}: ALTITUDE SET -> ${nivelString}`);
    },

    ativarAutorizacaoVIA(aero) {
        // Congela a altitude de plataforma para interceção
        if (!aero.altitude_before_ils) {
            const flPrev = parseInt(aero.nivAutorizado, 10);
            aero.altitude_before_ils = (!isNaN(flPrev) && flPrev > 0) ? (flPrev * 100) : (aero.alt || aero.flAtualNum * 100);
        }
        aero.nivAutorizado = "VIA";
        aero.cleared_level = "VIA";
        aero.ils_authorized = false;
        aero.nivAutorizadoFisico = "VIA";
        if (aero.autopilot) aero.autopilot.ils_authorized = false;
        // console.log(`[STATE] ${aero.callsign}: VERTICAL MODE -> VIA APP`);
    },

    ativarAutorizacaoILS(aero) {
        const currentAlt = aero.alt || (aero.flAtualNum * 100);
        const flPrev = parseInt(aero.nivAutorizado, 10);
        
        aero.altitude_before_ils = (!isNaN(flPrev) && flPrev > 0)
            ? Math.min(currentAlt, flPrev * 100)
            : currentAlt;

        aero.nivAutorizado = "ILS";
        aero.cleared_level = "ILS";
        aero.ils_authorized = true;
        aero.cleared_approach = true;
        aero.autorizadoProcedimento = true;
        aero.nivAutorizadoFisico = "ILS";
        if (aero.autopilot) aero.autopilot.ils_authorized = true;
        // console.log(`[STATE] ${aero.callsign}: APPROACH MODE -> CLEARED ILS`);
    },

    // ------------------------------------------------------------------------
    // MUTAÇÕES LONGITUDINAIS E CONFIGURAÇÃO (SPEED, FREIOS)
    // ------------------------------------------------------------------------

    definirModoVelocidade(aero, modo, valorManual = null) {
        if (modo === "MIN") {
            aero.velocidadeMinima = true;
            aero.velManual = false;
            // console.log(`[STATE] ${aero.callsign}: SPEED MODE -> MINIMUM`);
        } else if (modo === "AUTO") {
            aero.velocidadeMinima = false;
            aero.velManual = false;
            // console.log(`[STATE] ${aero.callsign}: SPEED MODE -> MANAGED/AUTO`);
        } else if (modo === "MANUAL" && valorManual !== null) {
            aero.velocidadeMinima = false;
            aero.velManual = true;
            aero.velComando = valorManual;
            aero.velDestino = valorManual;
            // console.log(`[STATE] ${aero.callsign}: SPEED MODE -> SELECTED ${valorManual} KT`);
        }
    },

    definirRestricaoVelocidadeVertical(aero, isUnrestricted, primeiroFixoIAC = null) {
        aero.semRestricoes = isUnrestricted;
        if (isUnrestricted) {
            if (!aero.cleared_approach) {
                aero.descent_mode = DESCENT_MODES.OPEN_DESCENT;
                aero.verticalMode = 'OP-D';
            }
            if ((aero.nivAutorizado === "VIA" || aero.cleared_approach) && primeiroFixoIAC) {
                aero.srAteFixoIAC = primeiroFixoIAC;
            }
        } else {
            if (!aero.cleared_approach) {
                aero.descent_mode = DESCENT_MODES.RESTRICTED_DESCENT;
                aero.verticalMode = 'AUTO';
            }
        }
    },

    definirSpeedbrakes(aero, ativo) {
        aero.speedbrakes = ativo;
        aero.speedbrakesComando = ativo;
        // Se ativou speedbrake, garante que a restrição de velocidade mínima seja desativada se entrar em conflito
        if (ativo && aero.velocidadeMinima) {
            aero.velocidadeMinima = false;
        }
    }
};
