import { flightCommandService } from './FlightCommandService.js';
import { authorize_approach, cancel_approach, DESCENT_MODES, findFirstIACFix } from '../controllers/ApproachProfileManager.js';
import { fixosNavegacao } from '../data/data.js';
import { AircraftStateMutator } from '../core/AircraftStateMutator.js';
import { state } from '../core/state.js';

export const DIC_FIXOS_PADRAO = {
    "PRU": "PRUMO", "IRP": "IROPU", "LVD": "LUVDI", "GRS": "GERSU",
    "URU": "URUTA", "SP139": "SP139", "KMG": "KOMGU", "OGT": "OGTAL",
    "SP017": "SP017", "SP099": "SP099", "SP101": "SP101", 
    "SP032": "SP032", "SBSP": "SBSP", "SBJH": "SBJH", "SBGR": "SBGR", "SBMT": "SBMT"
};

export class CommandParser {
    parseAndExecuteScratchpad(aero, rawText) {
        if (!aero) return;
        let texto = (rawText || "").toUpperCase().trim();

        if (texto === aero.ultimoComandoTexto) return;
        aero.ultimoComandoTexto = texto;

        if (!aero.comandosAtivos) {
            aero.comandosAtivos = {
                waypoint: null,
                heading: null,
                speed: null,
                altitude: null,
                approach: null,
                ils: null,
                runway: null,
                restriction: null,
                speedbrakes: null
            };
        }

        // 1. ILS e RUNWAY (Consome os tokens do textoLivre se encontrados)
        const matchILS = texto.match(/\bILS(?:\s+(\d{1,2}[RCL]?))?\b/);
        if (matchILS) {
            const rwyPista = matchILS[1] || null;
            const isNewILS = !aero.comandosAtivos.ils || (rwyPista && aero.comandosAtivos.ils.runway !== rwyPista);
            if (isNewILS) {
                flightCommandService.setLevel(aero, "ILS");
                authorize_approach(aero);
                if (rwyPista) {
                    aero.assigned_runway = rwyPista;
                    aero.pistaAtribuida = rwyPista;
                }
                aero.comandosAtivos.ils = { runway: rwyPista };
            }
        }

        const matchRwy = texto.match(/\b(?:RWY|RW)\s*(\d{1,2}[RCL]?)\b/);
        if (matchRwy) {
            const rwyVal = matchRwy[1];
            if (aero.comandosAtivos.runway !== rwyVal) {
                aero.assigned_runway = rwyVal;
                aero.pistaAtribuida = rwyVal;
                aero.comandosAtivos.runway = rwyVal;
            }
        }

        // 2. PROA (HEADING) - aceita H250, H250E, H250D, H250+, 250H, 250HE, 250HD, 250H+
        const matchProa = texto.match(/\b(?:H(\d{3})([ED\+]?)|\b(\d{3})H([ED\+]?))\b/i);
        let headingCmd = null;
        if (matchProa) {
            const numStr = matchProa[1] || matchProa[3];
            const modStr = (matchProa[2] || matchProa[4] || '').toUpperCase();
            const ladoOuDir = (modStr === 'E' || modStr === 'D') ? modStr : (modStr === '+');
            headingCmd = {
                proa: parseInt(numStr, 10),
                ladoMaior: (modStr === '+'),
                direcao: (modStr === 'E' || modStr === 'D') ? modStr : null,
                ladoMaiorOuDirecao: ladoOuDir
            };
        }

        // 2.1 HOLDING PATTERN (HLD, HLD<, HLD>, HLDE, HLDD)
        const matchHold = texto.match(/\bHLD([<>ED]?)(?=\s|$)/i);
        let holdingCmd = null;
        if (matchHold) {
            const modHold = (matchHold[1] || '').toUpperCase();
            const ladoHold = (modHold === '<' || modHold === 'E') ? 'E' : 'D';
            holdingCmd = { lado: ladoHold };
        }

        // 3. WAYPOINT / DIRETO A FIXO (DIRECT-TO)
        const dicFixos = { ...DIC_FIXOS_PADRAO };
        if (Array.isArray(fixosNavegacao)) {
            fixosNavegacao.forEach(f => {
                if (f.nome && !dicFixos[f.nome]) {
                    dicFixos[f.nome] = f.nome;
                }
            });
        }
        if (state.fixos) {
            Object.keys(state.fixos).forEach(nome => {
                if (!dicFixos[nome]) {
                    dicFixos[nome] = nome;
                }
            });
        }

        const chavesOrdenadas = Object.keys(dicFixos).sort((a, b) => b.length - a.length);
        let wpTarget = null;
        for (const key of chavesOrdenadas) {
            const regex = new RegExp(`\\b${key}\\b`, 'i');
            if (regex.test(texto)) {
                wpTarget = dicFixos[key];
                break;
            }
        }
        if (!wpTarget) {
            for (const key of chavesOrdenadas) {
                if (key.length >= 4 && (texto.includes(key) || texto.includes(dicFixos[key]))) {
                    wpTarget = dicFixos[key];
                    break;
                }
            }
        }

        // Execução Lateral: Holding vs Proa vs Waypoint
        if (holdingCmd) {
            const prevHold = aero.comandosAtivos.holding;
            const isNewHold = !prevHold || prevHold.lado !== holdingCmd.lado || !aero.modoHolding;
            if (isNewHold) {
                flightCommandService.setHolding(aero, holdingCmd.lado);
                aero.comandosAtivos.holding = { ...holdingCmd };
                aero.comandosAtivos.heading = null;
            }
        } else if (headingCmd) {
            const prevHdg = aero.comandosAtivos.heading;
            const isNewHdg = !prevHdg || prevHdg.proa !== headingCmd.proa || prevHdg.ladoMaiorOuDirecao !== headingCmd.ladoMaiorOuDirecao || aero.modoHolding;
            if (isNewHdg) {
                flightCommandService.setHeading(aero, headingCmd.proa, headingCmd.ladoMaiorOuDirecao);
                aero.comandosAtivos.heading = { ...headingCmd };
                aero.comandosAtivos.holding = null;
            }
        } else if (wpTarget) {
            // Só executa se for um novo fixo (diferente do último fixo comandado)
            // ou se a aeronave não estiver em LNAV (ex: estava em proa manual)
            const fixoJaComandado = (aero.comandosAtivos.waypoint === wpTarget);
            const deveExecutar = !fixoJaComandado || !aero.modoLNAV;
            if (deveExecutar) {
                flightCommandService.setDirectTo(aero, wpTarget);
                aero.comandosAtivos.waypoint = wpTarget;
            }
        }

        // 4. VELOCIDADE (SPEED)
        let speedCmd = null;
        const matchResume = /\b(FREE|FREEV|RSM|RSV|NORM|RESUME|VFREE|AUTO)\b/.test(texto);
        const matchMIN = /\bMIN\b/.test(texto);
        const matchVel3K = texto.match(/\b(\d{3})K\b/);
        const matchVel2K = texto.match(/\b(\d{2})K\b/);
        const matchVelV = texto.match(/\bV(\d{2,3})K?\b/);
        const matchVelNum = texto.match(/\b(1[3-9]\d|[23]\d\d)\b/);

        if (matchResume) {
            speedCmd = { type: 'AUTO' };
        } else if (matchMIN) {
            speedCmd = { type: 'MIN' };
        } else if (matchVel3K) {
            speedCmd = { type: 'NUM', value: parseInt(matchVel3K[1], 10) };
        } else if (matchVel2K) {
            speedCmd = { type: 'NUM', value: parseInt(matchVel2K[1], 10) * 10 };
        } else if (matchVelV) {
            let v = parseInt(matchVelV[1], 10);
            if (v < 100) v *= 10;
            speedCmd = { type: 'NUM', value: v };
        } else if (matchVelNum) {
            speedCmd = { type: 'NUM', value: parseInt(matchVelNum[1], 10) };
        }

        if (speedCmd) {
            const prevSpd = aero.comandosAtivos.speed;
            let isNewSpd = false;
            if (!prevSpd) {
                isNewSpd = true;
            } else if (prevSpd.type !== speedCmd.type) {
                isNewSpd = true;
            } else if (speedCmd.type === 'NUM' && prevSpd.value !== speedCmd.value) {
                isNewSpd = true;
            }

            if (isNewSpd) {
                if (speedCmd.type === 'AUTO') {
                    flightCommandService.setSpeed(aero, "AUTO");
                } else if (speedCmd.type === 'MIN') {
                    flightCommandService.setSpeed(aero, "MIN");
                } else if (speedCmd.type === 'NUM') {
                    flightCommandService.setSpeed(aero, speedCmd.value);
                }
                aero.comandosAtivos.speed = { ...speedCmd };
            }
        } else {
            // Suporte para quando a opção MIN é desmarcada via menu de níveis
            if (aero.velocidadeMinima && !matchMIN) {
                aero.velocidadeMinima = false;
                flightCommandService.setSpeed(aero, "AUTO");
                aero.comandosAtivos.speed = { type: 'AUTO' };
            }
        }

        // 5. RESTRIÇÃO VERTICAL / VELOCIDADE (SR)
        const matchSR = /\bSR\b/.test(texto);
        const matchNoSR = /\b(NOSR|CSR|REST)\b/.test(texto);
        let srCmd = null;
        if (matchNoSR) {
            srCmd = false;
        } else if (matchSR) {
            srCmd = true;
        }

        if (srCmd !== null) {
            if (aero.comandosAtivos.restriction !== srCmd) {
                if (srCmd) {
                    const iacFix = (aero.nivAutorizado === "VIA" || aero.cleared_approach) ? findFirstIACFix(aero) : null;
                    AircraftStateMutator.definirRestricaoVelocidadeVertical(aero, true, iacFix);
                } else {
                    AircraftStateMutator.definirRestricaoVelocidadeVertical(aero, false);
                }
                aero.comandosAtivos.restriction = srCmd;
            }
        } else if (state.aeroEditandoNivel === aero && aero.semRestricoes && !matchSR) {
            // Desmarcado via menu de nível
            AircraftStateMutator.definirRestricaoVelocidadeVertical(aero, false);
            aero.comandosAtivos.restriction = false;
        }

        // 6. APROXIMAÇÃO / PROCEDIMENTO (APP / NOAPP)
        const matchApp = /\b(APX|APP|RNP|IAC|AUT|PROC)\b/.test(texto);
        const matchNoApp = /\b(NOAPP|NOAPX|CANCEL)\b/.test(texto);
        if (matchNoApp) {
            if (aero.comandosAtivos.approach !== 'NOAPP') {
                cancel_approach(aero);
                aero.comandosAtivos.approach = 'NOAPP';
            }
        } else if (matchApp) {
            if (aero.comandosAtivos.approach !== 'APP') {
                authorize_approach(aero);
                aero.comandosAtivos.approach = 'APP';
            }
        }

        // 7. NÍVEL DE VOO / ALTITUDE (FL)
        const matchAlt = texto.match(/\b(?:FL)?(1[0-2][0-9]|0[2-9][0-9])\b/);
        const matchFLHigh = texto.match(/\bFL\s*(\d{2,3})\b/);
        let altCmd = null;
        if (matchAlt) {
            altCmd = matchAlt[1];
        } else if (matchFLHigh) {
            altCmd = matchFLHigh[1].padStart(3, '0');
        } else if (/\b(VIA|APP)\b/.test(texto) && !matchILS) {
            altCmd = "VIA";
        }

        if (altCmd) {
            if (aero.comandosAtivos.altitude !== altCmd) {
                flightCommandService.setLevel(aero, altCmd);
                aero.comandosAtivos.altitude = altCmd;
            }
        }

        // 8. SPEEDBRAKES (SB / NOSB)
        const matchSB = /\b(SB|SPB|BRK)\b/.test(texto);
        const matchNoSB = /\b(NOSB|NOBRK|SBOFF)\b/.test(texto);
        let sbCmd = null;
        if (matchNoSB) {
            sbCmd = false;
        } else if (matchSB) {
            sbCmd = true;
        }

        if (sbCmd !== null) {
            if (aero.comandosAtivos.speedbrakes !== sbCmd) {
                AircraftStateMutator.definirSpeedbrakes(aero, sbCmd);
                aero.comandosAtivos.speedbrakes = sbCmd;
            }
        }
    }
}

export const commandParser = new CommandParser();
