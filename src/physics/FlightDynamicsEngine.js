/**
 * ============================================================================
 * MOTOR DE FÍSICA CINEMÁTICA E ENERGIA (FlightDynamicsEngine.js)
 * ============================================================================
 * Executa no ciclo físico (dt em segundos) o acoplamento dinâmico de energia:
 * - Conversão cinemática IAS -> TAS modulada pela altitude e vetor de vento.
 * - Inércia de empuxo dos motores (spool rate).
 * - Proteção de envelope / Stall Protection (corte de razão vertical e empuxo TOGA).
 * - Conversão de energia potencial em cinética (Bleed IAS em descida íngreme).
 * - Suavização de jerk / aceleração da razão vertical (vsAccelRate).
 * ============================================================================
 */

import { getAircraftPerformance } from '../data/PerformanceDB.js';

export class FlightDynamicsEngine {
    /**
     * Converte Velocidade Indicada (IAS) para Velocidade Verdadeira (TAS) considerando a altitude.
     * TAS = IAS * (1 + (alt / 1000) * 0.018)
     * @param {number} ias - Velocidade indicada em nós (kt)
     * @param {number} alt - Altitude em pés (ft)
     * @returns {number} Velocidade verdadeira (TAS) em nós
     */
    static calcularTAS(ias, alt) {
        const altFt = Math.max(0, alt || 0);
        return (ias || 0) * (1 + (altFt / 1000) * 0.018);
    }

    /**
     * Calcula o vetor de velocidade sobre o solo (Ground Speed e Track) somando TAS e Vento.
     * @param {number} tas - Velocidade verdadeira em nós
     * @param {number} proaDeg - Proa magnética da aeronave (0-359°)
     * @param {Object} [vento={ vLat: 0, vLon: 0 }] - Vetor de vento atuante
     * @returns {Object} { gs, trackDeg, driftDeg, vGroundLat, vGroundLon }
     */
    static calcularVetorGS(tas, proaDeg, vento = { vLat: 0, vLon: 0 }) {
        const radProa = (proaDeg || 0) * (Math.PI / 180);
        const vAirLat = tas * Math.cos(radProa);
        const vAirLon = tas * Math.sin(radProa);

        const vGroundLat = vAirLat + (vento.vLat || 0);
        const vGroundLon = vAirLon + (vento.vLon || 0);

        const gs = Math.sqrt(vGroundLat * vGroundLat + vGroundLon * vGroundLon);
        const trackDeg = (Math.atan2(vGroundLon, vGroundLat) * (180 / Math.PI) + 360) % 360;

        let driftDeg = trackDeg - proaDeg;
        while (driftDeg > 180) driftDeg -= 360;
        while (driftDeg < -180) driftDeg += 360;

        return { gs, trackDeg, driftDeg, vGroundLat, vGroundLon };
    }

    /**
     * Atualiza o balanço simplificado de energia (empuxo, stall protection e bleed IAS).
     * @param {Object} ac - Instância ou estado da aeronave
     * @param {Object} perf - Parâmetros de performance da aeronave
     * @param {number} dt - Passo de tempo em segundos
     */
    static integrarBalancoEnergia(ac, perf, dt) {
        // Inicializa variáveis de energia se ainda não existirem
        if (ac.currentThrust === undefined) ac.currentThrust = 0.6; // 60% empuxo nominal
        if (ac.targetThrust === undefined) ac.targetThrust = 0.6;
        ac.stallProtectionActive = false;

        // 1. Inércia de empuxo dos motores (spoolRate [0.0 a 1.0] por segundo)
        const spoolRate = perf.limits?.spoolRate || 0.15;
        const thrustDiff = ac.targetThrust - ac.currentThrust;
        const maxThrustStep = spoolRate * dt;
        ac.currentThrust += Math.max(-maxThrustStep, Math.min(maxThrustStep, thrustDiff));
        ac.currentThrust = Math.max(0.0, Math.min(1.0, ac.currentThrust));

        // 2. Proteção de Stall (Envelope Inferior)
        // Se IAS <= vMin + 5 kt:
        // O piloto virtual corta imediatamente qualquer subida (targetVS <= 0) para nivelar asas
        // e comanda empuxo total (targetThrust = 1.0) até recuperar energia.
        const vMin = perf.speeds?.vMin || 135;
        const currentIAS = (ac.currentIAS !== undefined) ? ac.currentIAS : (ac.vel || 150);

        if (currentIAS <= vMin + 5) {
            ac.stallProtectionActive = true;
            if (ac.targetVS > 0) {
                ac.targetVS = 0; // Força nivelamento provisório
            }
            ac.targetThrust = 1.0; // Empuxo máximo / TOGA
        }

        // 3. Conversão de Energia Potencial em Cinética (Descida Acentuada / Bleed IAS)
        // Se VS < -2500 ft/min com motor em idle (currentThrust <= 0.20):
        // deltaBleedIAS = ((-VS - 2000) / 1000) * 0.5 * dt
        const currentVS = (ac.currentVS !== undefined) ? ac.currentVS : (ac.verticalSpeed || 0);
        if (currentVS < -2500 && ac.currentThrust <= 0.20) {
            const deltaBleedIAS = ((-currentVS - 2000) / 1000) * 0.5 * dt;
            if (ac.currentIAS !== undefined) {
                ac.currentIAS += deltaBleedIAS;
            }
            if (ac.vel !== undefined) {
                ac.vel += deltaBleedIAS;
            }
        }
    }

    /**
     * Aplica suavização contínua de razão vertical (vsAccelRate / jerk control) e integra a altitude.
     * @param {Object} ac - Instância da aeronave
     * @param {Object} perf - Parâmetros de performance
     * @param {number} dt - Passo de tempo em segundos
     */
    static atualizarCinematicaVertical(ac, perf, dt) {
        if (ac.on_ground || ac.flight_phase === 'LANDED' || ac.pousou) {
            ac.currentVS = 0;
            ac.targetVS = 0;
            ac.verticalSpeed = 0;
            return;
        }

        if (ac.targetVS === undefined) ac.targetVS = 0;
        if (ac.currentVS === undefined) ac.currentVS = ac.verticalSpeed || 0;
        if (ac.alt === undefined) ac.alt = (ac.flAtualNum || 0) * 100;

        // Suavização da Razão Vertical (sem degraus numéricos instantâneos)
        const vsDiff = ac.targetVS - ac.currentVS;
        const vsAccelRate = perf.limits?.vsAccelRate || 280; // (ft/min)/s
        const maxVSDelta = vsAccelRate * dt;
        ac.currentVS += Math.max(-maxVSDelta, Math.min(maxVSDelta, vsDiff));

        // Integração de Altitude física: alt (ft) += (currentVS / 60) * dt
        ac.alt += (ac.currentVS / 60) * dt;

        // TRAVA VERTICAL DE SEGURANÇA (Hard Floor Clamping):
        // Garante que nenhuma inércia física fure o piso autorizado/restrição do fixo antes do bloqueio
        let pisoAtivoFt = (ac.vertical_floor_altitude !== null && ac.vertical_floor_altitude !== undefined)
            ? ac.vertical_floor_altitude
            : null;
        if (ac.flyByProtegido && ac.flyByProtegido.flMinimo !== undefined) {
            const isViaAtivo = (ac.nivAutorizadoFisico === "VIA" || ac.nivAutorizadoFisico === "---" || ac.nivAutorizado === "VIA" || ac.cleared_level === "VIA");
            if (isViaAtivo && !ac.semRestricoes) {
                const flyByFt = ac.flyByProtegido.flMinimo * 100;
                pisoAtivoFt = (pisoAtivoFt !== null) ? Math.max(pisoAtivoFt, flyByFt) : flyByFt;
            }
        }

        if (pisoAtivoFt !== null && ac.descent_mode !== 'OPEN_DESCENT' && ac.descent_mode !== 'GLIDEPATH' && ac.descent_mode !== 'FLARE' && !ac.on_ground) {
            // Se o aviǜo estǭ mais de 500pǸs abaixo do piso (ex: vetoraǜo baixa), N?O teleporte-o para cima.
            // S corrija pequenos overshoots fsicos.
            if (ac.alt < pisoAtivoFt && ac.alt >= pisoAtivoFt - 500) {
                ac.alt = pisoAtivoFt;
                if (ac.currentVS < 0) ac.currentVS = 0;
            }
        }

        ac.flAtualNum = ac.alt / 100;

        // Atualiza a propriedade verticalSpeed da aeronave para compatibilidade
        ac.verticalSpeed = Math.round(ac.currentVS);
    }

    /**
     * Aplica suavização de velocidade indicada (IAS) e integra o deslocamento / DTG.
     * @param {Object} ac - Instância da aeronave
     * @param {Object} perf - Parâmetros de performance
     * @param {number} dt - Passo de tempo em segundos
     */
    static atualizarCinematicaLongitudinal(ac, perf, dt) {
        if (ac.targetIAS === undefined) ac.targetIAS = ac.velDestino || ac.vel || 250;
        if (ac.currentIAS === undefined) ac.currentIAS = ac.vel || 250;

        const iasDiff = ac.targetIAS - ac.currentIAS;
        let maxAccel;
        if (iasDiff > 0) {
            maxAccel = perf.limits?.maxAccel || 2.3;
        } else {
            maxAccel = ac.flaps ? (perf.limits?.maxDecelFlaps || 2.0) : (perf.limits?.maxDecelClean || 1.1);
            if (ac.speedbrakes) maxAccel *= 1.8;
        }

        const maxIASDelta = maxAccel * dt;
        ac.currentIAS += Math.max(-maxIASDelta, Math.min(maxIASDelta, iasDiff));
        ac.vel = ac.currentIAS;

        // Atualização de Distance-To-Go / DME
        if (ac.distanceToGoNM !== undefined && ac.gs) {
            ac.distanceToGoNM = Math.max(0, ac.distanceToGoNM - (ac.gs / 3600) * dt);
            ac.dtg = ac.distanceToGoNM;
        }
    }

    /**
     * Ciclo físico principal completo do motor de dinâmica de voo (passo dt).
     * @param {Object} ac - Instância da aeronave
     * @param {Object} vento - Vetor de vento atuante
     * @param {number} dt - Delta time em segundos
     */
    static update(ac, vento, dt) {
        const perf = getAircraftPerformance(ac.tipo);

        // 1. Balanço de energia, empuxo e envelopes de proteção
        this.integrarBalancoEnergia(ac, perf, dt);

        // 2. Cinemática vertical (aceleração de VS e altitude)
        this.atualizarCinematicaVertical(ac, perf, dt);

        // 3. Cinemática longitudinal (aceleração/desaceleração de IAS)
        this.atualizarCinematicaLongitudinal(ac, perf, dt);

        // 4. Conversão TAS e soma vetorial com vento para GS e Track
        ac.tas = this.calcularTAS(ac.currentIAS, ac.alt);
        const nav = this.calcularVetorGS(ac.tas, ac.proa, vento);
        ac.gs = nav.gs;
        ac.groundSpeed = nav.gs;
        ac.track = nav.trackDeg;
        ac.driftAngle = nav.driftDeg;

        return nav;
    }
}
