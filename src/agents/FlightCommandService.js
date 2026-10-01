/**
 * ============================================================================
 * SERVIÇO CENTRALIZADO DE COMANDOS DE VOO E PARSER ATC (FlightCommandService.js)
 * ============================================================================
 * Responsável por:
 * 1. Processar e executar comandos operacionais ATC de forma unificada e padronizada.
 * 2. Garantir paridade 100% idêntica entre seleções na interface gráfica (UI)
 *    e digitação de comandos no Scratchpad da etiqueta.
 * 3. Despachar tarefas pelos canais da cabine virtual (PilotAgent: LATERAL,
 *    VERTICAL, LONGITUDINAL) com validação física e envelopes de voo.
 * ============================================================================
 */

import { state } from '../core/state.js';
import { getAircraftPerformance } from '../data/PerformanceDB.js';
import { fixosNavegacao, montarRotaAPartirDeFixo, isFixoIAC } from '../data/data.js';
import { TASK_TYPES } from './pilotEngine.js';
import { authorize_approach, cancel_approach, DESCENT_MODES, findFirstIACFix } from '../controllers/ApproachProfileManager.js';
import { VERTICAL_MODES } from './VirtualPilot.js';
import { DIC_FIXOS_PADRAO } from './CommandParser.js';

export class FlightCommandService {
    /**
     * Define o nível ou procedimento vertical da aeronave (FL, VIA, ILS, etc.)
     * @param {Object} aero - Instância da aeronave
     * @param {string} level - "ILS", "VIA", "---" ou valor numérico de FL (ex: "070", "040")
     * @param {boolean} [fromUI=false] - Se true, limpa o scratchpad em comandos terminais (VIA/ILS)
     */
    setLevel(aero, level, fromUI = false) {
        if (!aero || !level) return;

        const cmd = String(level).toUpperCase().trim();

        if (cmd === "ILS") {
            const currentAlt = aero.alt || (aero.flAtualNum * 100);
            const flPrev = parseInt(aero.nivAutorizado, 10);
            // Trava a altitude de plataforma sem nunca permitir subida
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

            // Despacha no canal VERTICAL do piloto virtual
            if (aero.pilot) {
                aero.pilot.dispatch('VERTICAL', 'ALTITUDE', { level: "ILS" });
            }

            if (fromUI) {
                aero.textoLivre = "";
                if (state.aeroEditandoTexto === aero) {
                    const el = document.getElementById('inputTextoLivre');
                    if (el) el.value = "";
                }
            }
        } else if (cmd === "VIA") {
    if (!aero.altitude_before_ils) {
        const flPrev = parseInt(aero.nivAutorizado, 10);
        aero.altitude_before_ils = (!isNaN(flPrev) && flPrev > 0) ? (flPrev * 100) : (aero.alt || aero.flAtualNum * 100);
    }
    if (aero.semRestricoes) {
        const nextIacFix = findFirstIACFix(aero);
        if (nextIacFix) aero.srAteFixoIAC = nextIacFix;
    }
    aero.nivAutorizado = "VIA";
    aero.cleared_level = "VIA";
    aero.ils_authorized = false;
    aero.nivAutorizadoFisico = "VIA";
    if (aero.autopilot) aero.autopilot.ils_authorized = false;
    if (aero.pilot) aero.pilot.dispatch("VERTICAL", "ALTITUDE", { level: "VIA" });
} else if (cmd === "APP") {
            // Qualquer seleção ou comando APP é estritamente atribuído a VIA
            if (!aero.altitude_before_ils) {
                const flPrev = parseInt(aero.nivAutorizado, 10);
                aero.altitude_before_ils = (!isNaN(flPrev) && flPrev > 0) ? (flPrev * 100) : (aero.alt || aero.flAtualNum * 100);
            }
            if (aero.semRestricoes) {
                const nextIacFix = findFirstIACFix(aero);
                if (nextIacFix) aero.srAteFixoIAC = nextIacFix;
            }
            aero.nivAutorizado = "VIA";
            aero.cleared_level = "VIA";
            aero.cleared_approach = true;
            aero.autorizadoProcedimento = true;
            aero.ils_authorized = false;
            aero.nivAutorizadoFisico = "VIA";
            if (aero.autopilot) aero.autopilot.ils_authorized = false;

            authorize_approach(aero);

            if (aero.pilot) {
                aero.pilot.dispatch('VERTICAL', 'ALTITUDE', { level: "VIA" });
            }

            if (fromUI) {
                aero.textoLivre = "";
                if (state.aeroEditandoTexto === aero) {
                    const el = document.getElementById('inputTextoLivre');
                    if (el) el.value = "";
                }
            }
        } else if (cmd === "---") {
            aero.nivAutorizado = "---";
            aero.cleared_level = "---";
            aero.nivAutorizadoFisico = "---";
        } else {
            // Nível numérico (ex: "070", "040", "120")
            const nvStr = cmd.replace(/^FL/, '').padStart(3, '0');
            aero.nivAutorizado = nvStr;
            aero.cleared_level = nvStr;
            aero.nivAutorizadoFisico = nvStr;
            aero.ils_authorized = false;
            aero.cleared_approach = false;
            aero.autorizadoProcedimento = false;
            if (aero.autopilot) aero.autopilot.ils_authorized = false;

            if (aero.pilot) {
                aero.pilot.dispatch('VERTICAL', 'ALTITUDE', { level: nvStr });
            }
        }
    }

    /**
     * Comanda proa magnética à aeronave (vetoração radar ATC).
     * @param {Object} aero - Instância da aeronave
     * @param {number|string} heading - Proa (0 a 360)
     * @param {boolean} [ladoMaior=false] - Força curva pelo arco maior (+)
     */
    setHeading(aero, heading, ladoMaior = false) {
        if (!aero) return;
        let proaNum = parseInt(heading, 10);
        if (isNaN(proaNum) || proaNum < 0 || proaNum > 360) return;
        if (proaNum === 360) proaNum = 0;

        if (aero.pilot) {
            aero.pilot.dispatch('LATERAL', 'HEADING', { heading: proaNum, maior: Boolean(ladoMaior) });
        } else {
            aero.modoLNAV = false;
            aero.proaDestino = proaNum;
            aero.curvaForcada = Boolean(ladoMaior);
        }
    }

    /**
     * Comanda velocidade indicada (IAS) ou modo de velocidade (MIN, AUTO/NORM).
     * @param {Object} aero - Instância da aeronave
     * @param {number|string} speedOrMode - Velocidade em nós (ex: 210) ou "MIN", "AUTO", "NORM"
     */
    setSpeed(aero, speedOrMode) {
        if (!aero) return;
        const modoStr = String(speedOrMode).toUpperCase().trim();

        if (modoStr === "MIN") {
            aero.velocidadeMinima = true;
            aero.velManual = false;
        } else if (["AUTO", "NORM", "FREE", "FREEV", "RSM", "RSV", "RESUME", "VFREE"].includes(modoStr)) {
            aero.velocidadeMinima = false;
            aero.velManual = false;
            if (aero.pilot) {
                aero.pilot.dispatch('LONGITUDINAL', 'RESUME_SPEED', {});
            }
        } else {
            const velNum = parseInt(speedOrMode, 10);
            if (!isNaN(velNum) && velNum >= 40 && velNum <= 600) {
                aero.velocidadeMinima = false;
                if (aero.pilot) {
                    aero.pilot.dispatch('LONGITUDINAL', 'SPEED', { speed: velNum });
                } else {
                    aero.velManual = true;
                    aero.velComando = velNum;
                    aero.velDestino = velNum;
                }
            }
        }
    }

    /**
     * Comanda voo direto a um fixo (Direct-To / DCT).
     * Reconstitui dinamicamente o plano de voo a partir do grafo se necessário.
     * @param {Object} aero - Instância da aeronave
     * @param {string} targetWaypoint - Nome do fixo ou mnemônica de 3 letras
     */
    setDirectTo(aero, targetWaypoint) {
        if (!aero || !targetWaypoint) return;
        const raw = targetWaypoint.toUpperCase().trim();

        // Consulta dicionário de mnemônicas e fixos conhecidos
        const fixoAlvo = DIC_FIXOS_PADRAO[raw] || raw;

        let idx = (aero.rota && Array.isArray(aero.rota)) ? aero.rota.indexOf(fixoAlvo) : -1;
        let novaRotaCalculada = null;

        // Se o fixo comandado não está na rota atual, ou já ficou para trás,
        // ou a aeronave está fora de rota, reconstrói pelo grafo
        if (idx === -1 || idx < aero.wpIndex) {
            const rotaGrafo = montarRotaAPartirDeFixo(fixoAlvo, aero.dest || "SBSP");
            if (rotaGrafo && rotaGrafo.length > 0) {
                novaRotaCalculada = rotaGrafo;
                idx = 0;
            }
        }

        const novoWpPendente = (idx !== -1) ? idx : fixoAlvo;
        if (aero.ultimoWpComandadoTexto === novoWpPendente && aero.modoLNAV) {
            return;
        }
        aero.ultimoWpComandadoTexto = novoWpPendente;

        if (aero.pilot) {
            aero.pilot.dispatch('LATERAL', 'DIRECT_TO', {
                target: novoWpPendente,
                isIdx: (typeof novoWpPendente === 'number'),
                novaRota: novaRotaCalculada
            });
        } else {
            if (novaRotaCalculada) aero.rota = novaRotaCalculada;
            if (typeof novoWpPendente === 'number') {
                aero.wpIndex = novoWpPendente;
                aero.wpOffRoute = null;
            } else {
                aero.wpOffRoute = novoWpPendente;
            }
            aero.modoLNAV = true;
            aero.velManual = false;
            aero.flyByProtegido = null;
            aero.desceuParaWp = {};
        }
    }

    /**
     * Comanda razão vertical ou modos verticais específicos (AUTO, EXPEDITE, INCREASE, DECREASE, SET).
     * @param {Object} aero - Instância da aeronave
     * @param {string|number} rateCmd - 'AUTO', 'EXPEDITE', 'INCREASE', 'DECREASE' ou valor numérico
     */
    setVerticalRate(aero, rateCmd) {
        if (!aero) return;
        const perf = getAircraftPerformance(aero.tipo);

        if (rateCmd === 'AUTO') {
            aero.temModificacaoVertical = false;
            aero.clampedAtStructural = false;
            if (aero.pilot) {
                aero.pilot.dispatch('VERTICAL', 'AUTO');
            } else if (aero.virtualPilot) {
                aero.virtualPilot.autoCommand();
            } else {
                aero.verticalMode = VERTICAL_MODES.AUTO;
            }
        } else if (rateCmd === 'EXPEDITE') {
            aero.temModificacaoVertical = true;
            aero.clampedAtStructural = false;
            if (aero.pilot) {
                aero.pilot.dispatch('VERTICAL', TASK_TYPES.EXPEDITE, {});
            } else if (aero.virtualPilot) {
                aero.virtualPilot.expediteCommand();
            } else {
                aero.verticalMode = VERTICAL_MODES.EXPEDITE;
            }
        } else if (rateCmd === 'INCREASE') {
            aero.temModificacaoVertical = true;
            const currentVS = aero.targetVS || aero.currentVS || (aero.verticalSpeed || -1500);
            const isClimbing = currentVS >= 0;
            let newRate = isClimbing ? (currentVS + 500) : (currentVS - 500);
            let wasClamped = false;

            if (isClimbing && newRate > perf.rates.climbStructuralMax) {
                newRate = perf.rates.climbStructuralMax;
                wasClamped = true;
            } else if (!isClimbing && newRate < perf.rates.descentStructuralMax) {
                newRate = perf.rates.descentStructuralMax;
                wasClamped = true;
            }
            aero.clampedAtStructural = wasClamped;

            if (aero.pilot) {
                aero.pilot.dispatch('VERTICAL', TASK_TYPES.VERTICAL_RATE, { rate: newRate });
            } else if (aero.virtualPilot) {
                aero.virtualPilot.increaseRateCommand();
            } else {
                aero.targetVS = newRate;
                aero.verticalMode = VERTICAL_MODES.ATC_RATE;
            }
        } else if (rateCmd === 'DECREASE') {
            aero.temModificacaoVertical = true;
            const currentVS = aero.targetVS || aero.currentVS || (aero.verticalSpeed || -1500);
            const isClimbing = currentVS >= 0;
            let newRate = isClimbing ? Math.max(500, currentVS - 500) : Math.min(-500, currentVS + 500);
            aero.clampedAtStructural = false;

            if (aero.pilot) {
                aero.pilot.dispatch('VERTICAL', TASK_TYPES.VERTICAL_RATE, { rate: newRate });
            } else if (aero.virtualPilot) {
                aero.virtualPilot.decreaseRateCommand();
            } else {
                aero.targetVS = newRate;
                aero.verticalMode = VERTICAL_MODES.ATC_RATE;
            }
        } else {
            // Valor numérico customizado
            const num = parseInt(rateCmd, 10);
            if (!isNaN(num) && num !== 0) {
                const isClimbing = num > 0;
                let clampedRate = num;
                let wasClamped = false;

                if (isClimbing && num > perf.rates.climbStructuralMax) {
                    clampedRate = perf.rates.climbStructuralMax;
                    wasClamped = true;
                } else if (!isClimbing && num < perf.rates.descentStructuralMax) {
                    clampedRate = perf.rates.descentStructuralMax;
                    wasClamped = true;
                }

                aero.clampedAtStructural = wasClamped;
                aero.temModificacaoVertical = true;
                if (aero.virtualPilot) {
                    aero.virtualPilot.clampedAtStructural = wasClamped;
                }

                if (wasClamped) {
                    console.warn(`[Hard Clamp] Razão solicitada (${num} ft/min) excede o limite físico. Limitada a ${clampedRate} ft/min.`);
                }

                if (aero.pilot) {
                    aero.pilot.dispatch('VERTICAL', TASK_TYPES.VERTICAL_RATE, { rate: clampedRate });
                } else if (aero.virtualPilot) {
                    aero.virtualPilot.setRateCommand(clampedRate);
                } else {
                    aero.targetVS = clampedRate;
                    aero.verticalMode = VERTICAL_MODES.ATC_RATE;
                }
            }
        }
    }

}

// Instância Singleton do serviço
export const flightCommandService = new FlightCommandService();
