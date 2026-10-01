import { dmsParaDecimal } from '../utils/utils.js';

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
