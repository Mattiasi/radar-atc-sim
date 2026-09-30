import { state } from './state.js';
import { inicializarEspacoAereo, carregarTrafegoTeste, gerenciarEsteiraDeTrafego } from './engine.js';
import { configurarEventosUsuario, aplicarLimites } from './events.js';
import { inicializarUI, painelVentoUI } from './ui.js';
import { desenharRadar } from './render.js';
import { windManager } from './windManager.js';

/**
 * ============================================================================
 * PONTO DE ENTRADA DO SIMULADOR (MAIN ENTRY POINT)
 * Este ficheiro orquestra todos os módulos e controla o ciclo de vida da aplicação.
 * ============================================================================
 */

// Vincula o gerenciador de vento ao estado global
state.windManager = windManager;

// --- 1. SETUP INICIAL DO CANVAS ---
// Conecta o estado global ao elemento HTML real e ajusta a resolução para ecrã inteiro.
state.canvas = document.getElementById('telaRadar');
state.ctx = state.canvas.getContext('2d');
state.canvas.width = window.innerWidth;
state.canvas.height = window.innerHeight;

// O centro do Canvas (em píxeis) representa o marco zero do nosso plano cartesiano (Aeroporto SBSP)
state.centroX = state.canvas.width / 2;
state.centroY = state.canvas.height / 2;

// Guarda o momento exato em que o simulador iniciou, para calcular o delta de tempo depois
// Acumuladores de tempo simulado para desacoplamento Físico vs Radar
let acumuladorFisicoSegundos = 0;
let acumuladorRadarSegundos = 0;
let ultimoTempoFrame = performance.now();

const DT_FISICO = 0.05; // 20 Hz: passo fixo de física e dinâmica cognitiva do piloto (dt = 0.05s)
const INTERVALO_VARREDURA_RADAR = 4.0; // 0.25 Hz: ciclo de varredura e plot do radar (4.0s de voo simulado)

/**
 * Executa uma passada de física contínua e dinâmica do piloto (20 Hz / dt = 0.05s).
 * Integra curvas, VNAV, piloto automático e transições cognitivas das tarefas do piloto.
 * @param {number} dt - Passo de tempo em segundos
 */
function executarPassoFisico(dt) {
    state.aeronaves.forEach(a => {
        a.atualizar(dt);
    });
}

/**
 * Executa o ciclo de varredura do radar ATC (0.25 Hz / a cada 4.0 segundos).
 * Captura o snapshot atual do loop físico, registra o histórico de ecos e remove pousos.
 */
function executarPassoRadar() {
    state.aeronaves.forEach(a => {
        // Inicializa posicaoRadar se ainda não existir
        if (!a.posicaoRadar) {
            a.posicaoRadar = { 
                deltaLat: a.deltaLat, 
                deltaLon: a.deltaLon,
                track: (a.track !== undefined) ? a.track : a.proa,
                groundSpeed: (a.groundSpeed !== undefined) ? a.groundSpeed : a.vel,
                nivAtual: a.nivAtual,
                currentVS: (a.currentVS !== undefined) ? a.currentVS : (a.verticalSpeed || 0),
                verticalMode: a.verticalMode || 'AUTO',
                clampedAtStructural: Boolean(a.clampedAtStructural),
                temModificacaoVertical: Boolean(a.temModificacaoVertical)
            };
        }

        // Guarda o eco anterior no rasto histórico (pontinhos)
        a.historico.push({ deltaLat: a.posicaoRadar.deltaLat, deltaLon: a.posicaoRadar.deltaLon });
        
        // Mantém apenas os últimos 5 ecos do radar na memória
        if (a.historico.length > 5) a.historico.shift();
        
        // Captura o snapshot atual do loop físico para exibição na tela do radar (varredura a cada 4s)
        a.posicaoRadar = { 
            deltaLat: a.deltaLat, 
            deltaLon: a.deltaLon,
            track: (a.track !== undefined) ? a.track : a.proa,
            groundSpeed: (a.groundSpeed !== undefined) ? a.groundSpeed : a.vel,
            nivAtual: a.nivAtual,
            currentVS: (a.currentVS !== undefined) ? a.currentVS : (a.verticalSpeed || 0),
            verticalMode: a.verticalMode || 'AUTO',
            clampedAtStructural: Boolean(a.clampedAtStructural),
            temModificacaoVertical: Boolean(a.temModificacaoVertical)
        };
    });

    // Limpeza de Memória (Garbage Collection): Remove aviões que pousaram
    state.aeronaves = state.aeronaves.filter(a => !a.pousou);
    
    // Injeta novos aviões nas rotas caso a esteira de separação permita
    gerenciarEsteiraDeTrafego(); 
}

/**
 * Motor de Jogo / Game Loop do Simulador.
 * Desacopla o Loop Físico/Comportamental (20 Hz) do Loop de Apresentação Radar (0.25 Hz / 4s).
 * Ambos progridem rigorosamente proporcionais ao fator de velocidade configurado (1x a 10x).
 * 
 * @param {number} tempoAtual - Timestamp em milissegundos injetado automaticamente pelo requestAnimationFrame.
 */
function loopPrincipal(tempoAtual) {
    const fator = state.fatorVelocidade || 1.0;

    // Delta time real decorrido em segundos desde o último frame (limitado a 0.1s contra abas em segundo plano)
    const dtReal = Math.min(Math.max(0, (tempoAtual - ultimoTempoFrame) / 1000), 0.1);
    ultimoTempoFrame = tempoAtual;

    if (dtReal > 0) {
        const dtSimulado = dtReal * fator;

        // Atualização contínua do vento em tempo real
        windManager.update(dtSimulado);
        if (painelVentoUI.estaAberto()) {
            painelVentoUI.atualizarSeVisivel();
        }

        // 1. Loop Físico / Comportamental (20 Hz - dt = 0.05s)
        acumuladorFisicoSegundos += dtSimulado;
        let passosFisicos = 0;
        const maxPassosFisicos = 10; // Proteção contra acúmulo excessivo

        while (acumuladorFisicoSegundos >= DT_FISICO && passosFisicos < maxPassosFisicos) {
            executarPassoFisico(DT_FISICO);
            acumuladorFisicoSegundos -= DT_FISICO;
            passosFisicos++;
        }
        if (passosFisicos >= maxPassosFisicos) {
            acumuladorFisicoSegundos = 0; // Descarta backlog se o navegador engasgar
        }

        // 2. Loop de Radar / Display (0.25 Hz - 4.0s)
        acumuladorRadarSegundos += dtSimulado;
        while (acumuladorRadarSegundos >= INTERVALO_VARREDURA_RADAR) {
            executarPassoRadar();
            acumuladorRadarSegundos -= INTERVALO_VARREDURA_RADAR;
        }
    }
    
    // --- LÓGICA DE RENDERIZAÇÃO VISUAL (Executada a ~60 Frames Por Segundo) ---
    // A renderização acontece o mais rápido possível para que arrastar a tela (Pan) 
    // ou fazer Zoom seja suave, mesmo que os aviões estejam "congelados" esperando o próximo pulso de 4s.
    desenharRadar();
    
    // Pede ao browser para chamar esta função novamente no próximo frame da tela
    requestAnimationFrame(loopPrincipal);
}

// --- 2. SEQUÊNCIA DE INICIALIZAÇÃO (BOOT) ---
inicializarEspacoAereo();       // Carrega a geometria das rotas e TMA
inicializarUI();                // Inicializa e encapsula os elementos HTML/DOM (Painel, Scratchpad e Menus)
carregarTrafegoTeste();         // Faz spawn dos 2 aviões iniciais de demonstração
configurarEventosUsuario();     // Liga os "ouvintes" (Listeners) de rato e teclado
aplicarLimites(false);          // Garante que o zoom e o enquadramento inicial estão corretos

// Dispara o motor pela primeira vez
requestAnimationFrame(loopPrincipal);