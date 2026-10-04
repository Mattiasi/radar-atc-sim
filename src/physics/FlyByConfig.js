/**
 * ============================================================================
 * CONFIGURAÇÃO DATA-DRIVEN DE NAVEGAÇÃO LATERAL FLY-BY (FlyByConfig.js)
 * ============================================================================
 * Calibrada com base na referência de ouro da rota KOMGU -> GERSU:
 * - Curva de ~74° resulta em ~1.38 NM de antecipação suave e estabilização precisa.
 * - Suporta parâmetros globais, limites por fração de perna e overrides por fixo.
 * ============================================================================
 */

import { calcularRumoDistancia, isFixoDePista } from '../utils/utils.js';
import { obterRestricaoFixoParaAeronave } from '../data/data.js';

export const FLY_BY_CONFIG = {
    // Multiplicador de antecipação angular por grau de curva (Padrão Ouro KOMGU -> GERSU)
    // difCurva * turnGainNMPerDeg => ex: 74° * 0.0186 ≈ 1.38 NM
    turnGainNMPerDeg: 0.0186,

    // Distância mínima padrão de antecipação de curva em rota (NM)
    minFlyByNM: 1,

    // Fração máxima da próxima perna permitida para antecipar (impede cortar pernas curtas demais)
    maxLegFraction: 0.4,

    // Distância padrão quando não há próxima perna na rota (NM)
    defaultFlyByNM: 0.4,

    // Distância para cabeceiras de pista e fixos de limiar (voa quase na vertical exata da cabeceira)
    thresholdFlyByNM: 0.05,

    // Distância para fixos marcados explicitamente como Fly-Over
    flyOverDistanceNM: 0.1,

    // Overrides específicos opcionais por fixo (nome do fixo: distância em NM)
    // Exemplo: { "KOMGU": 1.38 }
    customFixOverrides: {}
};

/**
 * Calcula a distância em NM de antecipação de curva (Fly-By) para o waypoint atual.
 * 
 * @param {string} wpNome - Nome do fixo atual
 * @param {string|null} nextWpNome - Nome do próximo fixo na rota
 * @param {Object} wpCoords - Coordenadas deltaLat/deltaLon do fixo atual
 * @param {Object|null} nextWpCoords - Coordenadas deltaLat/deltaLon do próximo fixo
 * @param {Object|null} aeroNavInfo - Navegação atual { rumo, distanciaNM }
 * @param {Object} [aero=null] - Instância da aeronave (opcional para overrides de performance)
 * @returns {number} Distância de antecipação em NM
 */
export function calcularFlyByDistance(wpNome, nextWpNome, wpCoords, nextWpCoords, aeroNavInfo, aero = null) {
    const config = (aero && aero.flyByConfig) || FLY_BY_CONFIG;

    // Cabeceiras de pista voam até a vertical exata (0.05 NM)
    if (isFixoDePista(wpNome)) {
        return config.thresholdFlyByNM;
    }

    // Override manual específico configurado para este fixo
    if (config.customFixOverrides && config.customFixOverrides[wpNome] !== undefined) {
        return config.customFixOverrides[wpNome];
    }

    // Verifica se a carta possui anotação explícita de fly-over ou flyByNM customizado
    if (aero) {
        const rest = obterRestricaoFixoParaAeronave(wpNome, aero);
        if (rest) {
            if (rest.flyOver) return config.flyOverDistanceNM;
            if (typeof rest.flyByNM === 'number') return rest.flyByNM;
        }
    }

    // Sem próxima perna para avaliar curva, usa distância padrão
    if (!nextWpCoords || !wpCoords || !aeroNavInfo) {
        return config.defaultFlyByNM;
    }

    const nextNavInfo = calcularRumoDistancia(wpCoords, nextWpCoords);
    const proximaProa = parseInt(nextNavInfo.rumo, 10);
    const proaAtual = parseInt(aeroNavInfo.rumo, 10);

    let difCurva = Math.abs(proximaProa - proaAtual);
    if (difCurva > 180) difCurva = 360 - difCurva;

    // Fórmula Ouro calibrada a partir de KOMGU -> GERSU:
    const antecipacaoCalculada = difCurva * config.turnGainNMPerDeg;
    const limitePerna = nextNavInfo.distanciaNM * config.maxLegFraction;

    return Math.max(config.minFlyByNM, Math.min(antecipacaoCalculada, limitePerna));
}

