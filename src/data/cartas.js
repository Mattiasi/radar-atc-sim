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
                        { nome: "KOMGU", lat: dmsParaDecimal(23, 33, 54.89, 'S'), lon: dmsParaDecimal(46, 49, 40.64, 'W'), restricao: { fl:  55, tipo: "AT" } },
                        { nome: "ANISE", lat: dmsParaDecimal(24, 36, 13.3, 'S'), lon: dmsParaDecimal(46, 37, 53.3, 'W'), restricao: { fl: 230, tipo: "BELOW"  } },
                        { nome: "SP091", lat: dmsParaDecimal(24, 23, 66.7, 'S'), lon: dmsParaDecimal(46, 37, 53.3, 'W'), restricao: { fl: 200, tipo: "BELOW"  } },
                        { nome: "SP111", lat: dmsParaDecimal(24, 13, 63.3, 'S'), lon: dmsParaDecimal(46, 37, 55, 'W')  },
                        { nome: "IBDAL", lat: dmsParaDecimal(23, 45, 48.3, 'S'), lon: dmsParaDecimal(45, 13, 88.3, 'W')  },
                        { nome: "MANLO", lat: dmsParaDecimal(23, 47, 81.7, 'S'), lon: dmsParaDecimal(45, 24, 48.3, 'W'), restricao: { fl: 260, tipo: "BELOW"  } },
                        { nome: "SP033", lat: dmsParaDecimal(23, 50, 20, 'S'), lon: dmsParaDecimal(46, 12, 28.3, 'W')  }
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
                        { nome: "UTLOT", lat: dmsParaDecimal(22, 28, 43.3, 'S'), lon: dmsParaDecimal(47, 53, 53.3, 'W'), restricao: { fl: 280, tipo: "ABOVE" }},
                        { nome: "RUSTE", lat: dmsParaDecimal(22, 46, 8.3, 'S'), lon: dmsParaDecimal(47, 30, 0, 'W'), restricao: { fl: 200, flMax: 240, tipo: "WINDOW"  }},
                        { nome: "OTAGA", lat: dmsParaDecimal(22, 29, 40, 'S'), lon: dmsParaDecimal(46, 43, 86.7, 'W') },
                        { nome: "NEKIG", lat: dmsParaDecimal(22, 33, 18.3, 'S'), lon: dmsParaDecimal(46, 47, 66.7, 'W'), restricao: { fl: 230, tipo: "BELOW" }},
                        { nome: "MAVKA", lat: dmsParaDecimal(22, 40, 53.3, 'S'), lon: dmsParaDecimal(46, 55, 11.7, 'W') },
                        { nome: "SP031", lat: dmsParaDecimal(22, 52, 95, 'S'), lon: dmsParaDecimal(47, 3, 58.3, 'W'), restricao: { fl: 200, tipo: "ABOVE" }},
                        { nome: "ORESU", lat: dmsParaDecimal(23, 1, 45, 'S'), lon: dmsParaDecimal(47, 9, 35, 'W'), restricao: { fl: 130, flMax: 170, tipo: "WINDOW"  }},
                        { nome: "PRUMO", lat: dmsParaDecimal(23, 15, 16.7, 'S'), lon: dmsParaDecimal(47, 6, 31.7, 'W'), restricao: { fl: 120, tipo: "ABOVE"  } },
                        { nome: "IROPU", lat: dmsParaDecimal(23, 25, 51.7, 'S'), lon: dmsParaDecimal(47, 4, 5, 'W'), restricao: { fl: 80, flMax: 90, tipo: "WINDOW"  } },
                        { nome: "ENTIT", lat: dmsParaDecimal(22, 25, 5, 'S'), lon: dmsParaDecimal(46, 39, 46.7, 'W'), restricao: { fl: 270, tipo: "AT" }}
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
            SID: {
                "BAIAN_3A": {
                    nome: "BAIAN 3A",
                    cor: '#ff9900',
                    fixos: [
                        { nome: "RW35L", lat: dmsParaDecimal(23, 37, 59.81, 'S'),lon: dmsParaDecimal(46, 39, 6.99, 'W')},
                        { nome: "SP102", lat: dmsParaDecimal(23, 43, 25, 'S'), lon: dmsParaDecimal(46, 29, 55, 'W') },
                        { nome: "BAIAN", lat: dmsParaDecimal(23, 40, 11.7, 'S'), lon: dmsParaDecimal(46, 7, 70, 'W') },
                        { nome: "SP103", lat: dmsParaDecimal(23, 32, 48.3, 'S'), lon: dmsParaDecimal(46, 3, 45, 'W'), restricao: { fl: 140, tipo: "ABOVE" } },
                        { nome: "ISOXO", lat: dmsParaDecimal(23, 25, 86.7, 'S'), lon: dmsParaDecimal(45, 59, 76.7, 'W'), restricao: { fl: 170, tipo: "ABOVE" } },
                        { nome: "ORIMU", lat: dmsParaDecimal(23, 15, 83.3, 'S'), lon: dmsParaDecimal(45, 59, 41.7, 'W'), restricao: { fl: 220, tipo: "BELOW" } },
                        { nome: "VUMEV", lat: dmsParaDecimal(22, 53, 20, 'S'), lon: dmsParaDecimal(45, 58, 63.3, 'W') },
                        { nome: "NUXEL", lat: dmsParaDecimal(22, 16, 98.3, 'S'), lon: dmsParaDecimal(45, 49, 30, 'W') },
                        { nome: "NIBRU", lat: dmsParaDecimal(23, 34, 38.3, 'S'), lon: dmsParaDecimal(45, 28, 13.3, 'W') },
                        { nome: "UREMI", lat: dmsParaDecimal(23, 23, 33.3, 'S'), lon: dmsParaDecimal(45, 30, 76.7, 'W') }
                    ],
                    linhas: [
                        ["RW35L", "SP102", "BAIAN", "SP103", "ISOXO", "ORIMU", "VUMEV", "NUXEL"],
                        ["BAIAN", "NIBRU"],
                        ["BAIAN", "UREMI"]
                    ]
                },
                "UGTIX_2A": {
                    nome: "UGTIX 2A",
                    cor: '#ff9900',
                    fixos: [
                        { nome: "RW35L", lat: dmsParaDecimal(23, 37, 59.81, 'S'),lon: dmsParaDecimal(46, 39, 6.99, 'W')},
                        { nome: "SP104", lat: dmsParaDecimal(23, 44, 21.7, 'S'), lon: dmsParaDecimal(46, 38, 86.7, 'W') },
                        { nome: "SP106", lat: dmsParaDecimal(23, 47, 36.7, 'S'), lon: dmsParaDecimal(46, 44, 21.7, 'W'), restricao: { fl: 75, tipo: "BELOW" } },
                        { nome: "UTKOM", lat: dmsParaDecimal(23, 52, 56.7, 'S'), lon: dmsParaDecimal(46, 52, 73.3, 'W') },
                        { nome: "SP084", lat: dmsParaDecimal(23, 44, 46.7, 'S'), lon: dmsParaDecimal(47, 7, 66.7, 'W'), restricao: { fl: 100, tipo: "ABOVE" } },
                        { nome: "SP086", lat: dmsParaDecimal(23, 35, 43.3, 'S'), lon: dmsParaDecimal(47, 9, 65, 'W'), restricao: { fl: 130, tipo: "ABOVE" } },
                        { nome: "UGTIX", lat: dmsParaDecimal(23, 16, 86.7, 'S'), lon: dmsParaDecimal(47, 13, 71.7, 'W'), restricao: { fl: 240, tipo: "ABOVE" } },
                        { nome: "LESSA", lat: dmsParaDecimal(23, 10, 58.3, 'S'), lon: dmsParaDecimal(47, 37, 68.3, 'W') },
                        { nome: "VURDU", lat: dmsParaDecimal(23, 9, 70, 'S'), lon: dmsParaDecimal(48, 0, 90, 'W') },
                        { nome: "EGEVA", lat: dmsParaDecimal(23, 8, 38.3, 'S'), lon: dmsParaDecimal(48, 33, 68.3, 'W') },
                        { nome: "ASETA", lat: dmsParaDecimal(23, 17, 13.3, 'S'), lon: dmsParaDecimal(48, 5, 73.3, 'W') },
                        { nome: "SP087", lat: dmsParaDecimal(23, 8, 98.3, 'S'), lon: dmsParaDecimal(47, 15, 43.3, 'W'), restricao: { fl: 250, tipo: "ABOVE" } },
                        { nome: "SP088", lat: dmsParaDecimal(22, 40, 23.3, 'S'), lon: dmsParaDecimal(47, 21, 66.7, 'W') },
                        { nome: "GERTU", lat: dmsParaDecimal(22, 25, 80, 'S'), lon: dmsParaDecimal(47, 33, 73.3, 'W') }
                    ],
                    linhas: [
                        ["RW35L", "SP104", "SP106", "UTKOM", "SP084", "SP086", "UGTIX", "LESSA", "VURDU", "EGEVA"],
                        ["LESSA", "ASETA"],
                        ["UGTIX", "SP087", "SP088", "GERTU"]
                    ]
                },
                "UBRAM_1A": {
                    nome: "UBRAM 1A",
                    cor: '#ff9900',
                    fixos: [
                         { nome: "RW35L", lat: dmsParaDecimal(23, 37, 59.81, 'S'),lon: dmsParaDecimal(46, 39, 6.99, 'W')},
                        { nome: "SP053", lat: dmsParaDecimal(23, 41, 45, 'S'), lon: dmsParaDecimal(46, 40, 48.3, 'W') },
                        { nome: "SP081", lat: dmsParaDecimal(23, 43, 66.7, 'S'), lon: dmsParaDecimal(46, 48, 98.3, 'W') },
                        { nome: "SP066", lat: dmsParaDecimal(23, 45, 5, 'S'), lon: dmsParaDecimal(46, 54, 21.7, 'W') },
                        { nome: "SP039", lat: dmsParaDecimal(23, 41, 93.3, 'S'), lon: dmsParaDecimal(47, 2, 26.7, 'W'), restricao: { fl: 80, tipo: "ABOVE" } },
                        { nome: "SP038", lat: dmsParaDecimal(23, 37, 46.7, 'S'), lon: dmsParaDecimal(47, 13, 80, 'W') },
                        { nome: "XOGOD", lat: dmsParaDecimal(23, 31, 58.3, 'S'), lon: dmsParaDecimal(47, 28, 93.3, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "UMRAR", lat: dmsParaDecimal(23, 28, 5, 'S'), lon: dmsParaDecimal(47, 41, 46.7, 'W'), restricao: { fl: 110, tipo: "BELOW" } },
                        { nome: "UBRAM", lat: dmsParaDecimal(23, 26, 73.3, 'S'), lon: dmsParaDecimal(47, 46, 15, 'W'), restricao: { fl: 120, tipo: "ABOVE" } },
                        { nome: "ASETA", lat: dmsParaDecimal(23, 17, 13.3, 'S'), lon: dmsParaDecimal(48, 5, 73.3, 'W') },
                        { nome: "EGEVA", lat: dmsParaDecimal(23, 8, 38.3, 'S'), lon: dmsParaDecimal(48, 33, 68.3, 'W') }
                    ],
                    linhas: [
                        ["RW35L", "SP053", "SP081", "SP066", "SP039", "SP038", "XOGOD", "UMRAR", "UBRAM", "ASETA", "EGEVA"]
                    ]
                },
                "UTKOM_1A": {
                    nome: "UTKOM 1A",
                    cor: '#ff9900',
                    fixos: [
                         { nome: "RW35L", lat: dmsParaDecimal(23, 37, 59.81, 'S'),lon: dmsParaDecimal(46, 39, 6.99, 'W')},
                        { nome: "SP104", lat: dmsParaDecimal(23, 44, 21.7, 'S'), lon: dmsParaDecimal(46, 38, 86.7, 'W') },
                        { nome: "SP106", lat: dmsParaDecimal(23, 47, 36.7, 'S'), lon: dmsParaDecimal(46, 44, 21.7, 'W'), restricao: { fl: 75, tipo: "BELOW" } },
                        { nome: "UTKOM", lat: dmsParaDecimal(23, 52, 56.7, 'S'), lon: dmsParaDecimal(46, 52, 73.3, 'W') },
                        { nome: "MADNI", lat: dmsParaDecimal(24, 36, 43.3, 'S'), lon: dmsParaDecimal(47, 0, 53.3, 'W') },
                        { nome: "UBSOD", lat: dmsParaDecimal(24, 15, 70, 'S'), lon: dmsParaDecimal(47, 8, 65, 'W') },
                        { nome: "NIBGA", lat: dmsParaDecimal(24, 4, 71.7, 'S'), lon: dmsParaDecimal(47, 14, 36.7, 'W') },
                        { nome: "SOVSI", lat: dmsParaDecimal(24, 6, 31.7, 'S'), lon: dmsParaDecimal(47, 28, 31.7, 'W') }
                    ],
                    linhas: [
                        ["RW35L", "SP104", "SP106", "UTKOM", "MADNI"],
                        ["UTKOM", "UBSOD"],
                        ["UTKOM", "NIBGA"],
                        ["UTKOM", "SOVSI"]
                    ]
                }
            }
        },
        "35L": {
            STAR: {// =========================================================
                // ANISE 1A / IBDAL 2A - RWY 35L/35R
                // =========================================================
                "ANISE_1A": {
                    nome: "ANISE 1A - IBDAL 2A",
                    cor: '#ff9900',
                    fixos: [
                        { nome: "ANISE", lat: dmsParaDecimal(24, 36, 13.3, 'S'), lon: dmsParaDecimal(46, 37, 53.3, 'W'), restricao: { fl: 170, tipo: "ABOVE"  } },
                        { nome: "SP091", lat: dmsParaDecimal(24, 23, 66.7, 'S'), lon: dmsParaDecimal(46, 37, 53.3, 'W'), restricao: { fl: 140, tipo: "ABOVE"  } },
                        { nome: "SP111", lat: dmsParaDecimal(24, 13, 63.3, 'S'), lon: dmsParaDecimal(46, 37, 55, 'W')  },
                        { nome: "IBDAL", lat: dmsParaDecimal(23, 45, 48.3, 'S'), lon: dmsParaDecimal(45, 13, 88.3, 'W')  },
                        { nome: "MANLO", lat: dmsParaDecimal(23, 47, 81.7, 'S'), lon: dmsParaDecimal(45, 24, 48.3, 'W'), restricao: { fl: 190, tipo: "BELOW"  } },
                        { nome: "SP033", lat: dmsParaDecimal(23, 50, 20, 'S'), lon: dmsParaDecimal(46, 12, 28.3, 'W')  }
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
                        { nome: "ENTIT", lat: dmsParaDecimal(22, 25, 5, 'S'), lon: dmsParaDecimal(46, 39, 46.7, 'W'), restricao: { fl: 270, tipo: "AT"  } },
                        { nome: "NEKIG", lat: dmsParaDecimal(22, 33, 18.3, 'S'), lon: dmsParaDecimal(46, 47, 66.7, 'W'), restricao: { fl: 230, tipo: "AT"  } },
                        { nome: "MAVKA", lat: dmsParaDecimal(22, 40, 53.3, 'S'), lon: dmsParaDecimal(46, 55, 11.7, 'W')  },
                        { nome: "UTLOT", lat: dmsParaDecimal(22, 28, 43.3, 'S'), lon: dmsParaDecimal(47, 53, 53.3, 'W')  },
                        { nome: "RUSTE", lat: dmsParaDecimal(22, 46, 8.3, 'S'), lon: dmsParaDecimal(47, 30, 0, 'W'), restricao: { fl: 200, flMax: 240, tipo: "WINDOW"  } },
                        { nome: "SP031", lat: dmsParaDecimal(22, 52, 95, 'S'), lon: dmsParaDecimal(47, 3, 58.3, 'W'), restricao: { fl: 200, tipo: "AT"  } },
                        { nome: "ORESU", lat: dmsParaDecimal(23, 1, 45, 'S'), lon: dmsParaDecimal(47, 9, 35, 'W'), restricao: { fl: 130, flMax: 170, tipo: "WINDOW"  } },
                        { nome: "PRUMO", lat: dmsParaDecimal(23, 15, 16.7, 'S'), lon: dmsParaDecimal(47, 6, 31.7, 'W'), restricao: { fl: 120, tipo: "AT"  } },
                        { nome: "IROPU", lat: dmsParaDecimal(23, 25, 51.7, 'S'), lon: dmsParaDecimal(47, 4, 5, 'W')  },
                        { nome: "KOMGU", lat: dmsParaDecimal(23, 33, 54.89, 'S'), lon: dmsParaDecimal(46, 49, 40.64, 'W'), restricao: { fl:  90, tipo: "AT" } },                     
                        { nome: "SP098", lat: dmsParaDecimal(23, 38, 18.92, 'S'), lon: dmsParaDecimal(46, 46, 37.85, 'W'), restricao: { fl:  90, tipo: "AT" } },
                       
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
                        { nome: "OGTAL", lat: dmsParaDecimal(23, 51, 23.29, 'S'), lon: dmsParaDecimal(46, 37, 33.47, 'W'), restricao: { fl: 60, tipo: "AT" }, papel: "IAF" },
                        { nome: "ESUNI", lat: dmsParaDecimal(23, 51, 25.00, 'S'), lon: dmsParaDecimal(46, 27, 16.70, 'W'), restricao: { fl: 60, tipo: "AT" }, papel: "IAF" },
                        { nome: "USITO", lat: dmsParaDecimal(23, 48, 5.00, 'S'), lon: dmsParaDecimal(46, 32, 10.00, 'W'), restricao: { fl: 53, tipo: "AT" }, papel: "IF" },
                        { nome: "SURBU", lat: dmsParaDecimal(23, 42, 30.00, 'S'), lon: dmsParaDecimal(46, 36, 0.00, 'W'), restricao: { fl: 42, tipo: "AT" }, papel: "FAF", isFAF: true },
                        { nome: "RW35L", lat: dmsParaDecimal(23, 37, 59.81, 'S'), lon: dmsParaDecimal(46, 39, 6.99, 'W'), restricao: { fl: 26, tipo: "AT" }, papel: "MAPT", isThreshold: true }

                    ],
                    linhas: [
                        ["OGTAL","USITO"],
                        ["ESUNI","USITO"],
                        ["USITO","SURBU","RW35L"]
                    ]
                }
            },
            SID: {
                "BAIAN_3B": {
                    nome: "BAIAN 3B",
                    cor: '#ff9900',
                    fixos: [
                        { nome: "RW17R", lat: dmsParaDecimal(23, 37, 6.61, 'S'),lon: dmsParaDecimal(46, 39, 43.83, 'W')},
                        { nome: "SP107", lat: dmsParaDecimal(23, 36, 0, 'S'), lon: dmsParaDecimal(46, 36, 60, 'W'), restricao: { fl: 35, tipo: "ABOVE" } },
                        { nome: "VUNVU", lat: dmsParaDecimal(23, 36, 78.3, 'S'), lon: dmsParaDecimal(46, 33, 36.7, 'W'), restricao: { fl: 55, tipo: "ABOVE" } },
                        { nome: "SP108", lat: dmsParaDecimal(23, 42, 86.7, 'S'), lon: dmsParaDecimal(46, 26, 93.3, 'W') },
                        { nome: "BAIAN", lat: dmsParaDecimal(23, 40, 11.7, 'S'), lon: dmsParaDecimal(46, 7, 70, 'W') },
                        { nome: "SP103", lat: dmsParaDecimal(23, 32, 48.3, 'S'), lon: dmsParaDecimal(46, 3, 45, 'W'), restricao: { fl: 140, tipo: "ABOVE" } },
                        { nome: "ISOXO", lat: dmsParaDecimal(23, 25, 86.7, 'S'), lon: dmsParaDecimal(45, 59, 76.7, 'W'), restricao: { fl: 170, tipo: "ABOVE" } },
                        { nome: "ORIMU", lat: dmsParaDecimal(23, 15, 83.3, 'S'), lon: dmsParaDecimal(45, 59, 41.7, 'W'), restricao: { fl: 220, tipo: "BELOW" } },
                        { nome: "VUMEV", lat: dmsParaDecimal(22, 53, 20, 'S'), lon: dmsParaDecimal(45, 58, 63.3, 'W') },
                        { nome: "NUXEL", lat: dmsParaDecimal(22, 16, 98.3, 'S'), lon: dmsParaDecimal(45, 49, 30, 'W') },
                        { nome: "NIBRU", lat: dmsParaDecimal(23, 34, 38.3, 'S'), lon: dmsParaDecimal(45, 28, 13.3, 'W') },
                        { nome: "UREMI", lat: dmsParaDecimal(23, 23, 33.3, 'S'), lon: dmsParaDecimal(45, 30, 76.7, 'W') }
                    ],
                    linhas: [
                        ["RW17R", "SP107", "VUNVU", "SP108", "BAIAN", "SP103", "ISOXO", "ORIMU", "VUMEV", "NUXEL"],
                        ["BAIAN", "NIBRU"],
                        ["BAIAN", "UREMI"]
                    ]
                },
                "UGTIX_1B": {
                    nome: "UGTIX 1B",
                    cor: '#ff9900',
                    fixos: [
                        { nome: "RW17R", lat: dmsParaDecimal(23, 37, 6.61, 'S'),lon: dmsParaDecimal(46, 39, 43.83, 'W')},
                        { nome: "SP082", lat: dmsParaDecimal(23, 34, 50, 'S'), lon: dmsParaDecimal(46, 45, 43.3, 'W') },
                        { nome: "SP083", lat: dmsParaDecimal(23, 37, 65, 'S'), lon: dmsParaDecimal(46, 50, 78.3, 'W'), restricao: { fl: 75, tipo: "BELOW" } },
                        { nome: "SEDLO", lat: dmsParaDecimal(23, 46, 0, 'S'), lon: dmsParaDecimal(46, 55, 13.3, 'W') },
                        { nome: "SP084", lat: dmsParaDecimal(23, 44, 46.7, 'S'), lon: dmsParaDecimal(47, 7, 66.7, 'W'), restricao: { fl: 100, tipo: "ABOVE" } },
                        { nome: "SP086", lat: dmsParaDecimal(23, 35, 43.3, 'S'), lon: dmsParaDecimal(47, 9, 65, 'W'), restricao: { fl: 130, tipo: "ABOVE" } },
                        { nome: "UGTIX", lat: dmsParaDecimal(23, 16, 86.7, 'S'), lon: dmsParaDecimal(47, 13, 71.7, 'W'), restricao: { fl: 240, tipo: "ABOVE" } },
                        { nome: "LESSA", lat: dmsParaDecimal(23, 10, 58.3, 'S'), lon: dmsParaDecimal(47, 37, 68.3, 'W') },
                        { nome: "VURDU", lat: dmsParaDecimal(23, 9, 70, 'S'), lon: dmsParaDecimal(48, 0, 90, 'W') },
                        { nome: "EGEVA", lat: dmsParaDecimal(23, 8, 38.3, 'S'), lon: dmsParaDecimal(48, 33, 68.3, 'W') },
                        { nome: "ASETA", lat: dmsParaDecimal(23, 17, 13.3, 'S'), lon: dmsParaDecimal(48, 5, 73.3, 'W') },
                        { nome: "SP087", lat: dmsParaDecimal(23, 8, 98.3, 'S'), lon: dmsParaDecimal(47, 15, 43.3, 'W'), restricao: { fl: 250, tipo: "ABOVE" } },
                        { nome: "SP088", lat: dmsParaDecimal(22, 40, 23.3, 'S'), lon: dmsParaDecimal(47, 21, 66.7, 'W') },
                        { nome: "GERTU", lat: dmsParaDecimal(22, 25, 80, 'S'), lon: dmsParaDecimal(47, 33, 73.3, 'W') }
                    ],
                    linhas: [
                        ["RW17R", "SP082", "SP083", "SEDLO", "SP084", "SP086", "UGTIX", "LESSA", "VURDU", "EGEVA"],
                        ["LESSA", "ASETA"],
                        ["UGTIX", "SP087", "SP088", "GERTU"]
                    ]
                },
                "SEDLO_1A": {
                    nome: "SEDLO 1A",
                    cor: '#ff9900',
                    fixos: [
                        { nome: "RW17R", lat: dmsParaDecimal(23, 37, 6.61, 'S'),lon: dmsParaDecimal(46, 39, 43.83, 'W')},
                        { nome: "SP082", lat: dmsParaDecimal(23, 34, 50, 'S'), lon: dmsParaDecimal(46, 45, 43.3, 'W') },
                        { nome: "SP083", lat: dmsParaDecimal(23, 37, 65, 'S'), lon: dmsParaDecimal(46, 50, 78.3, 'W'), restricao: { fl: 75, tipo: "BELOW" } },
                        { nome: "SEDLO", lat: dmsParaDecimal(23, 46, 0, 'S'), lon: dmsParaDecimal(46, 55, 13.3, 'W') },
                        { nome: "MADNI", lat: dmsParaDecimal(24, 36, 43.3, 'S'), lon: dmsParaDecimal(47, 0, 53.3, 'W') },
                        { nome: "UBSOD", lat: dmsParaDecimal(24, 15, 70, 'S'), lon: dmsParaDecimal(47, 8, 65, 'W') },
                        { nome: "NIBGA", lat: dmsParaDecimal(24, 4, 71.7, 'S'), lon: dmsParaDecimal(47, 14, 36.7, 'W') },
                        { nome: "SOVSI", lat: dmsParaDecimal(24, 6, 31.7, 'S'), lon: dmsParaDecimal(47, 28, 31.7, 'W') }
                    ],
                    linhas: [
                        ["RW17R", "SP082", "SP083", "SEDLO", "MADNI"],
                        ["SEDLO", "UBSOD"],
                        ["SEDLO", "NIBGA"],
                        ["SEDLO", "SOVSI"]
                    ]
                },
                "UBRAM_1B": {
                    nome: "UBRAM 1B",
                    cor: '#ff9900',
                    fixos: [
                        { nome: "RW17R", lat: dmsParaDecimal(23, 37, 6.61, 'S'),lon: dmsParaDecimal(46, 39, 43.83, 'W')},
                        { nome: "SP074", lat: dmsParaDecimal(23, 35, 88.3, 'S'), lon: dmsParaDecimal(46, 45, 0, 'W') },
                        { nome: "SP079", lat: dmsParaDecimal(23, 36, 80, 'S'), lon: dmsParaDecimal(46, 51, 90, 'W') },
                        { nome: "SP038", lat: dmsParaDecimal(23, 37, 46.7, 'S'), lon: dmsParaDecimal(47, 13, 80, 'W') },
                        { nome: "XOGOD", lat: dmsParaDecimal(23, 31, 58.3, 'S'), lon: dmsParaDecimal(47, 28, 93.3, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "UMRAR", lat: dmsParaDecimal(23, 28, 5, 'S'), lon: dmsParaDecimal(47, 41, 46.7, 'W'), restricao: { fl: 110, tipo: "BELOW" } },
                        { nome: "UBRAM", lat: dmsParaDecimal(23, 26, 73.3, 'S'), lon: dmsParaDecimal(47, 46, 15, 'W'), restricao: { fl: 120, tipo: "ABOVE" } },
                        { nome: "ASETA", lat: dmsParaDecimal(23, 17, 13.3, 'S'), lon: dmsParaDecimal(48, 5, 73.3, 'W') },
                        { nome: "EGEVA", lat: dmsParaDecimal(23, 8, 38.3, 'S'), lon: dmsParaDecimal(48, 33, 68.3, 'W') }
                    ],
                    linhas: [
                        ["RW17R", "SP074", "SP079", "SP038", "XOGOD", "UMRAR", "UBRAM", "ASETA", "EGEVA"]
                    ]
                }
            }
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
                        { nome: "VUNOX", lat: dmsParaDecimal(22, 19, 6.7, 'S'), lon: dmsParaDecimal(46, 12, 78.3, 'W'),
                            restricao: { fl: 220, tipo: "BELOW"  }
                        },
                        { nome: "GR259", lat: dmsParaDecimal(22, 32, 63.3, 'S'), lon: dmsParaDecimal(46, 14, 88.3, 'W'),
                            restricao: { fl: 180, tipo: "BELOW"  }
                        },
                        { nome: "GR262", lat: dmsParaDecimal(22, 46, 96.7, 'S'), lon: dmsParaDecimal(46, 17, 11.7, 'W'),
                            restricao: { fl: 160, tipo: "BELOW"  }
                        },
                        { nome: "GR263", lat: dmsParaDecimal(22, 52, 63.3, 'S'), lon: dmsParaDecimal(46, 20, 86.7, 'W'),
                            restricao: { fl: 150, tipo: "AT"  }
                        },
                        { nome: "GR264", lat: dmsParaDecimal(22, 50, 51.7, 'S'), lon: dmsParaDecimal(46, 25, 96.7, 'W')
                         },
                        { nome: "GR266", lat: dmsParaDecimal(22, 49, 60, 'S'), lon: dmsParaDecimal(46, 32, 16.7, 'W')
                         },
                        { nome: "GR267", lat: dmsParaDecimal(22, 49, 98.3, 'S'), lon: dmsParaDecimal(46, 37, 56.7, 'W')
                         },
                        { nome: "GR268", lat: dmsParaDecimal(22, 51, 60, 'S'), lon: dmsParaDecimal(46, 43, 15, 'W')
                         },
                        { nome: "GR271", lat: dmsParaDecimal(22, 54, 78.3, 'S'), lon: dmsParaDecimal(46, 48, 66.7, 'W'),
                            restricao: { fl: 150, tipo: "AT"  }
                        },
                        { nome: "SANPA", lat: dmsParaDecimal(23, 12, 50, 'S'), lon: dmsParaDecimal(46, 32, 98.3, 'W'),
                            restricao: {
                                fl: 80,
                                flMax: 90,
                                tipo: "WINDOW"
                             }
                        },
                        { nome: "GR283", lat: dmsParaDecimal(23, 15, 85, 'S'), lon: dmsParaDecimal(46, 35, 36.7, 'W'),
                            restricao: { fl: 80, tipo: "BELOW"  }
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
                        { nome: "EDMUS", lat: dmsParaDecimal(23, 11, 35, 'S'), lon: dmsParaDecimal(45, 23, 15, 'W'),
                            restricao: { fl: 260, tipo: "BELOW"  }
                        },
                        { nome: "NIBVO", lat: dmsParaDecimal(23, 13, 60, 'S'), lon: dmsParaDecimal(45, 33, 35, 'W')
                         },
                        { nome: "POLYP", lat: dmsParaDecimal(23, 19, 40, 'S'), lon: dmsParaDecimal(45, 54, 38.3, 'W'),
                            restricao: { fl: 150, tipo: "BELOW"  }
                        },
                        { nome: "GR284", lat: dmsParaDecimal(23, 26, 15, 'S'), lon: dmsParaDecimal(46, 18, 31.7, 'W'),
                            restricao: { fl: 110, tipo: "ABOVE"  }
                        },
                        { nome: "GR286", lat: dmsParaDecimal(23, 20, 26.7, 'S'), lon: dmsParaDecimal(46, 28, 8.3, 'W'),
                            restricao: { fl: 110, tipo: "AT"  }
                        },
                        { nome: "GR283", lat: dmsParaDecimal(23, 15, 85, 'S'), lon: dmsParaDecimal(46, 35, 36.7, 'W'),
                            restricao: { fl: 100, tipo: "AT"  }
                        },
                        { nome: "GR287", lat: dmsParaDecimal(23, 13, 96.7, 'S'), lon: dmsParaDecimal(46, 41, 46.7, 'W'),
                            restricao: { fl: 90, tipo: "BELOW"  }
                        },
                        { nome: "GR288", lat: dmsParaDecimal(23, 15, 15, 'S'), lon: dmsParaDecimal(46, 47, 88.3, 'W'),
                            restricao: {
                                fl: 70,
                                flMax: 80,
                                tipo: "WINDOW"
                             }
                        },
                        { nome: "GR289", lat: dmsParaDecimal(23, 19, 20, 'S'), lon: dmsParaDecimal(46, 52, 85, 'W'),
                            restricao: { fl: 70, tipo: "BELOW"  }
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
                        { nome: "BUXUK", lat: dmsParaDecimal(23, 45, 83.3, 'S'), lon: dmsParaDecimal(47, 48, 95, 'W')  },
                        { nome: "GR071", lat: dmsParaDecimal(23, 39, 0, 'S'), lon: dmsParaDecimal(47, 41, 75, 'W'), restricao: { fl: 270, tipo: "BELOW"  } },
                        { nome: "GR072", lat: dmsParaDecimal(23, 23, 10, 'S'), lon: dmsParaDecimal(47, 25, 6.7, 'W'), restricao: { fl: 230, tipo: "BELOW"  } },
                        { nome: "ZARES", lat: dmsParaDecimal(22, 45, 96.7, 'S'), lon: dmsParaDecimal(47, 57, 26.7, 'W')  },
                        { nome: "GR073", lat: dmsParaDecimal(22, 49, 25, 'S'), lon: dmsParaDecimal(47, 50, 48.3, 'W'), restricao: { fl: 270, tipo: "BELOW"  } },
                        { nome: "GR327", lat: dmsParaDecimal(22, 59, 66, 'S'), lon: dmsParaDecimal(47, 28, 92, 'W'), restricao: { fl: 240, tipo: "ABOVE"  } },
                        { nome: "GR074", lat: dmsParaDecimal(23, 2, 35, 'S'), lon: dmsParaDecimal(47, 23, 38.3, 'W'), restricao: { fl: 230, tipo: "BELOW"  } },
                        { nome: "MOLLE", lat: dmsParaDecimal(23, 8, 74, 'S'), lon: dmsParaDecimal(47, 10, 0.1, 'W'), restricao: { fl: 210, tipo: "ABOVE"  } },
                        { nome: "GR249", lat: dmsParaDecimal(23, 4, 31.7, 'S'), lon: dmsParaDecimal(47, 4, 88.3, 'W'), restricao: { fl: 190, tipo: "ABOVE"  } },
                        { nome: "GR076", lat: dmsParaDecimal(22, 58, 45, 'S'), lon: dmsParaDecimal(46, 57, 98.3, 'W'), restricao: { fl: 160, tipo: "ABOVE"  } },
                        { nome: "GR077", lat: dmsParaDecimal(22, 54, 18.3, 'S'), lon: dmsParaDecimal(46, 52, 96.7, 'W'), restricao: { fl: 140, tipo: "AT"  } },
                        { nome: "GR252", lat: dmsParaDecimal(22, 52, 8.3, 'S'), lon: dmsParaDecimal(46, 50, 50, 'W'), restricao: { fl: 140, tipo: "AT"  } },
                        { nome: "GR272", lat: dmsParaDecimal(22, 48, 76.7, 'S'), lon: dmsParaDecimal(46, 43, 93.3, 'W')  },
                        { nome: "GR273", lat: dmsParaDecimal(22, 47, 6.7, 'S'), lon: dmsParaDecimal(46, 37, 70, 'W')  },
                        { nome: "GR274", lat: dmsParaDecimal(22, 46, 70, 'S'), lon: dmsParaDecimal(46, 31, 21.7, 'W')  },
                        { nome: "GR276", lat: dmsParaDecimal(22, 47, 70, 'S'), lon: dmsParaDecimal(46, 24, 80, 'W')  },
                        { nome: "GR277", lat: dmsParaDecimal(22, 50, 40, 'S'), lon: dmsParaDecimal(46, 18, 33.3, 'W'), restricao: { fl: 140, tipo: "AT"  } },
                        { nome: "SANPA", lat: dmsParaDecimal(23, 12, 50, 'S'), lon: dmsParaDecimal(46, 32, 98.3, 'W'), restricao: { fl: 80, flMax: 90, tipo: "WINDOW"  } },
                        { nome: "GR283", lat: dmsParaDecimal(23, 15, 85, 'S'), lon: dmsParaDecimal(46, 35, 36.7, 'W'), restricao: { fl: 80, tipo: "BELOW"  } }
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
            SID: {
                     
            }
        },
        "10L": {
            SID: {
                "AMVUL_6A": {
                    nome: "AMVUL 6A",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "RW28R",  lat: dmsParaDecimal(23, 25, 43.91, 'S'),lon: dmsParaDecimal(46, 27, 11.45, 'W')},
                        { nome: "AMVUL", lat: dmsParaDecimal(23, 23, 96.7, 'S'), lon: dmsParaDecimal(46, 21, 73.3, 'W') },
                        { nome: "GR222", lat: dmsParaDecimal(23, 22, 36.7, 'S'), lon: dmsParaDecimal(46, 18, 96.7, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "GR217", lat: dmsParaDecimal(23, 12, 75, 'S'), lon: dmsParaDecimal(46, 2, 38.3, 'W'), restricao: { fl: 100, tipo: "ABOVE" } },
                        { nome: "GR321", lat: dmsParaDecimal(23, 7, 51.7, 'S'), lon: dmsParaDecimal(46, 0, 38.3, 'W') },
                        { nome: "VUMEV", lat: dmsParaDecimal(22, 53, 20, 'S'), lon: dmsParaDecimal(45, 58, 63.3, 'W') },
                        { nome: "NUXEL", lat: dmsParaDecimal(22, 16, 98.3, 'S'), lon: dmsParaDecimal(45, 49, 30, 'W') },
                        { nome: "GR223", lat: dmsParaDecimal(22, 53, 95, 'S'), lon: dmsParaDecimal(46, 18, 3.3, 'W'), restricao: { fl: 180, tipo: "ABOVE" } },
                        { nome: "GR224", lat: dmsParaDecimal(22, 40, 11.7, 'S'), lon: dmsParaDecimal(46, 48, 96.7, 'W'), restricao: { fl: 250, tipo: "ABOVE" } },
                        { nome: "ORONU", lat: dmsParaDecimal(22, 37, 3.3, 'S'), lon: dmsParaDecimal(46, 55, 81.7, 'W') },
                        { nome: "GERKA", lat: dmsParaDecimal(22, 33, 6.7, 'S'), lon: dmsParaDecimal(47, 4, 60, 'W') },
                        { nome: "GERTU", lat: dmsParaDecimal(22, 25, 80, 'S'), lon: dmsParaDecimal(47, 33, 73.3, 'W') },
                        { nome: "ISMOB", lat: dmsParaDecimal(21, 47, 35, 'S'), lon: dmsParaDecimal(47, 11, 81.7, 'W') }
                    ],
                    linhas: [
                        ["RW28R", "AMVUL", "GR222", "GR217", "GR321", "VUMEV", "NUXEL"],
                        ["GR321", "GR223", "GR224", "ORONU", "GERKA", "GERTU"],
                        ["ORONU", "ISMOB"]
                    ]
                },
                "ORONU_1A": {
                    nome: "ORONU 1A",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "RW28R",  lat: dmsParaDecimal(23, 25, 43.91, 'S'),lon: dmsParaDecimal(46, 27, 11.45, 'W')},
                        { nome: "GR226", lat: dmsParaDecimal(23, 22, 46.7, 'S'), lon: dmsParaDecimal(46, 23, 93.3, 'W') },
                        { nome: "GR316", lat: dmsParaDecimal(23, 20, 36.7, 'S'), lon: dmsParaDecimal(46, 21, 60, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "GR306", lat: dmsParaDecimal(23, 5, 83.3, 'S'), lon: dmsParaDecimal(46, 5, 48.3, 'W') },
                        { nome: "GR223", lat: dmsParaDecimal(22, 53, 95, 'S'), lon: dmsParaDecimal(46, 18, 3.3, 'W'), restricao: { fl: 180, tipo: "ABOVE" } },
                        { nome: "GR224", lat: dmsParaDecimal(22, 40, 11.7, 'S'), lon: dmsParaDecimal(46, 48, 96.7, 'W'), restricao: { fl: 250, tipo: "ABOVE" } },
                        { nome: "ORONU", lat: dmsParaDecimal(22, 37, 3.3, 'S'), lon: dmsParaDecimal(46, 55, 81.7, 'W') },
                        { nome: "GERKA", lat: dmsParaDecimal(22, 33, 6.7, 'S'), lon: dmsParaDecimal(47, 4, 60, 'W') },
                        { nome: "GERTU", lat: dmsParaDecimal(22, 25, 80, 'S'), lon: dmsParaDecimal(47, 33, 73.3, 'W') },
                        { nome: "ISMOB", lat: dmsParaDecimal(21, 47, 35, 'S'), lon: dmsParaDecimal(47, 11, 81.7, 'W') }
                    ],
                    linhas: [
                        ["RW28R", "GR226", "GR316", "GR306", "GR223", "GR224", "ORONU", "GERKA", "GERTU"],
                        ["ORONU", "ISMOB"]
                    ]
                },
                "ORONU_1B": {
                    nome: "ORONU 1B",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "RW28R",  lat: dmsParaDecimal(23, 25, 43.91, 'S'),lon: dmsParaDecimal(46, 27, 11.45, 'W')},,
                        { nome: "GR226", lat: dmsParaDecimal(23, 22, 46.7, 'S'), lon: dmsParaDecimal(46, 23, 93.3, 'W') },
                        { nome: "GR227", lat: dmsParaDecimal(23, 14, 90, 'S'), lon: dmsParaDecimal(46, 18, 73.3, 'W') },
                        { nome: "EDLUT", lat: dmsParaDecimal(23, 6, 66.7, 'S'), lon: dmsParaDecimal(46, 12, 70, 'W') },
                        { nome: "GR324", lat: dmsParaDecimal(23, 3, 41.7, 'S'), lon: dmsParaDecimal(46, 14, 6.7, 'W'), restricao: { fl: 100, tipo: "ABOVE" } },
                        { nome: "GR223", lat: dmsParaDecimal(22, 53, 95, 'S'), lon: dmsParaDecimal(46, 18, 3.3, 'W') },
                        { nome: "GR322", lat: dmsParaDecimal(22, 47, 58.3, 'S'), lon: dmsParaDecimal(46, 32, 30, 'W') },
                        { nome: "GR292", lat: dmsParaDecimal(22, 44, 51.7, 'S'), lon: dmsParaDecimal(46, 39, 13.3, 'W'), restricao: { fl: 110, tipo: "ABOVE" } },
                        { nome: "GR021", lat: dmsParaDecimal(22, 40, 80, 'S'), lon: dmsParaDecimal(46, 47, 41.7, 'W'), restricao: { fl: 120, tipo: "BELOW" } },
                        { nome: "ORONU", lat: dmsParaDecimal(22, 37, 3.3, 'S'), lon: dmsParaDecimal(46, 55, 81.7, 'W') },
                        { nome: "GERKA", lat: dmsParaDecimal(22, 33, 6.7, 'S'), lon: dmsParaDecimal(47, 4, 60, 'W'), restricao: { fl: 140, tipo: "BELOW" } }
                    ],
                    linhas: [
                        ["RW28R", "GR226", "GR227", "EDLUT", "GR324", "GR223", "GR322", "GR292", "GR021", "ORONU", "GERKA"]
                    ]
                },
                "EKOPO_1A": {
                    nome: "EKOPO 1A",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "RW28R",  lat: dmsParaDecimal(23, 25, 43.91, 'S'),lon: dmsParaDecimal(46, 27, 11.45, 'W')},
                        { nome: "AMVUL", lat: dmsParaDecimal(23, 23, 96.7, 'S'), lon: dmsParaDecimal(46, 21, 73.3, 'W') },
                        { nome: "GR027", lat: dmsParaDecimal(23, 26, 28.3, 'S'), lon: dmsParaDecimal(46, 14, 65, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "EKOPO", lat: dmsParaDecimal(23, 29, 51.7, 'S'), lon: dmsParaDecimal(45, 55, 95, 'W'), restricao: { fl: 130, tipo: "BELOW" } },
                        { nome: "NIBRU", lat: dmsParaDecimal(23, 34, 38.3, 'S'), lon: dmsParaDecimal(45, 28, 13.3, 'W') },
                        { nome: "UREMI", lat: dmsParaDecimal(23, 23, 33.3, 'S'), lon: dmsParaDecimal(45, 30, 76.7, 'W') }
                    ],
                    linhas: [
                        ["RW28R", "AMVUL", "GR027", "EKOPO", "NIBRU"],
                        ["EKOPO", "UREMI"]
                    ]
                },
              
                "ZORZA_3A": {
                    nome: "ZORZA 3A",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "RW28R",  lat: dmsParaDecimal(23, 25, 43.91, 'S'),lon: dmsParaDecimal(46, 27, 11.45, 'W')},
                        { nome: "AMVUL", lat: dmsParaDecimal(23, 23, 96.7, 'S'), lon: dmsParaDecimal(46, 21, 73.3, 'W') },
                        { nome: "GR027", lat: dmsParaDecimal(23, 26, 28.3, 'S'), lon: dmsParaDecimal(46, 14, 65, 'W') },
                        { nome: "GR209", lat: dmsParaDecimal(23, 33, 46.7, 'S'), lon: dmsParaDecimal(46, 16, 11.7, 'W') },
                        { nome: "GR212", lat: dmsParaDecimal(23, 36, 45, 'S'), lon: dmsParaDecimal(46, 31, 15, 'W'), restricao: { fl: 160, tipo: "BELOW" } },
                        { nome: "CGO", lat: dmsParaDecimal(23, 37, 63.3, 'S'), lon: dmsParaDecimal(46, 39, 26.7, 'W'), restricao: { fl: 100, tipo: "ABOVE" } },
                        { nome: "ZORZA", lat: dmsParaDecimal(23, 42, 48.3, 'S'), lon: dmsParaDecimal(46, 47, 60, 'W') },
                        { nome: "MADNI", lat: dmsParaDecimal(24, 36, 43.3, 'S'), lon: dmsParaDecimal(47, 0, 53.3, 'W') },
                        { nome: "UBSOD", lat: dmsParaDecimal(24, 15, 70, 'S'), lon: dmsParaDecimal(47, 8, 65, 'W') },
                        { nome: "SOVSI", lat: dmsParaDecimal(24, 6, 31.7, 'S'), lon: dmsParaDecimal(47, 28, 31.7, 'W') },
                        { nome: "GR214", lat: dmsParaDecimal(23, 30, 68.3, 'S'), lon: dmsParaDecimal(47, 6, 21.7, 'W'), restricao: { fl: 240, tipo: "ABOVE" } },
                        { nome: "GR216", lat: dmsParaDecimal(23, 24, 40, 'S'), lon: dmsParaDecimal(47, 16, 6.7, 'W'), restricao: { fl: 270, tipo: "ABOVE" } },
                        { nome: "LESSA", lat: dmsParaDecimal(23, 10, 58.3, 'S'), lon: dmsParaDecimal(47, 37, 68.3, 'W') },
                        { nome: "EGEVA", lat: dmsParaDecimal(23, 8, 38.3, 'S'), lon: dmsParaDecimal(48, 33, 68.3, 'W') },
                        { nome: "ASETA", lat: dmsParaDecimal(23, 17, 13.3, 'S'), lon: dmsParaDecimal(48, 5, 73.3, 'W') }
                    ],
                    linhas: [
                        ["RW28R", "AMVUL", "GR027", "GR209", "GR212", "CGO", "ZORZA", "MADNI"],
                        ["ZORZA", "UBSOD"],
                        ["ZORZA", "SOVSI"],
                        ["ZORZA", "GR214", "GR216", "LESSA", "EGEVA"],
                        ["LESSA", "ASETA"]
                    ]
                },
               
                "AMVUL_6A": {
                    nome: "AMVUL 6A",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "RW28R",  lat: dmsParaDecimal(23, 25, 43.91, 'S'),lon: dmsParaDecimal(46, 27, 11.45, 'W')},
                        { nome: "AMVUL", lat: dmsParaDecimal(23, 23, 96.7, 'S'), lon: dmsParaDecimal(46, 21, 73.3, 'W') },
                        { nome: "GR222", lat: dmsParaDecimal(23, 22, 36.7, 'S'), lon: dmsParaDecimal(46, 18, 96.7, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "GR217", lat: dmsParaDecimal(23, 12, 75, 'S'), lon: dmsParaDecimal(46, 2, 38.3, 'W'), restricao: { fl: 100, tipo: "ABOVE" } },
                        { nome: "GR321", lat: dmsParaDecimal(23, 7, 51.7, 'S'), lon: dmsParaDecimal(46, 0, 38.3, 'W') },
                        { nome: "VUMEV", lat: dmsParaDecimal(22, 53, 20, 'S'), lon: dmsParaDecimal(45, 58, 63.3, 'W') },
                        { nome: "NUXEL", lat: dmsParaDecimal(22, 16, 98.3, 'S'), lon: dmsParaDecimal(45, 49, 30, 'W') },
                        { nome: "GR223", lat: dmsParaDecimal(22, 53, 95, 'S'), lon: dmsParaDecimal(46, 18, 3.3, 'W'), restricao: { fl: 180, tipo: "ABOVE" } },
                        { nome: "GR224", lat: dmsParaDecimal(22, 40, 11.7, 'S'), lon: dmsParaDecimal(46, 48, 96.7, 'W'), restricao: { fl: 250, tipo: "ABOVE" } },
                        { nome: "ORONU", lat: dmsParaDecimal(22, 37, 3.3, 'S'), lon: dmsParaDecimal(46, 55, 81.7, 'W') },
                        { nome: "GERKA", lat: dmsParaDecimal(22, 33, 6.7, 'S'), lon: dmsParaDecimal(47, 4, 60, 'W') },
                        { nome: "GERTU", lat: dmsParaDecimal(22, 25, 80, 'S'), lon: dmsParaDecimal(47, 33, 73.3, 'W') },
                        { nome: "ISMOB", lat: dmsParaDecimal(21, 47, 35, 'S'), lon: dmsParaDecimal(47, 11, 81.7, 'W') }
                    ],
                    linhas: [
                        ["RW28R", "AMVUL", "GR222", "GR217", "GR321", "VUMEV", "NUXEL"],
                        ["GR321", "GR223", "GR224", "ORONU", "GERKA", "GERTU"],
                        ["ORONU", "ISMOB"]
                    ]
                },
                "ORONU_1A": {
                    nome: "ORONU 1A",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "RW28R",  lat: dmsParaDecimal(23, 25, 43.91, 'S'),lon: dmsParaDecimal(46, 27, 11.45, 'W')},
                        { nome: "GR226", lat: dmsParaDecimal(23, 22, 46.7, 'S'), lon: dmsParaDecimal(46, 23, 93.3, 'W') },
                        { nome: "GR316", lat: dmsParaDecimal(23, 20, 36.7, 'S'), lon: dmsParaDecimal(46, 21, 60, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "GR306", lat: dmsParaDecimal(23, 5, 83.3, 'S'), lon: dmsParaDecimal(46, 5, 48.3, 'W') },
                        { nome: "GR223", lat: dmsParaDecimal(22, 53, 95, 'S'), lon: dmsParaDecimal(46, 18, 3.3, 'W'), restricao: { fl: 180, tipo: "ABOVE" } },
                        { nome: "GR224", lat: dmsParaDecimal(22, 40, 11.7, 'S'), lon: dmsParaDecimal(46, 48, 96.7, 'W'), restricao: { fl: 250, tipo: "ABOVE" } },
                        { nome: "ORONU", lat: dmsParaDecimal(22, 37, 3.3, 'S'), lon: dmsParaDecimal(46, 55, 81.7, 'W') },
                        { nome: "GERKA", lat: dmsParaDecimal(22, 33, 6.7, 'S'), lon: dmsParaDecimal(47, 4, 60, 'W') },
                        { nome: "GERTU", lat: dmsParaDecimal(22, 25, 80, 'S'), lon: dmsParaDecimal(47, 33, 73.3, 'W') },
                        { nome: "ISMOB", lat: dmsParaDecimal(21, 47, 35, 'S'), lon: dmsParaDecimal(47, 11, 81.7, 'W') }
                    ],
                    linhas: [
                        ["RW28R", "GR226", "GR316", "GR306", "GR223", "GR224", "ORONU", "GERKA", "GERTU"],
                        ["ORONU", "ISMOB"]
                    ]
                },
                "ORONU_1B": {
                    nome: "ORONU 1B",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "RW28R",  lat: dmsParaDecimal(23, 25, 43.91, 'S'),lon: dmsParaDecimal(46, 27, 11.45, 'W')},
                        { nome: "GR226", lat: dmsParaDecimal(23, 22, 46.7, 'S'), lon: dmsParaDecimal(46, 23, 93.3, 'W') },
                        { nome: "GR227", lat: dmsParaDecimal(23, 14, 90, 'S'), lon: dmsParaDecimal(46, 18, 73.3, 'W') },
                        { nome: "EDLUT", lat: dmsParaDecimal(23, 6, 66.7, 'S'), lon: dmsParaDecimal(46, 12, 70, 'W') },
                        { nome: "GR324", lat: dmsParaDecimal(23, 3, 41.7, 'S'), lon: dmsParaDecimal(46, 14, 6.7, 'W'), restricao: { fl: 100, tipo: "ABOVE" } },
                        { nome: "GR223", lat: dmsParaDecimal(22, 53, 95, 'S'), lon: dmsParaDecimal(46, 18, 3.3, 'W') },
                        { nome: "GR322", lat: dmsParaDecimal(22, 47, 58.3, 'S'), lon: dmsParaDecimal(46, 32, 30, 'W') },
                        { nome: "GR292", lat: dmsParaDecimal(22, 44, 51.7, 'S'), lon: dmsParaDecimal(46, 39, 13.3, 'W'), restricao: { fl: 110, tipo: "ABOVE" } },
                        { nome: "GR021", lat: dmsParaDecimal(22, 40, 80, 'S'), lon: dmsParaDecimal(46, 47, 41.7, 'W'), restricao: { fl: 120, tipo: "BELOW" } },
                        { nome: "ORONU", lat: dmsParaDecimal(22, 37, 3.3, 'S'), lon: dmsParaDecimal(46, 55, 81.7, 'W') },
                        { nome: "GERKA", lat: dmsParaDecimal(22, 33, 6.7, 'S'), lon: dmsParaDecimal(47, 4, 60, 'W'), restricao: { fl: 140, tipo: "BELOW" } }
                    ],
                    linhas: [
                        ["RW28R", "GR226", "GR227", "EDLUT", "GR324", "GR223", "GR322", "GR292", "GR021", "ORONU", "GERKA"]
                    ]
                },
                "EKOPO_1A": {
                    nome: "EKOPO 1A",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "RW28R",  lat: dmsParaDecimal(23, 25, 43.91, 'S'),lon: dmsParaDecimal(46, 27, 11.45, 'W')},
                        { nome: "AMVUL", lat: dmsParaDecimal(23, 23, 96.7, 'S'), lon: dmsParaDecimal(46, 21, 73.3, 'W') },
                        { nome: "GR027", lat: dmsParaDecimal(23, 26, 28.3, 'S'), lon: dmsParaDecimal(46, 14, 65, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "EKOPO", lat: dmsParaDecimal(23, 29, 51.7, 'S'), lon: dmsParaDecimal(45, 55, 95, 'W'), restricao: { fl: 130, tipo: "BELOW" } },
                        { nome: "NIBRU", lat: dmsParaDecimal(23, 34, 38.3, 'S'), lon: dmsParaDecimal(45, 28, 13.3, 'W') },
                        { nome: "UREMI", lat: dmsParaDecimal(23, 23, 33.3, 'S'), lon: dmsParaDecimal(45, 30, 76.7, 'W') }
                    ],
                    linhas: [
                        ["RW28R", "AMVUL", "GR027", "EKOPO", "NIBRU"],
                        ["EKOPO", "UREMI"]
                    ]
                },
                "ZORZA_3A": {
                    nome: "ZORZA 3A",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "RW28R",  lat: dmsParaDecimal(23, 25, 43.91, 'S'),lon: dmsParaDecimal(46, 27, 11.45, 'W')},
                        { nome: "AMVUL", lat: dmsParaDecimal(23, 23, 96.7, 'S'), lon: dmsParaDecimal(46, 21, 73.3, 'W') },
                        { nome: "GR027", lat: dmsParaDecimal(23, 26, 28.3, 'S'), lon: dmsParaDecimal(46, 14, 65, 'W') },
                        { nome: "GR209", lat: dmsParaDecimal(23, 33, 46.7, 'S'), lon: dmsParaDecimal(46, 16, 11.7, 'W') },
                        { nome: "GR212", lat: dmsParaDecimal(23, 36, 45, 'S'), lon: dmsParaDecimal(46, 31, 15, 'W'), restricao: { fl: 160, tipo: "BELOW" } },
                        { nome: "CGO", lat: dmsParaDecimal(23, 37, 63.3, 'S'), lon: dmsParaDecimal(46, 39, 26.7, 'W'), restricao: { fl: 100, tipo: "ABOVE" } },
                        { nome: "ZORZA", lat: dmsParaDecimal(23, 42, 48.3, 'S'), lon: dmsParaDecimal(46, 47, 60, 'W') },
                        { nome: "MADNI", lat: dmsParaDecimal(24, 36, 43.3, 'S'), lon: dmsParaDecimal(47, 0, 53.3, 'W') },
                        { nome: "UBSOD", lat: dmsParaDecimal(24, 15, 70, 'S'), lon: dmsParaDecimal(47, 8, 65, 'W') },
                        { nome: "SOVSI", lat: dmsParaDecimal(24, 6, 31.7, 'S'), lon: dmsParaDecimal(47, 28, 31.7, 'W') },
                        { nome: "GR214", lat: dmsParaDecimal(23, 30, 68.3, 'S'), lon: dmsParaDecimal(47, 6, 21.7, 'W'), restricao: { fl: 240, tipo: "ABOVE" } },
                        { nome: "GR216", lat: dmsParaDecimal(23, 24, 40, 'S'), lon: dmsParaDecimal(47, 16, 6.7, 'W'), restricao: { fl: 270, tipo: "ABOVE" } },
                        { nome: "LESSA", lat: dmsParaDecimal(23, 10, 58.3, 'S'), lon: dmsParaDecimal(47, 37, 68.3, 'W') },
                        { nome: "EGEVA", lat: dmsParaDecimal(23, 8, 38.3, 'S'), lon: dmsParaDecimal(48, 33, 68.3, 'W') },
                        { nome: "ASETA", lat: dmsParaDecimal(23, 17, 13.3, 'S'), lon: dmsParaDecimal(48, 5, 73.3, 'W') }
                    ],
                    linhas: [
                        ["RW28R", "AMVUL", "GR027", "GR209", "GR212", "CGO", "ZORZA", "MADNI"],
                        ["ZORZA", "UBSOD"],
                        ["ZORZA", "SOVSI"],
                        ["ZORZA", "GR214", "GR216", "LESSA", "EGEVA"],
                        ["LESSA", "ASETA"]
                    ]
                }
            }
        },
        "28L": {
            STAR: { // =========================================================
                // VUNOX 1C - RWY 28L/28R
                // =========================================================
                "VUNOX_1C": {
                    nome: "VUNOX 1C",
                    cor: '#fbff00',
                    fixos: [
                        { nome: "VUNOX", lat: dmsParaDecimal(22, 19, 6.7, 'S'), lon: dmsParaDecimal(46, 12, 78.3, 'W'), restricao: { fl: 220, tipo: "AT"  } },
                        { nome: "GR259", lat: dmsParaDecimal(22, 32, 63.3, 'S'), lon: dmsParaDecimal(46, 14, 88.3, 'W'), restricao: { fl: 180, tipo: "AT"  } },
                        { nome: "GR262", lat: dmsParaDecimal(22, 46, 96.7, 'S'), lon: dmsParaDecimal(46, 17, 11.7, 'W'), restricao: { fl: 160, tipo: "AT"  } },
                        { nome: "GR263", lat: dmsParaDecimal(22, 52, 63.3, 'S'), lon: dmsParaDecimal(46, 20, 86.7, 'W'), restricao: { fl: 150, tipo: "AT"  } },
                        { nome: "GR264", lat: dmsParaDecimal(22, 50, 51.7, 'S'), lon: dmsParaDecimal(46, 25, 96.7, 'W')  },
                        { nome: "GR266", lat: dmsParaDecimal(22, 49, 60, 'S'), lon: dmsParaDecimal(46, 32, 16.7, 'W')  },
                        { nome: "GR267", lat: dmsParaDecimal(22, 49, 98.3, 'S'), lon: dmsParaDecimal(46, 37, 56.7, 'W')  },
                        { nome: "GR268", lat: dmsParaDecimal(22, 51, 60, 'S'), lon: dmsParaDecimal(46, 43, 15, 'W')  },
                        { nome: "GR271", lat: dmsParaDecimal(22, 54, 78.3, 'S'), lon: dmsParaDecimal(46, 48, 66.7, 'W'), restricao: { fl: 150, tipo: "AT"  } },
                        { nome: "SANPA", lat: dmsParaDecimal(23, 12, 50, 'S'), lon: dmsParaDecimal(46, 32, 98.3, 'W'), restricao: { fl: 90, flMax: 100, tipo: "WINDOW"  } },
                        { nome: "GR253", lat: dmsParaDecimal(23, 16, 11.7, 'S'), lon: dmsParaDecimal(46, 26, 60, 'W')  },
                        { nome: "GR254", lat: dmsParaDecimal(23, 16, 23.3, 'S'), lon: dmsParaDecimal(46, 18, 38.3, 'W')  },
                        { nome: "UTKUG", lat: dmsParaDecimal(23, 18, 6.7, 'S'), lon: dmsParaDecimal(46, 14, 51.7, 'W'), restricao: { fl: 60, tipo: "AT"  } }
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
                        { nome: "EDMUS", lat: dmsParaDecimal(23, 11, 35, 'S'), lon: dmsParaDecimal(45, 23, 15, 'W'), restricao: { fl: 170, tipo: "AT"  } },
                        { nome: "NIBVO", lat: dmsParaDecimal(23, 13, 60, 'S'), lon: dmsParaDecimal(45, 33, 35, 'W'), restricao: { fl: 150, tipo: "BELOW"  } },
                        { nome: "POLYP", lat: dmsParaDecimal(23, 19, 40, 'S'), lon: dmsParaDecimal(45, 54, 38.3, 'W')  },
                        { nome: "GR282", lat: dmsParaDecimal(23, 8, 61.7, 'S'), lon: dmsParaDecimal(46, 9, 25, 'W'), restricao: { fl: 80, tipo: "AT"  } },
                        { nome: "GR278", lat: dmsParaDecimal(23, 20, 71.7, 'S'), lon: dmsParaDecimal(45, 59, 16.7, 'W'), restricao: { fl: 90, tipo: "AT"  } },
                        { nome: "GR281", lat: dmsParaDecimal(23, 10, 93.3, 'S'), lon: dmsParaDecimal(46, 4, 38.3, 'W') },
                        { nome: "GR279", lat: dmsParaDecimal(23, 15, 45, 'S'), lon: dmsParaDecimal(46, 0, 93.3, 'W') },
                        { nome: "UTKUG", lat: dmsParaDecimal(23, 18, 6.7, 'S'), lon: dmsParaDecimal(46, 14, 51.7, 'W'), restricao: { fl: 60, tipo: "AT"  } }
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
                        { nome: "ZARES", lat: dmsParaDecimal(22, 45, 96.7, 'S'), lon: dmsParaDecimal(47, 57, 26.7, 'W')  },
                        { nome: "GR073", lat: dmsParaDecimal(22, 49, 25, 'S'), lon: dmsParaDecimal(47, 50, 48.3, 'W'), restricao: { fl: 270, tipo: "AT"  } },
                        { nome: "GR327", lat: dmsParaDecimal(22, 59, 66, 'S'), lon: dmsParaDecimal(47, 28, 92, 'W'), restricao: { fl: 240, tipo: "AT"  } },
                        { nome: "GR074", lat: dmsParaDecimal(23, 2, 35, 'S'), lon: dmsParaDecimal(47, 23, 38.3, 'W'), restricao: { fl: 230, tipo: "AT"  } },
                        { nome: "BUXUK", lat: dmsParaDecimal(23, 45, 83.3, 'S'), lon: dmsParaDecimal(47, 48, 95, 'W')  },
                        { nome: "GR071", lat: dmsParaDecimal(23, 39, 0, 'S'), lon: dmsParaDecimal(47, 41, 75, 'W'), restricao: { fl: 270, tipo: "AT"  } },
                        { nome: "GR072", lat: dmsParaDecimal(23, 23, 10, 'S'), lon: dmsParaDecimal(47, 25, 6.7, 'W'), restricao: { fl: 230, tipo: "AT"  } },
                        { nome: "MOLLE", lat: dmsParaDecimal(23, 8, 74, 'S'), lon: dmsParaDecimal(47, 10, 0.1, 'W')  },
                        { nome: "GR249", lat: dmsParaDecimal(23, 4, 31.7, 'S'), lon: dmsParaDecimal(47, 4, 88.3, 'W'), restricao: { fl: 190, tipo: "AT"  } },
                        { nome: "GR076", lat: dmsParaDecimal(22, 58, 45, 'S'), lon: dmsParaDecimal(46, 57, 98.3, 'W'), restricao: { fl: 160, tipo: "AT"  } },
                        { nome: "GR077", lat: dmsParaDecimal(22, 54, 18.3, 'S'), lon: dmsParaDecimal(46, 52, 96.7, 'W'), restricao: { fl: 140, tipo: "AT"  } },
                        { nome: "GR252", lat: dmsParaDecimal(22, 52, 8.3, 'S'), lon: dmsParaDecimal(46, 50, 50, 'W'), restricao: { fl: 140, tipo: "AT"  } },
                        { nome: "GR272", lat: dmsParaDecimal(22, 48, 76.7, 'S'), lon: dmsParaDecimal(46, 43, 93.3, 'W')  },
                        { nome: "GR273", lat: dmsParaDecimal(22, 47, 6.7, 'S'), lon: dmsParaDecimal(46, 37, 70, 'W')  },
                        { nome: "GR274", lat: dmsParaDecimal(22, 46, 70, 'S'), lon: dmsParaDecimal(46, 31, 21.7, 'W')  },
                        { nome: "GR276", lat: dmsParaDecimal(22, 47, 70, 'S'), lon: dmsParaDecimal(46, 24, 80, 'W')  },
                        { nome: "GR277", lat: dmsParaDecimal(22, 50, 40, 'S'), lon: dmsParaDecimal(46, 18, 33.3, 'W'), restricao: { fl: 140, tipo: "AT"  } },
                        { nome: "SANPA", lat: dmsParaDecimal(23, 12, 50, 'S'), lon: dmsParaDecimal(46, 32, 98.3, 'W'), restricao: { fl: 90, flMax: 100, tipo: "WINDOW"  } }
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
                        { nome: "VUSNI", lat: dmsParaDecimal(23, 24, 31.89, 'S'), lon: dmsParaDecimal(46, 22, 33.86, 'W'), restricao: { fl: 40, tipo: "AT" }, papel: "FAF", isFAF: true },
                        { nome: "RW28L", lat: dmsParaDecimal(23, 25, 52.02, 'S'), lon: dmsParaDecimal(46, 27, 31.02, 'W'), restricao: { fl: 25, tipo: "AT" }, papel: "MAPT", isThreshold: true }
                    ],
                    linhas: [
                        ["UTKUG", "ETIKO", "VUSNI", "RW28L"]
                    ]
                }
            },
            AIC: {},
            SID: {
                "EVNEB_3A": {
                    nome: "EVNEB 3A",
                    cor: '#fbff00',
                    fixos: [
                        {nome: "RW10L", lat: dmsParaDecimal(23,26,3.3,'S'), lon: dmsParaDecimal(46,28,95,'W')},
                        { nome: "EVNEB", lat: dmsParaDecimal(23, 27, 71.7, 'S'), lon: dmsParaDecimal(46, 34, 40, 'W') },
                        { nome: "GR237", lat: dmsParaDecimal(23, 32, 13.3, 'S'), lon: dmsParaDecimal(46, 34, 5, 'W'), restricao: { fl: 65, tipo: "ABOVE" } },
                        { nome: "GR242", lat: dmsParaDecimal(23, 34, 90, 'S'), lon: dmsParaDecimal(46, 22, 60, 'W'), restricao: { fl: 160, tipo: "BELOW" } },
                        { nome: "GR232", lat: dmsParaDecimal(23, 30, 40, 'S'), lon: dmsParaDecimal(46, 2, 28.3, 'W') },
                        { nome: "NIBRU", lat: dmsParaDecimal(23, 34, 38.3, 'S'), lon: dmsParaDecimal(45, 28, 13.3, 'W') },
                        { nome: "UREMI", lat: dmsParaDecimal(23, 23, 33.3, 'S'), lon: dmsParaDecimal(45, 30, 76.7, 'W') },
                        { nome: "ISOXO", lat: dmsParaDecimal(23, 25, 86.7, 'S'), lon: dmsParaDecimal(45, 59, 76.7, 'W'), restricao: { fl: 160, tipo: "ABOVE" } },
                        { nome: "ORIMU", lat: dmsParaDecimal(23, 15, 83.3, 'S'), lon: dmsParaDecimal(45, 59, 41.7, 'W'), restricao: { fl: 220, tipo: "BELOW" } },
                        { nome: "VUMEV", lat: dmsParaDecimal(22, 53, 20, 'S'), lon: dmsParaDecimal(45, 58, 63.3, 'W') },
                        { nome: "NUXEL", lat: dmsParaDecimal(22, 16, 98.3, 'S'), lon: dmsParaDecimal(45, 49, 30, 'W') }
                    ],
                    linhas: [
                        ["RW10L", "EVNEB", "GR237", "GR242", "GR232", "NIBRU"],
                        ["GR232", "UREMI"],
                        ["GR232", "ISOXO", "ORIMU", "VUMEV", "NUXEL"]
                    ]
                },
        
                "XOLUS_1A": {
                    nome: "XOLUS 1A",
                    cor: '#fbff00',
                    fixos: [
                        {nome: "RW10L", lat: dmsParaDecimal(23, 26, 17.76, 'S'),lon: dmsParaDecimal(46, 29, 16.96, 'W')},
                        { nome: "GR323", lat: dmsParaDecimal(23, 23, 6.7, 'S'), lon: dmsParaDecimal(46, 41, 10, 'W') },
                        { nome: "GR081", lat: dmsParaDecimal(23, 14, 93.3, 'S'), lon: dmsParaDecimal(46, 49, 66.7, 'W') },
                        { nome: "GR082", lat: dmsParaDecimal(23, 11, 65, 'S'), lon: dmsParaDecimal(46, 53, 10, 'W'), restricao: { fl: 120, tipo: "ABOVE" } },
                        { nome: "GR083", lat: dmsParaDecimal(23, 5, 6.7, 'S'), lon: dmsParaDecimal(46, 57, 33.3, 'W'), restricao: { fl: 130, tipo: "ABOVE" } },
                        { nome: "GR084", lat: dmsParaDecimal(22, 57, 21.7, 'S'), lon: dmsParaDecimal(47, 2, 36.7, 'W'), restricao: { fl: 150, tipo: "BELOW" } },
                        { nome: "GR086", lat: dmsParaDecimal(22, 52, 16.7, 'S'), lon: dmsParaDecimal(47, 3, 5, 'W') },
                        { nome: "XOLUS", lat: dmsParaDecimal(22, 44, 15, 'S'), lon: dmsParaDecimal(47, 4, 15, 'W'), restricao: { fl: 190, tipo: "BELOW" } },
                        { nome: "GERTU", lat: dmsParaDecimal(22, 25, 80, 'S'), lon: dmsParaDecimal(47, 33, 73.3, 'W') },
                        { nome: "ISMOB", lat: dmsParaDecimal(21, 47, 35, 'S'), lon: dmsParaDecimal(47, 11, 81.7, 'W') }
                    ],
                    linhas: [
                        ["RW10L", "GR323", "GR081", "GR082", "GR083", "GR084", "GR086", "XOLUS", "GERTU"],
                        ["XOLUS", "ISMOB"]
                    ]
                },
                "CGO_4B": {
                    nome: "CGO 4B",
                    cor: '#fbff00',
                    fixos: [
                        {nome: "RW10L", lat: dmsParaDecimal(23, 26, 17.76, 'S'),lon: dmsParaDecimal(46, 29, 16.96, 'W')},
                        { nome: "EVNEB", lat: dmsParaDecimal(23, 27, 71.7, 'S'), lon: dmsParaDecimal(46, 34, 40, 'W') },
                        { nome: "GR237", lat: dmsParaDecimal(23, 32, 13.3, 'S'), lon: dmsParaDecimal(46, 34, 5, 'W'), restricao: { fl: 65, tipo: "ABOVE" } },
                        { nome: "VUNVU", lat: dmsParaDecimal(23, 36, 78.3, 'S'), lon: dmsParaDecimal(46, 33, 36.7, 'W') },
                        { nome: "CGO", lat: dmsParaDecimal(23, 37, 63.3, 'S'), lon: dmsParaDecimal(46, 39, 26.7, 'W'), restricao: { fl: 100, tipo: "ABOVE" } },
                        { nome: "ZORZA", lat: dmsParaDecimal(23, 42, 48.3, 'S'), lon: dmsParaDecimal(46, 47, 60, 'W') },
                        { nome: "MADNI", lat: dmsParaDecimal(24, 36, 43.3, 'S'), lon: dmsParaDecimal(47, 0, 53.3, 'W') },
                        { nome: "UBSOD", lat: dmsParaDecimal(24, 15, 70, 'S'), lon: dmsParaDecimal(47, 8, 65, 'W') },
                        { nome: "SOVSI", lat: dmsParaDecimal(24, 6, 31.7, 'S'), lon: dmsParaDecimal(47, 28, 31.7, 'W') },
                        { nome: "GR219", lat: dmsParaDecimal(23, 36, 46.7, 'S'), lon: dmsParaDecimal(47, 9, 43.3, 'W'), restricao: { fl: 190, tipo: "ABOVE" } },
                        { nome: "UGTIX", lat: dmsParaDecimal(23, 16, 86.7, 'S'), lon: dmsParaDecimal(47, 13, 71.7, 'W'), restricao: { fl: 250, tipo: "ABOVE" } },
                        { nome: "LESSA", lat: dmsParaDecimal(23, 10, 58.3, 'S'), lon: dmsParaDecimal(47, 37, 68.3, 'W') },
                        { nome: "ASETA", lat: dmsParaDecimal(23, 17, 13.3, 'S'), lon: dmsParaDecimal(48, 5, 73.3, 'W') },
                        { nome: "EGEVA", lat: dmsParaDecimal(23, 8, 38.3, 'S'), lon: dmsParaDecimal(48, 33, 68.3, 'W') }
                    ],
                    linhas: [
                        ["RW10L", "EVNEB", "GR237", "VUNVU", "CGO", "ZORZA", "MADNI"],
                        ["ZORZA", "UBSOD"],
                        ["ZORZA", "SOVSI"],
                        ["ZORZA", "GR219", "UGTIX", "LESSA", "ASETA"],
                        ["LESSA", "EGEVA"]
                    ]
                }
            }
        },
        "28R": {
            SID: {
                "ISNAP_2A": {
                    nome: "ISNAP 2A",
                    cor: '#fbff00',
                    fixos: [
                        {nome: "RW10L", lat: dmsParaDecimal(23, 26, 17.76, 'S'),lon: dmsParaDecimal(46, 29, 16.96, 'W')},
                        { nome: "ISNAP", lat: dmsParaDecimal(23, 27, 60, 'S'), lon: dmsParaDecimal(46, 34, 68.3, 'W') },
                        { nome: "GR237", lat: dmsParaDecimal(23, 32, 13.3, 'S'), lon: dmsParaDecimal(46, 34, 5, 'W'), restricao: { fl: 65, tipo: "ABOVE" } },
                        { nome: "GR242", lat: dmsParaDecimal(23, 34, 90, 'S'), lon: dmsParaDecimal(46, 22, 60, 'W'), restricao: { fl: 160, tipo: "BELOW" } },
                        { nome: "GR232", lat: dmsParaDecimal(23, 30, 40, 'S'), lon: dmsParaDecimal(46, 2, 28.3, 'W') },
                        { nome: "NIBRU", lat: dmsParaDecimal(23, 34, 38.3, 'S'), lon: dmsParaDecimal(45, 28, 13.3, 'W') },
                        { nome: "UREMI", lat: dmsParaDecimal(23, 23, 33.3, 'S'), lon: dmsParaDecimal(45, 30, 76.7, 'W') },
                        { nome: "ISOXO", lat: dmsParaDecimal(23, 25, 86.7, 'S'), lon: dmsParaDecimal(45, 59, 76.7, 'W'), restricao: { fl: 160, tipo: "ABOVE" } },
                        { nome: "ORIMU", lat: dmsParaDecimal(23, 15, 83.3, 'S'), lon: dmsParaDecimal(45, 59, 41.7, 'W'), restricao: { fl: 220, tipo: "BELOW" } },
                        { nome: "VUMEV", lat: dmsParaDecimal(22, 53, 20, 'S'), lon: dmsParaDecimal(45, 58, 63.3, 'W') },
                        { nome: "NUXEL", lat: dmsParaDecimal(22, 16, 98.3, 'S'), lon: dmsParaDecimal(45, 49, 30, 'W') }
                    ],
                    linhas: [
                        ["RW10L", "ISNAP", "GR237", "GR242", "GR232", "NIBRU"],
                        ["GR232", "UREMI"],
                        ["GR232", "ISOXO", "ORIMU", "VUMEV", "NUXEL"]
                    ]
                },
              
                "XOLUS_1A": {
                    nome: "XOLUS 1A",
                    cor: '#fbff00',
                    fixos: [
                        {nome: "RW10L", lat: dmsParaDecimal(23, 26, 17.76, 'S'),lon: dmsParaDecimal(46, 29, 16.96, 'W')},
                        { nome: "GR323", lat: dmsParaDecimal(23, 23, 6.7, 'S'), lon: dmsParaDecimal(46, 41, 10, 'W') },
                        { nome: "GR081", lat: dmsParaDecimal(23, 14, 93.3, 'S'), lon: dmsParaDecimal(46, 49, 66.7, 'W') },
                        { nome: "GR082", lat: dmsParaDecimal(23, 11, 65, 'S'), lon: dmsParaDecimal(46, 53, 10, 'W'), restricao: { fl: 120, tipo: "ABOVE" } },
                        { nome: "GR083", lat: dmsParaDecimal(23, 5, 6.7, 'S'), lon: dmsParaDecimal(46, 57, 33.3, 'W'), restricao: { fl: 130, tipo: "ABOVE" } },
                        { nome: "GR084", lat: dmsParaDecimal(22, 57, 21.7, 'S'), lon: dmsParaDecimal(47, 2, 36.7, 'W'), restricao: { fl: 150, tipo: "BELOW" } },
                        { nome: "GR086", lat: dmsParaDecimal(22, 52, 16.7, 'S'), lon: dmsParaDecimal(47, 3, 5, 'W') },
                        { nome: "XOLUS", lat: dmsParaDecimal(22, 44, 15, 'S'), lon: dmsParaDecimal(47, 4, 15, 'W'), restricao: { fl: 190, tipo: "BELOW" } },
                        { nome: "GERTU", lat: dmsParaDecimal(22, 25, 80, 'S'), lon: dmsParaDecimal(47, 33, 73.3, 'W') },
                        { nome: "ISMOB", lat: dmsParaDecimal(21, 47, 35, 'S'), lon: dmsParaDecimal(47, 11, 81.7, 'W') }
                    ],
                    linhas: [
                        ["RW10L", "GR323", "GR081", "GR082", "GR083", "GR084", "GR086", "XOLUS", "GERTU"],
                        ["XOLUS", "ISMOB"]
                    ]
                },
                "ZORZA_5B": {
                    nome: "ZORZA 5B",
                    cor: '#fbff00',
                    fixos: [
                        {nome: "RW10L", lat: dmsParaDecimal(23, 26, 17.76, 'S'),lon: dmsParaDecimal(46, 29, 16.96, 'W')},
                        { nome: "ISNAP", lat: dmsParaDecimal(23, 27, 60, 'S'), lon: dmsParaDecimal(46, 34, 68.3, 'W') },
                        { nome: "GR237", lat: dmsParaDecimal(23, 32, 13.3, 'S'), lon: dmsParaDecimal(46, 34, 5, 'W'), restricao: { fl: 65, tipo: "ABOVE" } },
                        { nome: "VUNVU", lat: dmsParaDecimal(23, 36, 78.3, 'S'), lon: dmsParaDecimal(46, 33, 36.7, 'W') },
                        { nome: "CGO", lat: dmsParaDecimal(23, 37, 63.3, 'S'), lon: dmsParaDecimal(46, 39, 26.7, 'W'), restricao: { fl: 100, tipo: "ABOVE" } },
                        { nome: "ZORZA", lat: dmsParaDecimal(23, 42, 48.3, 'S'), lon: dmsParaDecimal(46, 47, 60, 'W') },
                        { nome: "MADNI", lat: dmsParaDecimal(24, 36, 43.3, 'S'), lon: dmsParaDecimal(47, 0, 53.3, 'W') },
                        { nome: "UBSOD", lat: dmsParaDecimal(24, 15, 70, 'S'), lon: dmsParaDecimal(47, 8, 65, 'W') },
                        { nome: "SOVSI", lat: dmsParaDecimal(24, 6, 31.7, 'S'), lon: dmsParaDecimal(47, 28, 31.7, 'W') },
                        { nome: "GR219", lat: dmsParaDecimal(23, 36, 46.7, 'S'), lon: dmsParaDecimal(47, 9, 43.3, 'W'), restricao: { fl: 190, tipo: "ABOVE" } },
                        { nome: "UGTIX", lat: dmsParaDecimal(23, 16, 86.7, 'S'), lon: dmsParaDecimal(47, 13, 71.7, 'W'), restricao: { fl: 250, tipo: "ABOVE" } },
                        { nome: "LESSA", lat: dmsParaDecimal(23, 10, 58.3, 'S'), lon: dmsParaDecimal(47, 37, 68.3, 'W') },
                        { nome: "ASETA", lat: dmsParaDecimal(23, 17, 13.3, 'S'), lon: dmsParaDecimal(48, 5, 73.3, 'W') },
                        { nome: "EGEVA", lat: dmsParaDecimal(23, 8, 38.3, 'S'), lon: dmsParaDecimal(48, 33, 68.3, 'W') }
                    ],
                    linhas: [
                        ["RW10L", "ISNAP", "GR237", "VUNVU", "CGO", "ZORZA", "MADNI"],
                        ["ZORZA", "UBSOD"],
                        ["ZORZA", "SOVSI"],
                        ["ZORZA", "GR219", "UGTIX", "LESSA", "ASETA"],
                        ["LESSA", "EGEVA"]
                    ]
                }
            }
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
                        { nome: "EDMUS", lat: dmsParaDecimal(23, 11, 35, 'S'), lon: dmsParaDecimal(45, 23, 15, 'W')  },
                        { nome: "NIBVO", lat: dmsParaDecimal(23, 13, 60, 'S'), lon: dmsParaDecimal(45, 33, 35, 'W')  },
                        { nome: "KP153", lat: dmsParaDecimal(23, 22, 35, 'S'), lon: dmsParaDecimal(46, 4, 78.3, 'W'), restricao: { fl: 260, tipo: "BELOW"  } },
                        { nome: "KP154", lat: dmsParaDecimal(23, 27, 46.7, 'S'), lon: dmsParaDecimal(46, 22, 98.3, 'W')  },
                        { nome: "KP213", lat: dmsParaDecimal(23, 17, 43.3, 'S'), lon: dmsParaDecimal(46, 38, 40, 'W'), restricao: { fl: 140, tipo: "ABOVE"  } },
                        { nome: "KP212", lat: dmsParaDecimal(23, 14, 31.7, 'S'), lon: dmsParaDecimal(46, 41, 15, 'W'), restricao: { fl: 130, tipo: "ABOVE"  } },
                        { nome: "KP211", lat: dmsParaDecimal(23, 11, 20, 'S'), lon: dmsParaDecimal(46, 43, 88.3, 'W'), restricao: { fl: 120, tipo: "ABOVE"  } },
                        { nome: "KP208", lat: dmsParaDecimal(23, 1, 81.7, 'S'), lon: dmsParaDecimal(46, 52, 13.3, 'W')  },
                        { nome: "KP209", lat: dmsParaDecimal(23, 1, 13.3, 'S'), lon: dmsParaDecimal(46, 56, 41.7, 'W'), restricao: { fl: 110, tipo: "BELOW"  } },
                        { nome: "KP207", lat: dmsParaDecimal(22, 55, 58.3, 'S'), lon: dmsParaDecimal(47, 4, 6.7, 'W'), restricao: { fl: 90, tipo: "ABOVE"  } },
                        { nome: "ENTIT", lat: dmsParaDecimal(22, 25, 5, 'S'), lon: dmsParaDecimal(46, 39, 46.7, 'W'), restricao: { fl: 190, tipo: "BELOW"  } },
                        { nome: "KP203", lat: dmsParaDecimal(22, 33, 93.3, 'S'), lon: dmsParaDecimal(46, 52, 3.3, 'W'), restricao: { fl: 110, tipo: "BELOW"  } },
                        { nome: "KP204", lat: dmsParaDecimal(22, 38, 80, 'S'), lon: dmsParaDecimal(46, 58, 93.3, 'W'), restricao: { fl: 90, tipo: "BELOW"  } }
                        
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
                        { nome: "GNOME", lat: dmsParaDecimal(23, 13, 38.3, 'S'), lon: dmsParaDecimal(47, 58, 91.7, 'W'), restricao: { fl: 160, flMax: 170, tipo: "WINDOW"  } },
                        { nome: "EDRAT", lat: dmsParaDecimal(23, 50, 35, 'S'), lon: dmsParaDecimal(48, 18, 40, 'W')  },
                        { nome: "KP219", lat: dmsParaDecimal(23, 17, 71.7, 'S'), lon: dmsParaDecimal(47, 53, 80, 'W'), restricao: { fl: 160, tipo: "BELOW"  } },
                        { nome: "VERME", lat: dmsParaDecimal(23, 12, 53.3, 'S'), lon: dmsParaDecimal(47, 49, 91.7, 'W')  },
                        { nome: "KP217", lat: dmsParaDecimal(23, 10, 8.3, 'S'), lon: dmsParaDecimal(47, 44, 88.3, 'W'), restricao: { fl: 120, tipo: "ABOVE"  } },
                        { nome: "KP216", lat: dmsParaDecimal(23, 6, 26.7, 'S'), lon: dmsParaDecimal(47, 37, 10, 'W'), restricao: { fl: 100, tipo: "BELOW"  } },
                        { nome: "KP214", lat: dmsParaDecimal(23, 2, 63.3, 'S'), lon: dmsParaDecimal(47, 29, 70, 'W'), restricao: { fl: 80, tipo: "ABOVE"  } }
                        
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
                        { nome: "UTLOT", lat: dmsParaDecimal(22, 28, 43.3, 'S'), lon: dmsParaDecimal(47, 53, 53.3, 'W'), restricao: { fl: 160, tipo: "BELOW"  } },
                        { nome: "KP201", lat: dmsParaDecimal(22, 42, 28.3, 'S'), lon: dmsParaDecimal(47, 35, 10, 'W')  },
                        { nome: "NOBRE", lat: dmsParaDecimal(22, 50, 78.3, 'S'), lon: dmsParaDecimal(47, 21, 55, 'W'), restricao: { fl: 60, tipo: "BELOW"  } }
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
                        { nome: "ATARA", lat: dmsParaDecimal(22, 54, 17.47, 'S'), lon: dmsParaDecimal(47, 17, 39.01, 'W'), restricao: { fl: 44, tipo: "AT" }, papel: "IF" },
                        { nome: "NILKA", lat: dmsParaDecimal(22, 58, 53.30, 'S'), lon: dmsParaDecimal(47, 21, 35.0, 'W'), restricao: { fl: 65, tipo: "AT" }, papel: "IAF" },
                        { nome: "SEBSU", lat: dmsParaDecimal(22, 57, 25.64, 'S'), lon: dmsParaDecimal(47, 13, 12.31, 'W'), restricao: { fl: 37, tipo: "AT" }, papel: "IAF" },
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
                        SID: {
               
                "EGBEN 1A-RNAV EGBEN 1A - ISMOB 1A": {
                    nome: "EGBEN 1A-RNAV EGBEN 1A - ISMOB 1A",
                    cor: '#54f161',
                    fixos: [
                        { nome: "RWY33",lat: dmsParaDecimal(23, 1, 20.65, 'S'),lon: dmsParaDecimal(47, 7, 39.23, 'W') },
                        { nome: "KP241", lat: dmsParaDecimal(23, 0, 31.7, 'S'), lon: dmsParaDecimal(47, 1, 13.3, 'W')},
                        { nome: "EGBEN", lat: dmsParaDecimal(22, 54, 23.3, 'S'), lon: dmsParaDecimal(46, 56, 15, 'W'), restricao: { fl: 80, tipo: "BELOW" } },
                        { nome: "DEXIB", lat: dmsParaDecimal(22, 45, 93.3, 'S'), lon: dmsParaDecimal(47, 1, 26.7, 'W'),restricao: { fl: 100, tipo: "ABOVE" } },
                        { nome: "KP237", lat: dmsParaDecimal(22, 39, 13.3, 'S'), lon: dmsParaDecimal(47, 5, 0, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "ISMOB", lat: dmsParaDecimal(21, 47, 35, 'S'), lon: dmsParaDecimal(47, 11, 81.7, 'W'), restricao: { fl: 130, tipo: "ABOVE" } },
                        { nome: "KP179", lat: dmsParaDecimal(22, 17, 10, 'S'), lon: dmsParaDecimal(47, 17, 5, 'W') },
                        { nome: "KP241", lat: dmsParaDecimal(23, 0, 31.7, 'S'), lon: dmsParaDecimal(47, 1, 13.3, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "KP249", lat: dmsParaDecimal(22, 38, 68.3, 'S'), lon: dmsParaDecimal(46, 40, 45, 'W'), restricao: { fl: 90, tipo: "BELOW" } },
                        { nome: "KP242", lat: dmsParaDecimal(22, 46, 45, 'S'), lon: dmsParaDecimal(46, 48, 93.3, 'W') },
                        { nome: "KP243", lat: dmsParaDecimal(22, 44, 31.7, 'S'), lon: dmsParaDecimal(46, 46, 61.7, 'W') },
                        { nome: "URRAO", lat: dmsParaDecimal(22, 40, 81.7, 'S'), lon: dmsParaDecimal(46, 42, 76.7, 'W') },
                        { nome: "KP244", lat: dmsParaDecimal(22, 40, 98.3, 'S'), lon: dmsParaDecimal(46, 23, 28.3, 'W'),restricao: { fl: 190, tipo: "ABOVE" } },
                        { nome: "KONVI", lat: dmsParaDecimal(22, 41, 6.7, 'S'), lon: dmsParaDecimal(46, 10, 55, 'W'), restricao: { fl: 130, tipo: "ABOVE" } },
                        {nome: "NUXEL", lat: dmsParaDecimal(22,16,98.30,'S'), lon: dmsParaDecimal(45,49,30.00,'W')}
                    ],
                    linhas: [
                        ["RWY33", "KP241", "EGBEN"],
                        ["EGBEN","DEXIB", "KP237", "KP179","ISMOB"],
                        ["EGBEN","KP242", "KP243", "URRAO", "KP244", "KONVI","NUXEL"]

                    ]
                },
               
                "KONVI_2C": {
                    nome: "KONVI 2C",
                    cor: '#54f161',
                    fixos: [
                        { nome: "RWY33",lat: dmsParaDecimal(23, 1, 20.65, 'S'),lon: dmsParaDecimal(47, 7, 39.23, 'W') },
                        { nome: "EGBEN", lat: dmsParaDecimal(22, 54, 23.3, 'S'), lon: dmsParaDecimal(46, 56, 15, 'W'), restricao: { fl: 130, tipo: "ABOVE" } },
                        { nome: "KP241", lat: dmsParaDecimal(23, 0, 31.7, 'S'), lon: dmsParaDecimal(47, 1, 13.3, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "KP249", lat: dmsParaDecimal(22, 38, 68.3, 'S'), lon: dmsParaDecimal(46, 40, 45, 'W'), restricao: { fl: 90, tipo: "BELOW" } },
                        { nome: "KP242", lat: dmsParaDecimal(22, 46, 45, 'S'), lon: dmsParaDecimal(46, 48, 93.3, 'W') },
                        { nome: "KP243", lat: dmsParaDecimal(22, 44, 31.7, 'S'), lon: dmsParaDecimal(46, 46, 61.7, 'W') },
                        { nome: "URRAO", lat: dmsParaDecimal(22, 40, 81.7, 'S'), lon: dmsParaDecimal(46, 42, 76.7, 'W') },
                        { nome: "KP244", lat: dmsParaDecimal(22, 40, 98.3, 'S'), lon: dmsParaDecimal(46, 23, 28.3, 'W') },
                        { nome: "KONVI", lat: dmsParaDecimal(22, 41, 6.7, 'S'), lon: dmsParaDecimal(46, 10, 55, 'W'), restricao: { fl: 130, tipo: "ABOVE" } }
                    ],
                    linhas: [
                        ["RWY33", "KP241", "EGBEN","KP242", "KP243", "URRAO", "KP249","KP244", "KONVI"]
                    ]
                },
                "OSUDO_4A": {
                    nome: "OSUDO 4A",
                    cor: '#54f161',
                    fixos: [
                        { nome: "RWY33",lat: dmsParaDecimal(23, 1, 20.65, 'S'),lon: dmsParaDecimal(47, 7, 39.23, 'W') },
                        { nome: "OSUDO", lat: dmsParaDecimal(23, 6, 50, 'S'), lon: dmsParaDecimal(47, 8, 23.3, 'W'), restricao: { fl: 90, tipo: "BELOW" } },
                        { nome: "KP246", lat: dmsParaDecimal(23, 12, 16.7, 'S'), lon: dmsParaDecimal(47, 13, 58.3, 'W') },
                        { nome: "KP247", lat: dmsParaDecimal(23, 17, 30, 'S'), lon: dmsParaDecimal(47, 14, 98.3, 'W'), restricao: { fl: 110, tipo: "ABOVE" } },
                        { nome: "KP248", lat: dmsParaDecimal(23, 32, 10, 'S'), lon: dmsParaDecimal(47, 18, 98.3, 'W'), restricao: { fl: 170, tipo: "ABOVE" } },
                        { nome: "SOVSI", lat: dmsParaDecimal(24, 6, 31.7, 'S'), lon: dmsParaDecimal(47, 28, 31.7, 'W'), restricao: { fl: 230, tipo: "ABOVE" } },
                        { nome: "KP238", lat: dmsParaDecimal(23, 2, 15, 'S'), lon: dmsParaDecimal(47, 19, 88.3, 'W'), restricao: { fl: 90, tipo: "BELOW" } },
                        { nome: "KP239", lat: dmsParaDecimal(23, 7, 10, 'S'), lon: dmsParaDecimal(47, 32, 60, 'W'), restricao: { fl: 140, tipo: "ABOVE" } },
                        { nome: "KP264", lat: dmsParaDecimal(22, 46, 10, 'S'), lon: dmsParaDecimal(48, 2, 73.3, 'W')},
                        {nome: "OBLUG", lat: dmsParaDecimal(22,36,56.70,'S'), lon: dmsParaDecimal(48,27,56.70,'W')},
                        {nome: "OPNOB", lat: dmsParaDecimal(23,7,53.30,'S'), lon: dmsParaDecimal(47,51,13.30,'W')},
                        {nome: "ASETA", lat: dmsParaDecimal(23,17,13.30,'S'), lon: dmsParaDecimal(48,5,73.30,'W')},
                        {nome: "EGEVA", lat: dmsParaDecimal(23,8,38.30,'S'), lon: dmsParaDecimal(48,33,68.30,'W')}



                    ],
                    linhas: [
                        ["RWY33","OSUDO"],
                        ["OSUDO","KP246", "KP247", "KP248", "SOVSI"],
                        ["OSUDO", "KP238", "KP264","OBLUG"],
                        ["OSUDO", "KP239", "OPNOB"],
                        ["OPNOB","ASETA"],
                        ["OPNOB", "EGEVA"]

                    ]
                },
                "UGIKI_1A": {
                    nome: "UGIKI 1A",
                    cor: '#54f161',
                    fixos: [
                        { nome: "RWY33",lat: dmsParaDecimal(23, 1, 20.65, 'S'),lon: dmsParaDecimal(47, 7, 39.23, 'W') },
                        { nome: "KP251", lat: dmsParaDecimal(23, 7, 91.7, 'S'), lon: dmsParaDecimal(47, 2, 5, 'W') },
                        { nome: "KP127", lat: dmsParaDecimal(23, 12, 20, 'S'), lon: dmsParaDecimal(46, 59, 21.7, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "MUDET", lat: dmsParaDecimal(23, 19, 60, 'S'), lon: dmsParaDecimal(46, 55, 33.3, 'W'), restricao: { fl: 120, tipo: "ABOVE" } },
                        { nome: "GUABO", lat: dmsParaDecimal(23, 32, 5, 'S'), lon: dmsParaDecimal(46, 32, 33.3, 'W') },
                        { nome: "UGIKI", lat: dmsParaDecimal(23, 35, 60, 'S'), lon: dmsParaDecimal(46, 25, 78.3, 'W') },
                        { nome: "NIBRU", lat: dmsParaDecimal(23, 34, 38.3, 'S'), lon: dmsParaDecimal(45, 28, 13.3, 'W'), restricao: { fl: 170, tipo: "ABOVE" } },
                        { nome: "UREMI", lat: dmsParaDecimal(23, 23, 33.3, 'S'), lon: dmsParaDecimal(45, 30, 76.7, 'W') }
                    ],
                    linhas: [
                        ["RWY33", "KP251", "KP127", "MUDET", "GUABO", "UGIKI", "NIBRU"],
                        ["UGIKI", "UREMI"]
                    ]
                }
            }
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
                        { nome: "ENTIT", lat: dmsParaDecimal(22, 25, 5, 'S'), lon: dmsParaDecimal(46, 39, 46.7, 'W'), restricao: { fl: 220, tipo: "AT"  } },
                        { nome: "KP204", lat: dmsParaDecimal(22, 38, 80, 'S'), lon: dmsParaDecimal(46, 58, 93.3, 'W'), restricao: { fl: 150, tipo: "AT"  } },
                        { nome: "KP226", lat: dmsParaDecimal(22, 41, 96.7, 'S'), lon: dmsParaDecimal(47, 0, 58.3, 'W'), restricao: { fl: 140, tipo: "AT"  } },
                        { nome: "KP227", lat: dmsParaDecimal(22, 53, 70, 'S'), lon: dmsParaDecimal(47, 6, 66.7, 'W'), restricao: { fl: 90, tipo: "AT"  } },
                        { nome: "KP228", lat: dmsParaDecimal(22, 58, 3.3, 'S'), lon: dmsParaDecimal(47, 0, 68.3, 'W'), restricao: { fl: 80, tipo: "AT"  } },
                        { nome: "KP209", lat: dmsParaDecimal(23, 1, 13.3, 'S'), lon: dmsParaDecimal(46, 56, 41.7, 'W'), restricao: { fl: 65, tipo: "AT"  } }
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
                        { nome: "EDMUS", lat: dmsParaDecimal(23, 11, 35, 'S'), lon: dmsParaDecimal(45, 23, 15, 'W'), restricao: { fl: 300, tipo: "AT"  } },
                        { nome: "NIBVO", lat: dmsParaDecimal(23, 13, 60, 'S'), lon: dmsParaDecimal(45, 33, 35, 'W') },
                        { nome: "KP153", lat: dmsParaDecimal(23, 22, 35, 'S'), lon: dmsParaDecimal(46, 4, 78.3, 'W'), restricao: { fl: 230, tipo: "AT"  } },
                        { nome: "KP154", lat: dmsParaDecimal(23, 27, 46.7, 'S'), lon: dmsParaDecimal(46, 22, 98.3, 'W'), restricao: { fl: 180, tipo: "AT"  } },
                        { nome: "KP213", lat: dmsParaDecimal(23, 17, 43.3, 'S'), lon: dmsParaDecimal(46, 38, 40, 'W'), restricao: { fl: 120, tipo: "AT"  } },
                        { nome: "KP231", lat: dmsParaDecimal(23, 11, 86.7, 'S'), lon: dmsParaDecimal(46, 43, 30, 'W'), restricao: { fl: 80, flMax: 90, tipo: "WINDOW"   } }
                    ],
                    linhas: [
                        ["EDMUS", "NIBVO", "KP153", "KP154", "KP213", "KP231","KP191"]
                    ]
                },

                // =========================================================
                // UBKUP 2A - RWY 33
                // =========================================================
                "UBKUP_2A": {
                    nome: "UBKUP 2A",
                    cor: '#45df5e',
                    fixos: [
                        { nome: "UTLOT", lat: dmsParaDecimal(22, 28, 43.3, 'S'), lon: dmsParaDecimal(47, 53, 53.3, 'W')  },
                        { nome: "KP201", lat: dmsParaDecimal(22, 42, 28.3, 'S'), lon: dmsParaDecimal(47, 35, 10, 'W'), restricao: { fl: 170, tipo: "AT"  } },
                        { nome: "NILKA", lat: dmsParaDecimal(22, 58, 53.3, 'S'), lon: dmsParaDecimal(47, 21, 35, 'W'), restricao: { fl: 120, tipo: "AT"  } },
                        { nome: "KP221", lat: dmsParaDecimal(23, 4, 86.7, 'S'), lon: dmsParaDecimal(47, 12, 53.3, 'W'), restricao: { fl: 90, tipo: "AT"  } },
                        { nome: "KP222", lat: dmsParaDecimal(23, 7, 93.3, 'S'), lon: dmsParaDecimal(47, 8, 23.3, 'W'), restricao: { fl: 75, tipo: "AT"  } },
                        { nome: "EDRAT", lat: dmsParaDecimal(23, 50, 35, 'S'), lon: dmsParaDecimal(48, 18, 40, 'W')  },
                        { nome: "KP224", lat: dmsParaDecimal(23, 26, 81.7, 'S'), lon: dmsParaDecimal(47, 34, 40, 'W'), restricao: { fl: 120, tipo: "AT"  } },
                        { nome: "KP223", lat: dmsParaDecimal(23, 21, 65, 'S'), lon: dmsParaDecimal(47, 24, 81.7, 'W'), restricao: { fl: 90, tipo: "AT"  } },
                        { nome: "KP271", lat: dmsParaDecimal(23, 15, 48.3, 'S'), lon: dmsParaDecimal(47, 13, 41.7, 'W'), restricao: { fl: 80, tipo: "AT"  } },
                        { nome: "UBKUP", lat: dmsParaDecimal(23, 10, 63.3, 'S'), lon: dmsParaDecimal(47, 4, 48.3, 'W'), restricao: { fl: 65, tipo: "AT"  } }
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
                        { nome: "KP209", lat: dmsParaDecimal(23, 1, 13.30, 'S'), lon: dmsParaDecimal(46, 56, 41.70, 'W'), restricao: { fl: 65, tipo: "AT" }, papel: "IAF" },
                        { nome: "KP191", lat: dmsParaDecimal(23, 9, 53.17, 'S'), lon: dmsParaDecimal(46, 55, 32.82, 'W'), restricao: { fl: 65, tipo: "AT" }, papel: "IAF" },
                        { nome: "KP192", lat: dmsParaDecimal(23, 8, 3.35, 'S'), lon: dmsParaDecimal(46, 58, 8.48, 'W'), restricao: { fl: 57, tipo: "AT" } },
                        { nome: "UBKUP", lat: dmsParaDecimal(23, 10, 63.30, 'S'), lon: dmsParaDecimal(47, 4, 48.30, 'W'), restricao: { fl: 65, tipo: "AT" }, papel: "IAF" },
                        { nome: "KP107", lat: dmsParaDecimal(23, 6, 13.52, 'S'), lon: dmsParaDecimal(47, 0, 44.14, 'W'), restricao: { fl: 44, tipo: "AT" }, papel: "IF" },
                        { nome: "ARNIV", lat: dmsParaDecimal(23, 4, 23.69, 'S'), lon: dmsParaDecimal(47, 3, 19.80, 'W'), restricao: { fl: 36, tipo: "AT" }, papel: "FAF", isFAF: true },
                        { nome: "RWY33", lat: dmsParaDecimal(23, 1, 20.65, 'S'), lon: dmsParaDecimal(47, 7, 39.23, 'W'), restricao: { fl: 22, tipo: "BELOW" }, papel: "MAPT", isThreshold: true }
                    ],
                    linhas: [
                        ["KP209", "KP107"],
                        ["UBKUP", "KP107"],
                        ["KP191", "KP192", "KP107", "ARNIV", "RWY33"]
                    ]
                }
            },
            SID: {
                "ASETA_1A": {
                    nome: "ASETA 1A",
                    cor: '#45df5e',
                    fixos: [
                        { nome: "RWY15", lat: dmsParaDecimal(23, 0, 16.60, 'S'),lon: dmsParaDecimal(47, 9, 10.00, 'W') },
                        { nome: "KP257", lat: dmsParaDecimal(22, 57, 70, 'S'), lon: dmsParaDecimal(47, 26, 70, 'W') },
                        { nome: "ASETA", lat: dmsParaDecimal(23, 17, 13.3, 'S'), lon: dmsParaDecimal(48, 5, 73.3, 'W'), restricao: { fl: 200, tipo: "ABOVE" } },
                        {nome: "KP144", lat: dmsParaDecimal(22,58,15.00,'S'), lon: dmsParaDecimal(47,18,83.30,'W')},
                        {nome: "KP274", lat: dmsParaDecimal(23,2,49.17,'S'), lon: dmsParaDecimal(47,43,12.68,'W')}

                    ],
                    linhas: [
                        ["RWY15","KP144", "KP257", "KP274","ASETA"]
                    ]
                },
                "EGEVA_1B": {
                    nome: "EGEVA 1B",
                    cor: '#45df5e',
                    fixos: [
                        { nome: "RWY15", lat: dmsParaDecimal(23, 0, 16.60, 'S'),lon: dmsParaDecimal(47, 9, 10.00, 'W') },
                        { nome: "KP257", lat: dmsParaDecimal(22, 57, 70, 'S'), lon: dmsParaDecimal(47, 26, 70, 'W') },
                        { nome: "EGEVA", lat: dmsParaDecimal(23, 8, 38.3, 'S'), lon: dmsParaDecimal(48, 33, 68.3, 'W'), restricao: { fl: 230, tipo: "ABOVE" } },
                        {nome: "KP144", lat: dmsParaDecimal(22,58,15.00,'S'), lon: dmsParaDecimal(47,18,83.30,'W')},
                        {nome: "KP274", lat: dmsParaDecimal(23,2,49.17,'S'), lon: dmsParaDecimal(47,43,12.68,'W')}
                    ],
                    linhas: [
                        ["RWY15", "KP144","KP257", "KP274", "EGEVA"]
                    ]
                },
                "SOVSI_1A": {
                    nome: "SOVSI 1A",
                    cor: '#45df5e',
                    fixos: [
                        { nome: "RWY15", lat: dmsParaDecimal(23, 0, 16.60, 'S'),lon: dmsParaDecimal(47, 9, 10.00, 'W') },
                        { nome: "KP258", lat: dmsParaDecimal(23, 1, 11.7, 'S'), lon: dmsParaDecimal(47, 14, 16.7, 'W'), restricao: { fl: 80, tipo: "ABOVE" } },
                        { nome: "KP259", lat: dmsParaDecimal(23, 8, 11.7, 'S'), lon: dmsParaDecimal(47, 20, 40, 'W') },
                        { nome: "KP261", lat: dmsParaDecimal(23, 14, 8.3, 'S'), lon: dmsParaDecimal(47, 20, 25, 'W'), restricao: { fl: 100, tipo: "ABOVE" } },
                        { nome: "SOVSI", lat: dmsParaDecimal(24, 6, 31.7, 'S'), lon: dmsParaDecimal(47, 28, 31.7, 'W'), restricao: { fl: 160, tipo: "ABOVE" } },
                        {nome: "KP136", lat: dmsParaDecimal(23,20,35.00,'S'), lon: dmsParaDecimal(47,20,10.00,'W')}
                    ],
                    linhas: [
                        ["RWY15", "KP258", "KP259", "KP261","KP136", "SOVSI"]
                    ]
                },
                "KONVI_2D": {
                    nome: "KONVI 2D",
                    cor: '#45df5e',
                    fixos: [
                        { nome: "RWY15", lat: dmsParaDecimal(23, 0, 16.60, 'S'),lon: dmsParaDecimal(47, 9, 10.00, 'W') },
                        { nome: "KP254", lat: dmsParaDecimal(22, 55, 0, 'S'), lon: dmsParaDecimal(47, 8, 51.7, 'W') },
                        { nome: "KP267", lat: dmsParaDecimal(22, 53, 60, 'S'), lon: dmsParaDecimal(47, 5, 63.3, 'W') },
                        { nome: "KP256", lat: dmsParaDecimal(22, 51, 60, 'S'), lon: dmsParaDecimal(47, 1, 51.7, 'W') },
                        { nome: "KP249", lat: dmsParaDecimal(22, 38, 68.3, 'S'), lon: dmsParaDecimal(46, 40, 45, 'W'), restricao: { fl: 100, tipo: "BELOW" } },
                        { nome: "KP242", lat: dmsParaDecimal(22, 46, 45, 'S'), lon: dmsParaDecimal(46, 48, 93.3, 'W') },
                        { nome: "KP243", lat: dmsParaDecimal(22, 44, 31.7, 'S'), lon: dmsParaDecimal(46, 46, 61.7, 'W') },
                        { nome: "KONVI", lat: dmsParaDecimal(22, 41, 6.7, 'S'), lon: dmsParaDecimal(46, 10, 55, 'W'), restricao: { fl: 130, tipo: "ABOVE" } },
                        { nome: "NUXEL", lat: dmsParaDecimal(22, 16, 98.3, 'S'), lon: dmsParaDecimal(45, 49, 30, 'W') }
                    ],
                    linhas: [
                        ["RW15", "KP254", "KP267", "KP256", "KP243", "KP249","KONVI","NUXEL"]
                    ]
                },
                "KONVI_2B": {
                    nome: "KONVI 2B",
                    cor: '#45df5e',
                    fixos: [
                        { nome: "RWY15", lat: dmsParaDecimal(23, 0, 16.60, 'S'),lon: dmsParaDecimal(47, 9, 10.00, 'W') },
                        { nome: "KP254", lat: dmsParaDecimal(22, 55, 0, 'S'), lon: dmsParaDecimal(47, 8, 51.7, 'W') },
                        { nome: "KP267", lat: dmsParaDecimal(22, 53, 60, 'S'), lon: dmsParaDecimal(47, 5, 63.3, 'W') },
                        { nome: "KP256", lat: dmsParaDecimal(22, 51, 60, 'S'), lon: dmsParaDecimal(47, 1, 51.7, 'W') },
                        { nome: "KP242", lat: dmsParaDecimal(22, 46, 45, 'S'), lon: dmsParaDecimal(46, 48, 93.3, 'W') },
                        { nome: "KP243", lat: dmsParaDecimal(22, 44, 31.7, 'S'), lon: dmsParaDecimal(46, 46, 61.7, 'W') },
                        { nome: "URRAO", lat: dmsParaDecimal(22, 40, 81.7, 'S'), lon: dmsParaDecimal(46, 42, 76.7, 'W') },
                        { nome: "KP244", lat: dmsParaDecimal(22, 40, 98.3, 'S'), lon: dmsParaDecimal(46, 23, 28.3, 'W') },
                        { nome: "KONVI", lat: dmsParaDecimal(22, 41, 6.7, 'S'), lon: dmsParaDecimal(46, 10, 55, 'W'), restricao: { fl: 130, tipo: "ABOVE" } },
                        { nome: "NUXEL", lat: dmsParaDecimal(22, 16, 98.3, 'S'), lon: dmsParaDecimal(45, 49, 30, 'W') },
                    ],
                    linhas: [
                        ["RW15", "KP254", "KP267", "KP256", "KP243", "URRAO","KP244","KONVI","NUXEL"]
                    ]
                },
                "OBLUG_2A": {
                    nome: "OBLUG 2A",
                    cor: '#45df5e',
                    fixos: [
                        { nome: "RWY15", lat: dmsParaDecimal(23, 0, 16.60, 'S'),lon: dmsParaDecimal(47, 9, 10.00, 'W') },
                        { nome: "KP266", lat: dmsParaDecimal(22, 52, 78.3, 'S'), lon: dmsParaDecimal(47, 30, 18.3, 'W'), restricao: { fl: 110, tipo: "ABOVE" } },
                        { nome: "KP268", lat: dmsParaDecimal(22, 43, 85, 'S'), lon: dmsParaDecimal(48, 1, 96.7, 'W'), restricao: { fl: 160, tipo: "ABOVE" } },
                        { nome: "OBLUG", lat: dmsParaDecimal(22, 36, 56.7, 'S'), lon: dmsParaDecimal(48, 27, 56.7, 'W'), restricao: { fl: 200, tipo: "ABOVE" } }
                    ],
                    linhas: [
                        ["RWY15", "KP266", "KP268", "OBLUG"]
                    ]
                },
                "OPGUN_2A": {
                    nome: "OPGUN 2A",
                    cor: '#45df5e',
                    fixos: [
                        { nome: "RWY15", lat: dmsParaDecimal(23, 0, 16.60, 'S'),lon: dmsParaDecimal(47, 9, 10.00, 'W') },
                        { nome: "OPGUN", lat: dmsParaDecimal(22, 54, 41.7, 'S'), lon: dmsParaDecimal(47, 12, 98.3, 'W'), restricao: { fl: 90, tipo: "BELOW" } },
                        { nome: "KP179", lat: dmsParaDecimal(22, 17, 10, 'S'), lon: dmsParaDecimal(47, 17, 5, 'W'), restricao: { fl: 190, tipo: "ABOVE" } },
                        {nome: "ISMOB", lat: dmsParaDecimal(21,47,35.00,'S'), lon: dmsParaDecimal(47,11,81.70,'W')},
                        {nome: "VUPOG", lat: dmsParaDecimal(20,44,53.30,'S'), lon: dmsParaDecimal(48,49,98.30,'W')},
                        { nome: "GERTU", lat: dmsParaDecimal(22, 25, 80, 'S'), lon: dmsParaDecimal(47, 33, 73.3, 'W') }

                    ],
                    linhas: [
                        ["RWY15", "OPGUN"],
                        ["OPGUN","GERTU"],
                        ["OPGUN",  "KP179"],
                        ["KP179","VUPOG"],
                        ["KP179","ISMOB"]
                    ]
                },
                "UGIKI_1B": {
                    nome: "UGIKI 1B",
                    cor: '#45df5e',
                    fixos: [
                        { nome: "RWY15", lat: dmsParaDecimal(23, 0, 16.60, 'S'),lon: dmsParaDecimal(47, 9, 10.00, 'W') },
                        { nome: "KP258", lat: dmsParaDecimal(23, 1, 11.7, 'S'), lon: dmsParaDecimal(47, 14, 16.7, 'W') },
                        { nome: "KP259", lat: dmsParaDecimal(23, 8, 11.7, 'S'), lon: dmsParaDecimal(47, 20, 40, 'W') },
                        { nome: "KP127", lat: dmsParaDecimal(23, 12, 20, 'S'), lon: dmsParaDecimal(46, 59, 21.7, 'W'), restricao: { fl: 110, tipo: "BELOW" } },
                        { nome: "MUDET", lat: dmsParaDecimal(23, 19, 60, 'S'), lon: dmsParaDecimal(46, 55, 33.3, 'W'), restricao: { fl: 120, tipo: "ABOVE" } },
                        { nome: "UGIKI", lat: dmsParaDecimal(23, 35, 60, 'S'), lon: dmsParaDecimal(46, 25, 78.3, 'W') },
                        { nome: "NIBRU", lat: dmsParaDecimal(23, 34, 38.3, 'S'), lon: dmsParaDecimal(45, 28, 13.3, 'W'), restricao: { fl: 170, tipo: "ABOVE" } },
                        { nome: "UREMI", lat: dmsParaDecimal(23, 23, 33.3, 'S'), lon: dmsParaDecimal(45, 30, 76.7, 'W') },
                        {nome: "KP262", lat: dmsParaDecimal(23,12,20.00,'S'), lon: dmsParaDecimal(47,14,70.00,'W')}

                    ],
                    linhas: [
                        ["RWY15", "KP258", "KP259","KP262", "KP127", "MUDET", "UGIKI", "NIBRU"],
                        ["UGIKI", "UREMI"]
                    ]
                }
            }
        }
    }
};