/**
 * ============================================================================
 * BANCO DE DADOS DE PERFORMANCE AERONÁUTICA (PerformanceDB.js)
 * ============================================================================
 * Define os parâmetros aerodinâmicos, envelopes operacionais, limites estruturais
 * absolutos, taxas de razão vertical e limitações de aceleração / empuxo por modelo.
 * ============================================================================
 */

export const AIRCRAFT_PERFORMANCE = {
    B738: {
        speeds: { vMin: 140, vApp: 145, vClimb: 280, vCruise: 290, vMax: 340 },
        rates: {
            climbNormal: 2200,          // ft/min
            climbExpedite: 3200,        // ft/min operacional padrão
            climbStructuralMax: 4000,   // ft/min (TETO FÍSICO/ESTRUTURAL ABSOLUTO)
            descentNormal: -1800,
            descentExpedite: -3200,
            descentStructuralMax: -4500 // ft/min (LIMITE ESTRUTURAL ABSOLUTO)
        },
        limits: {
            maxAccel: 2.5,              // kt/s²
            maxDecelClean: 1.2,         // kt/s²
            maxDecelFlaps: 2.2,         // kt/s²
            vsAccelRate: 300,           // (ft/min)/s - suavização de razão (jerk control)
            spoolRate: 0.15             // variação de empuxo por segundo [0.0 a 1.0]
        },
        // Propriedades ponte de compatibilidade
        maxSpeedTMA: 280,
        initialAppSpeed: 250,
        intermediateAppSpeed: 210,
        finalAppSpeed: 170,
        approachSpeed: 145,
        minApproachSpeed: 140,
        taxaAcel: 2.5,
        taxaDesacel: 1.2
    },
    A320: {
        speeds: { vMin: 135, vApp: 140, vClimb: 270, vCruise: 280, vMax: 330 },
        rates: {
            climbNormal: 2100,
            climbExpedite: 3000,
            climbStructuralMax: 3800,
            descentNormal: -1800,
            descentExpedite: -3000,
            descentStructuralMax: -4200
        },
        limits: {
            maxAccel: 2.3,
            maxDecelClean: 1.1,
            maxDecelFlaps: 2.0,
            vsAccelRate: 280,
            spoolRate: 0.14
        },
        maxSpeedTMA: 270,
        initialAppSpeed: 250,
        intermediateAppSpeed: 205,
        finalAppSpeed: 165,
        approachSpeed: 140,
        minApproachSpeed: 135,
        taxaAcel: 2.3,
        taxaDesacel: 1.1
    },
    E190: {
        speeds: { vMin: 125, vApp: 132, vClimb: 260, vCruise: 270, vMax: 320 },
        rates: {
            climbNormal: 2400,
            climbExpedite: 3400,
            climbStructuralMax: 4100,
            descentNormal: -1800,
            descentExpedite: -3000,
            descentStructuralMax: -4000
        },
        limits: {
            maxAccel: 2.6,
            maxDecelClean: 1.3,
            maxDecelFlaps: 2.2,
            vsAccelRate: 320,
            spoolRate: 0.18
        },
        maxSpeedTMA: 260,
        initialAppSpeed: 240,
        intermediateAppSpeed: 200,
        finalAppSpeed: 160,
        approachSpeed: 132,
        minApproachSpeed: 125,
        taxaAcel: 2.6,
        taxaDesacel: 1.3
    },
    ATR72: {
        speeds: { vMin: 110, vApp: 115, vClimb: 170, vCruise: 220, vMax: 250 },
        rates: {
            climbNormal: 1400,
            climbExpedite: 1800,
            climbStructuralMax: 2300,
            descentNormal: -1400,
            descentExpedite: -2000,
            descentStructuralMax: -2600
        },
        limits: {
            maxAccel: 1.8,
            maxDecelClean: 1.4,
            maxDecelFlaps: 2.5,
            vsAccelRate: 200,
            spoolRate: 0.25
        },
        maxSpeedTMA: 220,
        initialAppSpeed: 200,
        intermediateAppSpeed: 170,
        finalAppSpeed: 140,
        approachSpeed: 115,
        minApproachSpeed: 110,
        taxaAcel: 1.8,
        taxaDesacel: 1.4
    }
};

// Aliases para variantes e modelos correlatos
AIRCRAFT_PERFORMANCE["B737"] = AIRCRAFT_PERFORMANCE["B738"];
AIRCRAFT_PERFORMANCE["A20N"] = AIRCRAFT_PERFORMANCE["A320"];
AIRCRAFT_PERFORMANCE["A319"] = AIRCRAFT_PERFORMANCE["A320"];
AIRCRAFT_PERFORMANCE["A321"] = AIRCRAFT_PERFORMANCE["A320"];
AIRCRAFT_PERFORMANCE["E195"] = AIRCRAFT_PERFORMANCE["E190"];
AIRCRAFT_PERFORMANCE["E295"] = AIRCRAFT_PERFORMANCE["E190"];
AIRCRAFT_PERFORMANCE["AT72"] = AIRCRAFT_PERFORMANCE["ATR72"];
AIRCRAFT_PERFORMANCE["DEFAULT"] = AIRCRAFT_PERFORMANCE["B738"];

/**
 * Obtém a performance da aeronave de forma segura com fallback garantido.
 * @param {string} tipo - Código ICAO da aeronave (ex: "B738", "A320")
 * @returns {Object} Configuração de performance da aeronave
 */
export function getAircraftPerformance(tipo) {
    if (!tipo) return AIRCRAFT_PERFORMANCE["DEFAULT"];
    const chave = tipo.toUpperCase().trim();
    return AIRCRAFT_PERFORMANCE[chave] || AIRCRAFT_PERFORMANCE["DEFAULT"];
}
