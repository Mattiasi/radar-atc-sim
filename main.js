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
let ultimoTempoVarredura = performance.now();
let ultimoTempoFrame = performance.now();

/**
 * Executa uma passada de física do radar (equivalente a 4 segundos de voo no tempo simulado).
 */
function executarPassoRadar() {
    state.aeronaves.forEach(a => {
        // 1. Guarda a posição atual no histórico antes de mover (para desenhar os pontinhos do rasto)
        a.historico.push({ deltaLat: a.deltaLat, deltaLon: a.deltaLon });
        
        // Mantém apenas os últimos 5 ecos do radar na memória
        if (a.historico.length > 5) a.historico.shift();
        
        // 2. Executa a máquina de estados (Curvas, Descidas, Velocidade) passando um "dt" de 4 segundos
        a.atualizar(4);
    });

    // 3. Limpeza de Memória (Garbage Collection): Remove aviões que pousaram em SBSP
    state.aeronaves = state.aeronaves.filter(a => !a.pousou);
    
    // 4. Injeta novos aviões nas rotas caso a esteira de separação permita
    gerenciarEsteiraDeTrafego(); 
}

/**
 * Motor de Jogo / Game Loop do Simulador.
 * Utiliza um padrão de "Fixed Timestep" para separar a lógica de física da lógica visual.
 * O intervalo entre as varreduras de radar é acelerado pelo fator de velocidade configurado (1x a 10x).
 * 
 * @param {number} tempoAtual - Timestamp em milissegundos injetado automaticamente pelo requestAnimationFrame.
 */
function loopPrincipal(tempoAtual) {
    const fator = state.fatorVelocidade || 1.0;
    const intervaloVarredura = 4000 / fator;

    // Atualização contínua do vento aleatório em tempo real (~60 FPS) acelerada pela velocidade da simulação
    const dtFrame = Math.min(Math.max(0, (tempoAtual - ultimoTempoFrame) / 1000), 0.1);
    ultimoTempoFrame = tempoAtual;

    if (dtFrame > 0) {
        windManager.update(dtFrame * fator);
        if (painelVentoUI.estaAberto()) {
            painelVentoUI.atualizarSeVisivel();
        }
    }

    // Proteção contra acúmulo excessivo (ex: quando o utilizador troca de aba do navegador)
    if (tempoAtual - ultimoTempoVarredura > intervaloVarredura * 4) {
        ultimoTempoVarredura = tempoAtual - intervaloVarredura;
    }

    while (tempoAtual - ultimoTempoVarredura >= intervaloVarredura) {
        executarPassoRadar();
        ultimoTempoVarredura += intervaloVarredura;
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
carregarTrafegoTeste();         // Faz spawn dos 2 aviões iniciais de demonstração
inicializarUI();                // Inicializa e encapsula os elementos HTML/DOM (Painel, Scratchpad e Menus)
configurarEventosUsuario();     // Liga os "ouvintes" (Listeners) de rato e teclado
aplicarLimites(false);          // Garante que o zoom e o enquadramento inicial estão corretos

// Dispara o motor pela primeira vez
requestAnimationFrame(loopPrincipal);