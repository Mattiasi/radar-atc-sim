import { dmsParaDecimal } from '../utils/utils.js';

export const cartasNavegacao = {
    "SBSP": {
        "17R": {
            STAR: {
                "OGTAL_2A": {
                    nome: "OGTAL 2A",
                    cor: '#ff9900',
                    fixos: [
                        { nome: "OGTAL", lat: dmsParaDecimal(23, 51, 23.29, 'S'), lon: dmsParaDecimal(46, 37, 33.47, 'W'), restricao: { fl: 120, tipo: "BELOW" } },
                        { nome: "SP099", lat: dmsParaDecimal(23, 46, 36.15, 'S'), lon: dmsParaDecimal(46, 40, 52.60, 'W'), restricao: { fl:  90, tipo: "AT" } },
                        { nome: "SP101", lat: dmsParaDecimal(23, 43, 13.30, 'S'), lon: dmsParaDecimal(46, 43, 13.76, 'W'), restricao: { fl:  90, tipo: "AT" } },
                        { nome: "SP032", lat: dmsParaDecimal(23, 38, 18.92, 'S'), lon: dmsParaDecimal(46, 46, 37.85, 'W'), restricao: { fl:  70, tipo: "AT" } },
                        { nome: "ANISE", lat: dmsParaDecimal(24, 36, 13.30, 'S'), lon: dmsParaDecimal(46, 37, 53.30, 'W'), restricao: { fl: 230, tipo: "BELOW" } },
                        { nome: "SP091", lat: dmsParaDecimal(24, 23, 66.70, 'S'), lon: dmsParaDecimal(46, 37, 53.30, 'W'), restricao: { fl: 200, tipo: "BELOW" } },
                        { nome: "SP111", lat: dmsParaDecimal(24, 13, 63.30, 'S'), lon: dmsParaDecimal(46, 37, 55.0, 'W') },
                        { nome: "IBDAL", lat: dmsParaDecimal(23, 45, 48.30, 'S'), lon: dmsParaDecimal(45, 13, 88.30, 'W') },
                        { nome: "MANLO", lat: dmsParaDecimal(23, 47, 81.70, 'S'), lon: dmsParaDecimal(45, 24, 48.30, 'W'), restricao: { fl: 260, tipo: "BELOW" } },
                        { nome: "SP033", lat: dmsParaDecimal(23, 50, 20.0, 'S'), lon: dmsParaDecimal(46, 12, 28.30, 'W') }
                    ],
                    linhas: [
                        ["ANISE", "SP091", "SP111", "OGTAL", "SP099", "SP101", "SP032", "KOMGU"],
                        ["IBDAL", "MANLO", "SP033", "OGTAL", "SP099", "SP101", "SP032", "KOMGU"]
                    ],
                    marcasMilhagem: [
                        {
                            pontoZero: "GERSU",
                            distancias: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110],
                            rota: ["ANISE", "SP091", "SP111", "OGTAL", "SP099", "SP101", "SP032", "KOMGU", "GERSU"]
                        },
                        {
                            pontoZero: "GERSU",
                            distancias: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110],
                            rota: ["IBDAL", "MANLO", "SP033" ,"OGTAL", "SP099", "SP101", "SP032", "KOMGU", "GERSU"]
                        }
                    ]
                },
                "ORESU_1A": {
                    nome: "ORESU 1A",
                    cor: '#ff9900',
                    fixos: [
                        {nome: "UTLOT", lat: dmsParaDecimal(22,28,43.30,'S'), lon: dmsParaDecimal(47,53,53.30,'W'), restricao: { fl: 280, tipo: "ABOVE"}},
                        {nome: "RUSTE", lat: dmsParaDecimal(22,46, 8.30,'S'), lon: dmsParaDecimal(47,30,0,'W'), restricao: { fl: 200, flMax: 240, tipo: "WINDOW" }},
                        {nome: "OTAGA", lat: dmsParaDecimal(22,29,40.0,'S'), lon: dmsParaDecimal(46,43,86.70,'W')},
                        {nome: "NEKIG", lat: dmsParaDecimal(22,33,18.30,'S'), lon: dmsParaDecimal(46,47,66.70,'W'), restricao: { fl: 230, tipo: "BELOW"}},
                        {nome: "MAVKA", lat: dmsParaDecimal(22,40,53.30,'S'), lon: dmsParaDecimal(46,55,11.70,'W')},
                        {nome: "SP031", lat: dmsParaDecimal(22,52,95.0,'S'), lon: dmsParaDecimal(47,3,58.30,'W'), restricao: { fl: 200, tipo: "ABOVE"}},
                        {nome: "ORESU", lat: dmsParaDecimal(23,1 ,45.0,'S'), lon: dmsParaDecimal(47,9,35.0,'W'), restricao: { fl: 130, flMax: 170, tipo: "WINDOW" }},
                        {nome: "PRUMO", lat: dmsParaDecimal(23, 15, 10.10, 'S'), lon: dmsParaDecimal(47,  6, 19.99, 'W'), restricao: { fl: 120, tipo: "ABOVE" } },
                        {nome: "IROPU", lat: dmsParaDecimal(23, 25, 31.5, 'S'), lon: dmsParaDecimal(47,  4,  3.91, 'W'), restricao: { fl: 80, flMax: 90, tipo: "WINDOW" } },
                        {nome: "ENTIT", lat: dmsParaDecimal(22,25,5.0,'S'), lon: dmsParaDecimal(46,39,46.70,'W'), restricao: { fl: 270, tipo: "AT"}}
                    ],
                    linhas: [
                        ["UTLOT","RUSTE", "ORESU", "PRUMO", "IROPU", "LUVDI"],
                        ["ENTIT", "OTAGA", "NEKIG", "MAVKA", "SP031", "ORESU"]
                    ],
                    marcasMilhagem: [
                        {
                            pontoZero: "GERSU",
                            distancias: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110],
                            rota: ["UTLOT","RUSTE", "ORESU", "PRUMO", "IROPU", "LUVDI", "GERSU"]
                        },
                        {
                            pontoZero: "GERSU",
                            distancias: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110],
                            rota: ["ENTIT", "OTAGA", "NEKIG", "MAVKA", "SP031", "ORESU", "PRUMO", "IROPU", "LUVDI", "GERSU"]
                        }
                    ]
                }
            },
            AIC: {
                "RNPY17R": {
                    nome: "RNP 17",
                    cor: '#00ff7f',
                    fixos: [
                        { nome: "LUVDI", lat: dmsParaDecimal(23, 29, 35.90, 'S'), lon: dmsParaDecimal(46, 48, 21.77, 'W'), restricao: { fl:  55, tipo: "AT" } },
                        { nome: "KOMGU", lat: dmsParaDecimal(23, 33, 54.89, 'S'), lon: dmsParaDecimal(46, 49, 40.64, 'W'), restricao: { fl:  55, tipo: "AT" } },
                        { nome: "GERSU", lat: dmsParaDecimal(23, 30, 41.0, 'S'), lon: dmsParaDecimal(46, 44, 10.10, 'W'), restricao: { fl:  47, tipo: "AT" } },
                        { nome: "URUTA", lat: dmsParaDecimal(23, 33, 28.57, 'S'), lon: dmsParaDecimal(46, 42, 14.37, 'W'), restricao: { fl:  40, tipo: "AT" } },
                        { nome: "SP139", lat: dmsParaDecimal(23, 34, 59.83, 'S'), lon: dmsParaDecimal(46, 41, 11.34, 'W'), restricao: { fl:  36, tipo: "AT" }, papel: "FAF", isFAF: true },
                        { nome: "SP017", lat: dmsParaDecimal(23, 36, 15.89, 'S'), lon: dmsParaDecimal(46, 40, 18.81, 'W'), restricao: { fl:  32, tipo: "AT" }, papel: "SDF" }
                    ],
                    linhas: [
                        ["LUVDI", "GERSU", "URUTA", "SP139", "SP017"],
                        ["KOMGU", "GERSU", "URUTA", "SP139", "SP017"]
                    ]
                }
            },
            SID: {}
        },
        "35L": {
            STAR: {// =========================================================
                // ANISE 1A / IBDAL 2A - RWY 35L/35R
                // =========================================================
                "ANISE_1A": {
                    nome: "ANISE 1A - IBDAL 2A",
                    cor: '#ff9900',
                    fixos: [
                        { nome: "ANISE", lat: dmsParaDecimal(24, 36, 13.30, 'S'), lon: dmsParaDecimal(46, 37, 53.30, 'W'), restricao: { fl: 170, tipo: "ABOVE" } },
                        { nome: "SP091", lat: dmsParaDecimal(24, 23, 66.70, 'S'), lon: dmsParaDecimal(46, 37, 53.30, 'W'), restricao: { fl: 140, tipo: "ABOVE" } },
                        { nome: "SP111", lat: dmsParaDecimal(24, 13, 63.30, 'S'), lon: dmsParaDecimal(46, 37, 55.0, 'W') },
                        { nome: "IBDAL", lat: dmsParaDecimal(23, 45, 48.30, 'S'), lon: dmsParaDecimal(45, 13, 88.30, 'W') },
                        { nome: "MANLO", lat: dmsParaDecimal(23, 47, 81.70, 'S'), lon: dmsParaDecimal(45, 24, 48.30, 'W'), restricao: { fl: 190, tipo: "BELOW" } },
                        { nome: "SP033", lat: dmsParaDecimal(23, 50, 20.0, 'S'), lon: dmsParaDecimal(46, 12, 28.30, 'W') }
                        ],
                    linhas: [
                        ["IBDAL", "MANLO", "SP033","ESUNI"],
                        ["ANISE", "SP091","SP111","OGTAL"]
                    ]
                },

                // =========================================================
                // ORESU 1B - RWY 35L/35R
                // =========================================================
                "ORESU_1B": {
                    nome: "ORESU 1B",
                    cor: '#ff9900',
                    fixos: [
                        { nome: "ENTIT", lat: dmsParaDecimal(22, 25, 5.0, 'S'), lon: dmsParaDecimal(46, 39, 46.70, 'W'), restricao: { fl: 270, tipo: "AT" } },
                        { nome: "NEKIG", lat: dmsParaDecimal(22, 33, 18.30, 'S'), lon: dmsParaDecimal(46, 47, 66.70, 'W'), restricao: { fl: 230, tipo: "AT" } },
                        { nome: "MAVKA", lat: dmsParaDecimal(22, 40, 53.30, 'S'), lon: dmsParaDecimal(46, 55, 11.70, 'W') },
                        { nome: "UTLOT", lat: dmsParaDecimal(22, 28, 43.30, 'S'), lon: dmsParaDecimal(47, 53, 53.30, 'W') },
                        { nome: "RUSTE", lat: dmsParaDecimal(22, 46, 8.30, 'S'), lon: dmsParaDecimal(47, 30, 0, 'W'), restricao: { fl: 200, flMax: 240, tipo: "WINDOW" } },
                        { nome: "SP031", lat: dmsParaDecimal(22, 52, 95.0, 'S'), lon: dmsParaDecimal(47, 3, 58.30, 'W'), restricao: { fl: 200, tipo: "AT" } },
                        { nome: "ORESU", lat: dmsParaDecimal(23, 1, 45.0, 'S'), lon: dmsParaDecimal(47, 9, 35.0, 'W'), restricao: { fl: 130, flMax: 170, tipo: "WINDOW" } },
                        { nome: "PRUMO", lat: dmsParaDecimal(23, 15, 16.70, 'S'), lon: dmsParaDecimal(47, 6, 31.70, 'W'), restricao: { fl: 120, tipo: "AT" } },
                        { nome: "IROPU", lat: dmsParaDecimal(23, 25, 51.70, 'S'), lon: dmsParaDecimal(47, 4, 5.0, 'W') },
                        { nome: "KOMGU", lat: dmsParaDecimal(23, 33, 54.89, 'S'), lon: dmsParaDecimal(46, 49, 40.64, 'W'), restricao: { fl:  90, tipo: "AT" } },                     
                        { nome: "SP098", lat: dmsParaDecimal(23, 38, 18.92, 'S'), lon: dmsParaDecimal(46, 46, 37.85, 'W'), restricao: { fl:  90, tipo: "AT" }},
                       
                    ],
                    linhas: [
                        ["ENTIT", "NEKIG", "MAVKA", "SP031", "ORESU", "PRUMO", "IROPU", "KOMGU", "SP098","OGTAL"],
                        ["UTLOT", "RUSTE", "ORESU"]
                    ]
                }
            },
            AIC: {
                    "RNPZ35L": {
                    nome: "RNP 35",
                    cor: '#00ff7f',
                    fixos: [
                        { nome: "OGTAL", lat: dmsParaDecimal(23, 51, 23.29, 'S'), lon: dmsParaDecimal(46, 37, 33.47, 'W'), restricao: { fl: 60, tipo: "AT" },papel: "IAF" },
                        {nome: "ESUNI", lat: dmsParaDecimal(23,51,25.00,'S'), lon: dmsParaDecimal(46,27,16.70,'W'), restricao: { fl: 60, tipo: "AT"},papel: "IAF"},
                        {nome: "USITO", lat: dmsParaDecimal(23,47,65.00,'S'), lon: dmsParaDecimal(46,32,10,'W'), restricao: { fl: "53", tipo: "AT"},papel: "IF"},
                        {nome: "SURBU", lat: dmsParaDecimal(23,42,30.00,'S'), lon: dmsParaDecimal(46,36,0,'W'), restricao: { fl: 42, tipo: "AT"},papel: "FAF",isFAF: true},
                        {nome: "RW35L", lat: dmsParaDecimal(23,38,5.00,'S'), lon: dmsParaDecimal(46,39,6.70,'W'), restricao: { fl: 26, tipo: "AT"}, papel: "MAPT", isThreshold: true}

                    ],
                    linhas: [
                        ["OGTAL","USITO"],
                        ["ESUNI","USITO"],
                        ["USITO","SURBU","RW35L"]
                    ]
                }
            },
            SID: {}
        }
    },
    "SBGR": {
        "10R": {
            STAR: {
                // =========================================================
                // VUNOX 1A - RWY 10R
                // =========================================================
                "VUNOX_1A": {
                    nome: "VUNOX 1A",
                    cor: '#fbff00',
                    fixos: [
                        {
                            nome: "VUNOX",
                            lat: dmsParaDecimal(22, 19, 6.70, 'S'),
                            lon: dmsParaDecimal(46, 12, 78.30, 'W'),
                            restricao: { fl: 220, tipo: "BELOW" }
                        },
                        {
                            nome: "GR259",
                            lat: dmsParaDecimal(22, 32, 63.30, 'S'),
                            lon: dmsParaDecimal(46, 14, 88.30, 'W'),
                            restricao: { fl: 180, tipo: "BELOW" }
                        },
                        {
                            nome: "GR262",
                            lat: dmsParaDecimal(22, 46, 96.70, 'S'),
                            lon: dmsParaDecimal(46, 17, 11.70, 'W'),
                            restricao: { fl: 160, tipo: "BELOW" }
                        },
                        {
                            nome: "GR263",
                            lat: dmsParaDecimal(22, 52, 63.30, 'S'),
                            lon: dmsParaDecimal(46, 20, 86.70, 'W'),
                            restricao: { fl: 150, tipo: "AT" }
                        },
                        {
                            nome: "GR264",
                            lat: dmsParaDecimal(22, 50, 51.70, 'S'),
                            lon: dmsParaDecimal(46, 25, 96.70, 'W')
                        },
                        {
                            nome: "GR266",
                            lat: dmsParaDecimal(22, 49, 60.00, 'S'),
                            lon: dmsParaDecimal(46, 32, 16.70, 'W')
                        },
                        {
                            nome: "GR267",
                            lat: dmsParaDecimal(22, 49, 98.30, 'S'),
                            lon: dmsParaDecimal(46, 37, 56.70, 'W')
                        },
                        {
                            nome: "GR268",
                            lat: dmsParaDecimal(22, 51, 60.00, 'S'),
                            lon: dmsParaDecimal(46, 43, 15.00, 'W')
                        },
                        {
                            nome: "GR271",
                            lat: dmsParaDecimal(22, 54, 78.30, 'S'),
                            lon: dmsParaDecimal(46, 48, 66.70, 'W'),
                            restricao: { fl: 150, tipo: "AT" }
                        },
                        {
                            nome: "SANPA",
                            lat: dmsParaDecimal(23, 12, 50.00, 'S'),
                            lon: dmsParaDecimal(46, 32, 98.30, 'W'),
                            restricao: {
                                fl: 80,
                                flMax: 90,
                                tipo: "WINDOW"
                            }
                        },
                        {
                            nome: "GR283",
                            lat: dmsParaDecimal(23, 15, 85.00, 'S'),
                            lon: dmsParaDecimal(46, 35, 36.70, 'W'),
                            restricao: { fl: 80, tipo: "BELOW" }
                        }
                    ],
                    linhas: [
                        [
                            "VUNOX",
                            "GR259",
                            "GR262",
                            "GR263",
                            "GR264",
                            "GR266",
                            "GR267",
                            "GR268",
                            "GR271",
                            "SANPA",
                            "GR283",
                            "LOMEN"
                        ]
                    ],
                    marcasMilhagem: [
                        {
                            pontoZero: "GR283",
                            distancias: [10, 20, 30],
                            rota: [
                                "GR266",
                                "GR267",
                                "GR268",
                                "GR271",
                                "SANPA",
                                "GR283",
                                "LOMEN"
                            ]
                        },
                        {
                            pontoZero: "GR263",
                            distancias: [10, 20, 30, 40, 50],
                            textos: [40, 50, 60, 70, 80],
                            rota: [
                                "VUNOX",
                                "GR259",
                                "GR262",
                                "GR263",
                                "GR264",
                                "GR266",
                                "GR267",
                                "GR268",
                                "GR271",
                                "SANPA",
                                "GR283",
                                "LOMEN"
                            ]
                        }
                    ]
                },

                // =========================================================
                // EDMUS 2A - RWY 10R
                // =========================================================
                "EDMUS_2A": {
                    nome: "EDMUS 2A",
                    cor: '#fbff00',
                    fixos: [
                        {
                            nome: "EDMUS",
                            lat: dmsParaDecimal(23, 11, 35.00, 'S'),
                            lon: dmsParaDecimal(45, 23, 15.00, 'W'),
                            restricao: { fl: 260, tipo: "BELOW" }
                        },
                        {
                            nome: "NIBVO",
                            lat: dmsParaDecimal(23, 13, 60.00, 'S'),
                            lon: dmsParaDecimal(45, 33, 35.00, 'W')
                        },
                        {
                            nome: "POLYP",
                            lat: dmsParaDecimal(23, 19, 40.00, 'S'),
                            lon: dmsParaDecimal(45, 54, 38.30, 'W'),
                            restricao: { fl: 150, tipo: "BELOW" }
                        },
                        {
                            nome: "GR284",
                            lat: dmsParaDecimal(23, 26, 15.00, 'S'),
                            lon: dmsParaDecimal(46, 18, 31.70, 'W'),
                            restricao: { fl: 110, tipo: "ABOVE" }
                        },
                        {
                            nome: "GR286",
                            lat: dmsParaDecimal(23, 20, 26.70, 'S'),
                            lon: dmsParaDecimal(46, 28, 8.30, 'W'),
                            restricao: { fl: 110, tipo: "AT" }
                        },
                        {
                            nome: "GR283",
                            lat: dmsParaDecimal(23, 15, 85.00, 'S'),
                            lon: dmsParaDecimal(46, 35, 36.70, 'W'),
                            restricao: { fl: 100, tipo: "AT" }
                        },
                        {
                            nome: "GR287",
                            lat: dmsParaDecimal(23, 13, 96.70, 'S'),
                            lon: dmsParaDecimal(46, 41, 46.70, 'W'),
                            restricao: { fl: 90, tipo: "BELOW" }
                        },
                        {
                            nome: "GR288",
                            lat: dmsParaDecimal(23, 15, 15.00, 'S'),
                            lon: dmsParaDecimal(46, 47, 88.30, 'W'),
                            restricao: {
                                fl: 70,
                                flMax: 80,
                                tipo: "WINDOW"
                            }
                        },
                        {
                            nome: "GR289",
                            lat: dmsParaDecimal(23, 19, 20.00, 'S'),
                            lon: dmsParaDecimal(46, 52, 85.00, 'W'),
                            restricao: { fl: 70, tipo: "BELOW" }
                        }
                    ],
                    linhas: [
                        [
                            "EDMUS",
                            "NIBVO",
                            "POLYP",
                            "GR284",
                            "GR286",
                            "GR283",
                            "GR287",
                            "GR288",
                            "GR289",
                            "LOMEN"
                        ]
                    ],
                    marcasMilhagem: [
                        {
                            pontoZero: "GR283",
                            distancias: [10, 20, 30, 40, 50, 60, 70, 80],
                            rota: [
                                "EDMUS",
                                "NIBVO",
                                "POLYP",
                                "GR284",
                                "GR286",
                                "GR283"
                            ]
                        }
                    ]
                },

                // =========================================================
                // MOLLE 1A - RWY 10R
                // =========================================================
                "MOLLE_1A": {
                    nome: "MOLLE 1A",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "BUXUK", lat: dmsParaDecimal(23, 45, 83.30, 'S'), lon: dmsParaDecimal(47, 48, 95.0, 'W') },
                        { nome: "GR071", lat: dmsParaDecimal(23, 39, 0.0, 'S'), lon: dmsParaDecimal(47, 41, 75.0, 'W'), restricao: { fl: 270, tipo: "BELOW" } },
                        { nome: "GR072", lat: dmsParaDecimal(23, 23, 10.0, 'S'), lon: dmsParaDecimal(47, 25, 6.70, 'W'), restricao: { fl: 230, tipo: "BELOW" } },
                        { nome: "ZARES", lat: dmsParaDecimal(22, 45, 96.70, 'S'), lon: dmsParaDecimal(47, 57, 26.70, 'W') },
                        { nome: "GR073", lat: dmsParaDecimal(22, 49, 25.0, 'S'), lon: dmsParaDecimal(47, 50, 48.30, 'W'), restricao: { fl: 270, tipo: "BELOW" } },
                        { nome: "GR327", lat: dmsParaDecimal(22, 59, 66.0, 'S'), lon: dmsParaDecimal(47, 28, 92.0, 'W'), restricao: { fl: 240, tipo: "ABOVE" } },
                        { nome: "GR074", lat: dmsParaDecimal(23, 2, 35.0, 'S'), lon: dmsParaDecimal(47, 23, 38.30, 'W'), restricao: { fl: 230, tipo: "BELOW" } },
                        { nome: "MOLLE", lat: dmsParaDecimal(23, 8, 74.0, 'S'), lon: dmsParaDecimal(47, 10, 0.10, 'W'), restricao: { fl: 210, tipo: "ABOVE" } },
                        { nome: "GR249", lat: dmsParaDecimal(23, 4, 31.70, 'S'), lon: dmsParaDecimal(47, 4, 88.30, 'W'), restricao: { fl: 190, tipo: "ABOVE" } },
                        { nome: "GR076", lat: dmsParaDecimal(22, 58, 45.0, 'S'), lon: dmsParaDecimal(46, 57, 98.30, 'W'), restricao: { fl: 160, tipo: "ABOVE" } },
                        { nome: "GR077", lat: dmsParaDecimal(22, 54, 18.30, 'S'), lon: dmsParaDecimal(46, 52, 96.70, 'W'), restricao: { fl: 140, tipo: "AT" } },
                        { nome: "GR252", lat: dmsParaDecimal(22, 52, 8.30, 'S'), lon: dmsParaDecimal(46, 50, 50.0, 'W'), restricao: { fl: 140, tipo: "AT" } },
                        { nome: "GR272", lat: dmsParaDecimal(22, 48, 76.70, 'S'), lon: dmsParaDecimal(46, 43, 93.30, 'W') },
                        { nome: "GR273", lat: dmsParaDecimal(22, 47, 6.70, 'S'), lon: dmsParaDecimal(46, 37, 70.0, 'W') },
                        { nome: "GR274", lat: dmsParaDecimal(22, 46, 70.0, 'S'), lon: dmsParaDecimal(46, 31, 21.70, 'W') },
                        { nome: "GR276", lat: dmsParaDecimal(22, 47, 70.0, 'S'), lon: dmsParaDecimal(46, 24, 80.0, 'W') },
                        { nome: "GR277", lat: dmsParaDecimal(22, 50, 40.0, 'S'), lon: dmsParaDecimal(46, 18, 33.30, 'W'), restricao: { fl: 140, tipo: "AT" } },
                        { nome: "SANPA", lat: dmsParaDecimal(23, 12, 50.0, 'S'), lon: dmsParaDecimal(46, 32, 98.30, 'W'), restricao: { fl: 80, flMax: 90, tipo: "WINDOW" } },
                        { nome: "GR283", lat: dmsParaDecimal(23, 15, 85.0, 'S'), lon: dmsParaDecimal(46, 35, 36.70, 'W'), restricao: { fl: 80, tipo: "BELOW" } }
                    ],
                    linhas: [
                        ["BUXUK", "GR071", "GR072", "MOLLE"],
                        ["ZARES", "GR073", "GR327", "GR074", "MOLLE"],
                        ["MOLLE", "GR249", "GR076", "GR077", "GR252", "GR272", "GR273", "GR274", "GR276", "GR277", "SANPA", "GR283", "LOMEN"]
                    ],
                    marcasMilhagem: [
                        {
                            pontoZero: "GR283",
                            distancias: [10, 20, 30],
                            rota: ["GR276","GR277", "SANPA", "GR283", "LOMEN"]
                        },
                        {
                            pontoZero: "GR252",
                            distancias: [10, 20, 30, 40, 50, 60, 70, 80],
                            textos: [50, 60, 70, 80, 90, 100, 110, 120],
                            rota: ["BUXUK", "GR071", "GR072","MOLLE", "GR249", "GR076", "GR077", "GR252"]
                        },
                        {
                            pontoZero: "GR252",
                            distancias: [10, 20, 30, 40, 50, 60, 70, 80],
                            textos: [50, 60, 70, 80, 90, 100, 110, 120],
                            rota: ["ZARES", "GR073", "GR327", "GR074","MOLLE", "GR249", "GR076", "GR077", "GR252"]
                        }
                    ]
                }
            },
            IAC: {
                "ILS10R": {
                    nome: "ILS RWY 10R",
                    cor: '#00ff7f',
                    fixos: [
                        { nome: "LOMEN", lat: dmsParaDecimal(23, 25, 36.86, 'S'), lon: dmsParaDecimal(46, 42, 17.85, 'W'), restricao: { fl: 60, tipo: "AT" } },
                        { nome: "GR202", lat: dmsParaDecimal(23, 27, 5.79, 'S'), lon: dmsParaDecimal(46, 39, 56.15, 'W'), restricao: { fl: 51, tipo: "AT" } },
                        { nome: "LUTPO", lat: dmsParaDecimal(23, 28, 34.68, 'S'), lon: dmsParaDecimal(46, 37, 34.40, 'W'), restricao: { fl: 45, tipo: "AT" } },
                        { nome: "OPSER", lat: dmsParaDecimal(23, 27, 44.10, 'S'), lon: dmsParaDecimal(46, 34, 26.45, 'W'), restricao: { fl: 41, tipo: "AT" }, papel: "FAF", isFAF: true },
                        { nome: "RW10R", lat: dmsParaDecimal(23, 26, 19.67, 'S'), lon: dmsParaDecimal(46, 29, 13.30, 'W'), restricao: { fl: 25, tipo: "AT" }, papel: "MAPT", isThreshold: true }
                    ],
                    linhas: [
                        ["LOMEN", "GR202", "LUTPO", "OPSER", "RW10R"]
                    ]
                },
                
            },
            AIC: {},
            SID: {}
        },
        "10L": {
            SID: {}
        },
        "28L": {
            STAR: { // =========================================================
                // VUNOX 1C - RWY 28L/28R
                // =========================================================
                "VUNOX_1C": {
                    nome: "VUNOX 1C",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "VUNOX", lat: dmsParaDecimal(22, 19, 6.70, 'S'), lon: dmsParaDecimal(46, 12, 78.30, 'W'), restricao: { fl: 220, tipo: "AT" } },
                        { nome: "GR259", lat: dmsParaDecimal(22, 32, 63.30, 'S'), lon: dmsParaDecimal(46, 14, 88.30, 'W'), restricao: { fl: 180, tipo: "AT" } },
                        { nome: "GR262", lat: dmsParaDecimal(22, 46, 96.70, 'S'), lon: dmsParaDecimal(46, 17, 11.70, 'W'), restricao: { fl: 160, tipo: "AT" } },
                        { nome: "GR263", lat: dmsParaDecimal(22, 52, 63.30, 'S'), lon: dmsParaDecimal(46, 20, 86.70, 'W'), restricao: { fl: 150, tipo: "AT" } },
                        { nome: "GR264", lat: dmsParaDecimal(22, 50, 51.70, 'S'), lon: dmsParaDecimal(46, 25, 96.70, 'W') },
                        { nome: "GR266", lat: dmsParaDecimal(22, 49, 60.0, 'S'), lon: dmsParaDecimal(46, 32, 16.70, 'W') },
                        { nome: "GR267", lat: dmsParaDecimal(22, 49, 98.30, 'S'), lon: dmsParaDecimal(46, 37, 56.70, 'W') },
                        { nome: "GR268", lat: dmsParaDecimal(22, 51, 60.0, 'S'), lon: dmsParaDecimal(46, 43, 15.0, 'W') },
                        { nome: "GR271", lat: dmsParaDecimal(22, 54, 78.30, 'S'), lon: dmsParaDecimal(46, 48, 66.70, 'W'), restricao: { fl: 150, tipo: "AT" } },
                        { nome: "SANPA", lat: dmsParaDecimal(23, 12, 50.0, 'S'), lon: dmsParaDecimal(46, 32, 98.30, 'W'), restricao: { fl: 90, flMax: 100, tipo: "WINDOW" } },
                        { nome: "GR253", lat: dmsParaDecimal(23, 16, 11.70, 'S'), lon: dmsParaDecimal(46, 26, 60.0, 'W') },
                        { nome: "GR254", lat: dmsParaDecimal(23, 16, 23.30, 'S'), lon: dmsParaDecimal(46, 18, 38.30, 'W') },
                        { nome: "UTKUG", lat: dmsParaDecimal(23, 18, 6.70, 'S'), lon: dmsParaDecimal(46, 14, 51.70, 'W'), restricao: { fl: 60, tipo: "AT" } }
                    ],
                    linhas: [
                        ["VUNOX", "GR259", "GR262", "GR263", "GR264", "GR266", "GR267", "GR268", "GR271", "SANPA", "GR253", "GR254", "UTKUG"]
                    ]
                },

                // =========================================================
                // EDMUS 1B - RWY 28L/28R
                // =========================================================
                "EDMUS_1B": {
                    nome: "EDMUS 1B",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "EDMUS", lat: dmsParaDecimal(23, 11, 35.0, 'S'), lon: dmsParaDecimal(45, 23, 15.0, 'W'), restricao: { fl: 170, tipo: "AT" } },
                        { nome: "NIBVO", lat: dmsParaDecimal(23, 13, 60.0, 'S'), lon: dmsParaDecimal(45, 33, 35.0, 'W'), restricao: { fl: 150, tipo: "BELOW" } },
                        { nome: "POLYP", lat: dmsParaDecimal(23, 19, 40.0, 'S'), lon: dmsParaDecimal(45, 54, 38.30, 'W') },
                        { nome: "GR282", lat: dmsParaDecimal(23, 8, 61.70, 'S'), lon: dmsParaDecimal(46, 9, 25.0, 'W'), restricao: { fl: 80, tipo: "AT" } },
                        { nome: "GR278", lat: dmsParaDecimal(23, 20, 71.70, 'S'), lon: dmsParaDecimal(45, 59, 16.70, 'W'), restricao: { fl: 90, tipo: "AT" } },
                        {nome: "GR281", lat: dmsParaDecimal(23,10,93.30,'S'), lon: dmsParaDecimal(46, 4,38.30,'W')},
                        {nome: "GR279", lat: dmsParaDecimal(23,15,45,'S'), lon: dmsParaDecimal(46, 0 ,93.30,'W')},
                        { nome: "UTKUG", lat: dmsParaDecimal(23, 18, 6.70, 'S'), lon: dmsParaDecimal(46, 14, 51.70, 'W'), restricao: { fl: 60, tipo: "AT" } }
                    ],
                    linhas: [
                        ["EDMUS", "NIBVO", "POLYP", "GR278", "GR279", "GR281", "GR282", "UTKUG"]
                    ]
                },

                // =========================================================
                // MOLLE 1B - RWY 28L/28R
                // =========================================================
                "MOLLE_1B": {
                    nome: "MOLLE 1B",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "ZARES", lat: dmsParaDecimal(22, 45, 96.70, 'S'), lon: dmsParaDecimal(47, 57, 26.70, 'W') },
                        { nome: "GR073", lat: dmsParaDecimal(22, 49, 25.0, 'S'), lon: dmsParaDecimal(47, 50, 48.30, 'W'), restricao: { fl: 270, tipo: "AT" } },
                        { nome: "GR327", lat: dmsParaDecimal(22, 59, 66.0, 'S'), lon: dmsParaDecimal(47, 28, 92.0, 'W'), restricao: { fl: 240, tipo: "AT" } },
                        { nome: "GR074", lat: dmsParaDecimal(23, 2, 35.0, 'S'), lon: dmsParaDecimal(47, 23, 38.30, 'W'), restricao: { fl: 230, tipo: "AT" } },
                        { nome: "BUXUK", lat: dmsParaDecimal(23, 45, 83.30, 'S'), lon: dmsParaDecimal(47, 48, 95.0, 'W') },
                        { nome: "GR071", lat: dmsParaDecimal(23, 39, 0.0, 'S'), lon: dmsParaDecimal(47, 41, 75.0, 'W'), restricao: { fl: 270, tipo: "AT" } },
                        { nome: "GR072", lat: dmsParaDecimal(23, 23, 10.0, 'S'), lon: dmsParaDecimal(47, 25, 6.70, 'W'), restricao: { fl: 230, tipo: "AT" } },
                        { nome: "MOLLE", lat: dmsParaDecimal(23, 8, 74.0, 'S'), lon: dmsParaDecimal(47, 10, 0.10, 'W') },
                        { nome: "GR249", lat: dmsParaDecimal(23, 4, 31.70, 'S'), lon: dmsParaDecimal(47, 4, 88.30, 'W'), restricao: { fl: 190, tipo: "AT" } },
                        { nome: "GR076", lat: dmsParaDecimal(22, 58, 45.0, 'S'), lon: dmsParaDecimal(46, 57, 98.30, 'W'), restricao: { fl: 160, tipo: "AT" } },
                        { nome: "GR077", lat: dmsParaDecimal(22, 54, 18.30, 'S'), lon: dmsParaDecimal(46, 52, 96.70, 'W'), restricao: { fl: 140, tipo: "AT" } },
                        { nome: "GR252", lat: dmsParaDecimal(22, 52, 8.30, 'S'), lon: dmsParaDecimal(46, 50, 50.0, 'W'), restricao: { fl: 140, tipo: "AT" } },
                        { nome: "GR272", lat: dmsParaDecimal(22, 48, 76.70, 'S'), lon: dmsParaDecimal(46, 43, 93.30, 'W') },
                        { nome: "GR273", lat: dmsParaDecimal(22, 47, 6.70, 'S'), lon: dmsParaDecimal(46, 37, 70.0, 'W') },
                        { nome: "GR274", lat: dmsParaDecimal(22, 46, 70.0, 'S'), lon: dmsParaDecimal(46, 31, 21.70, 'W') },
                        { nome: "GR276", lat: dmsParaDecimal(22, 47, 70.0, 'S'), lon: dmsParaDecimal(46, 24, 80.0, 'W') },
                        { nome: "GR277", lat: dmsParaDecimal(22, 50, 40.0, 'S'), lon: dmsParaDecimal(46, 18, 33.30, 'W'), restricao: { fl: 140, tipo: "AT" } },
                        { nome: "SANPA", lat: dmsParaDecimal(23, 12, 50.0, 'S'), lon: dmsParaDecimal(46, 32, 98.30, 'W'), restricao: { fl: 90, flMax: 100, tipo: "WINDOW" } }
                    ],
                    linhas: [
                        ["ZARES", "GR073", "GR327", "GR074", "MOLLE", "GR249", "GR076", "GR077", "GR252", "GR272", "GR273", "GR274", "GR276", "GR277", "SANPA"],
                        ["BUXUK", "GR071", "GR072", "MOLLE"]
                    ]
                }
            },
            IAC: {
                "ILS28L": {
                    nome: "ILS RWY 28L",
                    cor: '#00ff7f',
                    fixos: [
                        { nome: "UTKUG", lat: dmsParaDecimal(23, 18, 6.70, 'S'), lon: dmsParaDecimal(46, 14, 51.70, 'W'), restricao: { fl: 60, tipo: "AT" }, papel: "IAF" },
                        { nome: "ETIKO", lat: dmsParaDecimal(23, 23, 3.30, 'S'), lon: dmsParaDecimal(46, 17, 8.30, 'W'), restricao: { fl: 50, tipo: "AT" }, papel: "IF" },
                        { nome: "VUSNI", lat: dmsParaDecimal(23, 24, 45.00, 'S'), lon: dmsParaDecimal(46, 22, 30.00, 'W'), restricao: { fl: 40, tipo: "AT" }, papel: "FAF", isFAF: true },
                        { nome: "RW28L", lat: dmsParaDecimal(23, 25, 52.02, 'S'), lon: dmsParaDecimal(46, 27, 31.02, 'W'), restricao: { fl: 25, tipo: "AT" }, papel: "MAPT", isThreshold: true }
                    ],
                    linhas: [
                        ["UTKUG", "ETIKO", "VUSNI", "RW28L"]
                    ]
                }
            },
            AIC: {},
            SID: {}
        },
        "28R": {
            SID: {}
        }
    },
    "SBKP": {
        "15": {
            STAR: {
                // =========================================================
                // ITEDI 1A - RWY 15
                // =========================================================
                "ITEDI_1A": {
                    nome: "ITEDI 1A",
                    cor: '#54f161',
                    fixos: [
                        { nome: "EDMUS", lat: dmsParaDecimal(23, 11, 35.0, 'S'), lon: dmsParaDecimal(45, 23, 15.0, 'W') },
                        { nome: "NIBVO", lat: dmsParaDecimal(23, 13, 60.0, 'S'), lon: dmsParaDecimal(45, 33, 35.0, 'W') },
                        { nome: "KP153", lat: dmsParaDecimal(23, 22, 35.0, 'S'), lon: dmsParaDecimal(46, 4, 78.30, 'W'), restricao: { fl: 260, tipo: "BELOW" } },
                        { nome: "KP154", lat: dmsParaDecimal(23, 27, 46.70, 'S'), lon: dmsParaDecimal(46, 22, 98.30, 'W') },
                        { nome: "KP213", lat: dmsParaDecimal(23, 17, 43.30, 'S'), lon: dmsParaDecimal(46, 38, 40.0, 'W'), restricao: { fl: 140, tipo: "BELOW" } },
                        { nome: "KP212", lat: dmsParaDecimal(23, 14, 31.70, 'S'), lon: dmsParaDecimal(46, 41, 15.0, 'W'), restricao: { fl: 130, tipo: "BELOW" } },
                        { nome: "KP211", lat: dmsParaDecimal(23, 11, 20.0, 'S'), lon: dmsParaDecimal(46, 43, 88.30, 'W'), restricao: { fl: 120, tipo: "BELOW" } },
                        { nome: "KP208", lat: dmsParaDecimal(23, 1, 81.70, 'S'), lon: dmsParaDecimal(46, 52, 13.30, 'W') },
                        { nome: "KP209", lat: dmsParaDecimal(23, 1, 13.30, 'S'), lon: dmsParaDecimal(46, 56, 41.70, 'W'), restricao: { fl: 110, tipo: "ABOVE" } },
                        { nome: "KP207", lat: dmsParaDecimal(22, 55, 58.30, 'S'), lon: dmsParaDecimal(47, 4, 6.70, 'W'), restricao: { fl: 90, tipo: "BELOW" } },
                        { nome: "ENTIT", lat: dmsParaDecimal(22, 25, 5.0, 'S'), lon: dmsParaDecimal(46, 39, 46.70, 'W'), restricao: { fl: 190, tipo: "ABOVE" } },
                        { nome: "KP203", lat: dmsParaDecimal(22, 33, 93.30, 'S'), lon: dmsParaDecimal(46, 52, 3.30, 'W'), restricao: { fl: 110, tipo: "ABOVE" } },
                        { nome: "KP204", lat: dmsParaDecimal(22, 38, 80.0, 'S'), lon: dmsParaDecimal(46, 58, 93.30, 'W'), restricao: { fl: 90, tipo: "ABOVE" } }
                        
                    ],
                    linhas: [
                        ["EDMUS", "NIBVO", "KP153", "KP154", "KP213", "KP212", "KP211", "KP208", "KP209", "KP207", "ITEDI"],
                        ["ENTIT", "KP203", "KP204", "ITEDI"]
                    ]
                },

                // =========================================================
                // VERME 1A - RWY 15
                // =========================================================
                "VERME_1A": {
                    nome: "VERME 1A",
                    cor: '#54f161',
                    fixos: [
                        { nome: "GNOME", lat: dmsParaDecimal(23, 13, 38.30, 'S'), lon: dmsParaDecimal(47, 58, 91.70, 'W'), restricao: { fl: 160, flMax: 170, tipo: "WINDOW" } },
                        { nome: "EDRAT", lat: dmsParaDecimal(23, 50, 35.0, 'S'), lon: dmsParaDecimal(48, 18, 40.0, 'W') },
                        { nome: "KP219", lat: dmsParaDecimal(23, 17, 71.70, 'S'), lon: dmsParaDecimal(47, 53, 80.0, 'W'), restricao: { fl: 160, tipo: "BELOW" } },
                        { nome: "VERME", lat: dmsParaDecimal(23, 12, 53.30, 'S'), lon: dmsParaDecimal(47, 49, 91.70, 'W') },
                        { nome: "KP217", lat: dmsParaDecimal(23, 10, 8.30, 'S'), lon: dmsParaDecimal(47, 44, 88.30, 'W'), restricao: { fl: 120, tipo: "ABOVE" } },
                        { nome: "KP216", lat: dmsParaDecimal(23, 6, 26.70, 'S'), lon: dmsParaDecimal(47, 37, 10.0, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "KP214", lat: dmsParaDecimal(23, 2, 63.30, 'S'), lon: dmsParaDecimal(47, 29, 70.0, 'W'), restricao: { fl: 80, tipo: "ABOVE" } }
                        
                    ],
                    linhas: [
                        ["GNOME", "VERME", "KP217", "KP216", "KP214", "NILKA"],
                        ["EDRAT", "KP219", "VERME"]
                    ]
                },

                // =========================================================
                // UTLOT 3A - RWY 15
                // =========================================================
                "UTLOT_3A": {
                    nome: "UTLOT 3A",
                    cor: '#54f161',
                    fixos: [
                        { nome: "UTLOT", lat: dmsParaDecimal(22, 28, 43.30, 'S'), lon: dmsParaDecimal(47, 53, 53.30, 'W'), restricao: { fl: 160, tipo: "BELOW" } },
                        { nome: "KP201", lat: dmsParaDecimal(22, 42, 28.30, 'S'), lon: dmsParaDecimal(47, 35, 10.0, 'W') },
                        { nome: "NOBRE", lat: dmsParaDecimal(22, 50, 78.30, 'S'), lon: dmsParaDecimal(47, 21, 55.0, 'W'), restricao: { fl: 60, tipo: "BELOW" } }
                    ],
                    linhas: [
                        ["UTLOT", "KP201", "NOBRE"]
                    ]
                }
            },
            IAC: {
                "ILS15": {
                    nome: "ILS RWY 15",
                    cor: '#00ff7f',
                    fixos: [
                        {nome: "ATARA", lat: dmsParaDecimal(22,53,76.70,'S'), lon: dmsParaDecimal(47,17,38.30,'W'), restricao: { fl: 44, tipo: "AT"}, papel: "IF"},
                        { nome: "NILKA", lat: dmsParaDecimal(22, 58, 53.30, 'S'), lon: dmsParaDecimal(47, 21, 35.0, 'W'), restricao: { fl: 65, tipo: "AT" }, papel: "IAF" },
                        { nome: "SEBSU", lat: dmsParaDecimal(22,56,83.30,'S'), lon: dmsParaDecimal(47,13,10.00,'W'), restricao: { fl: 37, tipo: "AT"}, papel: "IAF"},
                        { nome: "ITEDI", lat: dmsParaDecimal(22, 48, 88.30, 'S'), lon: dmsParaDecimal(47, 13, 30.0, 'W'), restricao: { fl: 60, tipo: "AT" }, papel: "IAF" },
                        { nome: "RW15", lat: dmsParaDecimal(23, 0, 16.60, 'S'), lon: dmsParaDecimal(47, 9, 10.00, 'W'), restricao: { fl: 21, tipo: "AT" }, papel: "MAPT", isThreshold: true }
                    ],
                    linhas: [
                        ["ITEDI", "ATARA"],
                        ["NOBRE", "ATARA"],
                        ["NILKA", "ATARA"],
                        ["ATARA","SEBSU","RW15"]
                    ]
                }
            },
                        SID: {}
        },
        "33": {
            AIC: {},
            STAR: {
                // =========================================================
                // ENTIT 1A - RWY 33
                // =========================================================
                "ENTIT_1A": {
                    nome: "ENTIT 1A",
                    cor: '#45df5e',
                    fixos: [
                        { nome: "ENTIT", lat: dmsParaDecimal(22, 25, 5.0, 'S'), lon: dmsParaDecimal(46, 39, 46.70, 'W'), restricao: { fl: 220, tipo: "AT" } },
                        { nome: "KP204", lat: dmsParaDecimal(22, 38, 80.0, 'S'), lon: dmsParaDecimal(46, 58, 93.30, 'W'), restricao: { fl: 150, tipo: "AT" } },
                        { nome: "KP226", lat: dmsParaDecimal(22, 41, 96.70, 'S'), lon: dmsParaDecimal(47, 0, 58.30, 'W'), restricao: { fl: 140, tipo: "AT" } },
                        { nome: "KP227", lat: dmsParaDecimal(22, 53, 70.0, 'S'), lon: dmsParaDecimal(47, 6, 66.70, 'W'), restricao: { fl: 90, tipo: "AT" } },
                        { nome: "KP228", lat: dmsParaDecimal(22, 58, 3.30, 'S'), lon: dmsParaDecimal(47, 0, 68.30, 'W'), restricao: { fl: 80, tipo: "AT" } },
                        { nome: "KP209", lat: dmsParaDecimal(23, 1, 13.30, 'S'), lon: dmsParaDecimal(46, 56, 41.70, 'W'), restricao: { fl: 65, tipo: "AT" } }
                    ],
                    linhas: [
                        ["ENTIT", "KP204", "KP226", "KP227", "KP228", "KP209"]
                    ]
                },

                // =========================================================
                // EDMUS 1A - RWY 33
                // =========================================================
                "EDMUS_1A": {
                    nome: "EDMUS 1A",
                    cor: '#45df5e',
                    fixos: [
                        { nome: "EDMUS", lat: dmsParaDecimal(23, 11, 35.0, 'S'), lon: dmsParaDecimal(45, 23, 15.0, 'W'), restricao: { fl: 300, tipo: "AT" } },
                        { nome: "NIBVO", lat: dmsParaDecimal(23, 13, 60.0, 'S'), lon: dmsParaDecimal(45, 33, 35.0, 'W')},
                        { nome: "KP153", lat: dmsParaDecimal(23, 22, 35.0, 'S'), lon: dmsParaDecimal(46, 4, 78.30, 'W'), restricao: { fl: 230, tipo: "AT" } },
                        { nome: "KP154", lat: dmsParaDecimal(23, 27, 46.70, 'S'), lon: dmsParaDecimal(46, 22, 98.30, 'W'), restricao: { fl: 180, tipo: "AT" } },
                        { nome: "KP213", lat: dmsParaDecimal(23, 17, 43.30, 'S'), lon: dmsParaDecimal(46, 38, 40.0, 'W'), restricao: { fl: 120, tipo: "AT" } },
                        { nome: "KP231", lat: dmsParaDecimal(23, 11, 86.70, 'S'), lon: dmsParaDecimal(46, 43, 30.0, 'W'), restricao: { fl: 100, tipo: "AT" } }
                    ],
                    linhas: [
                        ["EDMUS", "NIBVO", "KP153", "KP154", "KP213", "KP231"]
                    ]
                },

                // =========================================================
                // UBKUP 2A - RWY 33
                // =========================================================
                "UBKUP_2A": {
                    nome: "UBKUP 2A",
                    cor: '#45df5e',
                    fixos: [
                        { nome: "UTLOT", lat: dmsParaDecimal(22, 28, 43.30, 'S'), lon: dmsParaDecimal(47, 53, 53.30, 'W') },
                        { nome: "KP201", lat: dmsParaDecimal(22, 42, 28.30, 'S'), lon: dmsParaDecimal(47, 35, 10.0, 'W'), restricao: { fl: 170, tipo: "AT" } },
                        { nome: "NILKA", lat: dmsParaDecimal(22, 58, 53.30, 'S'), lon: dmsParaDecimal(47, 21, 35.0, 'W'), restricao: { fl: 120, tipo: "AT" } },
                        { nome: "KP221", lat: dmsParaDecimal(23, 4, 86.70, 'S'), lon: dmsParaDecimal(47, 12, 53.30, 'W'), restricao: { fl: 90, tipo: "AT" } },
                        { nome: "KP222", lat: dmsParaDecimal(23, 7, 93.30, 'S'), lon: dmsParaDecimal(47, 8, 23.30, 'W'), restricao: { fl: 75, tipo: "AT" } },
                        { nome: "EDRAT", lat: dmsParaDecimal(23, 50, 35.0, 'S'), lon: dmsParaDecimal(48, 18, 40.0, 'W') },
                        { nome: "KP224", lat: dmsParaDecimal(23, 26, 81.70, 'S'), lon: dmsParaDecimal(47, 34, 40.0, 'W'), restricao: { fl: 120, tipo: "AT" } },
                        { nome: "KP223", lat: dmsParaDecimal(23, 21, 65.0, 'S'), lon: dmsParaDecimal(47, 24, 81.70, 'W'), restricao: { fl: 90, tipo: "AT" } },
                        { nome: "KP271", lat: dmsParaDecimal(23, 15, 48.30, 'S'), lon: dmsParaDecimal(47, 13, 41.70, 'W'), restricao: { fl: 80, tipo: "AT" } },
                        { nome: "UBKUP", lat: dmsParaDecimal(23, 10, 63.30, 'S'), lon: dmsParaDecimal(47, 4, 48.30, 'W'), restricao: { fl: 65, tipo: "AT" } }
                    ],
                    linhas: [
                        ["UTLOT", "KP201", "NILKA", "KP221", "KP222", "UBKUP"],
                        ["EDRAT", "KP224", "KP223", "KP271", "UBKUP"]
                    ]
                }
            },
            AIC: {
                "RNP X 33": {
                    nome: "RNP X 33",
                    cor: '#00ff7f',
                    fixos: [
                        {nome: "KP209", lat: dmsParaDecimal(23,1,13.30,'S'), lon: dmsParaDecimal(46,56,41.70,'W'), restricao: { fl: 65, tipo: "AT"},papel: "IAF"},
                        {nome: "KP191", lat: dmsParaDecimal(23,9,56.70,'S'), lon: dmsParaDecimal(46,55,30.00,'W'), restricao: { fl: 65, tipo: "AT"},papel: "IAF"},
                        {nome: "KP192", lat: dmsParaDecimal(23,7,71.70,'S'), lon: dmsParaDecimal(46,57,86.70,'W'), restricao: { fl: 57, tipo: "AT"}},
                        {nome: "UBKUP", lat: dmsParaDecimal(23,10,63.30,'S'), lon: dmsParaDecimal(47,4,48.30,'W'), restricao: { fl: 65, tipo: "AT"},papel: "IAF"},
                        {nome: "KP107", lat: dmsParaDecimal(23,5,88.30,'S'), lon: dmsParaDecimal(47,0,45.00,'W'), restricao: { fl: 44, tipo: "AT"},papel: "IF",},
                        {nome: "ARNIV", lat: dmsParaDecimal(23,4,5.00,'S'), lon: dmsParaDecimal(47,3,1.70,'W'), restricao: { fl: 36, tipo: "AT"},papel: "FAF", isFAF:true},
                        {nome: "RWY33", lat: dmsParaDecimal(23,0,95.00,'S'), lon: dmsParaDecimal(47,7,35.00,'W'), restricao: { fl: 22, tipo: "BELOW"}, papel: "MAPT", isThreshold: true }


                    ],
                    linhas: [
                        ["KP209","KP107"],
                        ["UBKUP","KP107"],
                        ["KP191", "KP192", "KP107"],
                        ["KP107", "ARNIV","RWY33"]
                    ]
                },},
            SID: {}
        }
    }
};