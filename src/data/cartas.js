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
                        { nome: "SP111", lat: dmsParaDecimal(24, 13, 63.30, 'S'), lon: dmsParaDecimal(46, 37, 55.00, 'W') },
                        { nome: "IBDAL", lat: dmsParaDecimal(23, 45, 48.30, 'S'), lon: dmsParaDecimal(45, 13, 88.30, 'W') },
                        { nome: "MANLO", lat: dmsParaDecimal(23, 47, 81.70, 'S'), lon: dmsParaDecimal(45, 24, 48.30, 'W'), restricao: { fl: 260, tipo: "BELOW" } },
                        { nome: "SP033", lat: dmsParaDecimal(23, 50, 20.00, 'S'), lon: dmsParaDecimal(46, 12, 28.30, 'W') }
                    ],
                    linhas: [
                        ["ANISE", "SP091", "SP111", "OGTAL", "SP099", "SP101", "SP032", "KOMGU"],
                        ["IBDAL", "MANLO", "SP033", "OGTAL"]
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
                        {nome: "OTAGA", lat: dmsParaDecimal(22,29,40.00,'S'), lon: dmsParaDecimal(46,43,86.70,'W')},
                        {nome: "NEKIG", lat: dmsParaDecimal(22,33,18.30,'S'), lon: dmsParaDecimal(46,47,66.70,'W'), restricao: { fl: 230, tipo: "BELOW"}},
                        {nome: "MAVKA", lat: dmsParaDecimal(22,40,53.30,'S'), lon: dmsParaDecimal(46,55,11.70,'W')},
                        {nome: "SP031", lat: dmsParaDecimal(22,52,95.00,'S'), lon: dmsParaDecimal(47,3,58.30,'W'), restricao: { fl: 200, tipo: "ABOVE"}},
                        {nome: "ORESU", lat: dmsParaDecimal(23,1 ,45.00,'S'), lon: dmsParaDecimal(47,9,35.00,'W'), restricao: { fl: 130, flMax: 170, tipo: "WINDOW" }},
                        {nome: "PRUMO", lat: dmsParaDecimal(23, 15, 10.10, 'S'), lon: dmsParaDecimal(47,  6, 19.99, 'W'), restricao: { fl: 120, tipo: "ABOVE" } },
                        {nome: "IROPU", lat: dmsParaDecimal(23, 25, 31.05, 'S'), lon: dmsParaDecimal(47,  4,  3.91, 'W'), restricao: { fl: 80, flMax: 90, tipo: "WINDOW" } },
                        {nome: "ENTIT", lat: dmsParaDecimal(22,25,5.00,'S'), lon: dmsParaDecimal(46,39,46.70,'W'), restricao: { fl: 270, tipo: "BELOW"}}
                    ],
                    linhas: [
                        ["UTLOT","RUSTE", "ORESU", "PRUMO", "IROPU", "LUVDI", "GERSU"],
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
                    nome: "RNP Y RWY 17R",
                    cor: '#00ff00',
                    fixos: [
                        { nome: "LUVDI", lat: dmsParaDecimal(23, 29, 35.90, 'S'), lon: dmsParaDecimal(46, 48, 21.77, 'W'), restricao: { fl:  55, tipo: "AT" } },
                        { nome: "KOMGU", lat: dmsParaDecimal(23, 33, 54.89, 'S'), lon: dmsParaDecimal(46, 49, 40.64, 'W'), restricao: { fl:  55, tipo: "AT" } },
                        { nome: "GERSU", lat: dmsParaDecimal(23, 30, 41.00, 'S'), lon: dmsParaDecimal(46, 44, 10.10, 'W'), restricao: { fl:  47, tipo: "ABOVE" } },
                        { nome: "URUTA", lat: dmsParaDecimal(23, 33, 28.57, 'S'), lon: dmsParaDecimal(46, 42, 14.37, 'W'), restricao: { fl:  40, tipo: "AT" } },
                        { nome: "SP139", lat: dmsParaDecimal(23, 34, 59.83, 'S'), lon: dmsParaDecimal(46, 41, 11.34, 'W'), restricao: { fl:  36, tipo: "AT" } },
                        { nome: "SP017", lat: dmsParaDecimal(23, 36, 15.89, 'S'), lon: dmsParaDecimal(46, 40, 18.81, 'W'), restricao: { fl:  32, tipo: "AT" } }
                    ],
                    linhas: [
                        ["LUVDI", "GERSU"],
                        ["KOMGU", "GERSU"],
                        ["GERSU", "URUTA", "SP139", "SP017"]
                    ]
                }
            },
            SID: {}
        },
        "35L": {
            STAR: {},
            AIC: {},
            SID: {}
        }
    }
};
