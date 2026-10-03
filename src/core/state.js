/**
 * Objeto de Estado Global (State Pattern).
 * Centraliza todas as variáveis dinâmicas, elementos de interface e arrays de dados do simulador.
 * Ao isolar o estado neste ficheiro, evita-se o problema de dependências circulares 
 * (ex: o render.js e o engine.js precisarem de importar variáveis um do outro).
 */
export const state = {
    // --- RENDENRIZAÇÃO BÁSICA ---
    canvas: null,           // Referência direta ao elemento <canvas> no DOM (HTML)
    ctx: null,              // Contexto de renderização 2D (a "caneta" que desenha no canvas)
    centroX: 0,             // Coordenada X do centro geométrico da tela (frequentemente a posição da antena/pista)
    centroY: 0,             // Coordenada Y do centro geométrico da tela
    
    // --- NAVEGAÇÃO DA TELA (PAN & ZOOM) ---
    escala: 1000,           // Fator de zoom atual do ecrã do radar
    offsetX: 0,             // Deslocamento horizontal da câmara (modificado ao arrastar o fundo)
    offsetY: 0,             // Deslocamento vertical da câmara
    arrastando: false,      // Flag: true se o controlador estiver a clicar e arrastar o fundo do mapa
    cliqueInicialX: 0,      // Âncora X de onde o rato iniciou o arraste do mapa
    cliqueInicialY: 0,      // Âncora Y de onde o rato iniciou o arraste do mapa
    mouseTelaX: 0,          // Posição X em tempo real do cursor no ecrã
    mouseTelaY: 0,          // Posição Y em tempo real do cursor no ecrã

    // --- FERRAMENTAS ATC (LINHAS DE MEDIÇÃO/VETORES) ---
    vetorAtivo: null,       // O objeto da linha de medição que está a ser puxada no momento (tecla O)
    vetoresFixos: [],       // Array contendo todas as linhas de medição já desenhadas e ancoradas
    vetorSelecionadoIndex: -1, // Índice (-1 = nenhum) do vetor atualmente selecionado (teclas V e X)
    cliqueVetorAtivoX: null,   // Posição X do mousedown para vetorAtivo
    cliqueVetorAtivoY: null,   // Posição Y do mousedown para vetorAtivo
    arrastouVetorAtivo: false, // Flag se segurou e arrastou a tela durante vetorAtivo

    // --- INTERAÇÃO COM ETIQUETAS (DATA BLOCKS) ---
    aeroArrastandoLabel: null, // Instância da Aeronave cuja etiqueta está a ser reposicionada com o rato
    aeroClicadoCallsign: null, // Instância da Aeronave cujo callsign foi clicado no mousedown
    aeroEditandoTexto: null,   // Instância da Aeronave com o bloco de texto (scratchpad) ativo
    aeroEditandoNivel: null,   // Instância da Aeronave com o menu flutuante de Flight Level (FL) aberto
    aeroEditandoRazao: null,   // Instância da Aeronave com o menu flutuante de Razão Vertical aberto
    arrastouLabel: false,      // Trava lógica para diferenciar um clique rápido (para editar texto) de um arraste longo (para mover a etiqueta)
    labelClickX: 0,            // Coordenada X de onde a etiqueta foi agarrada (para calcular a distância do arraste)
    labelClickY: 0,            // Coordenada Y de onde a etiqueta foi agarrada

    // --- CONFIGURAÇÕES DE VISUALIZAÇÃO ATC E TEMPO ---
    minutosPaliteiro: 1,       // Tempo em minutos do vetor de predição de rota (Speed Vector). Modificável pelas teclas 0-9.
    fatorVelocidade: 1.0,      // Multiplicador de aceleração do tempo da simulação (1x a 5x)

    // --- CONTROLE DE FLUXO E ESTEIRA (ESTADO PURO DATA-DRIVEN) ---
    configFluxo: {
        esteiras: [
            { id: "esteira_1", ativo: false, fixo: "OGTAL|SBSP|OGTAL 2A", separacao: 15 },
            { id: "esteira_2", ativo: false, fixo: "VUNOX|SBGR|VUNOX 1A", separacao: 15 }
        ]
    },

    // --- ENTIDADES DO SIMULADOR ---
    fixos: {},                 // Dicionário com os fixos/waypoints já convertidos em distâncias relativas ao centro
    aeronaves: [],             // Array com todas as instâncias ativas da classe Aeronave (tráfegos vivos na frequência)
    windManager: null,         // Gerenciador do sistema físico e meteorológico de vento

    // --- CONTROLE DE CAMADAS DE VÍDEO-MAPA E BRILHO (STATE PATTERN) ---
    radarLayers: null          // Inicializado abaixo com radarLayerState
};

/**
 * Estado reativo centralizado das camadas de vídeo-mapa e controle de opacidade.
 */
export const radarLayerState = {
    activeRunways: new Set(["SBSP-17", "SBSP-17R", "SBGR-10", "SBGR-10R", "SBGR-10L"]), // Chave única por pista ativa
    activeCharts: new Set([
        "OGTAL 2A", "ORESU 1A", "RNP Y RWY 17R", "RNP 17",
        "VUNOX 1A", "EDMUS 2A", "MOLLE 1A", "RNP Y RWY 10R", "RNP 10"
    ]), // Nomes das cartas/STARs ativas individualmente
    opacity: {
        STAR: 0.8,
        SID: 0.8,
        IAC: 0.8,
        ATCSMAC: 0.8
    }
};

state.radarLayers = radarLayerState;