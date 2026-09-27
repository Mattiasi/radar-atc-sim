/**
 * ============================================================================
 * MÓDULO MATEMÁTICO DE VENTO (WIND MATH)
 * ============================================================================
 * Funções matemáticas puras para cinemática vetorial do vento, projeção
 * ortogonal (headwind/crosswind) e trigonometria compatível com o Canvas 2D.
 * ============================================================================
 */

import { correcaoLon } from './utils.js';

/**
 * Normaliza qualquer ângulo em graus para o intervalo padrão [0, 360).
 * Garante continuidade suave e evita descontinuidades (wrap-around angular).
 * 
 * @param {number} deg - Ângulo em graus
 * @returns {number} Ângulo normalizado no intervalo [0, 360)
 */
export function normalizeHeading(deg) {
    if (isNaN(deg)) return 0;
    let norm = deg % 360;
    if (norm < 0) norm += 360;
    return norm;
}

/**
 * Converte a direção meteorológica de onde o vento sopra ("Wind From")
 * e sua intensidade em nós para um vetor de velocidade de deslocamento da massa de ar.
 * 
 * Convenção aeronáutica:
 * - "Wind From" representa de onde o vento VEM.
 * - O vetor físico de deslocamento da massa de ar aponta para o lado oposto ("Wind To"):
 *   theta_to = (fromDeg + 180°) % 360
 * 
 * Sistema Cartesiano do Canvas:
 * - 000° (Norte) = vetor (0, -1) [y diminui para cima]
 * - 090° (Leste) = vetor (+1, 0) [x aumenta para a direita]
 * - 180° (Sul)   = vetor (0, +1) [y aumenta para baixo]
 * - 270° (Oeste) = vetor (-1, 0) [x diminui para a esquerda]
 * 
 * Fórmula trigonométrica Canvas:
 *   alpha_rad = (theta_to - 90°) * (PI / 180)
 *   vx = speedKt * cos(alpha_rad)
 *   vy = speedKt * sin(alpha_rad)
 * 
 * Componentes geográficas de navegação (Norte +Lat, Leste +Lon):
 *   vLat = -vy = speedKt * cos(theta_to * PI / 180)
 *   vLon =  vx = speedKt * sin(theta_to * PI / 180)
 * 
 * @param {number} fromDeg - Direção meteorológica de onde o vento vem (0-359°)
 * @param {number} speedKt - Intensidade do vento em nós (kt)
 * @returns {Object} { vx, vy, vLat, vLon, speedKt, fromDeg, toDeg }
 */
export function windFromDirectionToVector(fromDeg, speedKt) {
    const safeSpeed = Math.max(0, parseFloat(speedKt) || 0);
    const safeFrom = normalizeHeading(parseFloat(fromDeg) || 0);

    // Se vento for 0 nós, retorna vetor nulo diretamente (branchless friendly)
    if (safeSpeed === 0) {
        return {
            vx: 0,
            vy: 0,
            vLat: 0,
            vLon: 0,
            speedKt: 0,
            fromDeg: safeFrom,
            toDeg: normalizeHeading(safeFrom + 180)
        };
    }

    const toDeg = normalizeHeading(safeFrom + 180);
    const toRad = toDeg * (Math.PI / 180);
    const alphaCanvasRad = (toDeg - 90) * (Math.PI / 180);

    const vx = safeSpeed * Math.cos(alphaCanvasRad);
    const vy = safeSpeed * Math.sin(alphaCanvasRad);

    const vLat = safeSpeed * Math.cos(toRad);
    const vLon = safeSpeed * Math.sin(toRad);

    return {
        vx,
        vy,
        vLat,
        vLon,
        speedKt: safeSpeed,
        fromDeg: safeFrom,
        toDeg
    };
}

/**
 * Calcula a componente de vento de proa/cauda (Headwind / Tailwind)
 * em relação a uma referência de proa ou rumo de pista.
 * 
 * Headwind = V_wind * cos(windFrom - headingRef)
 * - Positivo (> 0): Vento de proa (Headwind)
 * - Negativo (< 0): Vento de cauda (Tailwind)
 * 
 * @param {number} windFromDeg - Direção de onde o vento vem (0-359°)
 * @param {number} speedKt - Intensidade do vento em nós
 * @param {number} refHeadingDeg - Rumo da pista ou proa da aeronave (0-359°)
 * @returns {number} Componente em nós (+Headwind, -Tailwind)
 */
export function calculateHeadwindComponent(windFromDeg, speedKt, refHeadingDeg) {
    const diffRad = (normalizeHeading(windFromDeg) - normalizeHeading(refHeadingDeg)) * (Math.PI / 180);
    return (parseFloat(speedKt) || 0) * Math.cos(diffRad);
}

/**
 * Calcula a componente de vento de través (Crosswind)
 * em relação a uma referência de proa ou rumo de pista.
 * 
 * Crosswind = V_wind * sin(windFrom - headingRef)
 * - Positivo (> 0): Vento soprando da direita
 * - Negativo (< 0): Vento soprando da esquerda
 * 
 * @param {number} windFromDeg - Direção de onde o vento vem (0-359°)
 * @param {number} speedKt - Intensidade do vento em nós
 * @param {number} refHeadingDeg - Rumo da pista ou proa da aeronave (0-359°)
 * @returns {number} Componente em nós (+Direita, -Esquerda)
 */
export function calculateCrosswindComponent(windFromDeg, speedKt, refHeadingDeg) {
    const diffRad = (normalizeHeading(windFromDeg) - normalizeHeading(refHeadingDeg)) * (Math.PI / 180);
    return (parseFloat(speedKt) || 0) * Math.sin(diffRad);
}

/**
 * Determina o índice [0..11] do segmento ativo do instrumento circular de 12 retângulos.
 * Setor = round(direcaoVento / 30°) % 12
 * 
 * @param {number} windFromDeg - Direção de onde o vento vem
 * @returns {number} Índice do setor ativo entre 0 e 11
 */
export function getSectorIndex(windFromDeg) {
    const norm = normalizeHeading(windFromDeg);
    return Math.round(norm / 30) % 12;
}

/**
 * Calcula o triângulo de velocidades da aeronave:
 * V_ground = V_air + V_wind
 * 
 * @param {number} headingDeg - Proa magnética da aeronave (Heading)
 * @param {number} tasKt - Velocidade verdadeira no ar (True Airspeed / IAS)
 * @param {number} windFromDeg - Direção de onde o vento vem
 * @param {number} windSpeedKt - Intensidade do vento em nós
 * @returns {Object} { groundSpeed, track, driftAngle, vGroundLat, vGroundLon }
 */
export function calculateGroundVector(headingDeg, tasKt, windFromDeg, windSpeedKt) {
    const hRad = normalizeHeading(headingDeg) * (Math.PI / 180);
    const tas = Math.max(0, tasKt || 0);

    // Vetor ar da aeronave (Norte +Lat, Leste +Lon)
    const vAirLat = tas * Math.cos(hRad);
    const vAirLon = tas * Math.sin(hRad);

    // Vetor vento (massa de ar em movimento)
    const windVec = windFromDirectionToVector(windFromDeg, windSpeedKt);

    // Soma vetorial: V_ground = V_air + V_wind
    const vGroundLat = vAirLat + windVec.vLat;
    const vGroundLon = vAirLon + windVec.vLon;

    // Ground Speed (módulo da velocidade sobre o solo)
    const groundSpeed = Math.sqrt(vGroundLat * vGroundLat + vGroundLon * vGroundLon);

    // Track (rumo verdadeiro da trajetória em graus aeronáuticos)
    let track = (Math.atan2(vGroundLon, vGroundLat) * (180 / Math.PI) + 360) % 360;

    // Ângulo de deriva (Drift Angle = Track - Heading) no intervalo [-180, 180]
    let driftAngle = track - normalizeHeading(headingDeg);
    if (driftAngle > 180) driftAngle -= 360;
    if (driftAngle < -180) driftAngle += 360;

    return {
        groundSpeed,
        track,
        driftAngle,
        vGroundLat,
        vGroundLon
    };
}

/**
 * Calcula o Ângulo de Correção de Deriva (Wind Correction Angle - WCA).
 * Permite que a aeronave em navegação LNAV carangueje (Crab Angle) contra o vento
 * para que sua trajetória real sobre o solo (Ground Track) coincida exatamente com o rumo desejado da rota.
 * 
 * Fórmula trigonométrica exata:
 *   sen(WCA) = (V_vento * sen(WindFrom - DesiredTrack)) / TAS
 *   Heading = DesiredTrack + WCA
 * 
 * @param {number} desiredTrackDeg - Rumo magnético desejado da perna sobre o solo (ex: 170°)
 * @param {number} tasKt - Velocidade aerodinâmica verdadeira / indicada (IAS/TAS em nós)
 * @param {number} windFromDeg - Direção de onde o vento sopra (graus magnéticos)
 * @param {number} windSpeedKt - Intensidade do vento em nós
 * @returns {number} Ângulo de correção WCA em graus (soma à proa para anular a deriva)
 */
export function calculateWindCorrectionAngle(desiredTrackDeg, tasKt, windFromDeg, windSpeedKt) {
    if (!tasKt || tasKt <= 0 || !windSpeedKt || windSpeedKt <= 0) return 0;
    
    const angleRad = (windFromDeg - desiredTrackDeg) * (Math.PI / 180);
    const crosswind = windSpeedKt * Math.sin(angleRad);
    
    // Razão entre componente de través e velocidade aerodinâmica
    let ratio = crosswind / tasKt;
    ratio = Math.max(-1, Math.min(1, ratio)); // Clamp de segurança
    
    const wcaRad = Math.asin(ratio);
    return wcaRad * (180 / Math.PI);
}

/**
 * Calcula a Distância de Antecipação de Curva (Turn Anticipation Distance - TAD)
 * com base na velocidade sobre o solo (Ground Speed com vento) e geometria da curva.
 * 
 * Geometria padrão FMS (DO-236 / ARINC 424 / FAA AC 90-105A):
 * - Raio de curvatura sobre o solo: R = V_GS / (3600 * omega_rad)
 * - Distância do ponto de tangência ao fixo de vértice: D_geo = R * tan(deltaPsi / 2)
 * - Margem de transição (lead time do piloto/autopilot): D_lead = V_GS * (t_lead / 3600)
 * 
 * @param {number} groundSpeedKt - Velocidade sobre o solo em nós (já afetada pelo vento)
 * @param {number} turnAngleDeg - Ângulo de deflexão da curva em graus (0° a 180°)
 * @param {number} [legLengthNM=999] - Comprimento da próxima perna em NM
 * @param {number} [maxLegFraction=0.45] - Limite máximo de antecipação como fração da perna
 * @returns {number} Distância de antecipação em NM antes do fixo
 */
export function calculateTurnAnticipationDistance(groundSpeedKt, turnAngleDeg, legLengthNM = 999, maxLegFraction = 0.45) {
    const gs = Math.max(80, groundSpeedKt || 180);
    const turnDeg = Math.min(170, Math.max(0, Math.abs(turnAngleDeg) || 0));
    
    if (turnDeg < 1) return 0.4; // Curva insignificante

    // Taxa padrão de curva do simulador: 2.3 graus por segundo
    const omegaDegSec = 2.3;
    const omegaRadSec = omegaDegSec * (Math.PI / 180);
    
    // Raio de curva sobre o solo em NM: R = (gs / 3600) / omegaRadSec
    // 3600 * (2.3 * PI / 180) ≈ 144.51
    const radiusNM = gs / 144.51;

    // Distância geométrica de tangência: R * tan(deltaPsi / 2)
    const halfTurnRad = (turnDeg / 2) * (Math.PI / 180);
    const dGeo = radiusNM * Math.tan(halfTurnRad);

    // Tempo de transição de rolamento (Roll-in lead time ~2.5s)
    const dLead = gs * (2.5 / 3600);

    const tad = dGeo + dLead;

    // Trava de segurança: não deve ultrapassar a fração máxima da perna
    const maxPermitido = Math.max(0.6, (legLengthNM || 999) * maxLegFraction);
    return Math.max(0.4, Math.min(tad, maxPermitido));
}

/**
 * Calcula o erro lateral de trajetória (Cross-Track Error - XTK) em Milhas Náuticas
 * e a projeção ao longo da perna (Along-Track Distance) entre dois fixos A e B.
 * 
 * Convenção aeronáutica:
 * - XTK > 0: Aeronave está à DIREITA da linha do segmento A -> B.
 * - XTK < 0: Aeronave está à ESQUERDA da linha do segmento A -> B.
 * - XTK = 0: Aeronave está exatamente sobre a linha.
 * 
 * @param {Object} posAc - Posição da aeronave { deltaLat, deltaLon }
 * @param {Object} posA - Posição do fixo de início da perna { deltaLat, deltaLon }
 * @param {Object} posB - Posição do fixo de fim da perna { deltaLat, deltaLon }
 * @param {number} [correcaoLonVal=correcaoLon] - Fator de correção de longitude cos(lat)
 * @returns {Object} { xtkNM, legCourseDeg, alongTrackNM, legLengthNM }
 */
export function calculateCrossTrack(posAc, posA, posB, correcaoLonVal = correcaoLon) {
    if (!posAc || !posA || !posB) {
        return { xtkNM: 0, legCourseDeg: 0, alongTrackNM: 0, legLengthNM: 0 };
    }

    const cLon = (correcaoLonVal !== undefined) ? correcaoLonVal : correcaoLon;

    // Vetor do segmento de perna A -> B (em NM: Y para Norte, X para Leste)
    const yAB = (posB.deltaLat - posA.deltaLat) * 60;
    const xAB = (posB.deltaLon - posA.deltaLon) * cLon * 60;
    const legLengthNM = Math.sqrt(xAB * xAB + yAB * yAB);

    if (legLengthNM < 0.001) {
        return { xtkNM: 0, legCourseDeg: 0, alongTrackNM: 0, legLengthNM: 0 };
    }

    // Rumo magnético da perna A -> B (graus aeronáuticos 000-359°)
    const legCourseRad = Math.atan2(xAB, yAB);
    const legCourseDeg = (legCourseRad * (180 / Math.PI) + 360) % 360;

    // Vetor de A até a Aeronave
    const yAP = (posAc.deltaLat - posA.deltaLat) * 60;
    const xAP = (posAc.deltaLon - posA.deltaLon) * cLon * 60;

    // Cross-Track Error (projeção ortogonal no vetor normal à direita da perna)
    // Unit normal to the right: (yAB/L, -xAB/L)
    const xtkNM = (xAP * yAB - yAP * xAB) / legLengthNM;

    // Along-Track Distance (projeção longitudinal na perna a partir de A)
    const alongTrackNM = (xAP * xAB + yAP * yAB) / legLengthNM;

    return {
        xtkNM,
        legCourseDeg,
        alongTrackNM,
        legLengthNM
    };
}

/**
 * Calcula o Rumo Desejado sobre o solo (Desired Track) aplicando correção de fechamento
 * de malha proporcional ao Cross-Track Error (XTK) para manter a aeronave sobre a linha.
 * 
 * @param {number} legCourseDeg - Rumo nominal da perna da rota (000-359°)
 * @param {number} xtkNM - Erro lateral em NM (+Direita, -Esquerda)
 * @param {number} [maxInterceptDeg=30] - Ângulo máximo de interceptação em graus (padrão ATC 30°)
 * @returns {number} Track desejado sobre o solo em graus
 */
export function calculateDesiredTrack(legCourseDeg, xtkNM, maxInterceptDeg = 30) {
    if (Math.abs(xtkNM) < 0.008) {
        // Já está sobre a linha com altíssima precisão (< 15 metros)
        return normalizeHeading(legCourseDeg);
    }

    // Ganho proporcional Kp = 40° por NM de desvio lateral
    // Ex: 0.05 NM (~90m)  -> 2.0° de interceptação
    // Ex: 0.15 NM (~280m) -> 6.0° de interceptação
    // Ex: 0.50 NM (~920m) -> 20.0° de interceptação
    // Ex: >= 0.75 NM      -> 30.0° (clamped)
    const kp = 40;
    const interceptAngle = Math.max(-maxInterceptDeg, Math.min(maxInterceptDeg, xtkNM * kp));

    // Se estiver à direita (xtk > 0), vira para a esquerda (subtrai interceptAngle)
    // Se estiver à esquerda (xtk < 0), vira para a direita (adiciona interceptAngle)
    return normalizeHeading(legCourseDeg - interceptAngle);
}



