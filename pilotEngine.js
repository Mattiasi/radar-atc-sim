/**
 * ============================================================================
 * PILOT COCKPIT INTERACTION & DYNAMICS ENGINE (PILOT ENGINE)
 * ============================================================================
 * Modela com alta fidelidade a interação humana, cognitiva e física da tripulação
 * no cockpit (MCP/FCU e MCDU/FMS), gerenciando canais concorrentes, preempção,
 * carga de trabalho (Workload) e tempos estocásticos de reação e setup.
 * 
 * Atende rigorosamente aos princípios:
 * 1. Delta-Time puro: sem timers nativos (setTimeout/setInterval).
 * 2. Canais desacoplados: LATERAL, VERTICAL, LONGITUDINAL.
 * 3. Máquina de Estados Finitos de Tarefa (TaskFSM).
 * 4. Modelo estocástico com distribuição gaussiana e workload dinâmico.
 * ============================================================================
 */

export const TASK_CHANNELS = {
    LATERAL: 'LATERAL',
    VERTICAL: 'VERTICAL',
    LONGITUDINAL: 'LONGITUDINAL'
};

export const TASK_STATES = {
    QUEUED: 'QUEUED',
    PROCESSING: 'PROCESSING',
    SETTING: 'SETTING',
    EXECUTING: 'EXECUTING',
    STABILIZING: 'STABILIZING',
    COMPLETED: 'COMPLETED',
    SUPERSEDED: 'SUPERSEDED'
};

export const TASK_TYPES = {
    HEADING: 'HEADING',
    DIRECT_TO: 'DIRECT_TO',
    ROUTE: 'ROUTE',
    ALTITUDE: 'ALTITUDE',
    VERTICAL_RATE: 'VERTICAL_RATE',
    EXPEDITE: 'EXPEDITE',
    SPEED: 'SPEED',
    RESUME_SPEED: 'RESUME_SPEED'
};

/**
 * Tabela de tempos base nominais por tipo de tarefa (em segundos).
 * Diferencia ações rápidas no painel superior (MCP/FCU) de inserções complexas no FMS/MCDU.
 */
export const BASE_TASK_CONFIG = {
    [TASK_TYPES.HEADING]: {
        channel: TASK_CHANNELS.LATERAL,
        baseProcessing: 6.0, // Readback mental, escuta ATC e identificação da proa (~1.5 varreduras)
        baseSetting: 8.0,    // Rotação do knob de proa no MCP/FCU (~2 varreduras) (Total: 3 a 5 varreduras / ~12-18s)
        avionicsFactor: 1.0  // MCP/FCU direto na linha de visão
    },
    [TASK_TYPES.DIRECT_TO]: {
        channel: TASK_CHANNELS.LATERAL,
        baseProcessing: 7.5, // Localização mental do fixo na carta/espaço aéreo (~1.8 varreduras)
        baseSetting: 11.5,   // Olhar para o pedestal, página DIR, digitação no MCDU, LSK, crosscheck e EXEC (~2.8 varreduras) (Total: 4 a 6 varreduras / ~18-24s)
        avionicsFactor: 1.0  // FMS/MCDU requer digitação e confirmação cruzada
    },
    [TASK_TYPES.ROUTE]: {
        channel: TASK_CHANNELS.LATERAL,
        baseProcessing: 5.5,
        baseSetting: 7.5,
        avionicsFactor: 1.0
    },
    [TASK_TYPES.ALTITUDE]: {
        channel: TASK_CHANNELS.VERTICAL,
        baseProcessing: 6.0, // Readback e confirmação do novo nível (~1.5 varreduras)
        baseSetting: 8.0,    // Rotação do seletor de altitude no MCP e acoplamento (pull/push) (~2 varreduras) (Total: 3 a 5 varreduras / ~12-18s)
        avionicsFactor: 1.0
    },
    [TASK_TYPES.VERTICAL_RATE]: {
        channel: TASK_CHANNELS.VERTICAL,
        baseProcessing: 5.5,
        baseSetting: 7.5,
        avionicsFactor: 1.0
    },
    [TASK_TYPES.EXPEDITE]: {
        channel: TASK_CHANNELS.VERTICAL,
        baseProcessing: 4.0,
        baseSetting: 6.0,
        avionicsFactor: 0.95
    },
    [TASK_TYPES.SPEED]: {
        channel: TASK_CHANNELS.LONGITUDINAL,
        baseProcessing: 5.5, // Readback de velocidade (~1.4 varreduras)
        baseSetting: 7.5,    // Rotação do knob de velocidade no MCP (~1.8 varreduras) (Total: 3 a 5 varreduras / ~12-17s)
        avionicsFactor: 1.0
    },
    [TASK_TYPES.RESUME_SPEED]: {
        channel: TASK_CHANNELS.LONGITUDINAL,
        baseProcessing: 5.0,
        baseSetting: 7.0,
        avionicsFactor: 1.0
    }
};

/**
 * Gerador de ruído gaussiano (Distribuição Normal) usando a Transformada de Box-Muller.
 * Evita tempos de reação artificiais e planos, gerando uma curva em sino realista.
 * 
 * @param {number} [mean=1.0] Média da distribuição
 * @param {number} [stdDev=0.10] Desvio padrão
 * @param {number} [min=0.85] Limite inferior de segurança
 * @param {number} [max=1.20] Limite superior de segurança
 * @returns {number} Multiplicador estocástico
 */
export function gerarRuidoGaussiano(mean = 1.0, stdDev = 0.10, min = 0.85, max = 1.20) {
    let u1 = Math.random();
    let u2 = Math.random();
    while (u1 === 0) u1 = Math.random(); // Evita log(0)
    let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    let val = mean + z0 * stdDev;
    return Math.max(min, Math.min(max, val));
}

/**
 * Representa uma tarefa individual em execução no cockpit por um canal operacional.
 */
export class PilotTask {
    /**
     * @param {string} id - Identificador único da tarefa
     * @param {string} channel - Canal (LATERAL, VERTICAL, LONGITUDINAL)
     * @param {string} type - Tipo de comando (HEADING, DIRECT_TO, ALTITUDE, SPEED, etc.)
     * @param {Object} params - Dados específicos da instrução ATC
     * @param {PilotAgent} pilot - Instância do piloto responsável
     */
    constructor(id, channel, type, params, pilot) {
        this.id = id;
        this.channel = channel;
        this.type = type;
        this.params = params || {};
        this.pilot = pilot;

        this.status = TASK_STATES.QUEUED;
        this.timer = 0;
        this.targetApplied = false;

        // Recupera parâmetros nominais
        const config = BASE_TASK_CONFIG[this.type] || {
            baseProcessing: 6.0,
            baseSetting: 8.0,
            avionicsFactor: 1.0
        };

        const pilotFactor = pilot.profileFactor || 1.0;
        const workload = pilot.calculateWorkload();
        const avionics = config.avionicsFactor || 1.0;

        // Fórmula: TaskPhaseTime = BaseTime * PilotProfileFactor * (1 + (Workload * 0.40)) * AvionicsFactor * GaussianNoise()
        this.processingDuration = config.baseProcessing * pilotFactor * (1 + (workload * 0.40)) * avionics * gerarRuidoGaussiano();
        this.settingDuration = config.baseSetting * pilotFactor * (1 + (workload * 0.40)) * avionics * gerarRuidoGaussiano();

        // Limites físicos de segurança (mínimo de ~2.5s por fase)
        this.processingDuration = Math.max(2.5, this.processingDuration);
        this.settingDuration = Math.max(2.5, this.settingDuration);
    }

    /**
     * Atualiza o ciclo de vida da tarefa com base no Delta Time acumulado.
     * @param {number} dt - Passo de tempo físico em segundos
     */
    update(dt) {
        if (this.status === TASK_STATES.COMPLETED || this.status === TASK_STATES.SUPERSEDED) {
            return;
        }

        switch (this.status) {
            case TASK_STATES.QUEUED:
                this.status = TASK_STATES.PROCESSING;
                this.timer = 0;
                break;

            case TASK_STATES.PROCESSING:
                this.timer += dt;
                if (this.timer >= this.processingDuration) {
                    this.status = TASK_STATES.SETTING;
                    this.timer = 0;
                }
                break;

            case TASK_STATES.SETTING:
                this.timer += dt;
                if (this.timer >= this.settingDuration) {
                    this.status = TASK_STATES.EXECUTING;
                    this.timer = 0;
                    this.pilot.applyTaskExecution(this);
                    this.targetApplied = true;
                }
                break;

            case TASK_STATES.EXECUTING:
                this.timer += dt;
                if (this.checkStabilizationEnvelope()) {
                    this.status = TASK_STATES.STABILIZING;
                    this.timer = 0;
                }
                break;

            case TASK_STATES.STABILIZING:
                this.timer += dt;
                // Permanece de 1.5 a 2.0 segundos no envelope antes de considerar completamente estabilizado
                if (this.timer >= 1.5) {
                    this.status = TASK_STATES.COMPLETED;
                }
                break;
        }
    }

    /**
     * Verifica se os parâmetros físicos da aeronave convergiram para o envelope de captura.
     * Envelopes nominais:
     * - Proa: ±1.0°
     * - Altitude: ±0.5 FL (±50 ft)
     * - Velocidade: ±2.0 nós
     * @returns {boolean}
     */
    checkStabilizationEnvelope() {
        const aero = this.pilot.aero;
        if (!aero) return true;

        if (this.channel === TASK_CHANNELS.LATERAL) {
            if (this.type === TASK_TYPES.HEADING) {
                let dif = Math.abs(aero.proaDestino - aero.proa);
                if (dif > 180) dif = 360 - dif;
                return dif <= 1.0;
            } else if (this.type === TASK_TYPES.DIRECT_TO || this.type === TASK_TYPES.ROUTE) {
                // Em LNAV, considera estabilizado após iniciar o seguimento suave
                return aero.modoLNAV === true;
            }
        } else if (this.channel === TASK_CHANNELS.VERTICAL) {
            if (aero.nivAutorizadoFisico === "VIA" || aero.nivAutorizadoFisico === "---") {
                return true;
            }
            const alvoNum = parseInt(aero.nivAutorizadoFisico, 10);
            if (isNaN(alvoNum)) return true;
            return Math.abs(aero.flAtualNum - alvoNum) <= 0.5;
        } else if (this.channel === TASK_CHANNELS.LONGITUDINAL) {
            return Math.abs(aero.vel - aero.velDestino) <= 2.0;
        }

        return true;
    }
}

/**
 * Agente de Cabine Virtual do Piloto (Pilot Cockpit Agent).
 * Cada aeronave possui uma instância única desta classe que gerencia seus 3 canais operacionais.
 */
export class PilotAgent {
    /**
     * @param {Object} aero - Instância da Aeronave associada
     */
    constructor(aero) {
        this.aero = aero;

        // Fator individual da tripulação (experiência, agilidade: 0.95 a 1.12)
        this.profileFactor = 0.95 + Math.random() * 0.17;

        // Canais ativos (Task Dispatcher com preempção por canal)
        this.activeTasks = {
            [TASK_CHANNELS.LATERAL]: null,
            [TASK_CHANNELS.VERTICAL]: null,
            [TASK_CHANNELS.LONGITUDINAL]: null
        };

        this.taskIdCounter = 1;
    }

    /**
     * Calcula dinamicamente o nível de carga de trabalho (Workload: 0.0 a 1.0)
     * Baseia-se na fase de voo, proximidade do aeródromo, meteorologia e tarefas simultâneas.
     * @returns {number} Workload normalizado entre 0.0 e 1.0
     */
    calculateWorkload() {
        let wl = 0.15; // Carga base de cruzeiro nivelado

        const aero = this.aero;
        if (!aero) return wl;

        // 1. Proximidade terminal (TMA / Aproximação)
        const dtg = aero.dtg || 30;
        if (dtg < 10) {
            wl += 0.35; // Final approach / alta concentração
        } else if (dtg < 25) {
            wl += 0.20; // Terminal area / sequenciamento
        }

        // 2. Tarefas simultâneas concorrentes na cabine
        let tarefasAtivas = 0;
        Object.values(this.activeTasks).forEach(t => {
            if (t && t.status !== TASK_STATES.COMPLETED && t.status !== TASK_STATES.SUPERSEDED) {
                tarefasAtivas++;
            }
        });
        if (tarefasAtivas >= 2) wl += 0.20;

        // 3. Fatores ambientais (Vento e turbulência)
        if (aero.ventoAtual && aero.ventoAtual.speedKt > 15) {
            wl += 0.15;
        }

        // 4. Dinâmica física intensa (speedbrakes ou descida acentuada)
        if (aero.speedbrakes || (aero.verticalSpeed && aero.verticalSpeed < -1000)) {
            wl += 0.10;
        }

        return Math.max(0.0, Math.min(1.0, wl));
    }

    /**
     * Despacha um novo comando ATC para o canal correspondente.
     * Aplica REGRA DE PREEMPÇÃO: Um novo comando em um canal sobrescreve a tarefa ativa daquele canal
     * (marcando-a como SUPERSEDED), mantendo intactas as tarefas dos outros canais.
     * 
     * @param {string} channel - Canal ('LATERAL', 'VERTICAL', 'LONGITUDINAL')
     * @param {string} type - Tipo da tarefa ('HEADING', 'DIRECT_TO', 'ALTITUDE', 'SPEED', etc.)
     * @param {Object} [params={}] - Parâmetros específicos
     * @returns {PilotTask} A tarefa criada e agendada
     */
    dispatch(channel, type, params = {}) {
        if (!this.activeTasks.hasOwnProperty(channel)) {
            console.warn(`[PilotAgent] Canal desconhecido: ${channel}`);
            return null;
        }

        // Regra de Preempção: cancela a tarefa anterior do mesmo canal
        const tarefaAnterior = this.activeTasks[channel];
        if (tarefaAnterior && tarefaAnterior.status !== TASK_STATES.COMPLETED && tarefaAnterior.status !== TASK_STATES.SUPERSEDED) {
            tarefaAnterior.status = TASK_STATES.SUPERSEDED;
        }

        const taskId = `task_${this.aero.callsign || 'AC'}_${this.taskIdCounter++}`;
        const novaTarefa = new PilotTask(taskId, channel, type, params, this);

        this.activeTasks[channel] = novaTarefa;
        return novaTarefa;
    }

    /**
     * Executa fisicamente o acoplamento do comando à aeronave quando a tarefa
     * conclui a fase SETTING e ingressa em EXECUTING.
     * @param {PilotTask} task - Tarefa que atingiu a fase de execução
     */
    applyTaskExecution(task) {
        const aero = this.aero;
        if (!aero) return;

        switch (task.type) {
            case TASK_TYPES.HEADING: {
                const novaProa = task.params.heading;
                const ladoMaior = Boolean(task.params.maior);

                aero.modoLNAV = false;
                aero.flyByProtegido = null;
                aero.wpOffRoute = null;
                aero.proaDestino = novaProa;

                // Calcula o arco no círculo trigonométrico
                let difCurta = novaProa - aero.proa;
                while (difCurta <= -180) difCurta += 360;
                while (difCurta > 180) difCurta -= 360;

                if (difCurta === 0) aero.direcaoCurva = 0;
                else if (ladoMaior) aero.direcaoCurva = (difCurta > 0) ? -1 : 1;
                else aero.direcaoCurva = (difCurta > 0) ? 1 : -1;
                break;
            }

            case TASK_TYPES.DIRECT_TO: {
                if (task.params.novaRota && Array.isArray(task.params.novaRota)) {
                    aero.rota = task.params.novaRota;
                }
                const target = task.params.target;
                const isIdx = Boolean(task.params.isIdx);

                if (isIdx) {
                    aero.wpIndex = target;
                    aero.wpOffRoute = null;
                } else {
                    aero.wpOffRoute = target;
                }

                aero.modoLNAV = true;
                aero.velManual = false;
                aero.flyByProtegido = null;
                aero.desceuParaWp = {};
                break;
            }

            case TASK_TYPES.ROUTE: {
                aero.modoLNAV = true;
                aero.wpOffRoute = null;
                break;
            }

            case TASK_TYPES.ALTITUDE: {
                const novoNivel = task.params.level;
                aero.nivAutorizadoFisico = novoNivel;
                break;
            }

            case TASK_TYPES.SPEED: {
                const novaVel = task.params.speed;
                aero.velManual = true;
                aero.velComando = novaVel;
                aero.velDestino = novaVel;
                break;
            }

            case TASK_TYPES.RESUME_SPEED: {
                aero.velManual = false;
                break;
            }
        }
    }

    /**
     * Passo de atualização do piloto. Deve ser chamado no loop de física (com dt em segundos).
     * @param {number} dt - Delta time físico decorrido em segundos
     */
    update(dt) {
        Object.keys(this.activeTasks).forEach(canal => {
            const task = this.activeTasks[canal];
            if (task) {
                task.update(dt);
                // Libera tarefas concluídas ou sobrescritas
                if (task.status === TASK_STATES.COMPLETED || task.status === TASK_STATES.SUPERSEDED) {
                    this.activeTasks[canal] = null;
                }
            }
        });
    }
}
