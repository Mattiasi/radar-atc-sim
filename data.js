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
                { nome: "SP099", lat: dmsParaDecimal(23, 46, 36.15, 'S'), lon: dmsParaDecimal(46, 40, 52.60, 'W'), restricao: { fl:  90, tipo: "AT", vel: 250, tipoVel: "BELOW" } },
                { nome: "SP101", lat: dmsParaDecimal(23, 43, 13.30, 'S'), lon: dmsParaDecimal(46, 43, 13.76, 'W'), restricao: { fl:  90, tipo: "AT", vel: 230, tipoVel: "AT" } },
                { nome: "SP032", lat: dmsParaDecimal(23, 38, 18.92, 'S'), lon: dmsParaDecimal(46, 46, 37.85, 'W'), restricao: { fl:  70, tipo: "AT", vel: 210, tipoVel: "AT" } }
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
                { nome: "PRUMO", lat: dmsParaDecimal(23, 15, 10.10, 'S'), lon: dmsParaDecimal(47,  6, 19.99, 'W'), restricao: { fl: 120, tipo: "ABOVE", vel: 250, tipoVel: "BELOW" } },
                { nome: "IROPU", lat: dmsParaDecimal(23, 25, 31.05, 'S'), lon: dmsParaDecimal(47,  4,  3.91, 'W'), restricao: { fl:  90, tipo: "ABOVE", vel: 230, tipoVel: "AT" } }
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
                { nome: "LUVDI", lat: dmsParaDecimal(23, 29, 35.90, 'S'), lon: dmsParaDecimal(46, 48, 21.77, 'W'), restricao: { fl:  55, tipo: "ABOVE", vel: 200, tipoVel: "AT" } },
                { nome: "KOMGU", lat: dmsParaDecimal(23, 33, 54.89, 'S'), lon: dmsParaDecimal(46, 49, 40.64, 'W'), restricao: { fl:  55, tipo: "AT", vel: 200, tipoVel: "AT" } },
                { nome: "GERSU", lat: dmsParaDecimal(23, 30, 41.00, 'S'), lon: dmsParaDecimal(46, 44, 10.10, 'W'), restricao: { fl:  47, tipo: "ABOVE", vel: 180, tipoVel: "AT" } },
                { nome: "URUTA", lat: dmsParaDecimal(23, 33, 28.57, 'S'), lon: dmsParaDecimal(46, 42, 14.37, 'W'), restricao: { fl:  40, tipo: "AT", vel: 160, tipoVel: "BELOW" } },
                { nome: "SP139", lat: dmsParaDecimal(23, 34, 59.83, 'S'), lon: dmsParaDecimal(46, 41, 11.34, 'W'), restricao: { fl:  36, tipo: "AT", vel: 150, tipoVel: "BELOW" } },
                { nome: "SP017", lat: dmsParaDecimal(23, 36, 15.89, 'S'), lon: dmsParaDecimal(46, 40, 18.81, 'W'), restricao: { fl:  32, tipo: "AT", vel: 135, tipoVel: "BELOW" } }
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
 * - restricoesFixos: dicionário de restrições de nível de voo e velocidade
 */
export const fixosNavegacao = [];
export const restricoesFixos = {
    "SBSP": { fl: 26, tipo: "AT", vel: 130, tipoVel: "AT" }
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

    // Se a rota termina em SP017 e o destino é SBSP, adiciona SBSP no final para permitir o pouso
    if (dest && !rotaGerada.includes(dest)) {
        const ult = rotaGerada[rotaGerada.length - 1];
        if (ult === "SP017" && dest === "SBSP") {
            rotaGerada.push(dest);
        }
    }

    return rotaGerada;
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
            tracosAntes: 4,      // 4 tracejados ao Norte (proa 350°)
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
                    tracosDepois: 6,     // 6 tracejados 
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
                    tracosAntes: 4,      // 4 tracejados ao Oeste (aproximação 10L)
                    tracosDepois: 6,     // 6 tracejados ao Leste (aproximação 28R)
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


export const perfisAeronaves = {
    "A320":   { taxaAcel: 1.8, taxaDesacel: 1.0 },
    "A20N":   { taxaAcel: 2.0, taxaDesacel: 1.0 }, 
    "B738":   { taxaAcel: 1.8, taxaDesacel: 1.0 },
    "E195":   { taxaAcel: 2.0, taxaDesacel: 1.2 },
    "E295":   { taxaAcel: 2.2, taxaDesacel: 1.4 },
    "BE40":   { taxaAcel: 2.0, taxaDesacel: 1.3 }, 
    "C25A":   { taxaAcel: 1.9, taxaDesacel: 1.1 }, 
    "E50P":   { taxaAcel: 1.8, taxaDesacel: 1.0 }, 
    "E55P":   { taxaAcel: 1.8, taxaDesacel: 1.2 }, 
    "B350":   { taxaAcel: 1.5, taxaDesacel: 2.8 },
    "BE20":   { taxaAcel: 1.4, taxaDesacel: 2.8 },
    "BE9L":   { taxaAcel: 1.2, taxaDesacel: 2.6 },
    "C208":   { taxaAcel: 1.0, taxaDesacel: 2.3 },
    "C172-L": { taxaAcel: 0.8, taxaDesacel: 2.3 },
    "DEFAULT":{ taxaAcel: 2.0, taxaDesacel: 1.5 }
};

export const ROTA_PRUMO = montarRotaAPartirDeFixo("PRUMO", "SBSP");
export const ROTA_OGTAL = montarRotaAPartirDeFixo("OGTAL", "SBSP");