/**
 * ============================================================================
 * GERENCIADOR DE PROCEDIMENTOS DE APROXIMAÇÃO E MÁQUINA DE ESTADOS VERTICAL
 * (ApproachProfileManager.js)
 * ============================================================================
 * Responsável por:
 * 1. Definir os modos verticais canônicos do simulador ATC:
 *    - RESTRICTED_DESCENT: Descida cumprindo restrições da carta/STAR.
 *    - OPEN_DESCENT: Descida direta (Sem Restrições / SR) para o nível autorizado.
 *    - APPROACH_PROFILE: Perfil vertical gradual de descida da IAC (Step-Downs).
 *    - GLIDEPATH: Captura e rastreamento da rampa final (GS / GP de 3°).
 * 2. Processar a autorização de aproximação (Comando "APP" / authorize_approach).
 * 3. Gerenciar as travas verticais físicas (hold_altitude_until_waypoint) para
 *    impedir que a aeronave desça abaixo de cada fixo da IAC antes de cruzá-lo.
 * 4. Aplicar a Regra de Segurança: aeronaves abaixo do perfil nunca sobem ao receber APP.
 * 5. Sequenciar degraus de altitude entre fixos (IAF -> IF -> FAF -> SDF -> Pista).
 * ============================================================================
 */

import { state } from '../core/state.js';
import { cartasNavegacao, restricoesFixos, isFixoIAC, montarRotaAPartirDeFixo, getRunwayData } from '../data/data.js';
import { calcularRumoDistancia } from '../utils/utils.js';
import { calculateILSGeometry } from './ILSController.js';

/**
 * Modos verticais e de descida suportados pelo simulador ATC.
 */
export const DESCENT_MODES = {
    RESTRICTED_DESCENT: 'RESTRICTED_DESCENT', // Desce respeitando restrições intermediárias da carta
    OPEN_DESCENT: 'OPEN_DESCENT',             // Desce direto ao nível selecionado (Sem Restrições / SR)
    APPROACH_PROFILE: 'APPROACH_PROFILE',     // Procedimento da IAC ativo com travas de fixo (APP)
    GLIDEPATH: 'GLIDEPATH'                   // Rastreamento da rampa final de 3° (GS / GP)
};

/**
 * Mapeamento dos modos para exibição resumida na etiqueta do radar (6ª linha).
 */
export const DESCENT_MODE_TAG_LABELS = {
    [DESCENT_MODES.RESTRICTED_DESCENT]: 'AUTO',
    [DESCENT_MODES.OPEN_DESCENT]: 'OP-D',
    [DESCENT_MODES.APPROACH_PROFILE]: 'APP',
    [DESCENT_MODES.GLIDEPATH]: 'G/S'
};

/**
 * Obtém a carta IAC/AIC ativa aplicável para a aeronave.
 * @param {Object} aircraft - Instância da aeronave
 * @returns {Object|null} Carta de aproximação por instrumentos
 */
export function getActiveIAC(aircraft) {
    if (aircraft && aircraft.active_iac) return aircraft.active_iac;

    if (typeof cartasNavegacao === 'object' && cartasNavegacao && cartasNavegacao["SBSP"] && cartasNavegacao["SBSP"]["17R"] && cartasNavegacao["SBSP"]["17R"].AIC) {
        // Carta padrão para SBSP RNP Y RWY 17R
        if (cartasNavegacao["SBSP"]["17R"].AIC["RNPY17R"]) {
            return cartasNavegacao["SBSP"]["17R"].AIC["RNPY17R"];
        }
        return Object.values(cartasNavegacao["SBSP"]["17R"].AIC)[0] || null;
    }
    return null;
}

/**
 * Identifica o próximo fixo na sequência geométrica/estruturada da carta IAC.
 * @param {string} currentFixName - Nome do fixo atual
 * @param {Object} [active_iac=null] - Carta IAC ativa
 * @returns {string|null} Nome do próximo fixo ou null se fim do procedimento
 */
export function getNextIACFix(currentFixName, active_iac = null) {
    if (!currentFixName) return null;
    const iac = active_iac || getActiveIAC();
    if (!iac || !iac.linhas) return null;

    for (const linha of iac.linhas) {
        const idx = linha.indexOf(currentFixName);
        if (idx !== -1 && idx + 1 < linha.length) {
            return linha[idx + 1];
        }
    }

    // Se o fixo for o último de uma perna interna (ex: SP017), o próximo é o destino final (pista / SBSP)
    if (currentFixName === "SP017") {
        return "SBSP";
    }

    return null;
}

/**
 * Identifica o primeiro fixo aplicável da IAC para a aeronave.
 * Analisa a rota remanescente, fixo temporário direto (DCT) ou proximidade geométrica se vetorada.
 * @param {Object} aircraft - Instância da aeronave
 * @param {Object} [active_iac=null] - Carta IAC
 * @returns {string} Nome do primeiro fixo da IAC (ex: "KOMGU", "LUVDI" ou "GERSU")
 */
export function findFirstIACFix(aircraft, active_iac = null) {
    const iac = active_iac || getActiveIAC(aircraft);

    // 1. Busca na rota remanescente ativa da aeronave
    if (aircraft.rota && Array.isArray(aircraft.rota)) {
        const startIdx = (typeof aircraft.wpIndex === 'number') ? aircraft.wpIndex : 0;
        for (let i = startIdx; i < aircraft.rota.length; i++) {
            const wp = aircraft.rota[i];
            if (isFixoIAC(wp)) {
                return wp;
            }
        }
    }

    // 2. Busca no waypoint direto fora de rota (DCT pendente)
    if (aircraft.wpOffRoute && isFixoIAC(aircraft.wpOffRoute)) {
        return aircraft.wpOffRoute;
    }

    // 3. Caso tenha sido vetorada por proa manual ou esteja fora da rota:
    // Analisa a rota original de spawn da esteira (OGTAL -> KOMGU, PRUMO/ORESU -> LUVDI)
    if (aircraft.rotaOriginal === "OGTAL" || (aircraft.rota && aircraft.rota.includes("OGTAL"))) {
        return "KOMGU";
    }
    if (aircraft.rotaOriginal === "PRUMO" || (aircraft.rota && aircraft.rota.includes("PRUMO"))) {
        return "LUVDI";
    }

    // 4. Se não houver histórico de esteira, seleciona o IAF/IF mais próximo
    const fixosCandidatos = ["KOMGU", "LUVDI", "GERSU"];
    let menorDist = Infinity;
    let melhorFixo = "KOMGU";

    for (const fNome of fixosCandidatos) {
        const coords = state.fixos ? state.fixos[fNome] : null;
        if (coords) {
            const nav = calcularRumoDistancia(aircraft, coords);
            if (nav && nav.distanciaNM < menorDist) {
                menorDist = nav.distanciaNM;
                melhorFixo = fNome;
            }
        }
    }

    return melhorFixo;
}

/**
 * Obtém a restrição de altitude em pés de um fixo.
 * @param {string} fixName - Nome do fixo
 * @param {Object} [active_iac=null] - Carta IAC
 * @returns {number} Altitude em pés (ex: FL 55 -> 5500)
 */
export function getFixAltitudeFt(fixName, active_iac = null) {
    if (!fixName) return 5500;

    const rest = restricoesFixos[fixName];
    if (rest && rest.fl !== undefined) {
        return rest.fl * 100;
    }

    const iac = active_iac || getActiveIAC();
    if (iac && iac.fixos) {
        const f = iac.fixos.find(item => item.nome === fixName);
        if (f && f.restricao && f.restricao.fl !== undefined) {
            return f.restricao.fl * 100;
        }
    }

    return 5500;
}

/**
 * ----------------------------------------------------------------------------
 * COMANDO ATC: AUTORIZAÇÃO DE PROCEDIMENTO (Cleared Approach / "APP")
 * ----------------------------------------------------------------------------
 * Executado quando o controlador emite "APP" ou "APX" no Scratchpad ou na etiqueta.
 * 
 * Regras aplicadas:
 * 1. Identifica o primeiro fixo da IAC (IAF/IF) presente na rota ou seleciona o fixo aplicável.
 * 2. Define a target_altitude como a restrição desse primeiro fixo.
 * 3. REGRA DE SEGURANÇA: Se a aeronave já estiver em altitude inferior à restrição do fixo,
 *    ela NÃO sobe; mantém o nível atual até que o perfil a encontre:
 *    target_altitude = Math.min(current_altitude, fix_restriction_altitude).
 * 4. TRAVA VERTICAL: Trava a descida no fixo (hold_altitude_until_waypoint).
 *    A aeronave não pode descer abaixo dessa altitude até cruzá-lo fisicamente.
 * 
 * @param {Object} aircraft - Instância da aeronave
 * @param {Object} [active_iac=null] - Carta IAC opcional
 * @returns {Object} Resumo da autorização { first_iac_fix, target_altitude, vertical_floor_altitude }
 */
export function authorize_approach(aircraft, active_iac = null) {
    if (!aircraft) return null;

    const iac = active_iac || getActiveIAC(aircraft);
    aircraft.active_iac = iac;

    // 1. Identificar o primeiro fixo da IAC aplicável
    const first_iac_fix = findFirstIACFix(aircraft, iac);
    const fix_restriction_altitude = getFixAltitudeFt(first_iac_fix, iac);

    // 2. REGRA DE SEGURANÇA:
    // Se a aeronave já estiver voando em altitude inferior à restrição do fixo
    // (por instrução prévia do ATC), ela NÃO deve subir; deve manter o nível atual
    // até que o perfil da carta a encontre (target_altitude = min(current, restriction))
    const current_altitude = (aircraft.alt !== undefined) ? aircraft.alt : (aircraft.flAtualNum * 100);
    const target_altitude = Math.min(current_altitude, fix_restriction_altitude);
    const target_fl = Math.round(target_altitude / 100);

    // 3. ATUALIZAÇÃO DO ESTADO DA AERONAVE
    aircraft.cleared_approach = true;
    aircraft.autorizadoProcedimento = true; // Compatibilidade retroativa
    aircraft.descent_mode = DESCENT_MODES.APPROACH_PROFILE;
    aircraft.verticalMode = 'APP';

    // 4. TRAVA VERTICAL (Hold Altitude Until Waypoint)
    aircraft.hold_altitude_until_waypoint = first_iac_fix;
    aircraft.target_altitude = target_altitude;
    aircraft.targetFL = target_fl;
    aircraft.vertical_floor_altitude = target_altitude;
    aircraft.vertical_floor_fl = target_fl;

    // Reseta flags de monitoramento de aproximação
    aircraft.last_distance_to_hold_fix = undefined;

    // Se a aeronave estiver vetorada (modoLNAV = false) e sem rota estruturada até o IAF,
    // reconecta a rota da carta a partir do primeiro fixo da IAC,
    // EXCETO se a aeronave estiver autorizada ILS (onde deve manter a proa de vetoração do ATC)
    const isILS = Boolean(aircraft.ils_authorized || aircraft.cleared_level === "ILS" || aircraft.nivAutorizado === "ILS");
    if (!isILS) {
        if (!aircraft.modoLNAV && (!aircraft.rota || aircraft.rota.length === 0 || !aircraft.rota.includes(first_iac_fix))) {
            const rotaAproximacao = montarRotaAPartirDeFixo(first_iac_fix, aircraft.dest || "SBSP");
            if (rotaAproximacao && rotaAproximacao.length > 0) {
                aircraft.rota = rotaAproximacao;
                aircraft.wpIndex = 0;
                aircraft.wpOffRoute = null;
                aircraft.modoLNAV = true;
            }
        } else if (aircraft.rota && aircraft.rota.includes(first_iac_fix)) {
            // Assegura que o wpIndex não aponte para fixos passados se o IAF for o alvo
            const idx = aircraft.rota.indexOf(first_iac_fix);
            if (aircraft.wpIndex < idx) {
                // Mantém seguindo a STAR até o IAF
            } else if (aircraft.wpIndex > idx && !aircraft.modoLNAV) {
                aircraft.wpIndex = idx;
                aircraft.modoLNAV = true;
            }
        }
    }

    // Sincroniza o piloto virtual
    if (aircraft.virtualPilot) {
        aircraft.virtualPilot.verticalMode = 'APP';
        aircraft.virtualPilot.targetAlt = target_altitude;
    }

    return {
        first_iac_fix,
        target_altitude,
        vertical_floor_altitude: target_altitude,
        descent_mode: aircraft.descent_mode
    };
}

/**
 * Cancela a autorização de aproximação (Comando "NOAPP" / "CANCEL").
 * Retorna para o modo de descida anterior (OPEN_DESCENT se SR estiver ativo, ou RESTRICTED_DESCENT).
 * @param {Object} aircraft - Instância da aeronave
 */
export function cancel_approach(aircraft) {
    if (!aircraft) return;

    aircraft.cleared_approach = false;
    aircraft.autorizadoProcedimento = false;
    aircraft.hold_altitude_until_waypoint = null;
    aircraft.vertical_floor_altitude = null;
    aircraft.vertical_floor_fl = null;

    if (aircraft.semRestricoes) {
        aircraft.descent_mode = DESCENT_MODES.OPEN_DESCENT;
        aircraft.verticalMode = 'OP-D';
    } else {
        aircraft.descent_mode = DESCENT_MODES.RESTRICTED_DESCENT;
        aircraft.verticalMode = 'AUTO';
    }

    if (aircraft.virtualPilot) {
        aircraft.virtualPilot.verticalMode = 'AUTO';
    }
}

/**
 * ----------------------------------------------------------------------------
 * CICLO DE ATUALIZAÇÃO DO PERFIL VERTICAL DE APROXIMAÇÃO (Approach Tick)
 * ----------------------------------------------------------------------------
 * Chamado a cada ciclo físico (ou na passagem de waypoints) quando a aproximação
 * está autorizada (cleared_approach = true).
 * 
 * Responsabilidades:
 * 1. Verificar se o fixo de trava (hold_altitude_until_waypoint) foi fisicamente cruzado.
 * 2. Ao cruzar o fixo:
 *    - Buscar o próximo fixo na sequência da IAC (ex: KOMGU -> GERSU -> URUTA -> SP139 -> SBSP).
 *    - Atualizar a trava vertical e target_altitude para a restrição do próximo fixo.
 *    - Se alcançar o FAF / ponto de rampa final (SP139), transicionar para GLIDEPATH (G/S).
 * 3. No modo GLIDEPATH:
 *    - Guiar continuamente a altitude ao longo da rampa padrão de 3° até a cabeceira da pista.
 * 
 * @param {Object} aircraft - Instância da aeronave
 * @param {number} dtSec - Delta time do ciclo em segundos
 * @param {Object} [active_iac=null] - Carta IAC opcional
 */
export function update_approach_vertical_profile(aircraft, dtSec, active_iac = null) {
    if (!aircraft || !aircraft.cleared_approach) return;

    const iac = active_iac || getActiveIAC(aircraft);
    const holdFixName = aircraft.hold_altitude_until_waypoint;

    // -------------------------------------------------------------------------
    // 1. FASE DE CAPTURA E SEGUIMENTO DO GLIDEPATH (G/S / 3-Degree Glidepath)
    // -------------------------------------------------------------------------
    if (aircraft.descent_mode === DESCENT_MODES.GLIDEPATH || aircraft.descent_mode === 'FLARE') {
        aircraft.verticalMode = (aircraft.descent_mode === 'FLARE') ? 'FLARE' : 'G/S';
        aircraft.vertical_floor_altitude = null;
        aircraft.vertical_floor_fl = null;

        const rwy = getRunwayData(aircraft);
        const thresholdAltFt = rwy ? rwy.threshold.elevation_ft : 2631;
        let distThresholdNM = 1.0;

        if (rwy) {
            const geom = calculateILSGeometry(aircraft.deltaLat, aircraft.deltaLon, rwy.threshold.deltaLat, rwy.threshold.deltaLon, rwy.front_course_deg);
            distThresholdNM = Math.max(0, geom.along_track_nm);
        } else {
            const destCoords = state.fixos ? (state.fixos[aircraft.dest] || state.fixos["SBSP"]) : null;
            if (destCoords) {
                const navDest = calcularRumoDistancia(aircraft, destCoords);
                distThresholdNM = navDest ? navDest.distanciaNM : 1.0;
            }
        }

        // Rampa ideal de 3°: altitude = cabeceira + (distância * 318.4 ft/NM)
        const glidepathAltFt = thresholdAltFt + (distThresholdNM * 318.4);
        const targetAltFt = Math.max(thresholdAltFt, glidepathAltFt);

        aircraft.target_altitude = targetAltFt;
        aircraft.targetFL = Math.round(targetAltFt / 100);

        // Razão vertical nominal para seguir rampa de 3° (ft/min ≈ GS * 5.3)
        const gs = aircraft.groundSpeed || aircraft.vel || 140;
        let vsGlidepath = -Math.round(gs * 5.3);

        // Suavização do toque / flare próximo ao solo (altura <= 65 ft AGL)
        const curAlt = (aircraft.alt !== undefined) ? aircraft.alt : (aircraft.flAtualNum * 100);
        const heightAgl = curAlt - thresholdAltFt;
        if (heightAgl <= 65 && distThresholdNM <= 0.5) {
            const tFlare = Math.max(0, Math.min(1, heightAgl / 65));
            vsGlidepath = Math.round(-120 + tFlare * (vsGlidepath - (-120)));
        }

        aircraft.razaoEfetiva = Math.abs(vsGlidepath);
        aircraft.targetVS = vsGlidepath;

        if (aircraft.virtualPilot) {
            aircraft.virtualPilot.verticalMode = 'G/S';
            aircraft.virtualPilot.targetAlt = targetAltFt;
            aircraft.virtualPilot.targetVS = vsGlidepath;
        }
        return;
    }

    // -------------------------------------------------------------------------
    // 2. FASE STEP-DOWN DA IAC (PROGRESSÃO DE FIXO EM FIXO)
    // -------------------------------------------------------------------------
    if (holdFixName) {
        let fixoCruzado = false;

        // O wpIndex incrementa antecipadamente devido ao fly-by. Não forçamos o cruzamento
        // prematuramente. Vamos depender do flyByProtegido e da distância física real.

        if (!fixoCruzado) {
            if (aircraft.flyByProtegido && aircraft.flyByProtegido.fixoNome === holdFixName) {
                fixoCruzado = false;
            } else {
                const holdCoords = state.fixos ? state.fixos[holdFixName] : null;
                if (holdCoords) {
                    const nav = calcularRumoDistancia(aircraft, holdCoords);
                    const distNM = nav.distanciaNM;

                    if (aircraft.min_dist_to_hold_fix === undefined || aircraft.hold_fix_tracked !== holdFixName) {
                        aircraft.min_dist_to_hold_fix = distNM;
                        aircraft.hold_fix_tracked = holdFixName;
                    } else if (distNM < aircraft.min_dist_to_hold_fix) {
                        aircraft.min_dist_to_hold_fix = distNM;
                    }

                    const sobrevoou = (distNM <= 0.25);
                    const passouTraves = (aircraft.min_dist_to_hold_fix <= 1.2 && distNM >= aircraft.min_dist_to_hold_fix + 0.10);

                    if (sobrevoou || passouTraves) {
                        fixoCruzado = true;
                    }
                    aircraft.last_distance_to_hold_fix = distNM;
                }
            }
        }

        // ---------------------------------------------------------------------
        // PROGRESSÃO APÓS O FIXO ATUAL SER CRUZADO
        // ---------------------------------------------------------------------
        if (fixoCruzado) {
            // Se cruzamos o FAF (SP139) ou SDF (SP017), transiciona para captura do GLIDEPATH
            if (holdFixName === "SP017") {
                aircraft.descent_mode = DESCENT_MODES.GLIDEPATH;
                aircraft.verticalMode = 'G/S';
                aircraft.hold_altitude_until_waypoint = "SBSP";
                aircraft.vertical_floor_altitude = null;
                aircraft.vertical_floor_fl = null;
                aircraft.last_distance_to_hold_fix = undefined;
                aircraft.min_dist_to_hold_fix = undefined;
                aircraft.hold_fix_tracked = undefined;
                return;
            }

            // Identifica o próximo fixo na sequência da IAC (ex: KOMGU -> GERSU -> URUTA -> SP139)
            let nextFixName = null;

            // Prioridade 1: Próximo fixo na rota LNAV carregada
            if (aircraft.rota && Array.isArray(aircraft.rota)) {
                const curIdx = aircraft.rota.indexOf(holdFixName);
                if (curIdx !== -1 && curIdx + 1 < aircraft.rota.length) {
                    const candidate = aircraft.rota[curIdx + 1];
                    if (isFixoIAC(candidate)) {
                        nextFixName = candidate;
                    }
                }
            }

            // Prioridade 2: Grafo da carta IAC
            if (!nextFixName) {
                nextFixName = getNextIACFix(holdFixName, iac);
            }

            if (nextFixName && nextFixName !== "SBSP") {
                const nextRestrictionAlt = getFixAltitudeFt(nextFixName, iac);

                // Aplica a regra de segurança: não subir se voando abaixo
                const curAlt = (aircraft.alt !== undefined) ? aircraft.alt : (aircraft.flAtualNum * 100);
                const nextTargetAlt = Math.min(curAlt, nextRestrictionAlt);
                const nextTargetFL = Math.round(nextTargetAlt / 100);

                // Atualiza a trava vertical para o próximo fixo
                aircraft.hold_altitude_until_waypoint = nextFixName;
                aircraft.target_altitude = nextTargetAlt;
                aircraft.targetFL = nextTargetFL;
                aircraft.vertical_floor_altitude = nextTargetAlt;
                aircraft.vertical_floor_fl = nextTargetFL;
                aircraft.last_distance_to_hold_fix = undefined;
                aircraft.min_dist_to_hold_fix = undefined;
                aircraft.hold_fix_tracked = nextFixName;

                if (aircraft.virtualPilot) {
                    aircraft.virtualPilot.targetAlt = nextTargetAlt;
                }
            } else {
                // Chegou à perna final de aproximação
                aircraft.descent_mode = DESCENT_MODES.GLIDEPATH;
                aircraft.verticalMode = 'G/S';
                aircraft.hold_altitude_until_waypoint = "SBSP";
                aircraft.vertical_floor_altitude = null;
                aircraft.vertical_floor_fl = null;
                aircraft.last_distance_to_hold_fix = undefined;
                aircraft.min_dist_to_hold_fix = undefined;
                aircraft.hold_fix_tracked = undefined;
            }
        }
    }

    // -------------------------------------------------------------------------
    // 3. APLICAÇÃO DA TRAVA VERTICAL RÍGIDA
    // -------------------------------------------------------------------------
    // Impede que qualquer cálculo posterior de VNAV perfure a altitude do fixo
    // antes que ele seja fisicamente cruzado.
    if (aircraft.vertical_floor_altitude !== null && aircraft.vertical_floor_altitude !== undefined) {
        if (aircraft.target_altitude < aircraft.vertical_floor_altitude) {
            aircraft.target_altitude = aircraft.vertical_floor_altitude;
        }
        if (aircraft.targetFL < aircraft.vertical_floor_fl) {
            aircraft.targetFL = aircraft.vertical_floor_fl;
        }

        // Trava física de piso: impede que a altitude real desça abaixo do piso antes do fixo ser bloqueado
        if (aircraft.alt !== undefined && aircraft.alt < aircraft.vertical_floor_altitude && aircraft.descent_mode !== 'GLIDEPATH' && aircraft.descent_mode !== 'FLARE' && !aircraft.on_ground) {
            aircraft.alt = aircraft.vertical_floor_altitude;
            aircraft.flAtualNum = aircraft.vertical_floor_altitude / 100;
            if (aircraft.currentVS < 0) aircraft.currentVS = 0;
            if (aircraft.verticalSpeed < 0) aircraft.verticalSpeed = 0;
        }
    }
}
