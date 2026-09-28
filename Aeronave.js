import { state } from './state.js';
import { latCentro, lonCentro, correcaoLon, calcularRumoDistancia, geoParaDelta } from './utils.js';
import { perfisAeronaves, AIRCRAFT_PERFORMANCE, APPROACH_SPEED_PROFILE, restricoesFixos, montarRotaAPartirDeFixo, fixosNavegacao, aerodromos, obterNiveisSpawn } from './data.js';
import { windManager } from './windManager.js';
import { calculateWindCorrectionAngle, normalizeHeading } from './windMath.js';
import { PilotAgent } from './pilotEngine.js';
import { VirtualPilot } from './VirtualPilot.js';
import { FlightDynamicsEngine } from './FlightDynamicsEngine.js';

/**
 * Classe principal que modela o comportamento físico, cinemático e lógico de cada aeronave.
 * 
 * Funciona como uma Máquina de Estados Finitos (FSM) com cinemática contínua:
 * - LNAV (Lateral Navigation): Segue sequências de waypoints (STAR) com antecipação de curvas (Fly-By).
 * - VNAV (Vertical Navigation): Calcula Top of Descent (TOD), perfis de descida de 3° e respeita restrições de cartas.
 * - Controle Dinâmico de Velocidade: Gestão baseada em Distance-To-Go / DME, performance individual, tráfego precedente e instruções ATC.
 * - Simulação Humana (Delay Buffer): Comandos do controlador ATC entram numa fila de retardo aleatório (2 a 4 segundos)
 *   para simular o tempo de reação do piloto antes de iniciar curvas, mudanças de velocidade ou altitude.
 */
/**
 * Versão "Padrão Ouro" (Linear Assimétrica + Razão Vertical + Ruído Atmosférico)
 * Utiliza as taxas individuais de aceleração e desaceleração de cada aeronave definidas em data.js,
 * moduladas dinamicamente pela atitude de voo (razão vertical) e superfícies aerodinâmicas (speedbrakes):
 * 
 * - ACELERANDO: taxaAcel definida em data.js para o modelo.
 *   * Se estiver descendo (verticalSpeed < -200 ft/min), a gravidade auxilia na aceleração (+15%).
 *   * Se estiver subindo (verticalSpeed > 200 ft/min), o gradiente de subida consome empuxo (-15%).
 * - DESACELERANDO: baseado em taxaDesacel definida em data.js para o modelo (voo nivelado em IDLE).
 *   * Descendo (verticalSpeed < -200 ft/min): a gravidade empurra para frente, reduzindo a desaceleração
 *     (~60% da taxa nominal sem speedbrake, ~150% com speedbrake).
 *   * Nivelado em IDLE: taxa nominal de data.js (100% sem speedbrake, ~200% com speedbrake).
 * - Ruído Atmosférico: adiciona ligeiras flutuações dinâmicas de vento e turbulência (±10%)
 *   ao variar as velocidades, garantindo fidelidade de simulação sem quebrar a cinemática linear.
 * 
 * @param {Aeronave|Object} ac - Instância da aeronave ou objeto de estado cinemático
 * @param {number} dt - Delta time em segundos decorrido desde o último ciclo
 */
export function calcularTaxaDesacel(ac) {
    const perf = (ac.tipo && (AIRCRAFT_PERFORMANCE[ac.tipo] || perfisAeronaves[ac.tipo])) 
        ? (AIRCRAFT_PERFORMANCE[ac.tipo] || perfisAeronaves[ac.tipo]) 
        : (AIRCRAFT_PERFORMANCE["DEFAULT"] || { taxaDesacel: 1.2 });
    const baseDesacel = (ac.taxaDesacel !== undefined) ? ac.taxaDesacel : (perf.taxaDesacel || perf.decelerationRate || 1.2);
    const estaDescendo = ac.verticalSpeed && ac.verticalSpeed < -200; // ft/min

    if (estaDescendo) {
        // Descendo: gravidade empurra a aeronave para frente, dificultando a desaceleração
        return baseDesacel * (ac.speedbrakes ? 1.5 : 0.6);
    } else {
        // Nivelado em IDLE: taxa nominal da aeronave em data.js
        return baseDesacel * (ac.speedbrakes ? 2.0 : 1.0);
    }
}

export function calcularTaxaAcel(ac) {
    const perf = (ac.tipo && (AIRCRAFT_PERFORMANCE[ac.tipo] || perfisAeronaves[ac.tipo])) 
        ? (AIRCRAFT_PERFORMANCE[ac.tipo] || perfisAeronaves[ac.tipo]) 
        : (AIRCRAFT_PERFORMANCE["DEFAULT"] || { taxaAcel: 2.0 });
    const baseAcel = (ac.taxaAcel !== undefined) ? ac.taxaAcel : (perf.taxaAcel || perf.accelerationRate || 2.0);

    if (ac.verticalSpeed && ac.verticalSpeed < -200) {
        return baseAcel * 1.15; // Gravidade auxiliando aceleração na descida
    } else if (ac.verticalSpeed && ac.verticalSpeed > 200) {
        return baseAcel * 0.85; // Subida consumindo empuxo
    }
    return baseAcel;
}

export function atualizarVelocidadeRealista(ac, dt) {
    const curSpeed = (ac.speed !== undefined) ? ac.speed : ac.vel;
    const tgtSpeed = (ac.targetSpeed !== undefined) ? ac.targetSpeed : ac.velDestino;

    if (curSpeed === tgtSpeed) return;

    let taxa = 0;

    if (curSpeed < tgtSpeed) {
        // ACELERANDO (taxaAcel de data.js modulada pela razão vertical)
        taxa = calcularTaxaAcel(ac); 
    } else {
        // DESACELERANDO (taxaDesacel de data.js modulada pela razão vertical e speedbrakes)
        taxa = calcularTaxaDesacel(ac);
    }

    // Taxa linear sem ruído estocástico de alta frequência
    const taxaEfetiva = taxa;

    // Aplicação linear
    const direcao = Math.sign(tgtSpeed - curSpeed);
    const passo = direcao * taxaEfetiva * dt;

    let novaVel;
    if (Math.abs(tgtSpeed - curSpeed) <= Math.abs(passo)) {
        novaVel = tgtSpeed;
    } else {
        novaVel = curSpeed + passo;
    }

    if (ac.speed !== undefined) ac.speed = novaVel;
    if (ac.vel !== undefined) ac.vel = novaVel;
}

export class Aeronave {
    /**
     * @param {string} callsign - Indicativo de chamada da aeronave (ex: "GLO1234", "PT-ABC").
     * @param {string} tipo - Tipo ICAO da aeronave (ex: "A320", "B738", "E195", "BE40").
     * @param {number} lat - Latitude inicial em formato decimal.
     * @param {number} lon - Longitude inicial em formato decimal.
     * @param {number} proa - Proa magnética inicial em graus (000 a 359).
     * @param {number} vel - Velocidade indicada inicial (IAS) em nós (kt).
     * @param {string} nivAtual - Nível de voo inicial para exibição na etiqueta (ex: "120", "090↓").
     * @param {string} nivAutorizado - Nível autorizado pelo controlador exibido na etiqueta (ex: "070", "VIA").
     * @param {string} dest - Aeródromo de destino (ex: "SBSP").
     * @param {string} [textoLivre=""] - Anotações do controlador inseridas no bloco livre da etiqueta (Scratchpad).
     * @param {Array<string>} [rota=[]] - Lista sequencial de nomes de fixos da STAR (ex: ROTA_PRUMO ou ROTA_OGTAL).
     * @param {number} [spawnWpIndex=0] - Índice do fixo ativo para onde a aeronave se dirige logo após o spawn.
     */
    constructor(callsign, tipo, lat, lon, proa, vel, nivAtual, nivAutorizado, dest, textoLivre = "", rota = [], spawnWpIndex = 0) {
        // --- 1. IDENTIFICAÇÃO E POSIÇÃO CARTESIANA ---
        this.callsign = callsign; // Identificador ATC
        this.tipo = tipo;         // Modelo da aeronave para determinar coeficientes de desempenho
        
        // Posição cartesiana em deltas magnéticos relativos ao marco zero do radar (Aeroporto SBSP).
        // Converte coordenadas reais WGS-84 (ou recebe deltas diretamente se já convertidos).
        if (Math.abs(lat) < 5) {
            this.deltaLat = lat;
            this.deltaLon = lon;
        } else {
            const ptDelta = geoParaDelta(lat, lon);
            this.deltaLat = ptDelta.deltaLat;
            this.deltaLon = ptDelta.deltaLon;
        }
        
        // --- 2. PERFIL DE PERFORMANCE CINEMÁTICA ---
        // Coeficientes de aceleração, desaceleração e envelope de aproximação individual
        const perf = AIRCRAFT_PERFORMANCE[this.tipo] || AIRCRAFT_PERFORMANCE["DEFAULT"] || perfisAeronaves[this.tipo] || perfisAeronaves["DEFAULT"];
        this.perf = perf;
        this.taxaAcel = perf.taxaAcel || perf.accelerationRate || 1.8;       // Aceleração máxima (kt/s²)
        this.taxaDesacel = perf.taxaDesacel || perf.decelerationRate || 1.2; // Desaceleração máxima (kt/s²)
        this.maxSpeedTMA = perf.maxSpeedTMA || 260;                          // Teto na TMA (> 25 NM)
        this.minApproachSpeed = perf.minApproachSpeed || 125;                // Vls / velocidade mínima segura
        this.approachSpeed = perf.approachSpeed || 135;                      // Vapp / velocidade de toque
        this.initialAppSpeed = perf.initialAppSpeed || 240;                  // Velocidade entre 25-15 NM
        this.intermediateAppSpeed = perf.intermediateAppSpeed || 200;        // Velocidade entre 15-10 NM
        this.finalAppSpeed = perf.finalAppSpeed || 160;                      // Velocidade entre 10-4 NM
        this.dtg = 99;                                                       // Distance-To-Go atualizado dinamicamente em NM
        this.sugestaoVel = null;                                             // Sugestão de velocidade para apoio ao controlador
        
        // --- 3. NAVEGAÇÃO LATERAL (PROA / HEADING) ---
        this.proa = proa;                        // Proa magnética atual da aeronave (0-359°)
        this.proaDestino = proa;                 // Proa alvo que a aeronave está buscando atingir
        this.proaPendente = null;                // Buffer de proa recebida do ATC aguardando o fim do delay de reação
        this.curvaMaiorPendente = false;         // Flag booleana: se true, força curva pelo arco maior (comando Hxxx+)
        this.direcaoCurva = 0;                   // Sentido atual da curva: -1 (Esquerda), 1 (Direita), 0 (Asas niveladas)
        this.delayProa = 0;                      // Ciclos restantes de espera antes de aplicar o comando de proa
        
        // --- 4. GESTÃO DE VELOCIDADE INDICADA (IAS) ---
        this.vel = vel;                          // Velocidade atual em nós (Ground Speed simulada)
        this.velComando = vel;                   // Velocidade alvo definida pelo LNAV ou instruída pelo ATC
        this.velDestino = vel;                   // Velocidade alvo acrescida de ruídos atmosféricos e oscilações do radar
        this.velPendente = null;                 // Buffer de velocidade pendente aguardando delay de reação
        this.delayVel = 0;                       // Contador de ciclos de retardo para velocidade
        this.velManual = false;                  // Flag: true se o ATC fixou velocidade manual (anula reduções automáticas da rota)
        this.speedbrakes = false;                // Flag: speedbrakes / spoilers acionados (aumentam taxa de frenagem)
        this.speedbrakesComando = false;         // Flag: ativado explicitamente via Scratchpad (comando SB)

        // Se nivAtual ou nivAutorizado não forem fornecidos, obtém automaticamente das restrições da rota
        if ((!nivAtual || !nivAutorizado) && rota && rota.length > 0) {
            const refWp = rota[spawnWpIndex] || rota[0];
            const niveisAuto = obterNiveisSpawn(refWp, rota);
            if (!nivAtual) nivAtual = niveisAuto.nivAtual;
            if (!nivAutorizado) nivAutorizado = niveisAuto.nivAutorizado;
        }

        // --- 5. NAVEGAÇÃO VERTICAL (FLIGHT LEVEL / VNAV) ---
        this.nivAtual = nivAtual;                // String formatada para a etiqueta do radar (ex: "055↓")
        this.nivAutorizado = nivAutorizado;      // Clearance textual exibido no radar (ex: "040" ou "VIA")
        this.nivAutorizadoFisico = nivAutorizado;// Alvo numérico de altitude para a física de descida
        this.nivAutorizadoPendente = null;       // Buffer de nível autorizado enquanto corre o delay de reação do piloto
        this.delayNivel = 0;                     // Contador de ciclos de espera para autorização de nível
        this.flAtualNum = parseInt(nivAtual) || 0; // Valor numérico de altitude em Flight Level (ex: FL 55 = 5500 pés)
        this.verticalSpeed = 0;                  // Inicializa nivelado; VNAV modula dinamicamente a razão de descida a partir do TOD

        // --- 6. GESTÃO DE ROTA AUTOMÁTICA (LNAV) E TRANSIÇÕES (FLY-BY) ---
        this.rota = rota;                        // Sequência ordenada de nomes de fixos da carta (STAR)
        this.wpIndex = spawnWpIndex;             // Ponteiro para o waypoint ativo que a aeronave está perseguindo
        this.modoLNAV = (rota && rota.length > 0); // true = seguindo fixos da rota; false = vetorada por proa manual
        this.wpPendente = null;                  // Waypoint direto (DCT) pendente em buffer
        this.wpOffRoute = null;                  // Waypoint fora da rota padrão para voo direto temporário
        this.delayWp = 0;                        // Contador de delay para ativação de novo waypoint
        this.flyByDist = 0.6;                    // Distância calculada em NM para antecipar a curva antes do fixo
        this.desceuParaWp = {};                  // Registro de histerese: impede interrupção de descidas já iniciadas
        this.flyByProtegido = null;              // Trava de segurança RNAV: { fixoNome, flMinimo, distMin } durante fly-by com restrição de piso
        
        // --- 7. SISTEMA DE ETIQUETAS E CONTROLE OPERACIONAL ATC ---
        this.dest = dest;                        // Destino exibido na etiqueta (ex: "SBSP")
        this.textoLivre = textoLivre;            // Dados brutos digitados pelo operador no Scratchpad
        this.ultimoComandoTexto = "";            // Cache do último texto para evitar re-execução desnecessária de regex
        this.ultimoWpComandadoTexto = null;      // Evita reprocessar o mesmo comando de ponto em loop
        
        this.historico = [];                     // Últimas 5 posições cartesianas para desenho dos ecos históricos (rasto)
        this.labelAngle = Math.PI / 4;           // Ângulo polar em radianos da linha guia da etiqueta (Leader line)
        this.labelDist = 40;                     // Distância em píxeis entre o blip da aeronave e a etiqueta
        
        this.gerouSucessor = false;              // Trava do spawner: garante que esta aeronave crie apenas 1 sucessor na esteira
        this.rotaOriginal = null;                // Nome da rota de origem ("OGTAL" ou "PRUMO") para manter a esteira ativa
        this.distTriggerAnt = undefined;         // Distância anterior ao ponto gatilho (para detectar passagem)

        this.squawk = "";                        // Código transponder (muda para "2000" na final para indicar visual)
        this.pousou = false;                     // Flag de ciclo de vida: true remove a aeronave da memória do simulador

        // --- 8. SISTEMA REALISTA DE VENTO E VETORES RESULTANTES DE NAVEGAÇÃO ---
        this.groundSpeed = vel;                  // Velocidade sobre o solo (Ground Speed calculada pelo radar)
        this.track = proa;                       // Trajetória real sobre o solo (Track em graus aeronáuticos)
        this.driftAngle = 0;                     // Ângulo de deriva (Drift Angle = Track - Proa)
        
        let pistaPadrao = null;
        if (Array.isArray(aerodromos)) {
            const aeroData = aerodromos.find(a => a.nome === dest);
            if (aeroData && aeroData.pistas && aeroData.pistas.length > 0) {
                const primaryId = aeroData.pistas[0].id;
                pistaPadrao = primaryId.includes('/') ? primaryId.split('/')[0] : primaryId;
            }
        }
        this.pistaAtribuida = pistaPadrao || ((dest === "SBSP") ? "17R" : null); // Cabeceira terminal atribuída para vento local
        this.ventoAtual = { fromDeg: 0, speedKt: 0, vLat: 0, vLon: 0, origem: "GLOBAL" }; // Vento atuante

        // --- 9. PILOT COCKPIT INTERACTION & DYNAMICS ENGINE ---
        this.pilot = new PilotAgent(this);          // Agente de cabine virtual com gestão concorrente por canais
        this.virtualPilot = new VirtualPilot(this); // FSM vertical, perfil de descida e modos (AUTO, ATC_RATE, EXPEDITE)
        this.alt = this.flAtualNum * 100;
        this.currentVS = 0;
        this.targetVS = 0;
        this.verticalMode = 'AUTO';
        this.clampedAtStructural = false;
        this.expandida = false;                // Etiqueta expandida (exibe linhas 5 e 6 com callsign verde)
        this.temModificacaoVertical = false;   // True quando o controlador comanda razão customizada/expedite
        this.currentIAS = this.vel;
        this.targetIAS = this.vel;
        this.currentThrust = 0.6;
        this.targetThrust = 0.6;
        this.stallProtectionActive = false;
        this.posicaoRadar = { 
            deltaLat: this.deltaLat, 
            deltaLon: this.deltaLon,
            track: (this.track !== undefined) ? this.track : this.proa,
            groundSpeed: (this.groundSpeed !== undefined) ? this.groundSpeed : this.vel,
            nivAtual: this.nivAtual,
            currentVS: 0,
            verticalMode: 'AUTO',
            clampedAtStructural: false,
            temModificacaoVertical: false
        }; // Snapshot da varredura radar (0.25 Hz)
    }

    /**
     * Getters e setters para compatibilidade com o padrão cinemático operacional (ac.speed / ac.targetSpeed)
     */
    get speed() {
        return this.vel;
    }
    set speed(val) {
        this.vel = val;
    }

    get targetSpeed() {
        return this.velDestino;
    }
    set targetSpeed(val) {
        this.velComando = val;
        this.velDestino = val;
    }

    /**
     * Calcula dinamicamente a distância restante estimada até a cabeceira da pista (Distance-To-Go / DME).
     * Funciona com precisão geométrica e preditiva tanto na rota publicada (STAR)
     * quanto durante vetoração radar (downwind, base, interceptação de final ou direta).
     * Atende rigorosamente às Seções 2, 8 e 9 da Especificação ATC.
     * 
     * @returns {number} Distância restante estimada até o toque em Milhas Náuticas (NM).
     */
    calcularDistanceToGo() {
        const destNome = this.dest || "SBSP";
        const ptThreshold = state.fixos[destNome] || state.fixos["SBSP"];
        if (!ptThreshold) return 20.0;

        // Distância euclidiana em linha reta até o limiar
        const infoDireta = calcularRumoDistancia(this, ptThreshold);
        const distDireta = infoDireta.distanciaNM;

        // Rumo magnético da pista de pouso (ex: 170° para SBSP 17R)
        let rumoPista = 170;
        if (Array.isArray(aerodromos)) {
            const aeroData = aerodromos.find(a => a.nome === destNome);
            if (aeroData && aeroData.rumoPista !== undefined) {
                rumoPista = aeroData.rumoPista;
            }
        }

        // =====================================================================
        // CASO 1: NAVEGAÇÃO LATERAL EM ROTA PUBLICADA (LNAV ATIVO)
        // =====================================================================
        if (this.modoLNAV && this.rota && this.wpIndex < this.rota.length) {
            let wpAtivoNome = (this.wpOffRoute !== null) ? this.wpOffRoute : this.rota[this.wpIndex];
            let distRota = 0;
            let wpAtivoCoords = state.fixos[wpAtivoNome];

            if (wpAtivoCoords) {
                distRota += calcularRumoDistancia(this, wpAtivoCoords).distanciaNM;

                // Soma as pernas subsequentes da STAR
                const idxInicio = (this.wpOffRoute !== null) ? this.wpIndex : this.wpIndex;
                for (let i = idxInicio; i < this.rota.length - 1; i++) {
                    let p1 = state.fixos[this.rota[i]];
                    let p2 = state.fixos[this.rota[i + 1]];
                    if (p1 && p2) {
                        distRota += calcularRumoDistancia(p1, p2).distanciaNM;
                    }
                }

                // Se a STAR não terminar exatamente na cabeceira, soma do último fixo até ela
                const ultimoFixo = this.rota[this.rota.length - 1];
                if (ultimoFixo !== destNome) {
                    const ultCoords = state.fixos[ultimoFixo];
                    if (ultCoords) {
                        distRota += calcularRumoDistancia(ultCoords, ptThreshold).distanciaNM;
                    }
                }

                return Math.max(distDireta, distRota);
            }
        }

        // =====================================================================
        // CASO 2: VETORAÇÃO RADAR / FORA DA ROTA PUBLICADA (OFF-ROUTE)
        // =====================================================================
        // Geometria analítica no plano cartesiano magnético do radar:
        // O eixo de aproximação estende-se para trás da cabeceira no rumo recíproco (rumoPista + 180°)
        const angReciprocoRad = ((rumoPista + 180) % 360) * (Math.PI / 180);
        const uAppX = Math.sin(angReciprocoRad);
        const uAppY = Math.cos(angReciprocoRad);

        // Vetor do limiar da pista até a posição atual da aeronave em Milhas Náuticas
        const dLat = (this.deltaLat - ptThreshold.deltaLat) * 60;
        const dLon = (this.deltaLon - ptThreshold.deltaLon) * correcaoLon * 60;

        // dAlong: distância longitudinal ao longo do prolongamento do eixo (+ para o setor de aproximação)
        const dAlong = dLon * uAppX + dLat * uAppY;
        // dCross: afastamento lateral ortogonal em relação ao eixo da pista
        const dCross = Math.abs(dLon * (-uAppY) + dLat * uAppX);

        // Componente da proa da aeronave ao longo do eixo de aproximação para a pista:
        // vAlong > 0 indica voo em direção à final/pouso; vAlong < 0 indica afastamento (ex: downwind, abertura de base)
        const angProaRad = (this.proa - rumoPista) * (Math.PI / 180);
        const vAlong = Math.cos(angProaRad);

        let dtgEstimado = distDireta;

        if (dAlong > 0 && vAlong > 0.3) {
            // Aeronave interceptando ou alinhada com a reta final
            dtgEstimado = dAlong + 1.25 * dCross;
        } else {
            // Aeronave em perna do vento (downwind), proa de afastamento ou vetoração indireta:
            // A trajetória restante prevista exige voar até o ponto de curva base (mínimo 10-12 NM na final),
            // percorrer o braço da base lateral e depois a final até o toque (Seção 9).
            const dBaseAlong = Math.max(dAlong, 11.0);
            const distAteBase = Math.abs(dBaseAlong - dAlong);
            const distPernaBase = dCross * 1.25;
            const distFinal = dBaseAlong;
            const allowanceCurvas = 2.5; // NM para manobra e transição de arcos de curva

            dtgEstimado = distAteBase + distPernaBase + distFinal + allowanceCurvas;
        }

        return Math.max(distDireta, dtgEstimado);
    }

    /**
     * Calcula dinamicamente a velocidade-alvo da aeronave considerando:
     * - Distance-To-Go / DME calculado em tempo real
     * - Performance individual da aeronave (AIRCRAFT_PERFORMANCE)
     * - Desaceleração gradual e antecipação cinemática (Lookahead)
     * - Tráfego precedente e taxa de fechamento sobre o solo (Ground Speed)
     * - Prioridade de instruções ATC manuais e retomada automática
     * - Acionamento automático de Spoilers/Speedbrakes sob descida e frenagem
     * 
     * Atende às Seções 1 a 23 da Especificação ATC.
     * @returns {number} Velocidade-alvo em nós (KIAS).
     */
    calcularVelocidadeAlvoDinamica() {
        const perf = this.perf || AIRCRAFT_PERFORMANCE[this.tipo] || AIRCRAFT_PERFORMANCE["DEFAULT"];
        const dtg = this.calcularDistanceToGo();
        this.dtg = dtg;

        const maxSpd = perf.maxSpeedTMA || 260;
        const minSpd = perf.minApproachSpeed || 125;
        const vApp = perf.approachSpeed || 135;

        // ---------------------------------------------------------------------
        // 1. PRIORIDADE MÁXIMA: INSTRUÇÃO EXPLÍCITA DO CONTROLADOR (ATC)
        // ---------------------------------------------------------------------
        // Se o ATC fixou uma velocidade manual (ex: "21K"), ela tem prioridade total (Seção 13).
        // Exceção de segurança operacional: ao entrar na curta final (< 4 NM), o piloto
        // virtual deve configurar e reduzir suavemente para Vapp para pousar (Seções 14 e 19).
        if (this.velManual) {
            if (dtg >= 4.0) {
                const velClamp = Math.max(minSpd, Math.min(maxSpd, this.velComando));
                this.sugestaoVel = velClamp;
                return velClamp;
            } else {
                // Curta final (< 4 NM): transição suave para Vapp mesmo com velocidade manual anterior
                const fatorFinal = Math.max(0, Math.min(1, (dtg - 1.0) / 3.0));
                const velTeto = Math.min(this.velComando, perf.finalAppSpeed || 170);
                const velTrans = vApp + fatorFinal * (velTeto - vApp);
                const velClamp = Math.max(minSpd, Math.min(maxSpd, Math.round(velTrans)));
                this.sugestaoVel = velClamp;
                return velClamp;
            }
        }

        // ---------------------------------------------------------------------
        // 2. PERFIL DE VELOCIDADE AUTOMÁTICO BASEADO EM DISTANCE-TO-GO
        // ---------------------------------------------------------------------
        // Perfil contínuo interpolado proporcionalmente à performance da aeronave (Seções 3, 5 e 6).
        // Evita degraus bruscos: desaceleração progressiva a cada milha percorrida.
        let vBase = maxSpd;

        const v25 = perf.initialAppSpeed || 250;
        const v15 = perf.intermediateAppSpeed || 205;
        const v10 = perf.finalAppSpeed || 165;
        const v4 = Math.min(v10, Math.max(vApp + 25, 160));

        if (dtg > 35.0) {
            vBase = maxSpd;
        } else if (dtg > 25.0) {
            // Entre 35 NM e 25 NM: transição de maxSpeedTMA para initialAppSpeed
            const t = (dtg - 25.0) / 10.0;
            vBase = v25 + t * (maxSpd - v25);
        } else if (dtg > 15.0) {
            // Entre 25 NM e 15 NM: desaceleração de initialAppSpeed para intermediateAppSpeed (~210 kt)
            const t = (dtg - 15.0) / 10.0;
            vBase = v15 + t * (v25 - v15);
        } else if (dtg > 10.0) {
            // Entre 15 NM e 10 NM: desaceleração de ~210 kt para finalAppSpeed (~180-165 kt)
            const t = (dtg - 10.0) / 5.0;
            vBase = v10 + t * (v15 - v10);
        } else if (dtg > 4.0) {
            // Entre 10 NM e 4 NM: final approach de ~180-165 kt para ~160 kt
            const t = (dtg - 4.0) / 6.0;
            vBase = v4 + t * (v10 - v4);
        } else if (dtg > 1.0) {
            // Entre 4 NM e 1 NM: desaceleração final para Vapp
            const t = (dtg - 1.0) / 3.0;
            vBase = vApp + t * (v4 - vApp);
        } else {
            vBase = vApp;
        }

        // ---------------------------------------------------------------------
        // 3. ANTECIPAÇÃO CINEMÁTICA DE DESACELERAÇÃO (LOOKAHEAD PREDITIVO)
        // ---------------------------------------------------------------------
        // Se a aeronave estiver mais rápida que o perfil à frente, calcula a distância
        // de frenagem necessária (Seções 6 e 7) para antecipar a redução suavemente.
        const taxaEstimada = calcularTaxaDesacel(this);
        const brackets = [
            { d: 25.0, v: v25 },
            { d: 15.0, v: v15 },
            { d: 10.0, v: v10 },
            { d: 4.0,  v: v4 },
            { d: 1.0,  v: vApp }
        ];

        for (const b of brackets) {
            if (dtg > b.d && this.vel > b.v) {
                const tempoFrenagem = (this.vel - b.v) / Math.max(0.5, taxaEstimada);
                const velMedia = (this.vel + b.v) / 2;
                const distFrenagem = (velMedia / 3600) * tempoFrenagem + 1.0; // +1 NM margem

                if ((dtg - b.d) <= distFrenagem) {
                    vBase = Math.min(vBase, b.v);
                }
            }
        }

        // ---------------------------------------------------------------------
        // 4. INTERAÇÃO COM O TRÁFEGO PRECEDENTE E SEQUENCIAMENTO DINÂMICO
        // ---------------------------------------------------------------------
        // Monitora aeronave precedente na mesma pista e calcula taxa de fechamento
        // sobre o solo (Ground Speed, considerando vento) (Seções 10, 11, 12 e 15).
        let correcaoTrafego = 0;
        let menorDeltaDTG = 999;
        let trafegoPrecedente = null;

        if (state.aeronaves && Array.isArray(state.aeronaves)) {
            for (const ac of state.aeronaves) {
                if (ac === this || ac.pousou) continue;
                if ((ac.dest || "SBSP") !== (this.dest || "SBSP")) continue;

                const dtgOutra = (ac.dtg !== undefined) ? ac.dtg : (typeof ac.calcularDistanceToGo === 'function' ? ac.calcularDistanceToGo() : 999);
                const deltaDTG = dtg - dtgOutra;

                // Deve estar à frente no sequenciamento (deltaDTG > 0) e a menos de 18 NM
                if (deltaDTG > 0.5 && deltaDTG < 18.0 && deltaDTG < menorDeltaDTG) {
                    menorDeltaDTG = deltaDTG;
                    trafegoPrecedente = ac;
                }
            }
        }

        if (trafegoPrecedente) {
            // Taxa de fechamento sobre o solo (Ground Speed)
            const gsMinha = this.groundSpeed || this.vel;
            const gsOutra = trafegoPrecedente.groundSpeed || trafegoPrecedente.vel;
            const taxaFechamento = gsMinha - gsOutra; // kt

            if (taxaFechamento > 0 && menorDeltaDTG < 14.0) {
                // Modulação suave e progressiva de velocidade sem degraus discretos:
                // Fator de proximidade: 0.0 (em 14 NM) a 1.0 (em 4 NM)
                const fatorProx = Math.max(0, Math.min(1.0, (14.0 - menorDeltaDTG) / 10.0));
                correcaoTrafego = -Math.min(25, Math.round(taxaFechamento * fatorProx));
            }

            // Não ultrapassar a velocidade do tráfego precedente se estiver a menos de 6 NM
            if (menorDeltaDTG < 6.0) {
                vBase = Math.min(vBase, trafegoPrecedente.vel + 5);
            }
        }

        // Aplica correção por tráfego respeitando o piso operacional de segurança
        let vAlvo = vBase + correcaoTrafego;
        vAlvo = Math.max(minSpd, Math.min(maxSpd, Math.round(vAlvo)));

        // ---------------------------------------------------------------------
        // 5. ATUAÇÃO AUTOMÁTICA DE SPOILERS / SPEEDBRAKES (SEÇÃO 18)
        // ---------------------------------------------------------------------
        // Se a aeronave estiver em descida pronunciada e precisar desacelerar > 20 kt,
        // ou taxa exigida for alta, o piloto virtual abre spoilers automaticamente.
        if (!this.speedbrakesComando) {
            const estaDescendoForte = (this.verticalSpeed && this.verticalSpeed < -400);
            const precisaFrearMuito = (this.vel - vAlvo > 20);

            if (estaDescendoForte && precisaFrearMuito) {
                this.speedbrakes = true;
            } else if (this.vel - vAlvo <= 5) {
                this.speedbrakes = false;
            }
        }

        this.sugestaoVel = vAlvo;
        return vAlvo;
    }

    /**
     * Motor lógico principal (Main Tick). Recebe o delta time e executa
     * sequencialmente algoritmos de navegação preditiva, atrasos, vetores físicos e cinemática de posição.
     * @param {number} dtSec - Delta time em segundos decorrido desde o último frame de cálculo.
     */
    atualizar(dtSec) {
        let navInfo = null;
        let restricaoAlvo = null;

        // =========================================================================
        // ETAPA 1: NAVEGAÇÃO LATERAL AUTOMÁTICA (LNAV) & TRANSIÇÕES DE WAYPOINT (FLY-BY)
        // -------------------------------------------------------------------------
        // Calcula continuamente a proa magnética euclidiana em direção ao waypoint ativo.
        // Utiliza o algoritmo "Fly-By": antecipa o início da curva antes de sobrevoar
        // as coordenadas exatas do fixo, garantindo alinhamento suave com a próxima perna.
        // =========================================================================
        if (this.modoLNAV) {
            let wpNome = null;
            // Prioridade: se houver fixo temporário direto (DCT off-route), navega para ele;
            // caso contrário, segue o fixo indexado na rota estruturada da STAR.
            if (this.wpOffRoute !== null) {
                wpNome = this.wpOffRoute; 
            } else if (this.rota && this.wpIndex < this.rota.length) {
                wpNome = this.rota[this.wpIndex]; 
            }
            
            if (wpNome) {
                let wpCoords = state.fixos[wpNome];
                if (wpCoords) {
                    // Calcula distância em Milhas Náuticas e rumo magnético até o fixo ativo
                    navInfo = calcularRumoDistancia(this, wpCoords);
                    restricaoAlvo = restricoesFixos[wpNome]; 

                    let flyByDist = 0.4; // Distância mínima padrão de antecipação (0.4 a 0.6 NM)
                    
                    // ALGORITMO FLY-BY:
                    // Calcula a diferença angular entre a perna atual e a próxima perna da carta.
                    // Quanto maior o ângulo da curva, maior deve ser a distância de antecipação para
                    // que o raio da curva (R ≈ V / (20*π)) não cause overshoot (ultrapassagem da trajetória).
                    if (this.wpOffRoute === null && this.rota && this.wpIndex + 1 < this.rota.length) {
                        let nextWpNome = this.rota[this.wpIndex + 1];
                        let nextWpCoords = state.fixos[nextWpNome];
                        
                        if (nextWpCoords) {
                            let nextNavInfo = calcularRumoDistancia(wpCoords, nextWpCoords);
                            let proximaProa = parseInt(nextNavInfo.rumo, 10);
                            let proaAtual = parseInt(navInfo.rumo, 10);
                            
                            // Calcula o arco menor da curva (0 a 180 graus)
                            let difCurva = Math.abs(proximaProa - proaAtual);
                            if (difCurva > 180) difCurva = 360 - difCurva;

                            // 0.0186 NM por grau de curva aproxima geometricamente o raio de curva a ~180-210 nós
                            let antecipacaoCalculada = difCurva * 0.0186;
                            // Limita a antecipação a no máximo 40% da extensão da próxima perna para evitar curvas precoces
                            let limitePerna = nextNavInfo.distanciaNM * 0.4; 
                            
                            flyByDist = Math.max(0.6, Math.min(antecipacaoCalculada, limitePerna));
                        }
                    }
                    this.flyByDist = flyByDist;
                    
                    // GATILHO DE BLOQUEIO DO FIXO:
                    // Ao cruzar a distância de antecipação do fly-by, avança o indexador para o próximo fixo.
                    if (navInfo.distanciaNM <= flyByDist) {
                        if (this.wpOffRoute !== null) {
                            // Se era um fixo direto temporário fora da rota, transita para asas niveladas
                            this.wpOffRoute = null;
                            this.modoLNAV = false;
                            this.flyByProtegido = null;
                        } else {
                            // Proteção Universal de Fly-By: se o fixo possuir restrição de piso ("ABOVE" ou "AT"),
                            // mantém o piso mínimo da restrição durante a curva de fly-by até nivelar asas no próximo segmento
                            if (restricaoAlvo && restricaoAlvo.fl !== undefined && (restricaoAlvo.tipo === "ABOVE" || restricaoAlvo.tipo === "AT")) {
                                this.flyByProtegido = {
                                    fixoNome: wpNome,
                                    flMinimo: restricaoAlvo.fl,
                                    distMin: navInfo.distanciaNM
                                };
                            }
                            this.wpIndex++; // Avança para o próximo waypoint da rota
                            
                            // Imediatamente atualiza a proa alvo em direção ao próximo fixo para iniciar a curva
                            if (this.rota && this.wpIndex < this.rota.length) {
                                let proxCoords = state.fixos[this.rota[this.wpIndex]];
                                if (proxCoords) {
                                    let proxNav = calcularRumoDistancia(this, proxCoords);
                                    let rumoProx = parseInt(proxNav.rumo, 10);
                                    let wind = this.ventoAtual || { fromDeg: 0, speedKt: 0 };
                                    let wca = calculateWindCorrectionAngle(rumoProx, this.vel, wind.fromDeg, wind.speedKt);
                                    this.proaDestino = Math.round(normalizeHeading(rumoProx + wca));
                                }
                            }
                        }
                    } else {
                        // Modo LNAV ativo: rastreia o fixo aplicando o Ângulo de Correção de Deriva (WCA)
                        // para que a trajetória sobre o solo (Track) permaneça cravada no rumo desejado
                        let rumoAlvo = parseInt(navInfo.rumo, 10);
                        let wind = this.ventoAtual || { fromDeg: 0, speedKt: 0 };
                        let wca = calculateWindCorrectionAngle(rumoAlvo, this.vel, wind.fromDeg, wind.speedKt);
                        this.proaDestino = Math.round(normalizeHeading(rumoAlvo + wca));
                    }
                }
            }
        }

        // =========================================================================
        // ETAPA 2: PILOT COCKPIT INTERACTION & DYNAMICS ENGINE (DELTA-TIME PURO)
        // -------------------------------------------------------------------------
        // O agente de cabine virtual avança os cronômetros das tarefas ativas
        // nos canais concorrentes (LATERAL, VERTICAL, LONGITUDINAL) proporcionalmente
        // ao dtSec, acoplando os comandos físicos ao atingir o estado EXECUTING.
        // =========================================================================
        if (this.pilot) {
            this.pilot.update(dtSec);
        }

        // =========================================================================
        // ETAPA 3: FÍSICA DE VOO LATERAL (VETORIZAÇÃO, CURVAS E CONTROLE DE RAIO)
        // -------------------------------------------------------------------------
        // Aplica a taxa padrão de curva de 2.3° por segundo (aproximadamente Curva Padrão /
        // Standard Rate Turn de aeronaves comerciais e executivas a jato).
        // Calcula o arco menor no círculo trigonométrico (ou respeita a curva pelo arco maior
        // se o operador tiver comandado com sinal "+" no Scratchpad, ex: H090+).
        // =========================================================================
        if (this.proa !== this.proaDestino) {
            let taxaCurva = 2.3 * dtSec; // Variação máxima de proa no frame atual (ex: 2.3 * 4s = 9.2°)
            let distFaltante;

            if (this.modoLNAV || this.direcaoCurva === 0) {
                // Em modo de rota (LNAV), sempre busca o caminho angular mais curto
                let difCurta = this.proaDestino - this.proa;
                while (difCurta <= -180) difCurta += 360;
                while (difCurta > 180) difCurta -= 360;
                this.direcaoCurva = (difCurta > 0) ? 1 : -1;
                distFaltante = Math.abs(difCurta);
            } else {
                // Em modo de vetoração manual comandada, respeita a direção forçada (direita ou esquerda)
                if (this.direcaoCurva === 1) { 
                    distFaltante = this.proaDestino - this.proa;
                    if (distFaltante < 0) distFaltante += 360;
                } else { 
                    distFaltante = this.proa - this.proaDestino;
                    if (distFaltante < 0) distFaltante += 360;
                }
            }

            // Se o ângulo faltante for menor que a taxa do frame, atinge a proa final exatamente
            if (distFaltante <= taxaCurva) {
                this.proa = this.proaDestino; 
                if (!this.modoLNAV) this.direcaoCurva = 0; // Nivela asas
            } else {
                // Incrementa ou decrementa a proa conforme o sentido direcional
                if (this.direcaoCurva === 1) this.proa = (this.proa + taxaCurva) % 360;
                else this.proa = (this.proa - taxaCurva + 360) % 360;
            }
        }

        // -------------------------------------------------------------------------
        // MONITORAMENTO DA FINALIZAÇÃO DO FLY-BY UNIVERSAL COM RESTRIÇÃO DE PISO:
        // Verifica se a aeronave concluiu a curva e superou o ponto de menor aproximação
        // do fixo (através). Quando concluído, desativa a proteção para liberar a descida para o próximo fixo.
        // -------------------------------------------------------------------------
        if (this.flyByProtegido) {
            let protCoords = state.fixos[this.flyByProtegido.fixoNome];
            if (protCoords && this.modoLNAV) {
                let distProt = calcularRumoDistancia(this, protCoords).distanciaNM;
                if (distProt < this.flyByProtegido.distMin) {
                    this.flyByProtegido.distMin = distProt;
                }
                let difProa = Math.abs(this.proaDestino - this.proa);
                if (difProa > 180) difProa = 360 - difProa;

                // O fly-by termina quando a curva é concluída (asas niveladas na proa do próximo fixo com tolerância de 2°) 
                // e a aeronave já ultrapassou o través do fixo protegido (distância mínima superada, afastando-se do fixo)
                if (difProa <= 2 && distProt >= this.flyByProtegido.distMin) {
                    this.flyByProtegido = null;
                }
            } else {
                this.flyByProtegido = null;
            }
        }

        // =========================================================================
        // ETAPA 4: GESTÃO DINÂMICA DE VELOCIDADE (DISTANCE-TO-GO, PERFORMANCE & TRÁFEGO)
        // -------------------------------------------------------------------------
        // Gerenciamento contínuo e realista de velocidade de aproximação (Seções 1 a 23).
        // Baseado em DTG (Distance-to-Go / DME), envelope individual de cada aeronave,
        // tráfego precedente, taxa de aproximação por Ground Speed e prioridade ATC.
        // =========================================================================
        const velAlvoBase = this.calcularVelocidadeAlvoDinamica();
        this.velComando = velAlvoBase;

        // SIMULAÇÃO DE VARIAÇÃO ATMOSFÉRICA REALISTA (DELTA-TIME PURO):
        // Flutuações lentas e sutis (15 a 35 segundos) de ±1 a 2 nós em vez de ruído aleatório em alta frequência (20 Hz),
        // evitando oscilações bruscas e irreais no velocímetro / radar (ex: 250, 251, 250, 251).
        this.timerVariacaoAtmosferica = (this.timerVariacaoAtmosferica || 0) + dtSec;
        if (this.intervaloVariacaoAtmosferica === undefined) {
            this.intervaloVariacaoAtmosferica = 15 + Math.random() * 15;
            this.offsetVentoVel = 0;
        }

        if (this.timerVariacaoAtmosferica >= this.intervaloVariacaoAtmosferica) {
            this.timerVariacaoAtmosferica = 0;
            this.intervaloVariacaoAtmosferica = 18 + Math.random() * 16; // Próximo ciclo em 18 a 34 segundos
            
            const ventoForte = (this.ventoAtual && this.ventoAtual.speedKt > 15);
            const maxDesvio = ventoForte ? 2 : 1;
            
            // 60% de chance de voo calmo cravado (0 kt de desvio), 40% de leve oscilação
            if (Math.random() < 0.40) {
                this.offsetVentoVel = Math.floor(Math.random() * (maxDesvio * 2 + 1)) - maxDesvio;
            } else {
                this.offsetVentoVel = 0;
            }
        }

        // Se houver comando explícito de velocidade do ATC (velManual), mantém cravado sem desvio
        if (this.velManual) {
            this.offsetVentoVel = 0;
        }

        this.velDestino = velAlvoBase + (this.offsetVentoVel || 0);
        this.targetIAS = this.velDestino;
        this.currentIAS = this.vel;

        // Aplicação cinemática realista: Linear Assimétrica + Razão Vertical + Ruído Atmosférico (Padrão Ouro)
        atualizarVelocidadeRealista(this, dtSec);
        this.currentIAS = this.vel;

        // =========================================================================
        // ETAPA 5: ATUALIZAÇÃO CINEMÁTICA COM SOMA VETORIAL DE VENTO (FLIGHT DYNAMICS)
        // -------------------------------------------------------------------------
        // Cinemática com vento integrado (Seções 20-26 da Especificação ATC):
        // TAS = IAS * (1 + (alt / 1000) * 0.018)
        // V_ground = V_tas + V_wind
        // A aeronave mantém sua velocidade indicada (IAS) e sua proa (Heading),
        // enquanto o vento atua continuamente no deslocamento sobre o solo (Ground Speed),
        // na trajetória efetiva (Track) e no ângulo de deriva (Drift Angle).
        // =========================================================================
        const windVec = windManager.getWindForAircraft(this);
        this.ventoAtual = windVec;

        // Converte IAS em TAS com altitude real
        this.tas = FlightDynamicsEngine.calcularTAS(this.vel, this.alt || (this.flAtualNum * 100));

        // Vetor resultante com vento (Ground Speed, Track e Ângulo de Deriva)
        const nav = FlightDynamicsEngine.calcularVetorGS(this.tas, this.proa, windVec);
        this.groundSpeed = nav.gs;
        this.track = nav.trackDeg;
        this.driftAngle = nav.driftDeg;

        // Deslocamento cartesiano acumulado em milhas náuticas / deltas:
        const distNMLat = nav.vGroundLat * (dtSec / 3600);
        const distNMLon = nav.vGroundLon * (dtSec / 3600);

        this.deltaLat += distNMLat / 60;
        this.deltaLon += distNMLon / 60 / correcaoLon;

        // =========================================================================
        // ETAPA 6: NAVEGAÇÃO VERTICAL PREDITIVA (ALGORITMO VNAV COM LOOKAHEAD E TOD)
        // -------------------------------------------------------------------------
        // Modela o computador de navegação vertical (VNAV) de aeronaves comerciais.
        // 
        // FUNDAMENTOS AERONÁUTICOS E FÓRMULAS:
        // 1. Rampa Padrão de 3° (Standard 3-Degree Glidepath):
        //    Em aviação civil, um perfil de descida ideal de 3 graus gera um gradiente
        //    de aproximadamente ~318 pés por Milha Náutica (~300 ft/NM).
        //    Portanto, para perder 1 nível de voo (1 FL = 100 pés), a aeronave precisa de:
        //    distTOD = (FL_atual - FL_alvo) * 0.3 NM.
        //    (Exemplo: descendo do FL120 para o FL070, delta = 50 FL -> necessita de 15 NM).
        //
        // 2. Razão Nominal de Descida (Regra dos 3 Graus):
        //    razaoNominal (ft/min) ≈ Velocidade_Solo (kt) * 5
        //    (Ex: a 240 nós: 240 * 5 = 1200 ft/min; a 180 nós: 180 * 5 = 900 ft/min).
        //
        // 3. Modulação Dinâmica de Razão de Descida:
        //    Se a aeronave estiver atrasada em relação ao perfil vertical, o sistema
        //    aumenta a razão até rMax (até 1800+ ft/min). Se estiver adiantada, suaviza até rMin.
        //
        // 4. Proteção Universal de Piso em Fly-By (Fly-By Restriction):
        //    Se um fixo possui restrição de altitude mínima ("AT" ou "ABOVE"), durante a curva de
        //    fly-by em direção ao próximo fixo, a aeronave mantém o piso mínimo e só inicia
        //    a descida subsequente após nivelar asas na nova proa e ultrapassar o través.
        // =========================================================================
        let targetFL = this.flAtualNum;
        let razaoNominal = Math.round(this.vel * 5); // Regra dos 3 graus (IAS * 5 = ft/min)
        let razaoEfetiva = razaoNominal;

        // Se o nível autorizado for "VIA" ou "---", a aeronave segue estritamente as restrições da carta
        const isVia = (this.nivAutorizadoFisico === "VIA" || this.nivAutorizadoFisico === "---");
        const altClearence = isVia ? 0 : parseInt(this.nivAutorizadoFisico, 10);
        const lnavAtivoOuPendente = this.modoLNAV || (this.wpPendente !== null);

        // =========================================================================
        // PRIORIDADE 1: SUBIDA AUTORIZADA PELO CONTROLADOR (ATC CLIMB CLEARANCE)
        // =========================================================================
        // Se o controlador autorizou um nível superior ao nível atual (altClearence > flAtualNum),
        // a aeronave inicia a subida com a razão normal de subida (climbNormal),
        // tanto em modo de rota automática (LNAV/STAR) quanto vetorada fora de rota.
        if (!isVia && !isNaN(altClearence) && altClearence > this.flAtualNum) {
            targetFL = altClearence;
            const perfRate = (this.perf && this.perf.rates && this.perf.rates.climbNormal) 
                ? this.perf.rates.climbNormal 
                : 2200;
            razaoEfetiva = perfRate;
        } else if (lnavAtivoOuPendente && this.rota && this.rota.length > 0) {
            let startWpNome = null;
            let startWpIndex = this.wpIndex;

            // Determina o fixo inicial de referência para o lookahead vertical
            if (this.wpPendente !== null) {
                if (typeof this.wpPendente === 'number') {
                    startWpIndex = this.wpPendente;
                    startWpNome = this.rota[startWpIndex];
                } else {
                    startWpNome = this.wpPendente;
                }
            } else if (this.modoLNAV) {
                if (this.wpOffRoute !== null) {
                    startWpNome = this.wpOffRoute;
                } else if (this.wpIndex < this.rota.length) {
                    startWpNome = this.rota[this.wpIndex];
                }
            }

            if (startWpNome) {
                let iterWpNome = startWpNome;
                let iterIndex = startWpIndex;
                let distAcumulada = 0;

                let wpCoords = state.fixos[iterWpNome];
                if (wpCoords) {
                    distAcumulada = calcularRumoDistancia(this, wpCoords).distanciaNM;
                }

                // Piso do fixo ativo imediato (W0): impede furar a restrição antes de bloqueá-lo
                const restAtual = restricoesFixos[startWpNome];
                const limitFLAtual = restAtual ? restAtual.fl : null;
                let pisoAtual = isVia ? 0 : altClearence;
                if (restAtual && limitFLAtual !== undefined) {
                    pisoAtual = isVia ? limitFLAtual : Math.max(limitFLAtual, altClearence);
                }

                // Teto/altitude de cruzeiro do segmento entre o fixo anterior e o atual
                let flCruzeiroSegmento = this.flAtualNum;
                if (startWpIndex > 0 && this.rota) {
                    const prevWpNome = this.rota[startWpIndex - 1];
                    const prevRest = restricoesFixos[prevWpNome];
                    if (prevRest && prevRest.fl !== undefined) {
                        flCruzeiroSegmento = isVia ? prevRest.fl : Math.max(prevRest.fl, altClearence);
                    }
                }

                let encontrouDescida = false;
                let flAlvoFinal = this.flAtualNum;
                let maiorRazaoNecessaria = razaoNominal;

                if (!this.desceuParaWp) this.desceuParaWp = {};

                // Loop preditivo de profundidade limitada: analisa até 5 waypoints à frente na STAR
                for (let i = 0; i < 5; i++) {
                    if (!iterWpNome) break;

                    let rest = restricoesFixos[iterWpNome];
                    if (rest && rest.fl !== undefined) {
                        let limitFL = rest.fl;
                        let flAlvoFixo = isVia ? limitFL : Math.max(limitFL, altClearence);

                        // Proteção: Se a restrição for "BELOW" e o avião já voar abaixo dela, não sobe
                        if (rest.tipo === "BELOW" && this.flAtualNum <= limitFL) {
                            flAlvoFixo = this.flAtualNum;
                        }

                        // Proteção Universal de Fly-By: mantém piso mínimo da restrição durante a curva de fly-by
                        if (this.flyByProtegido) {
                            let pisoFlyBy = isVia ? this.flyByProtegido.flMinimo : Math.max(this.flyByProtegido.flMinimo, altClearence);
                            flAlvoFixo = Math.max(flAlvoFixo, pisoFlyBy);
                        }

                        if (this.flAtualNum > flAlvoFixo) {
                            let deltaAltFt = (this.flAtualNum - flAlvoFixo) * 100;
                            // Distância ideal até o Top of Descent (0.3 NM por FL a perder)
                            let distTOD = (this.flAtualNum - flAlvoFixo) * 0.3;

                            let distEfetiva = distAcumulada;
                            if (i === 0) {
                                let flyBy = this.flyByDist || 0.6;
                                distEfetiva = Math.max(0.1, distAcumulada - flyBy);
                            }

                            // Histerese de descida: uma vez iniciada para o fixo imediato, não aborta
                            let jaIniciou = (i === 0 && Boolean(this.desceuParaWp[iterWpNome]));
                            let noTOD = (distAcumulada <= distTOD + 1.5); // Margem operacional de 1.5 NM

                            // Disparo do início da descida
                            if (jaIniciou || noTOD) {
                                if (i === 0 && (!this.flyByProtegido || (this.rota && iterWpNome !== this.rota[this.wpIndex]))) {
                                    this.desceuParaWp[iterWpNome] = true;
                                }

                                let velEfetiva = Math.max(this.vel, 100);
                                let tempoMin = (distEfetiva / velEfetiva) * 60;
                                let rNec = tempoMin > 0 ? (deltaAltFt / tempoMin) : razaoNominal;

                                // Modulação dinâmica da razão de descida vertical (ft/min)
                                let rMin = Math.max(500, razaoNominal - 500);
                                let rMax = Math.max(razaoNominal + 700, 1800);
                                let rAjustada = Math.min(rMax, Math.max(rMin, rNec));

                                // Proteção de piso: fixos futuros não podem perfurar o piso "AT" ou "ABOVE" do fixo imediato
                                let alvoValido = flAlvoFixo;
                                if (i > 0 && restAtual && (restAtual.tipo === "AT" || restAtual.tipo === "ABOVE")) {
                                    alvoValido = Math.max(alvoValido, pisoAtual);
                                }
                                if (this.flyByProtegido) {
                                    let pisoFlyBy = isVia ? this.flyByProtegido.flMinimo : Math.max(this.flyByProtegido.flMinimo, altClearence);
                                    alvoValido = Math.max(alvoValido, pisoFlyBy);
                                }

                                if (alvoValido < flAlvoFinal) {
                                    flAlvoFinal = alvoValido;
                                    maiorRazaoNecessaria = Math.max(maiorRazaoNecessaria, rAjustada);
                                    encontrouDescida = true;
                                }
                            }
                        }
                    }

                    // Quebra o lookahead se o voo for para fixo direto fora de rota
                    if (this.wpOffRoute !== null && this.wpPendente === null && i === 0) break;
                    if (this.wpPendente !== null && typeof this.wpPendente === 'string' && i === 0) break;

                    // Acumula a distância euclidiana para o fixo seguinte na rota
                    if (this.rota && iterIndex + 1 < this.rota.length) {
                        let nextWpNome = this.rota[iterIndex + 1];
                        let pAtual = state.fixos[iterWpNome];
                        let pProx = state.fixos[nextWpNome];
                        if (pAtual && pProx) {
                            let dLat = pProx.deltaLat - pAtual.deltaLat;
                            let dLon = (pProx.deltaLon - pAtual.deltaLon) * correcaoLon;
                            let distSeg = Math.sqrt(Math.pow(dLat * 60, 2) + Math.pow(dLon * 60, 2));
                            distAcumulada += distSeg;
                        }
                        iterWpNome = nextWpNome;
                        iterIndex++;
                    } else {
                        break;
                    }
                }

                if (encontrouDescida) {
                    targetFL = flAlvoFinal;
                    razaoEfetiva = maiorRazaoNecessaria;
                } else if (!isVia && altClearence < this.flAtualNum) {
                    // Descida autorizada manualmente pelo controlador ATC que ainda não atingiu o TOD
                    let deltaClearence = (this.flAtualNum - altClearence) * 0.3;
                    if (distAcumulada <= deltaClearence + 1.5) {
                        targetFL = altClearence;
                        razaoEfetiva = razaoNominal;
                    } else {
                        targetFL = this.flAtualNum;
                    }
                } else {
                    // Mantém o nível de cruzeiro do segmento se o avião estiver acima
                    if (this.flAtualNum > flCruzeiroSegmento) {
                        targetFL = flCruzeiroSegmento;
                        razaoEfetiva = razaoNominal;
                    } else {
                        targetFL = this.flAtualNum;
                    }
                }

                // Clamping final de segurança: garante o piso durante o fly-by protegido
                if (this.flyByProtegido) {
                    let pisoFlyBy = isVia ? this.flyByProtegido.flMinimo : Math.max(this.flyByProtegido.flMinimo, altClearence);
                    if (targetFL < pisoFlyBy) {
                        targetFL = pisoFlyBy;
                    }
                }
            }
        } else if (!isVia && !isNaN(altClearence)) {
            // Modo de vetoração manual fora da rota: desce com razão nominal para a altitude autorizada
            targetFL = altClearence;
            razaoEfetiva = razaoNominal;
        }

        this.targetFL = targetFL;
        this.razaoNominal = razaoNominal;
        this.razaoEfetiva = razaoEfetiva;

        // Atualização do Piloto Virtual (VNAV / Modos AUTO, ATC-R, EXPD)
        if (this.virtualPilot) {
            this.virtualPilot.update(dtSec);
        }

        // Atualização do Motor de Dinâmica de Voo e Energia (FlightDynamicsEngine)
        // Aplica suavização de razão (vsAccelRate / jerk control), balanço de energia, spool de empuxo e proteção de stall
        FlightDynamicsEngine.integrarBalancoEnergia(this, this.perf || {}, dtSec);
        FlightDynamicsEngine.atualizarCinematicaVertical(this, this.perf || {}, dtSec);

        // Indicador visual de tendência na etiqueta de dados do radar (↑ subindo, ↓ descendo)
        let sinal = "";
        if (this.currentVS >= 100) sinal = "↑";
        else if (this.currentVS <= -100) sinal = "↓";

        this.nivAtual = Math.round(this.flAtualNum).toString().padStart(3, '0') + sinal;

        // =========================================================================
        // ETAPA 7: GERENCIAMENTO DE POUSO E CICLO DE VIDA (GARBAGE COLLECTION)
        // -------------------------------------------------------------------------
        // Verifica a proximidade em relação ao aeródromo de destino:
        // - A menos de 0.8 NM: Altera o squawk para "2000" (contato visual com a torre).
        // - A menos de 0.35 NM: Marca pousou = true para remoção da memória pelo main loop.
        // =========================================================================
        const destCoords = state.fixos[this.dest] || state.fixos["SBSP"];
        if (destCoords) {
            let distDest = calcularRumoDistancia(this, destCoords).distanciaNM;
            if (distDest <= 0.8 && distDest > 0.35) {
                this.squawk = "2000"; 
            } else if (distDest <= 0.35) {
                this.pousou = true;  
            }
        }
    }

    /**
     * Módulo de Parsing do Bloco de Comando ATC via Expressões Regulares (Regex).
     * Interceta manipulações diretas digitadas pelo controlador no Scratchpad:
     * 
     * SINTAXES SUPORTADAS:
     * 1. Proa (Heading):
     *    - "Hxxx": Curva para a proa magnética xxx pelo arco menor (ex: "H090", "H360").
     *    - "Hxxx+": Curva para a proa xxx forçando o arco maior (ex: "H090+").
     * 
     * 2. Velocidade (Speed):
     *    - "xxK": Define a velocidade indicada em dezenas de nós (ex: "21K" = 210 nós, "16K" = 160 nós).
     * 
     * 3. Direto a Fixo (Direct-To / DCT):
     *    - Mnemônicas de 3 letras: "PRU" (PRUMO), "IRP" (IROPU), "LVD" (LUVDI), "GRS" (GERSU),
     *      "URU" (URUTA), "KMG" (KOMGU), "OGT" (OGTAL).
     *    - Nomes completos de fixos: "SP017", "SP099", "SP101", "SP032", "SBSP", etc.
     *    - Se a aeronave estiver vetorada fora de rota e receber um direto para um fixo de STAR,
     *      ela recupera automaticamente a rota completa (ROTA_PRUMO ou ROTA_OGTAL) e reengaja o LNAV.
     */
    analisarComandosTexto() {
        let texto = this.textoLivre.toUpperCase().trim();
        // Otimização: evita reprocessar comandos se o texto digitado não mudou
        if (texto === this.ultimoComandoTexto) return;
        this.ultimoComandoTexto = texto;
        
        // ---------------------------------------------------------------------
        // 1. REGEX DE PROA / HEADING: Hxxx ou Hxxx+ (ex: H090 ou H090+)
        // ---------------------------------------------------------------------
        let matchProa = texto.match(/\bH(\d{3})(\+?)/);
        if (matchProa) {
            let novaProa = parseInt(matchProa[1], 10);
            let ladoMaior = (matchProa[2] === '+'); 
            if (novaProa >= 0 && novaProa <= 360) {
                novaProa = novaProa === 360 ? 0 : novaProa;
                // Despacha no canal LATERAL (preempção imediata sobre curvas anteriores)
                this.pilot.dispatch('LATERAL', 'HEADING', { heading: novaProa, maior: ladoMaior });
            }
        }

        // ---------------------------------------------------------------------
        // 2. REGEX DE VELOCIDADE INDICADA: xxK (ex: 21K -> 210 KIAS) OU RETOMADA AUTOMÁTICA (FREE/NORM)
        // ---------------------------------------------------------------------
        const matchVel = texto.match(/\b(\d{2})K\b/);
        const matchResume = /\b(FREE|FREEV|RSM|RSV|NORM|RESUME|VFREE|AUTO)\b/.test(texto);

        if (matchResume) {
            // Cancelamento explícito da restrição manual: retoma gerenciamento dinâmico (Seção 19)
            this.pilot.dispatch('LONGITUDINAL', 'RESUME_SPEED', {});
        } else if (matchVel) {
            let novaVel = parseInt(matchVel[1], 10) * 10;
            if (novaVel >= 40 && novaVel <= 600) { 
                this.pilot.dispatch('LONGITUDINAL', 'SPEED', { speed: novaVel });
            }
        } else if (this.velManual && !/\b\d{2}K\b/.test(texto)) {
            // Se o comando de velocidade manual foi apagado do scratchpad pelo operador
            this.pilot.dispatch('LONGITUDINAL', 'RESUME_SPEED', {});
        }

        // ---------------------------------------------------------------------
        // 3. REGEX DE SPEEDBRAKES / SPOILERS: SB ou NOSB / SBOFF
        // ---------------------------------------------------------------------
        const matchSB = /\b(SB|SPB|BRK)\b/.test(texto);
        const matchNoSB = /\b(NOSB|NOBRK|SBOFF)\b/.test(texto);
        if (matchNoSB) {
            this.speedbrakes = false;
            this.speedbrakesComando = false;
        } else if (matchSB) {
            this.speedbrakes = true;
            this.speedbrakesComando = true;
        } else if (this.speedbrakesComando && !matchSB) {
            // Se o comando SB foi apagado do scratchpad pelo operador
            this.speedbrakes = false;
            this.speedbrakesComando = false;
        }

        // ---------------------------------------------------------------------
        // 4. IDENTIFICAÇÃO DE FIXOS / DIRECT-TO (DCT)
        // ---------------------------------------------------------------------
        const dicFixos = {
            "PRU": "PRUMO", "IRP": "IROPU", "LVD": "LUVDI", "GRS": "GERSU",
            "URU": "URUTA", "SP139": "SP139", "KMG": "KOMGU", "OGT": "OGTAL",
            "SP017": "SP017", "SP099": "SP099", "SP101": "SP101", 
            "SP032": "SP032", "SBSP": "SBSP", "SBJH": "SBJH", "SBGR": "SBGR", "SBMT": "SBMT"
        };
        // Registra automaticamente todos os fixos de navegação conhecidos por nome completo
        if (Array.isArray(fixosNavegacao)) {
            fixosNavegacao.forEach(f => {
                if (f.nome && !dicFixos[f.nome]) {
                    dicFixos[f.nome] = f.nome;
                }
            });
        }

        // Identifica se alguma mnemônica ou nome completo de fixo foi digitado no Scratchpad
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

        if (wpTarget) {
            let idx = (this.rota && Array.isArray(this.rota)) ? this.rota.indexOf(wpTarget) : -1;
            let novaRotaCalculada = null;

            // Direct-To Inteligente com Grafo de Rotas:
            // Se o fixo comandado não está na rota atual, ou está atrás da posição atual,
            // ou se a aeronave estava sob vetores radar fora de rota,
            // reconstrói a sequência completa a partir do grafo de navegação de cartasNavegacao!
            if (idx === -1 || idx < this.wpIndex) {
                const rotaGrafo = montarRotaAPartirDeFixo(wpTarget, this.dest || "SBSP");
                if (rotaGrafo && rotaGrafo.length > 0) {
                    novaRotaCalculada = rotaGrafo;
                    idx = 0; // O ponto inicial da nova rota será o próprio fixo solicitado quando ativado
                }
            }

            let novoWpPendente = (idx !== -1) ? idx : wpTarget;

            // Se o comando de waypoint for novo e não conflitante com comando de proa ativo
            if (!matchProa && (this.ultimoWpComandadoTexto !== novoWpPendente || !this.modoLNAV)) {
                this.ultimoWpComandadoTexto = novoWpPendente; 
                this.pilot.dispatch('LATERAL', 'DIRECT_TO', { 
                    target: novoWpPendente, 
                    isIdx: (typeof novoWpPendente === 'number'),
                    novaRota: novaRotaCalculada
                });
            }
        } else {
            this.ultimoWpComandadoTexto = null;
        }
    }
}