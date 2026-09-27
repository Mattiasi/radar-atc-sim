import { dmsParaDecimal, latCentro, lonCentro } from './utils.js';

/**
 * Cartas e Procedimentos de Navegação (STAR, SID, AIC).
 * Organizado de forma modular por categorias.
 * Cada grupo possui sua cor única, lista ordenada de fixos (com coordenadas e restrições)
 * e definição das linhas a serem desenhadas no radar.
 */
export const cartasNavegacao = {
    STAR: {
        "OGTAL_2A": {
            nome: "OGTAL 2A",
            cor: '#ff9900',
            fixos: [
                { nome: "OGTAL", lat: dmsParaDecimal(23, 51, 23.29, 'S'), lon: dmsParaDecimal(46, 37, 33.47, 'W'), restricao: { fl: 120, tipo: "BELOW" } },
                { nome: "SP099", lat: dmsParaDecimal(23, 46, 36.15, 'S'), lon: dmsParaDecimal(46, 40, 52.60, 'W'), restricao: { fl:  90, tipo: "AT" } },
                { nome: "SP101", lat: dmsParaDecimal(23, 43, 13.30, 'S'), lon: dmsParaDecimal(46, 43, 13.76, 'W'), restricao: { fl:  90, tipo: "AT" } },
                { nome: "SP032", lat: dmsParaDecimal(23, 38, 18.92, 'S'), lon: dmsParaDecimal(46, 46, 37.85, 'W'), restricao: { fl:  70, tipo: "AT" } }
            ],
            // Linhas desenhadas na cor desta STAR (inclui a conexão SP032 -> KOMGU na cor da STAR)
            linhas: [
                ["OGTAL", "SP099", "SP101", "SP032", "KOMGU"]
            ]
        },
        "ORESU_1A": {
            nome: "ORESU 1A",
            cor: '#ff9900',
            fixos: [
                { nome: "PRUMO", lat: dmsParaDecimal(23, 15, 10.10, 'S'), lon: dmsParaDecimal(47,  6, 19.99, 'W'), restricao: { fl: 120, tipo: "ABOVE" } },
                { nome: "IROPU", lat: dmsParaDecimal(23, 25, 31.05, 'S'), lon: dmsParaDecimal(47,  4,  3.91, 'W'), restricao: { fl:  90, tipo: "ABOVE" } }
            ],
            // Linhas desenhadas na cor desta STAR (inclui a conexão IROPU -> LUVDI na cor da STAR)
            linhas: [
                ["PRUMO", "IROPU", "LUVDI"]
            ]
        }
    },
    AIC: {
        "RNPY17R": {
            nome: "RNP Y RWY 17R",
            cor: '#00ff00',
            fixos: [
                { nome: "LUVDI", lat: dmsParaDecimal(23, 29, 35.90, 'S'), lon: dmsParaDecimal(46, 48, 21.77, 'W'), restricao: { fl:  55, tipo: "ABOVE" } },
                { nome: "KOMGU", lat: dmsParaDecimal(23, 33, 54.89, 'S'), lon: dmsParaDecimal(46, 49, 40.64, 'W'), restricao: { fl:  55, tipo: "AT" } },
                { nome: "GERSU", lat: dmsParaDecimal(23, 30, 41.00, 'S'), lon: dmsParaDecimal(46, 44, 10.10, 'W'), restricao: { fl:  47, tipo: "ABOVE" } },
                { nome: "URUTA", lat: dmsParaDecimal(23, 33, 28.57, 'S'), lon: dmsParaDecimal(46, 42, 14.37, 'W'), restricao: { fl:  40, tipo: "AT" } },
                { nome: "SP139", lat: dmsParaDecimal(23, 34, 59.83, 'S'), lon: dmsParaDecimal(46, 41, 11.34, 'W'), restricao: { fl:  36, tipo: "AT" } },
                { nome: "SP017", lat: dmsParaDecimal(23, 36, 15.89, 'S'), lon: dmsParaDecimal(46, 40, 18.81, 'W'), restricao: { fl:  32, tipo: "AT" } }
            ],
            // Duas pernas confluindo em GERSU (LUVDI e KOMGU NÃO se conectam diretamente entre si)
            linhas: [
                ["LUVDI", "GERSU"],
                ["KOMGU", "GERSU"],
                ["GERSU", "URUTA", "SP139", "SP017"]
            ]
        }
    },
    SID: {
        // Reservado para futuras cartas de saída (SIDs)
    }
};

/**
 * Agregação dinâmica para compatibilidade total com o motor do simulador:
 * - fixosNavegacao: lista com todos os fixos, suas coordenadas e cores das cartas
 * - restricoesFixos: dicionário de restrições de nível de voo e altitude
 */
export const fixosNavegacao = [];
export const restricoesFixos = {
    "SBSP": { fl: 26, tipo: "AT" }
};

Object.values(cartasNavegacao).forEach(categoria => {
    Object.values(categoria).forEach(carta => {
        if (carta.fixos) {
            carta.fixos.forEach(f => {
                fixosNavegacao.push({
                    nome: f.nome,
                    lat: f.lat,
                    lon: f.lon,
                    cor: carta.cor,
                    restricao: f.restricao
                });
                if (f.restricao) {
                    restricoesFixos[f.nome] = f.restricao;
                }
            });
        }
    });
});

/**
 * Constrói dinamicamente a sequência de waypoints de uma rota a partir de qualquer fixo inicial,
 * navegando através do Grafo Direcionado de cartasNavegacao (STAR -> AIC -> Destino).
 * 
 * @param {string} fixoOrigem - Nome do fixo inicial solicitado (ex: "KOMGU", "GERSU", "PRUMO")
 * @param {string} [dest="SBSP"] - Aeródromo de destino da aeronave
 * @returns {Array<string>} Lista ordenada de fixos até o pouso ou fim do procedimento
 */
export function montarRotaAPartirDeFixo(fixoOrigem, dest = "SBSP") {
    if (!fixoOrigem) return [];

    const conexoes = {};
    if (typeof cartasNavegacao === 'object' && cartasNavegacao !== null) {
        Object.values(cartasNavegacao).forEach(categoria => {
            Object.values(categoria).forEach(carta => {
                if (carta.linhas) {
                    carta.linhas.forEach(linha => {
                        for (let i = 0; i < linha.length - 1; i++) {
                            if (!conexoes[linha[i]]) {
                                conexoes[linha[i]] = linha[i + 1];
                            }
                        }
                    });
                }
            });
        });
    }

    const rotaGerada = [fixoOrigem];
    let atual = fixoOrigem;
    const visitados = new Set([fixoOrigem]);

    while (conexoes[atual] && !visitados.has(conexoes[atual])) {
        atual = conexoes[atual];
        rotaGerada.push(atual);
        visitados.add(atual);
    }

    // Conexão Terminal Genérica: Se a rota atingiu o último fixo de um procedimento
    // de aproximação (sem conexão seguinte no grafo), conecta diretamente ao aeródromo de destino
    if (dest && !rotaGerada.includes(dest)) {
        const ult = rotaGerada[rotaGerada.length - 1];
        if (!conexoes[ult]) {
            rotaGerada.push(dest);
        }
    }

    return rotaGerada;
}

/**
 * Retorna uma lista consolidada e única de todos os nomes de fixos cadastrados em cartas de navegação (STAR e AIC).
 * Utilizado para popular dinamicamente os seletores de fixo do Painel de Fluxo e do simulador.
 * 
 * @returns {Array<string>} Lista de nomes de fixos disponíveis
 */
export function obterTodosFixosProcedimentos() {
    const fixosSet = new Set();
    if (cartasNavegacao && typeof cartasNavegacao === 'object') {
        Object.values(cartasNavegacao).forEach(categoria => {
            Object.values(categoria).forEach(carta => {
                if (carta.fixos && Array.isArray(carta.fixos)) {
                    carta.fixos.forEach(f => {
                        if (f && f.nome) fixosSet.add(f.nome);
                    });
                }
            });
        });
    }
    return Array.from(fixosSet);
}

/**
 * Reconstrói a trajetória completa (precedente e posterior) que cruza qualquer fixo escolhido pelo usuário.
 * Permite ao gerador de fluxo recuar dinamicamente no traçado da carta mesmo quando o fixo fica no meio dela.
 * 
 * @param {string} fixoAlvo - Fixo escolhido como referência para o fluxo
 * @param {string} [dest="SBSP"] - Aeródromo de destino
 * @returns {{ rotaCompleta: Array<string>, targetIndex: number }} Trajetória completa e índice do fixo na rota
 */
export function obterTrajetoriaCompletaAteFixo(fixoAlvo, dest = "SBSP") {
    if (!fixoAlvo) return { rotaCompleta: [], targetIndex: -1 };

    // 1. Rota posterior partindo do fixo até a pista de pouso
    const posteriores = montarRotaAPartirDeFixo(fixoAlvo, dest);

    // 2. Grafo inverso de conexões a partir das cartas de navegação
    const conexoesInversas = {};
    if (typeof cartasNavegacao === 'object' && cartasNavegacao !== null) {
        Object.values(cartasNavegacao).forEach(categoria => {
            Object.values(categoria).forEach(carta => {
                if (carta.linhas) {
                    carta.linhas.forEach(linha => {
                        for (let i = 1; i < linha.length; i++) {
                            if (!conexoesInversas[linha[i]]) {
                                conexoesInversas[linha[i]] = linha[i - 1];
                            }
                        }
                    });
                }
            });
        });
    }

    // 3. Caminha regressivamente a partir do fixoAlvo para encontrar fixos anteriores da mesma carta
    const precedentes = [];
    let atual = fixoAlvo;
    const visitados = new Set([fixoAlvo]);

    while (conexoesInversas[atual] && !visitados.has(conexoesInversas[atual])) {
        atual = conexoesInversas[atual];
        precedentes.unshift(atual); // Insere no início para manter a ordem cronológica
        visitados.add(atual);
    }

    // Remove duplicação do fixoAlvo entre precedentes e posteriores
    const rotaCompleta = [...precedentes, ...posteriores];
    const targetIndex = precedentes.length;

    return { rotaCompleta, targetIndex };
}

/**
 * Determina o nível de voo inicial de nascimento (flSpawn) e o nível autorizado de descida (flAutorizado)
 * para uma aeronave que nasce num fixo de procedimento ou ao longo de sua rota.
 * Se o fixo possuir restrição de altitude, a aeronave nasce no nível dessa restrição
 * e recebe autorização para descer até a próxima restrição de nível inferior da carta.
 * 
 * Exemplo: Em OGTAL (restrição FL 120), nasce no FL 120 e autorizado FL 090 (restrição de SP099).
 * 
 * @param {string} fixoAlvo - Nome do fixo de referência do fluxo (ex: "OGTAL", "PRUMO", "KOMGU")
 * @param {Array<string>} [rotaCompleta=[]] - Lista sequencial de fixos da rota
 * @returns {{ nivAtual: string, nivAutorizado: string }} Níveis formatados em 3 dígitos (ex: "120", "090")
 */
export function obterNiveisSpawn(fixoAlvo, rotaCompleta = []) {
    let flSpawn = null;

    // 1. Verifica se o fixo alvo possui restrição direta
    if (fixoAlvo && restricoesFixos[fixoAlvo] && restricoesFixos[fixoAlvo].fl !== undefined) {
        flSpawn = restricoesFixos[fixoAlvo].fl;
    }

    const idxAlvo = Array.isArray(rotaCompleta) ? rotaCompleta.indexOf(fixoAlvo) : -1;

    // 2. Se o fixo alvo não tiver restrição, busca na rota anterior ou posterior
    if (flSpawn === null && idxAlvo >= 0) {
        // Procura para trás na rota
        for (let i = idxAlvo - 1; i >= 0; i--) {
            const rest = restricoesFixos[rotaCompleta[i]];
            if (rest && rest.fl !== undefined) {
                flSpawn = rest.fl;
                break;
            }
        }
        // Se ainda não achou, procura para frente
        if (flSpawn === null) {
            for (let i = idxAlvo; i < rotaCompleta.length; i++) {
                const rest = restricoesFixos[rotaCompleta[i]];
                if (rest && rest.fl !== undefined) {
                    flSpawn = rest.fl;
                    break;
                }
            }
        }
    }

    // Fallback padrão se não houver nenhuma restrição na carta
    if (flSpawn === null) {
        flSpawn = 120;
    }

    // 3. Determina o próximo nível autorizado para descida ao longo da rota (primeira restrição inferior a flSpawn)
    let flAutorizado = null;
    if (Array.isArray(rotaCompleta) && rotaCompleta.length > 0) {
        const startIdx = idxAlvo >= 0 ? idxAlvo + 1 : 0;
        for (let i = startIdx; i < rotaCompleta.length; i++) {
            const rest = restricoesFixos[rotaCompleta[i]];
            if (rest && rest.fl !== undefined && rest.fl < flSpawn) {
                flAutorizado = rest.fl;
                break;
            }
        }
    }

    // Se não encontrou nenhuma restrição inferior subsequente, mantém o nível de spawn
    if (flAutorizado === null) {
        flAutorizado = flSpawn;
    }

    const formatarFL = (fl) => String(Math.round(fl)).padStart(3, '0');

    return {
        nivAtual: formatarFL(flSpawn),
        nivAutorizado: formatarFL(flAutorizado)
    };
}

/**
 * Aeródromos com suas respectivas pistas e eixos prolongados configurados de forma orientada a dados (Data-Driven).
 */
export const aerodromos = [
    {
        nome: "SBSP",
        lat: latCentro,
        lon: lonCentro,
        rumoPista: 170,
        // Prolongamento compartilhado no centro do aeródromo (alinhado com o eixo da pista 17R)
        prolongamento: {
            tracosAntes: 5,      // 4 tracejados ao Norte (proa 350°)
            tracosDepois: 6,     // 6 tracejados ao Sul (proa 170°)
            tamanhoTracoNM: 1.0, // 1 NM por tracejado
            espacoNM: 1.0,       // Afastados em 1 NM
            afastamentoNM: 1.0,  // Início a 1 NM da cabeceira
            compNM: 1.05,       // Comprimento de referência (pista principal 17R)
            sepYNM: 0,          // Eixo da 17R alinhado com a aproximação
            sepXNM: 0,
            cor: '#ffffff'
        },
        pistas: [
            {
                id: "17R/35L",
                rumo: 170,
                compNM: 1.05,
                larguraPx: 3.5,
                sepYNM: 0, // Eixo principal (17R)
                sepXNM: 0
            },
            {
                id: "17L/35R",
                rumo: 170,
                compNM: 0.77,
                larguraPx: 3.0,
                sepYNM: -0.097, // Eixo à esquerda (Leste), 180m de separação
                sepXNM: 0.08
            }
        ]
    },
    {
        nome: "SBJH",
        lat: dmsParaDecimal(23, 25, 37, 'S'),
        lon: dmsParaDecimal(47,  9, 57, 'W'),
        rumoPista: 120,
        pistas: [
            {
                id: "12/30",
                rumo: 120,
                compNM: 1.33, // 2.470 metros reais
                larguraPx: 3.0,
                sepY: 0
            }
        ]
    },
    {
        nome: "SBKP",
        lat: dmsParaDecimal(23,  0, 25, 'S'),
        lon: dmsParaDecimal(47,  8,  4, 'W'),
        rumoPista: 150,
        pistas: [
            {
                id: "15/33",
                rumo: 150,
                compNM: 1.75, // 3.240 metros reais
                larguraPx: 3.5,
                sepY: 0,
                prolongamento: {
                    tracosAntes: 6,      // 6 tracejados na aproximação da 15 (Noroeste)
                    tracosDepois: 6,     // 6 tracejados na aproximação da 33 (Sudeste)
                    tamanhoTracoNM: 1.0,
                    espacoNM: 1.0,
                    afastamentoNM: 1.0,
                    cor: '#ffffff'
                }
            }
        ]
    },
    {
        nome: "SBMT",
        lat: dmsParaDecimal(23, 30, 33, 'S'),
        lon: dmsParaDecimal(46, 38, 15, 'W'),
        rumoPista: 120,
        pistas: [
            {
                id: "12/30",
                rumo: 120,
                compNM: 0.994,
                larguraPx: 3.0,
                sepY: 0
            }
        ]
    },
    {
        nome: "SBGR",
        lat: dmsParaDecimal(23, 26, 8, 'S'),
        lon: dmsParaDecimal(46, 28, 23, 'W'),
        rumoPista: 100,
        pistas: [
            {
                id: "10R/28L",
                rumo: 100,
                compNM: 1.86,
                larguraPx: 3.0,
                sepY: 4,
                prolongamento: {
                    tracosAntes: 4,      // 4 tracejados 
                    tracosDepois: 5,     // 6 tracejados 
                    tamanhoTracoNM: 1.0, // 1 NM por tracejado
                    espacoNM: 1.0,       // Afastados em 1 NM
                    afastamentoNM: 1.0,  // Início a 1 NM da cabeceira
                    cor: '#ffffff'
                }
            },
            {
                id: "10L/28R",
                rumo: 100,
                compNM: 2.3,
                larguraPx: 3.0,
                sepY: -4, // Eixo à esquerda do centro (Norte)
                sepX: 24,  // Deslocamento longitudinal para frente (+X no rumo 100°)
                prolongamento: {
                    tracosAntes: 5,      // 4 tracejados ao Oeste (aproximação 10L)
                    tracosDepois: 4,     // 6 tracejados ao Leste (aproximação 28R)
                    tamanhoTracoNM: 1.0, // 1 NM por tracejado
                    espacoNM: 1.0,       // Afastados em 1 NM
                    afastamentoNM: 1.0,  // Início a 1 NM da cabeceira
                    cor: '#ffffff'}
            }
        ]
    }
];


/**
 * Coordenadas oficiais DECEA WGS-84 de delimitação geométrica do espaço aéreo (Vértices de Setor ATCSMAC SBSP).
 */
export const verticesSetor = [
    { nome: "PT_54",  lat: dmsParaDecimal(24,  2,  0.46, 'S'), lon: dmsParaDecimal(46, 44,  0.04, 'W') },
    { nome: "PT_110", lat: dmsParaDecimal(23, 48, 50.34, 'S'), lon: dmsParaDecimal(46, 54, 19.80, 'W') },
    { nome: "PT_56",  lat: dmsParaDecimal(23, 30,  0.77, 'S'), lon: dmsParaDecimal(47,  5, 38.00, 'W') },
    { nome: "PT_57",  lat: dmsParaDecimal(23, 22, 38.20, 'S'), lon: dmsParaDecimal(47,  2, 40.74, 'W') },
    { nome: "PT_42",  lat: dmsParaDecimal(23, 26, 24.89, 'S'), lon: dmsParaDecimal(46, 51, 41.18, 'W') },
    { nome: "PT_41",  lat: dmsParaDecimal(23, 24, 22.97, 'S'), lon: dmsParaDecimal(46, 48, 12.25, 'W') },
    { nome: "PT_40",  lat: dmsParaDecimal(23, 22, 27.93, 'S'), lon: dmsParaDecimal(46, 44, 56.06, 'W') },
    { nome: "PT_111", lat: dmsParaDecimal(23, 21, 18.47, 'S'), lon: dmsParaDecimal(46, 43, 23.34, 'W') },
    { nome: "PT_44",  lat: dmsParaDecimal(23, 29, 48.09, 'S'), lon: dmsParaDecimal(46, 41, 32.12, 'W') },
    { nome: "PT_45",  lat: dmsParaDecimal(23, 31, 31.40, 'S'), lon: dmsParaDecimal(46, 38, 40.30, 'W') },
    { nome: "PT_47",  lat: dmsParaDecimal(23, 35,  9.45, 'S'), lon: dmsParaDecimal(46, 36,  9.96, 'W') },
    { nome: "PT_48",  lat: dmsParaDecimal(23, 51, 25.13, 'S'), lon: dmsParaDecimal(46, 24, 50.52, 'W') },
    { nome: "PT_55",  lat: dmsParaDecimal(23, 39, 11.95, 'S'), lon: dmsParaDecimal(46, 59, 30.54, 'W') },
    { nome: "PT_58",  lat: dmsParaDecimal(23, 29, 53.00, 'S'), lon: dmsParaDecimal(46, 57, 36.63, 'W') },
    { nome: "PT_59",  lat: dmsParaDecimal(23, 35, 42.62, 'S'), lon: dmsParaDecimal(46, 53, 35.90, 'W') },
    { nome: "PT_43",  lat: dmsParaDecimal(23, 32, 56.81, 'S'), lon: dmsParaDecimal(46, 46, 51.82, 'W') }
];

/**
 * Definições das linhas de fronteira e polígonos de altitude mínima (ATCSMAC).
 */
export const estruturaEspacoAereo = {
    linhasFronteira: [
        ["PT_54", "PT_110", "PT_56", "PT_57", "PT_42", "PT_41", "PT_40", "PT_111", "PT_44", "PT_45", "PT_47", "PT_48"],
        ["PT_55", "PT_59", "PT_58", "PT_42", "PT_43", "PT_44"],
        ["PT_110", "PT_47"],
        ["PT_54", "PT_48"]
    ],
    setoresAltitude: [
        { vertices: ["PT_57", "PT_42", "PT_58", "PT_59", "PT_55", "PT_56"], altitude: "5100'" },
        { vertices: ["PT_42", "PT_41", "PT_40", "PT_111", "PT_44", "PT_43"], altitude: "4700'" },
        { vertices: ["PT_54", "PT_110", "PT_56", "PT_55", "PT_59"], altitude: "4700'" },
        { vertices: ["PT_48", "PT_54", "PT_110"], altitude: "5100'" }
    ]
};


/**
 * Perfil de Referência de Velocidade por Distância à Cabeceira (Distance-To-Go / DME).
 * Define faixas de velocidade de aproximação realistas, dinâmicas e contínuas (Seção 3 da Especificação ATC).
 */
export const APPROACH_SPEED_PROFILE = [
    { minDtg: 25.0, maxDtg: 999.0, minSpeed: 250, maxSpeed: 280, desc: "> 25 NM: Transição TMA / Aproximação Inicial" },
    { minDtg: 15.0, maxDtg: 25.0,  minSpeed: 210, maxSpeed: 250, desc: "25-15 NM: Desaceleração Intermediária" },
    { minDtg: 10.0, maxDtg: 15.0,  minSpeed: 180, maxSpeed: 210, desc: "15-10 NM: Aproximação Intermediária / Sequenciamento" },
    { minDtg: 4.0,  maxDtg: 10.0,  minSpeed: 160, maxSpeed: 180, desc: "10-4 NM: Final Approach / Interceptação Localizer" },
    { minDtg: 0.0,  maxDtg: 4.0,   minSpeed: 130, maxSpeed: 140, desc: "< 4 NM: Velocidade de Aproximação Final (Vapp)" }
];

/**
 * Performance Individual das Aeronaves (Seção 4 da Especificação ATC).
 * Configuração paramétrica de envelope e cinemática individual para cada tipo ICAO:
 * - maxSpeedTMA: velocidade máxima de operação na TMA (> 25 NM)
 * - initialAppSpeed: velocidade típica entre 25 e 15 NM
 * - intermediateAppSpeed: velocidade entre 15 e 10 NM
 * - finalAppSpeed: velocidade entre 10 e 4 NM
 * - approachSpeed: Vapp (velocidade final de toque na pista < 4 NM)
 * - minApproachSpeed: Vls / velocidade mínima segura de aproximação
 * - taxaAcel / accelerationRate: taxa nominal de aceleração (kt/s)
 * - taxaDesacel / decelerationRate: taxa nominal de desaceleração em voo nivelado IDLE (kt/s)
 */
export const AIRCRAFT_PERFORMANCE = {
    // Jatos Comerciais Médios / Narrowbody
    "A320": {
        maxSpeedTMA: 270,
        initialAppSpeed: 250,
        intermediateAppSpeed: 205,
        finalAppSpeed: 165,
        approachSpeed: 136,
        minApproachSpeed: 128,
        taxaAcel: 1.8,
        taxaDesacel: 1.0,
        decelerationRate: 1.0,
        accelerationRate: 1.8
    },
    "A20N": {
        maxSpeedTMA: 270,
        initialAppSpeed: 250,
        intermediateAppSpeed: 205,
        finalAppSpeed: 165,
        approachSpeed: 136,
        minApproachSpeed: 128,
        taxaAcel: 2.0,
        taxaDesacel: 1.0,
        decelerationRate: 1.0,
        accelerationRate: 2.0
    },
    "B738": {
        maxSpeedTMA: 280,
        initialAppSpeed: 250,
        intermediateAppSpeed: 210,
        finalAppSpeed: 170,
        approachSpeed: 142,
        minApproachSpeed: 132,
        taxaAcel: 1.8,
        taxaDesacel: 1.0,
        decelerationRate: 1.0,
        accelerationRate: 1.8
    },
    "B737": {
        maxSpeedTMA: 280,
        initialAppSpeed: 250,
        intermediateAppSpeed: 210,
        finalAppSpeed: 170,
        approachSpeed: 140,
        minApproachSpeed: 130,
        taxaAcel: 1.8,
        taxaDesacel: 1.0,
        decelerationRate: 1.0,
        accelerationRate: 1.8
    },
    "E190": {
        maxSpeedTMA: 260,
        initialAppSpeed: 240,
        intermediateAppSpeed: 200,
        finalAppSpeed: 160,
        approachSpeed: 132,
        minApproachSpeed: 122,
        taxaAcel: 2.0,
        taxaDesacel: 1.2,
        decelerationRate: 1.2,
        accelerationRate: 2.0
    },
    "E195": {
        maxSpeedTMA: 260,
        initialAppSpeed: 240,
        intermediateAppSpeed: 200,
        finalAppSpeed: 160,
        approachSpeed: 134,
        minApproachSpeed: 124,
        taxaAcel: 2.0,
        taxaDesacel: 1.2,
        decelerationRate: 1.2,
        accelerationRate: 2.0
    },
    "E295": {
        maxSpeedTMA: 265,
        initialAppSpeed: 245,
        intermediateAppSpeed: 200,
        finalAppSpeed: 160,
        approachSpeed: 134,
        minApproachSpeed: 124,
        taxaAcel: 2.2,
        taxaDesacel: 1.4,
        decelerationRate: 1.4,
        accelerationRate: 2.2
    },

    // Turboélices Regionais
    "ATR72": {
        maxSpeedTMA: 230,
        initialAppSpeed: 210,
        intermediateAppSpeed: 180,
        finalAppSpeed: 150,
        approachSpeed: 118,
        minApproachSpeed: 110,
        taxaAcel: 1.4,
        taxaDesacel: 1.8,
        decelerationRate: 1.8,
        accelerationRate: 1.4
    },

    // Jatos Executivos (GA Jets)
    "BE40": {
        maxSpeedTMA: 260,
        initialAppSpeed: 240,
        intermediateAppSpeed: 200,
        finalAppSpeed: 160,
        approachSpeed: 125,
        minApproachSpeed: 115,
        taxaAcel: 2.0,
        taxaDesacel: 1.3,
        decelerationRate: 1.3,
        accelerationRate: 2.0
    },
    "C25A": {
        maxSpeedTMA: 250,
        initialAppSpeed: 230,
        intermediateAppSpeed: 195,
        finalAppSpeed: 155,
        approachSpeed: 120,
        minApproachSpeed: 112,
        taxaAcel: 1.9,
        taxaDesacel: 1.1,
        decelerationRate: 1.1,
        accelerationRate: 1.9
    },
    "E50P": {
        maxSpeedTMA: 250,
        initialAppSpeed: 230,
        intermediateAppSpeed: 195,
        finalAppSpeed: 155,
        approachSpeed: 122,
        minApproachSpeed: 114,
        taxaAcel: 1.8,
        taxaDesacel: 1.0,
        decelerationRate: 1.0,
        accelerationRate: 1.8
    },
    "E55P": {
        maxSpeedTMA: 255,
        initialAppSpeed: 235,
        intermediateAppSpeed: 195,
        finalAppSpeed: 155,
        approachSpeed: 122,
        minApproachSpeed: 114,
        taxaAcel: 1.8,
        taxaDesacel: 1.2,
        decelerationRate: 1.2,
        accelerationRate: 1.8
    },

    // Turboélices Executivos / Utilitários
    "B350": {
        maxSpeedTMA: 230,
        initialAppSpeed: 200,
        intermediateAppSpeed: 175,
        finalAppSpeed: 145,
        approachSpeed: 118,
        minApproachSpeed: 108,
        taxaAcel: 1.5,
        taxaDesacel: 2.5,
        decelerationRate: 2.5,
        accelerationRate: 1.5
    },
    "BE20": {
        maxSpeedTMA: 220,
        initialAppSpeed: 195,
        intermediateAppSpeed: 170,
        finalAppSpeed: 145,
        approachSpeed: 115,
        minApproachSpeed: 105,
        taxaAcel: 1.4,
        taxaDesacel: 2.5,
        decelerationRate: 2.5,
        accelerationRate: 1.4
    },
    "BE9L": {
        maxSpeedTMA: 210,
        initialAppSpeed: 190,
        intermediateAppSpeed: 165,
        finalAppSpeed: 140,
        approachSpeed: 112,
        minApproachSpeed: 102,
        taxaAcel: 1.2,
        taxaDesacel: 2.4,
        decelerationRate: 2.4,
        accelerationRate: 1.2
    },
    "C208": {
        maxSpeedTMA: 165,
        initialAppSpeed: 150,
        intermediateAppSpeed: 140,
        finalAppSpeed: 120,
        approachSpeed: 95,
        minApproachSpeed: 85,
        taxaAcel: 1.0,
        taxaDesacel: 2.2,
        decelerationRate: 2.2,
        accelerationRate: 1.0
    },

    // Monomotores / Aviação Leve
    "C172-L": {
        maxSpeedTMA: 120,
        initialAppSpeed: 110,
        intermediateAppSpeed: 100,
        finalAppSpeed: 85,
        approachSpeed: 70,
        minApproachSpeed: 60,
        taxaAcel: 0.8,
        taxaDesacel: 2.0,
        decelerationRate: 2.0,
        accelerationRate: 0.8
    },

    // Perfil Padrão Genérico
    "DEFAULT": {
        maxSpeedTMA: 260,
        initialAppSpeed: 240,
        intermediateAppSpeed: 200,
        finalAppSpeed: 160,
        approachSpeed: 135,
        minApproachSpeed: 125,
        taxaAcel: 1.8,
        taxaDesacel: 1.2,
        decelerationRate: 1.2,
        accelerationRate: 1.8
    }
};

// Alias de retrocompatibilidade
export const perfisAeronaves = AIRCRAFT_PERFORMANCE;

export const ROTA_PRUMO = montarRotaAPartirDeFixo("PRUMO", "SBSP");
export const ROTA_OGTAL = montarRotaAPartirDeFixo("OGTAL", "SBSP");