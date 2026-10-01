/**
 * ============================================================================
 * BANCO DE DADOS DE PERFORMANCE AERONÁUTICA (PerformanceDB.js)
 * ============================================================================
 * Fonte única da verdade (Single Source of Truth) para parâmetros aerodinâmicos,
 * envelopes operacionais, limites estruturais absolutos, taxas de razão vertical
 * e limitações de aceleração / desaceleração / empuxo por modelo ICAO.
 * ============================================================================
 */

export const AIRCRAFT_PERFORMANCE = {
    // -------------------------------------------------------------------------
    // 1. JATOS COMERCIAIS (AIRLINERS)
    // -------------------------------------------------------------------------
    B738: {
        speeds: { vMin: 140, vApp: 145, vCleanMin: 210, vAppMin: 140, vClimb: 280, vCruise: 290, vMax: 340 },
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
        maxSpeedTMA: 280,
        initialAppSpeed: 250,
        intermediateAppSpeed: 210,
        finalAppSpeed: 170,
        approachSpeed: 145,
        minApproachSpeed: 140,
        taxaAcel: 2.5,
        taxaDesacel: 1.2,
        accelerationRate: 2.5,
        decelerationRate: 1.2
    },
    A320: {
        speeds: { vMin: 135, vApp: 140, vCleanMin: 210, vAppMin: 135, vClimb: 270, vCruise: 280, vMax: 330 },
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
        taxaDesacel: 1.1,
        accelerationRate: 2.3,
        decelerationRate: 1.1
    },
    E190: {
        speeds: { vMin: 125, vApp: 132, vCleanMin: 200, vAppMin: 125, vClimb: 260, vCruise: 270, vMax: 320 },
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
        taxaDesacel: 1.3,
        accelerationRate: 2.6,
        decelerationRate: 1.3
    },
    ATR72: {
        speeds: { vMin: 110, vApp: 115, vCleanMin: 160, vAppMin: 110, vClimb: 170, vCruise: 220, vMax: 250 },
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
        taxaDesacel: 1.4,
        accelerationRate: 1.8,
        decelerationRate: 1.4
    },

    // -------------------------------------------------------------------------
    // 2. AVIAÇÃO EXECUTIVA (JATOS - EXECUTIVE JETS)
    // -------------------------------------------------------------------------
    BE40: {
        speeds: { vMin: 115, vApp: 120, vCleanMin: 180, vAppMin: 115, vClimb: 250, vCruise: 280, vMax: 320 },
        rates: {
            climbNormal: 2400,
            climbExpedite: 3200,
            climbStructuralMax: 4000,
            descentNormal: -1800,
            descentExpedite: -2800,
            descentStructuralMax: -3800
        },
        limits: {
            maxAccel: 2.2,
            maxDecelClean: 1.2,
            maxDecelFlaps: 2.0,
            vsAccelRate: 300,
            spoolRate: 0.16
        },
        maxSpeedTMA: 250,
        initialAppSpeed: 220,
        intermediateAppSpeed: 180,
        finalAppSpeed: 150,
        approachSpeed: 120,
        minApproachSpeed: 115,
        taxaAcel: 2.2,
        taxaDesacel: 1.2,
        accelerationRate: 2.2,
        decelerationRate: 1.2
    },
    C25A: {
        speeds: { vMin: 110, vApp: 118, vCleanMin: 170, vAppMin: 110, vClimb: 240, vCruise: 270, vMax: 310 },
        rates: {
            climbNormal: 2300,
            climbExpedite: 3100,
            climbStructuralMax: 3800,
            descentNormal: -1700,
            descentExpedite: -2600,
            descentStructuralMax: -3600
        },
        limits: {
            maxAccel: 2.1,
            maxDecelClean: 1.1,
            maxDecelFlaps: 1.9,
            vsAccelRate: 280,
            spoolRate: 0.17
        },
        maxSpeedTMA: 240,
        initialAppSpeed: 210,
        intermediateAppSpeed: 175,
        finalAppSpeed: 145,
        approachSpeed: 118,
        minApproachSpeed: 110,
        taxaAcel: 2.1,
        taxaDesacel: 1.1,
        accelerationRate: 2.1,
        decelerationRate: 1.1
    },
    E50P: {
        speeds: { vMin: 105, vApp: 112, vCleanMin: 160, vAppMin: 105, vClimb: 230, vCruise: 260, vMax: 300 },
        rates: {
            climbNormal: 2200,
            climbExpedite: 2900,
            climbStructuralMax: 3600,
            descentNormal: -1600,
            descentExpedite: -2500,
            descentStructuralMax: -3500
        },
        limits: {
            maxAccel: 2.0,
            maxDecelClean: 1.1,
            maxDecelFlaps: 1.8,
            vsAccelRate: 260,
            spoolRate: 0.17
        },
        maxSpeedTMA: 230,
        initialAppSpeed: 200,
        intermediateAppSpeed: 170,
        finalAppSpeed: 140,
        approachSpeed: 112,
        minApproachSpeed: 105,
        taxaAcel: 2.0,
        taxaDesacel: 1.1,
        accelerationRate: 2.0,
        decelerationRate: 1.1
    },
    E55P: {
        speeds: { vMin: 110, vApp: 115, vCleanMin: 170, vAppMin: 110, vClimb: 250, vCruise: 280, vMax: 320 },
        rates: {
            climbNormal: 2500,
            climbExpedite: 3300,
            climbStructuralMax: 4100,
            descentNormal: -1800,
            descentExpedite: -2800,
            descentStructuralMax: -3800
        },
        limits: {
            maxAccel: 2.3,
            maxDecelClean: 1.2,
            maxDecelFlaps: 2.0,
            vsAccelRate: 290,
            spoolRate: 0.16
        },
        maxSpeedTMA: 250,
        initialAppSpeed: 220,
        intermediateAppSpeed: 180,
        finalAppSpeed: 148,
        approachSpeed: 115,
        minApproachSpeed: 110,
        taxaAcel: 2.3,
        taxaDesacel: 1.2,
        accelerationRate: 2.3,
        decelerationRate: 1.2
    },

    // -------------------------------------------------------------------------
    // 3. TURBOÉLICES (TURBOPROPS)
    // -------------------------------------------------------------------------
    B350: {
        speeds: { vMin: 105, vApp: 115, vCleanMin: 150, vAppMin: 105, vClimb: 180, vCruise: 230, vMax: 260 },
        rates: {
            climbNormal: 1600,
            climbExpedite: 2200,
            climbStructuralMax: 2800,
            descentNormal: -1500,
            descentExpedite: -2200,
            descentStructuralMax: -3000
        },
        limits: {
            maxAccel: 1.5,
            maxDecelClean: 1.4,
            maxDecelFlaps: 2.4,
            vsAccelRate: 220,
            spoolRate: 0.22
        },
        maxSpeedTMA: 220,
        initialAppSpeed: 195,
        intermediateAppSpeed: 170,
        finalAppSpeed: 145,
        approachSpeed: 115,
        minApproachSpeed: 105,
        taxaAcel: 1.5,
        taxaDesacel: 1.4,
        accelerationRate: 1.5,
        decelerationRate: 1.4
    },
    BE20: {
        speeds: { vMin: 100, vApp: 110, vCleanMin: 145, vAppMin: 100, vClimb: 170, vCruise: 220, vMax: 250 },
        rates: {
            climbNormal: 1500,
            climbExpedite: 2000,
            climbStructuralMax: 2600,
            descentNormal: -1400,
            descentExpedite: -2100,
            descentStructuralMax: -2800
        },
        limits: {
            maxAccel: 1.4,
            maxDecelClean: 1.3,
            maxDecelFlaps: 2.3,
            vsAccelRate: 210,
            spoolRate: 0.23
        },
        maxSpeedTMA: 210,
        initialAppSpeed: 190,
        intermediateAppSpeed: 165,
        finalAppSpeed: 140,
        approachSpeed: 110,
        minApproachSpeed: 100,
        taxaAcel: 1.4,
        taxaDesacel: 1.3,
        accelerationRate: 1.4,
        decelerationRate: 1.3
    },
    BE9L: {
        speeds: { vMin: 95, vApp: 105, vCleanMin: 140, vAppMin: 95, vClimb: 160, vCruise: 200, vMax: 230 },
        rates: {
            climbNormal: 1400,
            climbExpedite: 1800,
            climbStructuralMax: 2400,
            descentNormal: -1300,
            descentExpedite: -1900,
            descentStructuralMax: -2600
        },
        limits: {
            maxAccel: 1.3,
            maxDecelClean: 1.3,
            maxDecelFlaps: 2.2,
            vsAccelRate: 200,
            spoolRate: 0.24
        },
        maxSpeedTMA: 200,
        initialAppSpeed: 180,
        intermediateAppSpeed: 155,
        finalAppSpeed: 130,
        approachSpeed: 105,
        minApproachSpeed: 95,
        taxaAcel: 1.3,
        taxaDesacel: 1.3,
        accelerationRate: 1.3,
        decelerationRate: 1.3
    },
    C208: {
        speeds: { vMin: 80, vApp: 90, vCleanMin: 120, vAppMin: 80, vClimb: 130, vCruise: 160, vMax: 185 },
        rates: {
            climbNormal: 1000,
            climbExpedite: 1400,
            climbStructuralMax: 1800,
            descentNormal: -1000,
            descentExpedite: -1600,
            descentStructuralMax: -2200
        },
        limits: {
            maxAccel: 1.1,
            maxDecelClean: 1.2,
            maxDecelFlaps: 2.0,
            vsAccelRate: 170,
            spoolRate: 0.25
        },
        maxSpeedTMA: 165,
        initialAppSpeed: 150,
        intermediateAppSpeed: 135,
        finalAppSpeed: 115,
        approachSpeed: 90,
        minApproachSpeed: 80,
        taxaAcel: 1.1,
        taxaDesacel: 1.2,
        accelerationRate: 1.1,
        decelerationRate: 1.2
    },

    // -------------------------------------------------------------------------
    // 4. MONOMOTORES / AVIAÇÃO LEVE
    // -------------------------------------------------------------------------
    "C172-L": {
        speeds: { vMin: 55, vApp: 65, vCleanMin: 85, vAppMin: 55, vClimb: 80, vCruise: 110, vMax: 135 },
        rates: {
            climbNormal: 700,
            climbExpedite: 950,
            climbStructuralMax: 1300,
            descentNormal: -700,
            descentExpedite: -1200,
            descentStructuralMax: -1600
        },
        limits: {
            maxAccel: 0.8,
            maxDecelClean: 1.0,
            maxDecelFlaps: 1.6,
            vsAccelRate: 150,
            spoolRate: 0.35
        },
        maxSpeedTMA: 120,
        initialAppSpeed: 110,
        intermediateAppSpeed: 95,
        finalAppSpeed: 80,
        approachSpeed: 65,
        minApproachSpeed: 55,
        taxaAcel: 0.8,
        taxaDesacel: 1.0,
        accelerationRate: 0.8,
        decelerationRate: 1.0
    },

    // -------------------------------------------------------------------------
    // 5. PERFIL PADRÃO GENÉRICO (FALLBACK)
    // -------------------------------------------------------------------------
    DEFAULT: {
        speeds: { vMin: 130, vApp: 138, vCleanMin: 200, vAppMin: 130, vClimb: 260, vCruise: 280, vMax: 320 },
        rates: {
            climbNormal: 2000,
            climbExpedite: 2800,
            climbStructuralMax: 3500,
            descentNormal: -1700,
            descentExpedite: -2800,
            descentStructuralMax: -3800
        },
        limits: {
            maxAccel: 2.0,
            maxDecelClean: 1.2,
            maxDecelFlaps: 2.0,
            vsAccelRate: 260,
            spoolRate: 0.16
        },
        maxSpeedTMA: 260,
        initialAppSpeed: 240,
        intermediateAppSpeed: 200,
        finalAppSpeed: 160,
        approachSpeed: 138,
        minApproachSpeed: 130,
        taxaAcel: 2.0,
        taxaDesacel: 1.2,
        accelerationRate: 2.0,
        decelerationRate: 1.2
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
AIRCRAFT_PERFORMANCE["C172"] = AIRCRAFT_PERFORMANCE["C172-L"];

// Exportação de retrocompatibilidade
export const perfisAeronaves = AIRCRAFT_PERFORMANCE;

/**
 * Obtém a performance da aeronave de forma segura com fallback garantido.
 * @param {string} tipo - Código ICAO da aeronave (ex: "B738", "BE40", "B350")
 * @returns {Object} Configuração de performance da aeronave
 */
export function getAircraftPerformance(tipo) {
    if (!tipo) return AIRCRAFT_PERFORMANCE["DEFAULT"];
    const chave = tipo.toUpperCase().trim();
    return AIRCRAFT_PERFORMANCE[chave] || AIRCRAFT_PERFORMANCE["DEFAULT"];
}
