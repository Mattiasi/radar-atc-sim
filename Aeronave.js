import { state } from './state.js';
import { latCentro, lonCentro, correcaoLon, calcularRumoDistancia, geoParaDelta } from './utils.js';
import { perfisAeronaves, restricoesFixos, montarRotaAPartirDeFixo, fixosNavegacao } from './data.js';
import { windManager } from './windManager.js';
import { calculateWindCorrectionAngle, normalizeHeading } from './windMath.js';

/**
 * Classe principal que modela o comportamento físico, cinemático e lógico de cada aeronave.
 * 
 * Funciona como uma Máquina de Estados Finitos (FSM) com cinemática contínua:
 * - LNAV (Lateral Navigation): Segue sequências de waypoints (STAR) com antecipação de curvas (Fly-By).
 * - VNAV (Vertical Navigation): Calcula Top of Descent (TOD), perfis de descida de 3° e respeita restrições de cartas.
 * - Controle de Velocidade: Lookahead preditivo para desaceleração suave antes de fixos restritivos.
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
    const perf = (ac.tipo && perfisAeronaves[ac.tipo]) 
        ? perfisAeronaves[ac.tipo] 
        : (perfisAeronaves["DEFAULT"] || { taxaDesacel: 1.2 });
    const baseDesacel = (ac.taxaDesacel !== undefined) ? ac.taxaDesacel : perf.taxaDesacel;
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
    const perf = (ac.tipo && perfisAeronaves[ac.tipo]) 
        ? perfisAeronaves[ac.tipo] 
        : (perfisAeronaves["DEFAULT"] || { taxaAcel: 2.0 });
    const baseAcel = (ac.taxaAcel !== undefined) ? ac.taxaAcel : perf.taxaAcel;

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

    // Ruído atmosférico dinâmico ao variar velocidades (rajadas de vento e turbulência leve: ±10%)
    const fatorRuidoAtmosfera = 0.90 + Math.random() * 0.20; // 0.90 a 1.10
    const taxaEfetiva = taxa * fatorRuidoAtmosfera;

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
        // Coeficientes de aceleração e desaceleração (em nós por segundo ao quadrado)
        const perf = perfisAeronaves[this.tipo] || perfisAeronaves["DEFAULT"];
        this.taxaAcel = perf.taxaAcel;       // Aceleração máxima (kt/s²)
        this.taxaDesacel = perf.taxaDesacel; // Desaceleração máxima (kt/s²)
        
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

        // --- 5. NAVEGAÇÃO VERTICAL (FLIGHT LEVEL / VNAV) ---
        this.nivAtual = nivAtual;                // String formatada para a etiqueta do radar (ex: "055↓")
        this.nivAutorizado = nivAutorizado;      // Clearance textual exibido no radar (ex: "040" ou "VIA")
        this.nivAutorizadoFisico = nivAutorizado;// Alvo numérico de altitude para a física de descida
        this.nivAutorizadoPendente = null;       // Buffer de nível autorizado enquanto corre o delay de reação do piloto
        this.delayNivel = 0;                     // Contador de ciclos de espera para autorização de nível
        this.flAtualNum = parseInt(nivAtual) || 0; // Valor numérico de altitude em Flight Level (ex: FL 55 = 5500 pés)
        
        // Razão vertical inicial estimada em ft/min (negativa descendo, positiva subindo, 0 nivelado)
        const autNum = parseInt(nivAutorizado) || 0;
        if (this.flAtualNum > autNum && autNum > 0) {
            this.verticalSpeed = -Math.round(this.vel * 5); // Descida nominal inicial (~3°)
        } else if (this.flAtualNum < autNum) {
            this.verticalSpeed = Math.round(this.vel * 5);
        } else {
            this.verticalSpeed = 0;
        }

        // --- 6. GESTÃO DE ROTA AUTOMÁTICA (LNAV) E TRANSIÇÕES (FLY-BY) ---
        this.rota = rota;                        // Sequência ordenada de nomes de fixos da carta (STAR)
        this.wpIndex = spawnWpIndex;             // Ponteiro para o waypoint ativo que a aeronave está perseguindo
        this.modoLNAV = (rota && rota.length > 0); // true = seguindo fixos da rota; false = vetorada por proa manual
        this.wpPendente = null;                  // Waypoint direto (DCT) pendente em buffer
        this.wpOffRoute = null;                  // Waypoint fora da rota padrão para voo direto temporário
        this.delayWp = 0;                        // Contador de delay para ativação de novo waypoint
        this.flyByDist = 0.6;                    // Distância calculada em NM para antecipar a curva antes do fixo
        this.desceuParaWp = {};                  // Registro de histerese: impede interrupção de descidas já iniciadas
        this.emFlyByGersu = false;               // Trava de segurança: true durante a curva em GERSU para não furar 4700'
        this.distGersuMin = 999;                 // Rastreia a menor distância até GERSU para detectar passagem pelo través
        
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
        this.pistaAtribuida = (dest === "SBSP") ? "17R" : null; // Cabeceira terminal atribuída para vento local
        this.ventoAtual = { fromDeg: 0, speedKt: 0, vLat: 0, vLon: 0, origem: "GLOBAL" }; // Vento atuante
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
                            this.emFlyByGersu = false;
                        } else {
                            // Se atingiu o ponto de fly-by em GERSU, ativa a proteção de altitude de 4700'
                            if (wpNome === "GERSU") {
                                this.emFlyByGersu = true;
                                this.distGersuMin = navInfo.distanciaNM;
                            }
                            this.wpIndex++; // Avança para o próximo waypoint da rota (ex: URUTA)
                            
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
        // ETAPA 2: PROCESSAMENTO DE DELAYS (TEMPO DE REAÇÃO HUMANA DO PILOTO)
        // -------------------------------------------------------------------------
        // Simula o tempo que a tripulação leva entre ouvir a instrução do controlador,
        // colacionar (readback) e selecionar o comando no MCP/FCU da aeronave.
        // A cada ciclo de 4 segundos, os contadores de delay são decrementados.
        // =========================================================================
        if (this.delayWp > 0) {
            this.delayWp--;
            if (this.delayWp === 0 && this.wpPendente !== null) {
                if (typeof this.wpPendente === 'number') {
                    this.wpIndex = this.wpPendente; 
                    this.wpOffRoute = null; 
                } else {
                    this.wpOffRoute = this.wpPendente; 
                }
                this.modoLNAV = true; 
                this.velManual = false; // Retomar o LNAV anula qualquer trava manual de velocidade do operador
                this.wpPendente = null;
                this.proaPendente = null; 
                this.curvaMaiorPendente = false;
            }
        }

        if (this.delayProa > 0) {
            this.delayProa--;
            if (this.delayProa === 0 && this.proaPendente !== null) {
                this.modoLNAV = false; 
                this.emFlyByGersu = false;
                this.proaDestino = this.proaPendente;
                
                // Normaliza ângulos no círculo trigonométrico para encontrar o arco mais curto
                let difCurta = this.proaDestino - this.proa;
                while (difCurta <= -180) difCurta += 360;
                while (difCurta > 180) difCurta -= 360;

                if (difCurta === 0) this.direcaoCurva = 0;
                else if (this.curvaMaiorPendente) this.direcaoCurva = (difCurta > 0) ? -1 : 1; 
                else this.direcaoCurva = (difCurta > 0) ? 1 : -1; 
                
                this.proaPendente = null;
                this.curvaMaiorPendente = false;
            }
        }

        if (this.delayVel > 0) {
            this.delayVel--;
            if (this.delayVel === 0 && this.velPendente !== null) {
                this.velComando = this.velPendente; 
                this.velPendente = null;
            }
        }

        if (this.delayNivel > 0) {
            this.delayNivel--;
            if (this.delayNivel === 0 && this.nivAutorizadoPendente !== null) {
                this.nivAutorizadoFisico = this.nivAutorizadoPendente;
                this.nivAutorizadoPendente = null;
            }
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
        // MONITORAMENTO DA FINALIZAÇÃO DO FLY-BY EM GERSU:
        // Verifica se a aeronave concluiu a curva e superou o ponto de menor aproximação
        // de GERSU (atravês). Quando concluído, desativa a flag para liberar a descida para URUTA.
        // -------------------------------------------------------------------------
        if (this.emFlyByGersu) {
            let gersuCoords = state.fixos["GERSU"];
            if (gersuCoords && this.modoLNAV) {
                let distGersu = calcularRumoDistancia(this, gersuCoords).distanciaNM;
                if (distGersu < this.distGersuMin) {
                    this.distGersuMin = distGersu;
                }
                let difProa = Math.abs(this.proaDestino - this.proa);
                if (difProa > 180) difProa = 360 - difProa;

                // O fly-by termina quando a curva é concluída (asas niveladas na proa de URUTA com tolerância de 2°) 
                // e a aeronave já ultrapassou o través de GERSU (distância mínima superada, afastando-se do fixo)
                if (difProa <= 2 && distGersu >= this.distGersuMin) {
                    this.emFlyByGersu = false;
                }
            } else {
                this.emFlyByGersu = false;
            }
        }

        // =========================================================================
        // ETAPA 4: GESTÃO INTELIGENTE DE VELOCIDADE (LOOKAHEAD PREDITIVO DE ROTA)
        // -------------------------------------------------------------------------
        // Varre até 5 waypoints à frente na STAR para identificar restrições de velocidade.
        // Utiliza a equação da cinemática clássica (D = V_media * T) para calcular o ponto ideal
        // de desaceleração antecipada, evitando reduções bruscas e simulando o comportamento de um FMS real.
        // =========================================================================
        let velAlvoBase = this.velComando; 

        let lnavAtivoOuPendente = this.modoLNAV || (this.wpPendente !== null);

        if (lnavAtivoOuPendente && !this.velManual) {
            let startWpNome = null;
            let startWpIndex = this.wpIndex;
            
            // Avaliação Preditiva: Descobre qual será o vetor ativo logo que o delay passar
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
                } else if (this.rota && this.wpIndex < this.rota.length) {
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

                let melhorVelAlvo = this.velComando;
                let encontrouReducao = false;

                // Loop preditivo de profundidade limitada (max 5 níveis na árvore de waypoints).
                // Otimiza o comportamento de frenagem sem processamento O(N) exagerado da rota toda.
                for (let i = 0; i < 5; i++) {
                    if (!iterWpNome) break;

                    let rest = restricoesFixos[iterWpNome];
                    if (rest && rest.vel !== undefined) {
                        let tipoVel = rest.tipoVel || "AT";
                        let vAlvo = this.velComando;

                        if (tipoVel === "AT") vAlvo = rest.vel;
                        else if (tipoVel === "BELOW") vAlvo = Math.min(this.velComando, rest.vel);
                        else if (tipoVel === "ABOVE") vAlvo = Math.max(this.velComando, rest.vel);

                        if (this.vel > vAlvo) {
                            // CÁLCULO CINEMÁTICO DE FRENAGEM COM MODELO ASSIMÉTRICO REALISTA:
                            // Utiliza a taxa de desaceleração exata do perfil da aeronave em data.js
                            // tempo = (V_atual - V_alvo) / taxaEstimada
                            // dist = (V_media em NM/s) * tempo em segundos
                            let taxaEstimada = calcularTaxaDesacel(this);
                            let tempoFrenagem = (this.vel - vAlvo) / taxaEstimada;
                            let velMedia = (this.vel + vAlvo) / 2;
                            let distFrenagem = (velMedia / 3600) * tempoFrenagem;
                            
                            // Adiciona 1.0 NM de margem operacional de conforto
                            if (distAcumulada <= distFrenagem + 1.0) {
                                melhorVelAlvo = Math.min(melhorVelAlvo, vAlvo);
                                encontrouReducao = true;
                            }
                        }
                    }

                    // Quebra o lookahead imediatamente caso estejamos em off-route
                    if (this.wpOffRoute !== null && this.wpPendente === null && i === 0) break;
                    if (this.wpPendente !== null && typeof this.wpPendente === 'string' && i === 0) break;

                    // Acumula a distância iterando para o nó seguinte da rota lógica
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

                if (encontrouReducao) {
                    velAlvoBase = melhorVelAlvo;
                    this.velComando = velAlvoBase;
                } else {
                    let restAtual = restricoesFixos[startWpNome];
                    if (restAtual && restAtual.vel !== undefined) {
                        let tipoVel = restAtual.tipoVel || "AT";
                        let vAlvoAtual = this.velComando;
                        if (tipoVel === "AT") vAlvoAtual = restAtual.vel;
                        else if (tipoVel === "BELOW") vAlvoAtual = Math.min(this.velComando, restAtual.vel);
                        else if (tipoVel === "ABOVE") vAlvoAtual = Math.max(this.velComando, restAtual.vel);

                        if (this.vel <= vAlvoAtual) {
                            velAlvoBase = vAlvoAtual;
                            this.velComando = velAlvoBase;
                        }
                    }
                }
            }
        }

        // SIMULAÇÃO DE RUÍDO ATMOSFÉRICO E VARREDURA DO RADAR:
        // Variações leves de vento (rajadas de ±5 nós) em torno da velocidade comandada para evitar velocidade perfeitamente estática.
        if (Math.random() < 0.25) {
            let variacaoVento = Math.floor(Math.random() * 11) - 5; 
            this.velDestino = velAlvoBase + variacaoVento;
        } else if (Math.abs(this.velDestino - velAlvoBase) > 6) {
            this.velDestino = velAlvoBase; 
        }

        // Aplicação cinemática realista: Linear Assimétrica + Razão Vertical + Ruído Atmosférico (Padrão Ouro)
        atualizarVelocidadeRealista(this, dtSec);

        // =========================================================================
        // ETAPA 5: ATUALIZAÇÃO CINEMÁTICA COM SOMA VETORIAL DE VENTO
        // -------------------------------------------------------------------------
        // Cinemática com vento integrado (Seções 20-26 da Especificação ATC):
        // V_ground = V_air + V_wind
        // A aeronave mantém sua velocidade indicada/verdadeira (TAS) e sua proa (Heading),
        // enquanto o vento atua continuamente no deslocamento sobre o solo (Ground Speed),
        // na trajetória efetiva (Track) e no ângulo de deriva (Drift Angle).
        // =========================================================================
        const windVec = windManager.getWindForAircraft(this);
        this.ventoAtual = windVec;

        const radAir = this.proa * (Math.PI / 180);
        const vAirLat = this.vel * Math.cos(radAir);
        const vAirLon = this.vel * Math.sin(radAir);

        // Soma vetorial direta (em nós = NM/h):
        const vGroundLat = vAirLat + windVec.vLat;
        const vGroundLon = vAirLon + windVec.vLon;

        // Ground Speed (módulo escalar da velocidade sobre o solo)
        this.groundSpeed = Math.sqrt(vGroundLat * vGroundLat + vGroundLon * vGroundLon);

        // Track (trajetória real sobre o solo em graus aeronáuticos 000-359°)
        let trackDeg = (Math.atan2(vGroundLon, vGroundLat) * (180 / Math.PI) + 360) % 360;
        this.track = trackDeg;

        // Ângulo de deriva (Drift Angle = Track - Proa) normalizado em [-180°, +180°]
        let difDrift = trackDeg - this.proa;
        if (difDrift > 180) difDrift -= 360;
        if (difDrift < -180) difDrift += 360;
        this.driftAngle = difDrift;

        // Deslocamento cartesiano acumulado em milhas náuticas / deltas:
        const distNMLat = vGroundLat * (dtSec / 3600);
        const distNMLon = vGroundLon * (dtSec / 3600);

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
        // 4. Proteção de Piso de Cruzamento em GERSU (Fly-By Restriction):
        //    GERSU possui altitude mínima de 4700 pés (FL 047+). Durante a curva de
        //    fly-by em direção a URUTA (FL 040), a aeronave mantém o piso de 4700'
        //    e só inicia a descida para URUTA após nivelar asas na proa de aproximação final.
        // =========================================================================
        let targetFL = this.flAtualNum;
        let razaoNominal = Math.round(this.vel * 5); // Regra dos 3 graus (IAS * 5 = ft/min)
        let razaoEfetiva = razaoNominal;

        // Se o nível autorizado for "VIA" ou "---", a aeronave segue estritamente as restrições da carta
        const isVia = (this.nivAutorizadoFisico === "VIA" || this.nivAutorizadoFisico === "---");
        const altClearence = isVia ? 0 : parseInt(this.nivAutorizadoFisico, 10);

        if (lnavAtivoOuPendente && this.rota && this.rota.length > 0) {
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

                        // Proteção de GERSU: mantém piso mínimo de FL 047 (4700') durante a curva de fly-by
                        if (this.emFlyByGersu) {
                            let pisoGersu = isVia ? 47 : Math.max(47, altClearence);
                            flAlvoFixo = Math.max(flAlvoFixo, pisoGersu);
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
                                if (i === 0 && (!this.emFlyByGersu || iterWpNome !== "URUTA")) {
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
                                if (this.emFlyByGersu) {
                                    let pisoGersu = isVia ? 47 : Math.max(47, altClearence);
                                    alvoValido = Math.max(alvoValido, pisoGersu);
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

                // Clamping final de segurança: garante 4700' durante o fly-by de GERSU
                if (this.emFlyByGersu) {
                    let pisoGersu = isVia ? 47 : Math.max(47, altClearence);
                    if (targetFL < pisoGersu) {
                        targetFL = pisoGersu;
                    }
                }
            }
        } else if (!isVia && !isNaN(altClearence)) {
            // Modo de vetoração manual fora da rota: desce com razão nominal para a altitude autorizada
            targetFL = altClearence;
            razaoEfetiva = razaoNominal;
        }

        // Integração numérica da variação de altitude por frame
        if (targetFL !== undefined && !isNaN(targetFL)) {
            let flPerSec = (razaoEfetiva / 100) / 60; // Razão convertida de ft/min para FL/segundo
            let deltaFL = flPerSec * dtSec;

            if (this.flAtualNum < targetFL) {
                this.flAtualNum = Math.min(this.flAtualNum + deltaFL, targetFL);
                this.verticalSpeed = Math.round(razaoEfetiva);
            } else if (this.flAtualNum > targetFL) {
                this.flAtualNum = Math.max(this.flAtualNum - deltaFL, targetFL);
                this.verticalSpeed = -Math.round(razaoEfetiva);
            } else {
                this.verticalSpeed = 0;
            }

            // Indicador visual de tendência na etiqueta de dados do radar (↑ subindo, ↓ descendo)
            let sinal = "";
            if (this.flAtualNum < targetFL - 0.5) sinal = "↑";
            else if (this.flAtualNum > targetFL + 0.5) sinal = "↓";

            this.nivAtual = Math.round(this.flAtualNum).toString().padStart(3, '0') + sinal;
        } else {
            this.verticalSpeed = 0;
            this.nivAtual = Math.round(this.flAtualNum).toString().padStart(3, '0');
        }

        // =========================================================================
        // ETAPA 7: GERENCIAMENTO DE POUSO E CICLO DE VIDA (GARBAGE COLLECTION)
        // -------------------------------------------------------------------------
        // Verifica a proximidade em relação ao aeródromo de destino (SBSP):
        // - A menos de 0.8 NM: Altera o squawk para "2000" (contato visual com a torre).
        // - A menos de 0.35 NM: Marca pousou = true para remoção da memória pelo main loop.
        // =========================================================================
        let distSBSP = calcularRumoDistancia(this, state.fixos["SBSP"]).distanciaNM;
        
        if (distSBSP <= 0.8 && distSBSP > 0.35) {
            this.squawk = "2000"; 
        } else if (distSBSP <= 0.35) {
            this.pousou = true;  
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
                this.proaPendente = novaProa;
                this.curvaMaiorPendente = ladoMaior;
                this.delayProa = Math.floor(Math.random() * 2) + 2; // Delay de reação de 2 a 3 ciclos (8 a 12s)
                this.wpPendente = null; 
                this.emFlyByGersu = false;
            }
        }

        // ---------------------------------------------------------------------
        // 2. REGEX DE VELOCIDADE INDICADA: xxK (ex: 21K -> 210 KIAS)
        // ---------------------------------------------------------------------
        let matchVel = texto.match(/\b(\d{2})K\b/);
        if (matchVel) {
            let novaVel = parseInt(matchVel[1], 10) * 10;
            if (novaVel >= 40 && novaVel <= 600) { 
                this.velPendente = novaVel;
                this.delayVel = Math.floor(Math.random() * 2) + 2; 
                this.velManual = true; // Fixa velocidade manual (desabilita reduções automáticas da rota)
            }
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

            // Direct-To Inteligente com Grafo de Rotas:
            // Se o fixo comandado não está na rota atual, ou está atrás da posição atual,
            // ou se a aeronave estava sob vetores radar fora de rota,
            // reconstrói a sequência completa a partir do grafo de navegação de cartasNavegacao!
            if (idx === -1 || idx < this.wpIndex) {
                const novaRota = montarRotaAPartirDeFixo(wpTarget, this.dest || "SBSP");
                if (novaRota && novaRota.length > 0) {
                    this.rota = novaRota;
                    idx = 0; // O ponto inicial da nova rota é o próprio fixo solicitado
                }
            }

            let novoWpPendente = (idx !== -1) ? idx : wpTarget;

            // Se o comando de waypoint for novo e não conflitante com comando de proa ativo
            if (!matchProa && (this.ultimoWpComandadoTexto !== novoWpPendente || !this.modoLNAV)) {
                this.ultimoWpComandadoTexto = novoWpPendente; 
                this.wpPendente = novoWpPendente;
                this.delayWp = Math.floor(Math.random() * 3) + 2;
                this.proaPendente = null; 
                this.desceuParaWp = {};
                this.emFlyByGersu = false;
            }
        } else {
            this.ultimoWpComandadoTexto = null;
        }
    }
}