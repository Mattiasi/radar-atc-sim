import { dmsParaDecimal } from '../utils/utils.js';

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
            linhas: [
                ["OGTAL", "SP099", "SP101", "SP032", "KOMGU"]
            ],
            marcasMilhagem: {
                pontoZero: "GERSU",
                distancias: [10, 20, 30, 40, 50],
                rota: ["OGTAL", "SP099", "SP101", "SP032", "KOMGU", "GERSU"]
            }
        },
        "ORESU_1A": {
            nome: "ORESU 1A",
            cor: '#ff9900',
            fixos: [
                { nome: "PRUMO", lat: dmsParaDecimal(23, 15, 10.10, 'S'), lon: dmsParaDecimal(47,  6, 19.99, 'W'), restricao: { fl: 120, tipo: "ABOVE" } },
                { nome: "IROPU", lat: dmsParaDecimal(23, 25, 31.05, 'S'), lon: dmsParaDecimal(47,  4,  3.91, 'W'), restricao: { fl:  90, tipo: "ABOVE" } }
            ],
            linhas: [
                ["PRUMO", "IROPU", "LUVDI"]
            ],
            marcasMilhagem: {
                pontoZero: "GERSU",
                distancias: [10, 20, 30, 40, 50],
                rota: ["PRUMO", "IROPU", "LUVDI", "GERSU", "URUTA", "SP139", "SP017"]
            }
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
            linhas: [
                ["LUVDI", "GERSU"],
                ["KOMGU", "GERSU"],
                ["GERSU", "URUTA", "SP139", "SP017"]
            ]
        }
    },
    SID: {}
};
