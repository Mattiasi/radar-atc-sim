/**
 * ============================================================================
 * PILOTO VIRTUAL E MÁQUINA DE ESTADOS VERTICAIS (VirtualPilot.js)
 * ============================================================================
 * Gerencia as decisões de voo, FSM de modos verticais e controle de aproximação:
 * - 'AUTO': Perfil ótimo de 3° calculado por Distance-To-Go (DTG) e reduções de velocidade.
 * - 'ATC_RATE': Razão vertical imposta pelo controlador (INCREASE, DECREASE, SET).
 * - 'EXPEDITE': Razão operacional máxima da aeronave (climbExpedite / descentExpedite).
 * ============================================================================
 */

import { getAircraftPerformance } from './PerformanceDB.js';
import { DESCENT_MODES } from './ApproachProfileManager.js';

export const VERTICAL_MODES = {
    AUTO: 'AUTO',
    RESTRICTED_DESCENT: 'AUTO',
    OPEN_DESCENT: 'OP-D',
    APPROACH_PROFILE: 'APP',
    GLIDEPATH: 'G/S',
    ATC_RATE: 'ATC-R',
    EXPEDITE: 'EXPD'
};

export class VirtualPilot {
    /**
     * @param {Object} aero - Instância da Aeronave associada
     */
    constructor(aero) {
        this.aero = aero;
        this.verticalMode = VERTICAL_MODES.AUTO;
        this.targetVS = 0;
        this.clampedAtStructural = false; // Flag visual: teto estrutural atingido
    }

    /**
     * Executa a lógica de decisão do piloto virtual em cada ciclo físico.
     * @param {number} dt - Passo de tempo em segundos
     */
    update(dt) {
        const aero = this.aero;
        if (!aero) return;

        // Se a aeronave estiver sob controle vertical de Glide Slope / Flare / Touchdown (ILS ou RNAV/VIA):
        const emGuiamentoVerticalFinal = (
            (aero.autopilot && (
                aero.autopilot.vertical_mode === 'GS_CAPTURE' ||
                aero.autopilot.vertical_mode === 'GS_TRACK' ||
                aero.autopilot.vertical_mode === 'FLARE' ||
                aero.autopilot.vertical_mode === 'TOUCHDOWN'
            )) ||
            aero.descent_mode === 'GLIDEPATH' ||
            aero.descent_mode === 'FLARE' ||
            aero.on_ground
        );
        if (emGuiamentoVerticalFinal) {
            this.verticalMode = (aero.descent_mode === 'FLARE' || (aero.autopilot && aero.autopilot.vertical_mode === 'FLARE')) ? 'FLARE' : 'G/S';
            aero.verticalMode = this.verticalMode;
            // O ILSController ou ApproachProfileManager calcula continuamente a targetVS física.
            return;
        }

        const perf = getAircraftPerformance(aero.tipo);
        const alt = aero.alt || (aero.flAtualNum * 100);
        
        // Determina a altitude alvo autorizada em pés
        let targetAlt = alt;
        if (aero.cleared_level === "ILS" || aero.nivAutorizado === "ILS") {
            targetAlt = aero.altitude_before_ils || (aero.flAtualNum * 100);
        } else if (aero.target_altitude !== undefined && !isNaN(aero.target_altitude)) {
            targetAlt = aero.target_altitude;
        } else if (aero.targetFL !== undefined && !isNaN(aero.targetFL)) {
            targetAlt = aero.targetFL * 100;
        } else if (aero.nivAutorizadoFisico && aero.nivAutorizadoFisico !== "VIA" && aero.nivAutorizadoFisico !== "---") {
            const flNum = parseInt(aero.nivAutorizadoFisico, 10);
            if (!isNaN(flNum)) targetAlt = flNum * 100;
        } else if (aero.nivAutorizado && aero.nivAutorizado !== "VIA" && aero.nivAutorizado !== "---") {
            const flNum = parseInt(aero.nivAutorizado, 10);
            if (!isNaN(flNum)) targetAlt = flNum * 100;
        }

        const altDiff = targetAlt - alt;
        const isClimbing = altDiff > 50;
        const isDescending = altDiff < -50;

        // Se estiver dentro da janela de captura de altitude (±100 ft), nivele asas
        if (Math.abs(altDiff) <= 100) {
            aero.targetVS = 0;
            if (this.verticalMode !== VERTICAL_MODES.AUTO && !aero.cleared_approach) {
                this.verticalMode = VERTICAL_MODES.AUTO;
                this.clampedAtStructural = false;
                aero.temModificacaoVertical = false;
            }
            aero.verticalMode = aero.cleared_approach
                ? (aero.descent_mode === DESCENT_MODES.GLIDEPATH ? 'G/S' : 'APP')
                : (aero.verticalMode || this.verticalMode);
            return;
        }

        // =====================================================================
        // MÁQUINA DE ESTADOS VERTICAL
        // =====================================================================
        switch (this.verticalMode) {
            case 'APP':
            case 'G/S':
            case 'OP-D':
            case VERTICAL_MODES.AUTO: {
                this.clampedAtStructural = false;
                const dtg = Math.max(0.5, (aero.distanceToGoNM !== undefined) ? aero.distanceToGoNM : (aero.dtg || 20.0));
                const gs = aero.gs || aero.groundSpeed || aero.vel || 250;

                let vsRequired;
                if (isClimbing) {
                    vsRequired = (aero.razaoEfetiva !== undefined && aero.razaoEfetiva > 0)
                        ? aero.razaoEfetiva
                        : perf.rates.climbNormal;
                    vsRequired = Math.min(vsRequired, perf.rates.climbNormal);
                } else if (isDescending) {
                    vsRequired = (aero.razaoEfetiva !== undefined && aero.razaoEfetiva > 0)
                        ? -aero.razaoEfetiva
                        : ((altDiff / dtg) * (gs / 60));
                    vsRequired = Math.max(vsRequired, perf.rates.descentNormal);
                } else {
                    vsRequired = 0;
                }

                aero.targetVS = vsRequired;

                // Gestão de velocidade: mantém velocidade de subida ou segue perfil DTG em descida
                if (!aero.velManual) {
                    if (aero.velocidadeMinima) {
                        const vCleanMin = (perf.speeds && perf.speeds.vCleanMin) || 210;
                        const vAppMin = (perf.speeds && perf.speeds.vAppMin) || perf.minApproachSpeed || 135;
                        aero.targetIAS = (typeof aero.estaProximaDoAIC === 'function' && aero.estaProximaDoAIC())
                            ? vAppMin
                            : vCleanMin;
                    } else if (aero.cleared_approach) {
                        const vAppMin = (perf.speeds && perf.speeds.vAppMin) || perf.minApproachSpeed || 140;
                        aero.targetIAS = vAppMin;
                    } else if (isDescending) {
                        aero.targetIAS = this.calcularIASPerfilDTG(dtg, perf);
                    } else if (isClimbing) {
                        aero.targetIAS = perf.speeds?.vClimb || 250;
                    }
                }
                break;
            }

            case VERTICAL_MODES.EXPEDITE: {
                this.clampedAtStructural = false;
                if (isClimbing) {
                    aero.targetVS = perf.rates.climbExpedite;
                } else if (isDescending) {
                    aero.targetVS = perf.rates.descentExpedite;
                } else {
                    aero.targetVS = 0;
                    this.verticalMode = VERTICAL_MODES.AUTO;
                }
                break;
            }

            case VERTICAL_MODES.ATC_RATE: {
                // Mantém a razão estabelecida pelas ações INCREASE, DECREASE ou SET
                // Garante que a direção da razão coincida com o sentido da autorização
                if (isClimbing && aero.targetVS < 0) {
                    aero.targetVS = Math.abs(aero.targetVS);
                } else if (isDescending && aero.targetVS > 0) {
                    aero.targetVS = -Math.abs(aero.targetVS);
                }
                break;
            }
        }

        // Sincroniza propriedade na aeronave para exibição e física
        aero.verticalMode = this.verticalMode;
        aero.clampedAtStructural = this.clampedAtStructural;
    }

    /**
     * Calcula a velocidade indicada ideal conforme faixas de Distance-To-Go.
     * > 25 NM: 250 kt
     * 25-15 NM: 220 kt
     * 15-10 NM: 180 kt
     * < 4 NM: vApp
     * @param {number} dtg - Distância até o toque em NM
     * @param {Object} perf - Configuração de performance da aeronave
     * @returns {number} Velocidade indicada alvo (kt)
     */
    calcularIASPerfilDTG(dtg, perf) {
        const vApp = perf.speeds?.vApp || 140;
        if (dtg > 25.0) return perf.speeds?.vCruise ? Math.min(250, perf.speeds.vCruise) : 250;
        if (dtg > 15.0) return 220;
        if (dtg > 10.0) return 180;
        if (dtg > 4.0) return 160;
        return vApp;
    }

    /**
     * Comando ATC: SET [Valor]
     * Aplica trava estrutural obrigatória (Hard Clamp Rule).
     * @param {number} requestedRate - Razão desejada em ft/min (+ subida, - descida)
     */
    setRateCommand(requestedRate) {
        const aero = this.aero;
        const perf = getAircraftPerformance(aero.tipo);
        const isClimbing = requestedRate > 0;

        let clampedRate = requestedRate;
        this.clampedAtStructural = false;

        if (isClimbing) {
            if (requestedRate > perf.rates.climbStructuralMax) {
                clampedRate = perf.rates.climbStructuralMax;
                this.clampedAtStructural = true;
            }
        } else {
            if (requestedRate < perf.rates.descentStructuralMax) {
                clampedRate = perf.rates.descentStructuralMax;
                this.clampedAtStructural = true;
            }
        }

        aero.targetVS = clampedRate;
        this.verticalMode = VERTICAL_MODES.ATC_RATE;
        aero.verticalMode = this.verticalMode;
        aero.clampedAtStructural = this.clampedAtStructural;
        aero.temModificacaoVertical = true;

        return clampedRate;
    }

    /**
     * Comando ATC: INCREASE
     * Incrementa a magnitude da razão vertical em +500 ft/min.
     */
    increaseRateCommand() {
        const aero = this.aero;
        const perf = getAircraftPerformance(aero.tipo);
        const currentVS = aero.targetVS || aero.currentVS || (aero.verticalSpeed || -1500);
        const isClimbing = currentVS >= 0;

        let newRate;
        if (isClimbing) {
            newRate = currentVS + 500;
            if (newRate > perf.rates.climbStructuralMax) {
                newRate = perf.rates.climbStructuralMax;
                this.clampedAtStructural = true;
            } else {
                this.clampedAtStructural = false;
            }
        } else {
            newRate = currentVS - 500;
            if (newRate < perf.rates.descentStructuralMax) {
                newRate = perf.rates.descentStructuralMax;
                this.clampedAtStructural = true;
            } else {
                this.clampedAtStructural = false;
            }
        }

        aero.targetVS = newRate;
        this.verticalMode = VERTICAL_MODES.ATC_RATE;
        aero.verticalMode = this.verticalMode;
        aero.clampedAtStructural = this.clampedAtStructural;
        aero.temModificacaoVertical = true;
    }

    /**
     * Comando ATC: DECREASE
     * Reduz a magnitude da razão vertical em -500 ft/min (mínimo de magnitude: 500 ft/min).
     */
    decreaseRateCommand() {
        const aero = this.aero;
        const currentVS = aero.targetVS || aero.currentVS || (aero.verticalSpeed || -1500);
        const isClimbing = currentVS >= 0;

        let newRate;
        if (isClimbing) {
            newRate = Math.max(500, currentVS - 500);
        } else {
            newRate = Math.min(-500, currentVS + 500);
        }

        this.clampedAtStructural = false;
        aero.targetVS = newRate;
        this.verticalMode = VERTICAL_MODES.ATC_RATE;
        aero.verticalMode = this.verticalMode;
        aero.clampedAtStructural = this.clampedAtStructural;
        aero.temModificacaoVertical = true;
    }

    /**
     * Comando ATC: EXPEDITE
     */
    expediteCommand() {
        this.verticalMode = VERTICAL_MODES.EXPEDITE;
        this.clampedAtStructural = false;
        const aero = this.aero;
        const perf = getAircraftPerformance(aero.tipo);

        const alt = aero.alt || (aero.flAtualNum * 100);
        const targetAlt = (parseInt(aero.nivAutorizadoFisico || aero.nivAutorizado, 10) || aero.flAtualNum) * 100;

        if (targetAlt > alt) {
            aero.targetVS = perf.rates.climbExpedite;
        } else {
            aero.targetVS = perf.rates.descentExpedite;
        }

        aero.verticalMode = this.verticalMode;
        aero.clampedAtStructural = this.clampedAtStructural;
        aero.temModificacaoVertical = true;
    }

    /**
     * Comando ATC: AUTO
     */
    autoCommand() {
        this.verticalMode = VERTICAL_MODES.AUTO;
        this.clampedAtStructural = false;
        if (this.aero) {
            this.aero.verticalMode = this.verticalMode;
            this.aero.clampedAtStructural = false;
            this.aero.temModificacaoVertical = false;
        }
    }
}
