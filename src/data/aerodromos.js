import { dmsParaDecimal, latCentro, lonCentro } from '../utils/utils.js';

/**
 * ============================================================================
 * GUIA DE CONFIGURAÇÃO DATA-DRIVEN (REFERÊNCIA DE OURO: SBSP RWY 17R)
 * ============================================================================
 * Para habilitar ILS em qualquer pista/cabeceira de qualquer aeródromo, basta
 * configurar o bloco `ils: { ... }` na cabeceira desejada com `enabled: true`.
 * 
 * EXEMPLO DE CONFIGURAÇÃO ILS DATA-DRIVEN NA CABECEIRA:
 * ----------------------------------------------------------------------------
 * cabeceiras: {
 *     "17R": {
 *         lat: dmsParaDecimal(23, 37, 6.61, 'S'),
 *         lon: dmsParaDecimal(46, 39, 43.83, 'W'),
 *         id: "17R",
 *         rumo: 170,
 *         frontCourseDeg: 170,
 *         elevacaoFt: 2631,
 *         // PARÂMETROS DATA-DRIVEN DE POUSO E SOLO (OPCIONAIS COM VALORES PADRÃO):
 *         squawkToque: "2000",             // Transponder ativado após a rolagem na pista
 *         tempoRolagemAteSquawkSec: 4.0,   // Tempo decorrido de rolagem no solo (s) antes de mudar para 2000
 *         distanciaRolagemAteSquawkNM: 0.20, // Distância rolada na pista (NM) antes de mudar para 2000
 *         velAtivacaoSquawkKt: 80,         // Velocidade (kt) para acionar 2000 se atingida antes do tempo
 *         velTaxiKt: 20,                   // Velocidade de rolagem no solo para considerar parada
 *         desaceleracaoSoloKtPorSec: 5.0,  // Desaceleração física na pista (nós por segundo)
 *         tempoEsperaDesaparecerSec: 1.5,  // Tempo após desacelerar antes de sumir
 *         // SISTEMA DE APROXIMAÇÃO ILS DATA-DRIVEN:
 *         ils: {
 *             ident: "ISBP",               // Identificador do ILS
 *             freq: "109.5",               // Frequência do Localizer
 *             front_course_deg: 170,       // Proa do feixe do Localizer
 *             gs_angle_deg: 3.0,           // Ângulo da rampa de planeio (Glide Slope)
 *             loc_max_distance_nm: 30.0,   // Alcance máximo do sinal lateral (NM)
 *             gs_max_distance_nm: 30.0,    // Alcance máximo do sinal vertical (NM)
 *             loc_capture_angle_deg: 45.0, // Ângulo máximo de interceptação lateral
 *             loc_valid: true,             // Sinal do LOC em operação
 *             gs_valid: true,              // Sinal do GS em operação
 *             enabled: true                // ILS ativo para a cabeceira
 *         }
 *     }
 * }
 * ============================================================================
 */
export const aerodromos = [
    {
        nome: "SBSP",
        lat: latCentro,
        lon: lonCentro,
        elevacaoFt: 2631,
        rumoPista: 170,
        pistaPadrao: "17R",
        altitudeTransicaoFt: 7000,
        raioVentoNM: 8.0,
        tetoVentoFL: 40,
        prolongamento: {
            tracosAntes: 5,
            tracosDepois: 6,
            tamanhoTracoNM: 1.0,
            espacoNM: 1.0,
            afastamentoNM: 1.0,
            compNM: 1.05,
            sepYNM: 0,
            sepXNM: 0,
            cor: '#ffffff'
        },
        pistas: [
            {
                id: "17R/35L",
                rumo: 170,
                compNM: 1.05,
                larguraPx: 3.5,
                sepYNM: 0,
                sepXNM: 0,
                cabeceiras: {
                    "17R": {
                        lat: dmsParaDecimal(23, 37, 6.61, 'S'),
                        lon: dmsParaDecimal(46, 39, 43.83, 'W'),
                        id: "17R",
                        rumo: 170,
                        frontCourseDeg: 170,
                        elevacaoFt: 2631,
                        ils: {
                            ident: "ISBP",
                            freq: "109.5",
                            front_course_deg: 170,
                            gs_angle_deg: 3.0,
                            loc_max_distance_nm: 30.0,
                            gs_max_distance_nm: 30.0,
                            loc_capture_angle_deg: 45.0,
                            loc_valid: true,
                            gs_valid: true,
                            enabled: true
                        }
                    },
                    "35L": {
                        lat: dmsParaDecimal(23, 37, 59.81, 'S'),
                        lon: dmsParaDecimal(46, 39, 6.99, 'W'),
                        id: "35L",
                        rumo: 350,
                        frontCourseDeg: 350,
                        elevacaoFt: 2631,
                        ils: {
                            ident: "ICGN",
                            freq: "110.1",
                            front_course_deg: 350,
                            gs_angle_deg: 3.0,
                            loc_max_distance_nm: 30.0,
                            gs_max_distance_nm: 30.0,
                            loc_capture_angle_deg: 45.0,
                            loc_valid: true,
                            gs_valid: true,
                            enabled: true
                        }
                    }
                }
            },
            {
                id: "17L/35R",
                rumo: 170,
                compNM: 0.77,
                larguraPx: 3.0,
                sepYNM: -0.097,
                sepXNM: 0.08,
                cabeceiras: {
                    "17L": {
                        lat: dmsParaDecimal(23, 37, 14.64, 'S'),
                        lon: dmsParaDecimal(46, 39, 30.75, 'W'),
                        id: "17L",
                        rumo: 170,
                        frontCourseDeg: 170,
                        elevacaoFt: 2631,
                        ils: { enabled: false, loc_valid: false, gs_valid: false }
                    },
                    "35R": {
                        lat: dmsParaDecimal(23, 37, 53.65, 'S'),
                        lon: dmsParaDecimal(46, 39, 3.73, 'W'),
                        id: "35R",
                        rumo: 350,
                        frontCourseDeg: 350,
                        elevacaoFt: 2631,
                        ils: { enabled: false, loc_valid: false, gs_valid: false }
                    }
                }
            }
        ]
    },
    {
        nome: "SBGR",
        lat: dmsParaDecimal(23, 26, 7.80, 'S'),
        lon: dmsParaDecimal(46, 28, 16.58, 'W'),
        elevacaoFt: 2461,
        rumoPista: 96,
        pistaPadrao: "10R",
        altitudeTransicaoFt: 7000,
        raioVentoNM: 10.0,
        tetoVentoFL: 40,
        pistas: [
            {
                id: "10R/28L",
                rumo: 96,
                compNM: 1.63,
                larguraPx: 3.5,
                prolongamento: {
                    tracosAntes: 4,
                    tracosDepois: 5,
                    tamanhoTracoNM: 1.0,
                    espacoNM: 1.0,
                    afastamentoNM: 1.0,
                    cor: '#ffffff'
                },
                cabeceiras: {
                    "10R": {
                        lat: dmsParaDecimal(23, 26, 19.67, 'S'),
                        lon: dmsParaDecimal(46, 29, 13.30, 'W'),
                        id: "10R",
                        rumo: 96,
                        frontCourseDeg: 96,
                        elevacaoFt: 2461,
                        ils: {
                            ident: "IGR",
                            freq: "109.3",
                            front_course_deg: 96,
                            gs_angle_deg: 3.0,
                            loc_max_distance_nm: 30.0,
                            gs_max_distance_nm: 30.0,
                            loc_capture_angle_deg: 45.0,
                            loc_valid: true,
                            gs_valid: true,
                            enabled: true
                        }
                    },
                    "28L": {
                        lat: dmsParaDecimal(23, 25, 52.02, 'S'),
                        lon: dmsParaDecimal(46, 27, 31.02, 'W'),
                        id: "28L",
                        rumo: 276,
                        frontCourseDeg: 276,
                        elevacaoFt: 2461,
                        ils: { enabled: false, loc_valid: false, gs_valid: false }
                    }
                }
            },
            {
                id: "10L/28R",
                rumo: 96,
                compNM: 2.0,
                larguraPx: 3.5,
                cabeceiras: {
                    "10L": {
                        lat: dmsParaDecimal(23, 26, 17.76, 'S'),
                        lon: dmsParaDecimal(46, 29, 16.96, 'W'),
                        id: "10L",
                        rumo: 96,
                        frontCourseDeg: 96,
                        elevacaoFt: 2461,
                        ils: { enabled: false, loc_valid: false, gs_valid: false }
                    },
                    "28R": {
                        lat: dmsParaDecimal(23, 25, 43.91, 'S'),
                        lon: dmsParaDecimal(46, 27, 11.45, 'W'),
                        id: "28R",
                        rumo: 276,
                        frontCourseDeg: 276,
                        elevacaoFt: 2461,
                        ils: { enabled: false, loc_valid: false, gs_valid: false }
                    }
                }
            }
        ]
    },
    {
        nome: "SBKP",
        lat: dmsParaDecimal(23, 0, 48.62, 'S'),
        lon: dmsParaDecimal(47, 8, 24.61, 'W'),
        elevacaoFt: 2135,
        rumoPista: 150,
        pistaPadrao: "15",
        altitudeTransicaoFt: 7000,
        raioVentoNM: 8.0,
        tetoVentoFL: 40,
        pistas: [
            {
                id: "15/33",
                rumo: 150,
                compNM: 1.75,
                larguraPx: 3.5,
                sepY: 0,
                prolongamento: {
                    tracosAntes: 6,
                    tracosDepois: 6,
                    tamanhoTracoNM: 1.0,
                    espacoNM: 1.0,
                    afastamentoNM: 1.0,
                    cor: '#ffffff'
                },
                cabeceiras: {
                    "15": {
                        lat: dmsParaDecimal(23, 0, 16.60, 'S'),
                        lon: dmsParaDecimal(47, 9, 10.00, 'W'),
                        id: "15",
                        rumo: 150,
                        frontCourseDeg: 150,
                        elevacaoFt: 2135,
                        ils: {
                            ident: "IKP",
                            freq: "109.3",
                            front_course_deg: 150,
                            gs_angle_deg: 3.0,
                            loc_max_distance_nm: 30.0,
                            gs_max_distance_nm: 30.0,
                            loc_capture_angle_deg: 45.0,
                            loc_valid: true,
                            gs_valid: true,
                            enabled: true
                        }
                    },
                    "33": {
                        lat: dmsParaDecimal(23, 1, 20.65, 'S'),
                        lon: dmsParaDecimal(47, 7, 39.23, 'W'),
                        id: "33",
                        rumo: 330,
                        frontCourseDeg: 330,
                        elevacaoFt: 2135,
                        ils: { enabled: false, loc_valid: false, gs_valid: false }
                    }
                }
            }
        ]
    },
    {
        nome: "SBSJ",
        lat: dmsParaDecimal(23, 13, 50.31, 'S'),
        lon: dmsParaDecimal(45, 51, 49.80, 'W'),
        elevacaoFt: 2120,
        rumoPista: 160,
        pistaPadrao: "16",
        altitudeTransicaoFt: 7000,
        raioVentoNM: 8.0,
        tetoVentoFL: 40,
            pistas: [
            {
                id: "16/34",
                rumo: 160,
                compNM: 1.44,
                larguraPx: 2.5,
                sepYNM: 0,
                sepXNM: 0,
                cabeceiras: {
                    "16": {
                        lat: dmsParaDecimal(23, 13, 18.30, 'S'),
                        lon: dmsParaDecimal(45, 52, 21.70, 'W'),
                        id: "16",
                        rumo: 160,
                        frontCourseDeg: 160,
                        elevacaoFt: 2120,
                        ils: { enabled: false }
                    },
                    "34": {
                        lat: dmsParaDecimal(23, 14, 22.32, 'S'),
                        lon: dmsParaDecimal(45, 51, 17.89, 'W'),
                        id: "34",
                        rumo: 340,
                        frontCourseDeg: 340,
                        elevacaoFt: 2120,
                        ils: { enabled: false }
                    }
                }
            }
        ]
    },
    {
        nome: "SBMT",
        lat: dmsParaDecimal(23, 30, 50.13, 'S'),
        lon: dmsParaDecimal(46, 38, 43.66, 'W'),
        elevacaoFt: 2369,
        rumoPista: 120,
        pistaPadrao: "12",
        altitudeTransicaoFt: 7000,
        raioVentoNM: 8.0,
        tetoVentoFL: 40,
        
        pistas: [
            {
                id: "12/30",
                rumo: 120,
                compNM: 0.86,
                larguraPx: 2.5,
                sepY: 0,
                cabeceiras: {
                    "12": {
                        lat: dmsParaDecimal(23, 30, 46.70, 'S'),
                        lon: dmsParaDecimal(46, 39, 11.70, 'W'),
                        id: "12",
                        rumo: 120,
                        frontCourseDeg: 120,
                        elevacaoFt: 2369,
                        ils: { enabled: false }
                    },
                    "30": {
                        lat: dmsParaDecimal(23, 30, 53.56, 'S'),
                        lon: dmsParaDecimal(46, 38, 15.62, 'W'),
                        id: "30",
                        rumo: 300,
                        frontCourseDeg: 300,
                        elevacaoFt: 2369,
                        ils: { enabled: false }
                    }
                }
            }
        ]
    },
    {
        nome: "SBJD",
        lat: dmsParaDecimal(23, 11, 10.97, 'S'),
        lon: dmsParaDecimal(46, 57, 10.57, 'W'),
        elevacaoFt: 2487,
        rumoPista: 180,
        pistaPadrao: "18",
        altitudeTransicaoFt: 7000,
        raioVentoNM: 8.0,
        tetoVentoFL: 40,
       
        pistas: [
            {
                id: "18/36",
                rumo: 180,
                compNM: 0.76,
                larguraPx: 2.0,
                sepYNM: 0,
                sepXNM: 0,
                cabeceiras: {
                    "18": {
                        lat: dmsParaDecimal(23, 10, 50.00, 'S'),
                        lon: dmsParaDecimal(46, 57, 20.00, 'W'),
                        id: "18",
                        rumo: 180,
                        frontCourseDeg: 180,
                        elevacaoFt: 2487,
                        ils: { enabled: false }
                    },
                    "36": {
                        lat: dmsParaDecimal(23, 11, 31.93, 'S'),
                        lon: dmsParaDecimal(46, 57, 1.13, 'W'),
                        id: "36",
                        rumo: 360,
                        frontCourseDeg: 360,
                        elevacaoFt: 2487,
                        ils: { enabled: false }
                    }
                }
            }
        ]
    },
    {
        nome: "SBJH",
        lat: dmsParaDecimal(23, 26, 1.99, 'S'),
        lon: dmsParaDecimal(47, 10, 15.01, 'W'),
        elevacaoFt: 2772,
        rumoPista: 120,
        pistaPadrao: "12",
        altitudeTransicaoFt: 7000,
        raioVentoNM: 8.0,
        tetoVentoFL: 40,
        prolongamento: {
            tracosAntes: 2,
            tracosDepois: 2,
            tamanhoTracoNM: 1.0,
            espacoNM: 1.0,
            afastamentoNM: 0.5,
            compNM: 1.33,
            sepYNM: 0,
            sepXNM: 0,
            cor: '#ffffff'
        },
        pistas: [
            {
                id: "12/30",
                rumo: 120,
                compNM: 1.33,
                larguraPx: 2.5,
                sepY: 0,
                cabeceiras: {
                    "12": {
                        lat: dmsParaDecimal(23, 25, 56.70, 'S'),
                        lon: dmsParaDecimal(47, 10, 58.30, 'W'),
                        id: "12",
                        rumo: 120,
                        frontCourseDeg: 120,
                        elevacaoFt: 2772,
                        ils: { enabled: false }
                    },
                    "30": {
                        lat: dmsParaDecimal(23, 26, 7.28, 'S'),
                        lon: dmsParaDecimal(47, 9, 31.72, 'W'),
                        id: "30",
                        rumo: 300,
                        frontCourseDeg: 300,
                        elevacaoFt: 2772,
                        ils: { enabled: false }
                    }
                }
            }
        ]
    },
    {
        nome: "SDCO",
        lat: dmsParaDecimal(23, 28, 52.17, 'S'),
        lon: dmsParaDecimal(47, 29, 43.33, 'W'),
        elevacaoFt: 2070,
        rumoPista: 180,
        pistaPadrao: "18",
        altitudeTransicaoFt: 7000,
        raioVentoNM: 8.0,
        tetoVentoFL: 40,
        
        pistas: [
            {
                id: "18/36",
                rumo: 180,
                compNM: 0.80,
                larguraPx: 2.0,
                sepYNM: 0,
                sepXNM: 0,
                cabeceiras: {
                    "18": {
                        lat: dmsParaDecimal(23, 28, 30.00, 'S'),
                        lon: dmsParaDecimal(47, 29, 53.30, 'W'),
                        id: "18",
                        rumo: 180,
                        frontCourseDeg: 180,
                        elevacaoFt: 2070,
                        ils: { enabled: false }
                    },
                    "36": {
                        lat: dmsParaDecimal(23, 29, 14.33, 'S'),
                        lon: dmsParaDecimal(47, 29, 33.36, 'W'),
                        id: "36",
                        rumo: 360,
                        frontCourseDeg: 360,
                        elevacaoFt: 2070,
                        ils: { enabled: false }
                    }
                }
            }
        ]
    },
    {
        nome: "SBBP",
        lat: dmsParaDecimal(22, 58, 52.65, 'S'),
        lon: dmsParaDecimal(46, 32, 28.99, 'W'),
        elevacaoFt: 2900,
        rumoPista: 160,
        pistaPadrao: "16",
        altitudeTransicaoFt: 7000,
        raioVentoNM: 8.0,
        tetoVentoFL: 40,
        
        pistas: [
            {
                id: "16/34",
                rumo: 160,
                compNM: 0.65,
                larguraPx: 2.0,
                sepYNM: 0,
                sepXNM: 0,
                cabeceiras: {
                    "16": {
                        lat: dmsParaDecimal(22, 58, 38.30, 'S'),
                        lon: dmsParaDecimal(46, 32, 43.30, 'W'),
                        id: "16",
                        rumo: 160,
                        frontCourseDeg: 160,
                        elevacaoFt: 2900,
                        ils: { enabled: false }
                    },
                    "34": {
                        lat: dmsParaDecimal(22, 59, 7.01, 'S'),
                        lon: dmsParaDecimal(46, 32, 14.69, 'W'),
                        id: "34",
                        rumo: 340,
                        frontCourseDeg: 340,
                        elevacaoFt: 2900,
                        ils: { enabled: false }
                    }
                }
            }
        ]
    },
    {
        nome: "SBST",
        lat: dmsParaDecimal(23, 56, 19.01, 'S'),
        lon: dmsParaDecimal(46, 18, 6.83, 'W'),
        elevacaoFt: 10,
        rumoPista: 170,
        pistaPadrao: "17",
        altitudeTransicaoFt: 7000,
        raioVentoNM: 8.0,
        tetoVentoFL: 40,
       
        pistas: [
            {
                id: "17/35",
                rumo: 170,
                compNM: 0.75,
                larguraPx: 2.0,
                sepYNM: 0,
                sepXNM: 0,
                cabeceiras: {
                    "17": {
                        lat: dmsParaDecimal(23, 56, 0.00, 'S'),
                        lon: dmsParaDecimal(46, 18, 20.00, 'W'),
                        id: "17",
                        rumo: 170,
                        frontCourseDeg: 170,
                        elevacaoFt: 10,
                        ils: { enabled: false }
                    },
                    "35": {
                        lat: dmsParaDecimal(23, 56, 38.02, 'S'),
                        lon: dmsParaDecimal(46, 17, 53.66, 'W'),
                        id: "35",
                        rumo: 350,
                        frontCourseDeg: 350,
                        elevacaoFt: 10,
                        ils: { enabled: false }
                    }
                }
            }
        ]
    },
    {
        nome: "SDAI",
        lat: dmsParaDecimal(22, 45, 35.66, 'S'),
        lon: dmsParaDecimal(47, 16, 29.02, 'W'),
        elevacaoFt: 1800,
        rumoPista: 120,
        pistaPadrao: "12",
        altitudeTransicaoFt: 7000,
        raioVentoNM: 8.0,
        tetoVentoFL: 40,
        
        pistas: [
            {
                id: "12/30",
                rumo: 120,
                compNM: 0.59,
                larguraPx: 2.0,
                sepYNM: 0,
                sepXNM: 0,
                cabeceiras: {
                    "12": {
                        lat: dmsParaDecimal(22, 45, 33.30, 'S'),
                        lon: dmsParaDecimal(47, 16, 48.30, 'W'),
                        id: "12",
                        rumo: 120,
                        frontCourseDeg: 120,
                        elevacaoFt: 1800,
                        ils: { enabled: false }
                    },
                    "30": {
                        lat: dmsParaDecimal(22, 45, 38.01, 'S'),
                        lon: dmsParaDecimal(47, 16, 9.74, 'W'),
                        id: "30",
                        rumo: 300,
                        frontCourseDeg: 300,
                        elevacaoFt: 1800,
                        ils: { enabled: false }
                    }
                }
            }
        ]
    },
    {
        nome: "SDAM",
        lat: dmsParaDecimal(22, 51, 51.44, 'S'),
        lon: dmsParaDecimal(47, 6, 53.63, 'W'),
        elevacaoFt: 2011,
        rumoPista: 160,
        pistaPadrao: "16",
        altitudeTransicaoFt: 7000,
        raioVentoNM: 8.0,
        tetoVentoFL: 40,
        
        pistas: [
            {
                id: "16/34",
                rumo: 160,
                compNM: 0.89,
                larguraPx: 2.0,
                sepYNM: 0,
                sepXNM: 0,
                cabeceiras: {
                    "16": {
                        lat: dmsParaDecimal(22, 51, 31.70, 'S'),
                        lon: dmsParaDecimal(47, 7, 13.30, 'W'),
                        id: "16",
                        rumo: 160,
                        frontCourseDeg: 160,
                        elevacaoFt: 2011,
                        ils: { enabled: false }
                    },
                    "34": {
                        lat: dmsParaDecimal(22, 52, 11.17, 'S'),
                        lon: dmsParaDecimal(47, 6, 33.96, 'W'),
                        id: "34",
                        rumo: 340,
                        frontCourseDeg: 340,
                        elevacaoFt: 2011,
                        ils: { enabled: false }
                    }
                }
            }
        ]
    }
];