import { flightCommandService } from './FlightCommandService.js';
import { authorize_approach, cancel_approach, DESCENT_MODES, findFirstIACFix } from '../controllers/ApproachProfileManager.js';
import { fixosNavegacao } from '../data/data.js';
import { AircraftStateMutator } from '../core/AircraftStateMutator.js';

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

        if (/\bILS\b/.test(texto)) {
            flightCommandService.setLevel(aero, "ILS");
            aero.textoLivre = aero.textoLivre.replace(/\bILS\b/g, '').trim();
            aero.ultimoComandoTexto = aero.textoLivre;
            texto = aero.textoLivre.toUpperCase().trim();
        }

        const matchProa = texto.match(/\bH(\d{3})(\+?)/);
        if (matchProa) {
            const proa = parseInt(matchProa[1], 10);
            const ladoMaior = (matchProa[2] === '+');
            flightCommandService.setHeading(aero, proa, ladoMaior);
        }

        const matchMIN = /\bMIN\b/.test(texto);
        const matchVel = texto.match(/\b(\d{2})K\b/);
        const matchResume = /\b(FREE|FREEV|RSM|RSV|NORM|RESUME|VFREE|AUTO)\b/.test(texto);

        if (matchResume) {
            flightCommandService.setSpeed(aero, "AUTO");
        } else if (matchMIN) {
            flightCommandService.setSpeed(aero, "MIN");
        } else if (matchVel) {
            const novaVel = parseInt(matchVel[1], 10) * 10;
            flightCommandService.setSpeed(aero, novaVel);
        } else {
            if (aero.velocidadeMinima && !matchMIN) {
                aero.velocidadeMinima = false;
            }
            if (aero.velManual && !/\b\d{2}K\b/.test(texto)) {
                flightCommandService.setSpeed(aero, "AUTO");
            }
        }

        const matchSR = /\bSR\b/.test(texto);
        if (matchSR) {
            const iacFix = (aero.nivAutorizado === "VIA" || aero.cleared_approach) ? findFirstIACFix(aero) : null;
            AircraftStateMutator.definirRestricaoVelocidadeVertical(aero, true, iacFix);
        } else if (aero.semRestricoes && !matchSR) {
            AircraftStateMutator.definirRestricaoVelocidadeVertical(aero, false);
        }

        const matchApp = /\b(APX|APP|RNP|IAC|ILS|AUT|PROC)\b/.test(texto);
        const matchNoApp = /\b(NOAPP|NOAPX|CANCEL)\b/.test(texto);
        if (matchApp) {
            authorize_approach(aero);
        } else if (matchNoApp) {
            cancel_approach(aero);
        }

        const matchAlt = texto.match(/\b(?:FL)?(1[0-2][0-9]|0[2-9][0-9])\b/);
        if (matchAlt) {
            flightCommandService.setLevel(aero, matchAlt[1]);
        } else if (/\b(VIA|APP)\b/.test(texto)) {
            flightCommandService.setLevel(aero, "VIA");
        }

        const matchSB = /\b(SB|SPB|BRK)\b/.test(texto);
        const matchNoSB = /\b(NOSB|NOBRK|SBOFF)\b/.test(texto);
        if (matchNoSB) {
            AircraftStateMutator.definirSpeedbrakes(aero, false);
        } else if (matchSB) {
            AircraftStateMutator.definirSpeedbrakes(aero, true);
        } else if (aero.speedbrakesComando && !matchSB) {
            AircraftStateMutator.definirSpeedbrakes(aero, false);
        }

        const dicFixos = { ...DIC_FIXOS_PADRAO };
        if (Array.isArray(fixosNavegacao)) {
            fixosNavegacao.forEach(f => {
                if (f.nome && !dicFixos[f.nome]) {
                    dicFixos[f.nome] = f.nome;
                }
            });
        }

        let wpTarget = null;
        for (let key in dicFixos) {
            const regex = new RegExp(`\\b${key}\\b`, 'i');
            if (regex.test(texto)) {
                wpTarget = dicFixos[key];
                break;
            }
        }
        if (!wpTarget) {
            for (let key in dicFixos) {
                if (texto.includes(key) || texto.includes(dicFixos[key])) {
                    wpTarget = dicFixos[key];
                    break;
                }
            }
        }

        if (wpTarget && !matchProa) {
            flightCommandService.setDirectTo(aero, wpTarget);
        } else if (!wpTarget) {
            aero.ultimoWpComandadoTexto = null;
        }
    }
}

export const commandParser = new CommandParser();

