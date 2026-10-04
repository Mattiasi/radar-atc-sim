/**
 * ============================================================================
 * GERENCIADOR UNIFICADO DE POUSO, TRANSPONDER 2000 E SUMIÇO DATA-DRIVEN
 * (LandingRolloutManager.js)
 * ============================================================================
 * Unifica e padroniza a física de toque, acionamento do transponder e rolagem/sumiço
 * tanto para aproximações ILS quanto RNAV/RNP, visuais ou convencionais.
 * Totalmente data-driven a partir dos dados do aeródromo e cabeceira.
 * ============================================================================
 */

export const POUSO_ROLLOUT_CONFIG_PADRAO = {
    squawkToque: "2000",             // Código do transponder ativado após a rolagem na pista
    tempoRolagemAteSquawkSec: 4.0,   // Tempo decorrido de rolagem no solo (s) antes de comutar para 2000
    distanciaRolagemAteSquawkNM: 0.20, // Distância percorrida na pista (NM) antes de comutar para 2000
    velAtivacaoSquawkKt: 80,         // Velocidade de desaceleração (kt) na qual comuta para 2000
    velTaxiKt: 20,                   // Velocidade de saída da pista / táxi para considerar fim de corrida
    desaceleracaoSoloKtPorSec: 5.0,  // Desaceleração física na pista seca (kt/s)
    tempoEsperaDesaparecerSec: 1.5,  // Tempo no solo a velocidade de táxi antes de remover da frequência
    toleranciaVerticalFt: 15.0,      // Tolerância de proximidade com a elevação da pista para toque
    toleranciaAlinhamentoNM: 0.35    // Desvio lateral máximo permitido para autorizar toque físico
};

/**
 * Avalia as condições físicas e geométricas de toque na pista e executa a transição para solo.
 * Garante que:
 * 1. A aeronave está estritamente após a coordenada do início da cabeceira (alongTrack <= 0.0).
 * 2. A aeronave está fisicamente na altitude de elevação da pista (Math.abs(alt - rwyElev) <= 15 ft).
 * 3. O toque é registrado e a rolagem inicia mantendo o callsign/squawk original ativo.
 * 
 * @param {Object} aircraft - Instância da aeronave
 * @param {Object} rwy - Dados da pista e cabeceira ({ threshold, comp_nm, front_course_deg, ... })
 * @param {number} dtSec - Delta time em segundos
 * @param {number} alongTrack - Distância along-track em NM até a cabeceira (< 0 sobre a pista)
 * @param {number} crossTrack - Desvio cross-track em NM em relação ao eixo da pista
 * @param {number} altFt - Altitude física atual da aeronave em pés
 * @param {number} heightAgl - Altura sobre a cabeceira em pés (altFt - rwyElevFt)
 * @returns {boolean} True se o toque ocorreu ou já estava no solo
 */
export function verificarTouchdown(aircraft, rwy, dtSec, alongTrack, crossTrack, altFt, heightAgl) {
    if (!aircraft || !rwy) return false;

    if (aircraft.on_ground) return true;

    const rwyElevFt = rwy.threshold ? rwy.threshold.elevation_ft : 2631;
    const rwyCompNM = rwy.comp_nm || 1.0;
    const frontCourse = rwy.front_course_deg !== undefined ? rwy.front_course_deg : 170;

    const tolVert = rwy.toleranciaVerticalFt || POUSO_ROLLOUT_CONFIG_PADRAO.toleranciaVerticalFt;
    const tolCross = rwy.toleranciaAlinhamentoNM || POUSO_ROLLOUT_CONFIG_PADRAO.toleranciaAlinhamentoNM;

    // 1. "apos a coordenada do inicio da cabeceira":
    //    alongTrack <= 0.0 (o ponto 0.0 é a coordenada exata da cabeceira; valores negativos estão sobre a pista)
    //    e dentro dos limites físicos do comprimento da pista
    const sobreSuperficiePista = (alongTrack <= 0.0 && alongTrack >= -(rwyCompNM + 0.2));

    // 2. "esta na altitude do aeroporto":
    //    A aeronave desceu fisicamente até a elevação da pista
    const naAltitudePista = (Math.abs(altFt - rwyElevFt) <= tolVert || heightAgl <= tolVert);

    // 3. Alinhado com o prolongamento / eixo da pista
    const alinhado = (Math.abs(crossTrack) <= tolCross);

    if (sobreSuperficiePista && naAltitudePista && alinhado) {
        aircraft.on_ground = true;
        aircraft._on_ground = true;
        aircraft.flight_phase = "LANDED";
        aircraft._flight_phase = "LANDED";
        aircraft.just_touched_down = true;

        // Crava a aeronave na elevação física da pista
        aircraft.alt = rwyElevFt;
        aircraft.flAtualNum = rwyElevFt / 100;
        aircraft.nivAtual = Math.round(aircraft.flAtualNum).toString().padStart(3, '0');
        aircraft.currentVS = 0;
        aircraft.targetVS = 0;

        // Inicializa telemetria de rolagem no solo (mantém squawk e callsign originais no toque)
        aircraft.tempoRolagemSolo = 0;
        aircraft.distanciaToqueAlongTrackNM = alongTrack;
        aircraft.velAoTocar = aircraft.vel;

        // Trava proa no eixo da pista durante a desaceleração no solo
        aircraft.proa = frontCourse;
        aircraft.proaDestino = frontCourse;
        aircraft.direcaoCurva = 0;

        if (aircraft.autopilot) {
            aircraft.autopilot.vertical_mode = 'TOUCHDOWN';
        }

        return true;
    }

    return false;
}

/**
 * Gerencia a física de solo da aeronave após o toque:
 * - Mantém a proa alinhada na pista.
 * - Registra tempo e distância de rolagem na pista.
 * - Transição para Squawk 2000 após rolar na pista por tempo/distância configurados ("rola um pouco e dps 2000").
 * - Desacelera até a velocidade de táxi.
 * - Ao atingir velocidade de táxi e decorrido o tempo de espera, aciona pousou = true (sumiço).
 * 
 * @param {Object} aircraft - Instância da aeronave
 * @param {Object} rwy - Dados da pista e cabeceira
 * @param {number} dtSec - Delta time em segundos
 * @param {number} alongTrack - Posição along-track em NM
 */
export function processarRolloutESumico(aircraft, rwy, dtSec, alongTrack) {
    if (!aircraft) return;

    const rwyElevFt = rwy && rwy.threshold ? rwy.threshold.elevation_ft : (aircraft.alt || 2631);
    const rwyCompNM = (rwy && rwy.comp_nm) ? rwy.comp_nm : 1.0;
    const frontCourse = (rwy && rwy.front_course_deg !== undefined) ? rwy.front_course_deg : aircraft.proa;

    const squawkAlvo = (rwy && rwy.squawkToque) ? rwy.squawkToque : POUSO_ROLLOUT_CONFIG_PADRAO.squawkToque;
    const tempoAteSquawk = (rwy && rwy.tempoRolagemAteSquawkSec !== undefined) ? rwy.tempoRolagemAteSquawkSec : POUSO_ROLLOUT_CONFIG_PADRAO.tempoRolagemAteSquawkSec;
    const distAteSquawk = (rwy && rwy.distanciaRolagemAteSquawkNM !== undefined) ? rwy.distanciaRolagemAteSquawkNM : POUSO_ROLLOUT_CONFIG_PADRAO.distanciaRolagemAteSquawkNM;
    const velAteSquawk = (rwy && rwy.velAtivacaoSquawkKt !== undefined) ? rwy.velAtivacaoSquawkKt : POUSO_ROLLOUT_CONFIG_PADRAO.velAtivacaoSquawkKt;

    const decelSolo = (rwy && rwy.desaceleracaoSoloKtPorSec) ? rwy.desaceleracaoSoloKtPorSec : POUSO_ROLLOUT_CONFIG_PADRAO.desaceleracaoSoloKtPorSec;
    const velTaxi = (rwy && rwy.velTaxiKt) ? rwy.velTaxiKt : POUSO_ROLLOUT_CONFIG_PADRAO.velTaxiKt;
    const tempoEspera = (rwy && rwy.tempoEsperaDesaparecerSec) ? rwy.tempoEsperaDesaparecerSec : POUSO_ROLLOUT_CONFIG_PADRAO.tempoEsperaDesaparecerSec;

    // Enforce propriedades de aeronave pousada
    aircraft.flight_phase = "LANDED";
    aircraft._flight_phase = "LANDED";
    aircraft.alt = rwyElevFt;
    aircraft.flAtualNum = rwyElevFt / 100;
    aircraft.currentVS = 0;
    aircraft.targetVS = 0;

    // Mantém proa no eixo da pista
    aircraft.proa = frontCourse;
    aircraft.proaDestino = frontCourse;
    aircraft.direcaoCurva = 0;

    // Inicialização defensiva de referência de toque se necessário
    if (aircraft.distanciaToqueAlongTrackNM === undefined && alongTrack !== undefined) {
        aircraft.distanciaToqueAlongTrackNM = alongTrack;
    }

    // Atualiza tempo de rolagem no solo
    aircraft.tempoRolagemSolo = (aircraft.tempoRolagemSolo || 0) + dtSec;

    // Distância percorrida desde o ponto de toque
    let distRoladaNM = 0;
    if (aircraft.distanciaToqueAlongTrackNM !== undefined && alongTrack !== undefined) {
        distRoladaNM = Math.abs(alongTrack - aircraft.distanciaToqueAlongTrackNM);
    }

    // Transição do transponder para 2000 somente após rolar na pista:
    // 1. Decorrido o tempo de rolagem (ex: 4.0s)
    // 2. OU percorrida a distância de rolagem (ex: 0.20 NM)
    // 3. OU desacelerado até a velocidade limite (ex: 80 kt)
    const deveAtivarSquawk2000 = (
        aircraft.tempoRolagemSolo >= tempoAteSquawk ||
        distRoladaNM >= distAteSquawk ||
        aircraft.vel <= velAteSquawk
    );

    if (deveAtivarSquawk2000 && aircraft.squawk !== squawkAlvo) {
        aircraft.squawk = squawkAlvo;
        if (aircraft.transponder) {
            aircraft.transponder.code = squawkAlvo;
        }
    }

    // Desaceleração física na rolagem
    if (aircraft.vel > velTaxi) {
        aircraft.vel = Math.max(velTaxi, aircraft.vel - decelSolo * dtSec);
        aircraft.currentIAS = aircraft.vel;
    } else {
        // Atingiu velocidade de táxi na pista
        if (!aircraft.tempoNoSolo) aircraft.tempoNoSolo = 0;
        aircraft.tempoNoSolo += dtSec;

        // Sumiço: após desacelerar ou atingir o fim da pista física
        if (aircraft.tempoNoSolo >= tempoEspera || (alongTrack !== undefined && alongTrack <= -(rwyCompNM + 0.1))) {
            aircraft.pousou = true;
        }
    }
}

