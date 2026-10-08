import { dmsParaDecimal } from '../utils/utils.js';

export const verticesTMA = [
    { nome: "TMA1",  lat: dmsParaDecimal(22, 27, 66.70, 'S'), lon: dmsParaDecimal(46, 59, 10.00, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA2",  lat: dmsParaDecimal(22, 30, 16.70, 'S'), lon: dmsParaDecimal(46, 37, 16.70, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA3",  lat: dmsParaDecimal(22, 33, 46.70, 'S'), lon: dmsParaDecimal(46,  7, 36.70, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA4",  lat: dmsParaDecimal(22, 49, 20.00, 'S'), lon: dmsParaDecimal(45, 59, 95.00, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA5",  lat: dmsParaDecimal(22, 58, 48.30, 'S'), lon: dmsParaDecimal(45, 55, 55.00, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA6",  lat: dmsParaDecimal(23,  3, 13.30, 'S'), lon: dmsParaDecimal(45, 40,  1.70, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA24", lat: dmsParaDecimal(23,  7, 34.00, 'S'), lon: dmsParaDecimal(45, 41, 24.00, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA25", lat: dmsParaDecimal(23, 15, 59.39, 'S'), lon: dmsParaDecimal(45, 33, 19.03, 'W') },
    { nome: "TMA26", lat: dmsParaDecimal(23, 24, 15.00, 'S'), lon: dmsParaDecimal(45, 43, 44.00, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA27", lat: dmsParaDecimal(23, 24, 32.00, 'S'), lon: dmsParaDecimal(45, 54, 23.00, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA28", lat: dmsParaDecimal(23,  9, 41.00, 'S'), lon: dmsParaDecimal(46,  8, 30.00, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA7",  lat: dmsParaDecimal(23,  2, 31.70, 'S'), lon: dmsParaDecimal(45, 36, 33.30, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA8",  lat: dmsParaDecimal(23, 14, 86.70, 'S'), lon: dmsParaDecimal(45, 33, 26.70, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA9",  lat: dmsParaDecimal(23, 18, 53.30, 'S'), lon: dmsParaDecimal(45, 32, 36.70, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA10", lat: dmsParaDecimal(23, 42, 73.30, 'S'), lon: dmsParaDecimal(45, 25, 68.30, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA11", lat: dmsParaDecimal(23, 54, 61.70, 'S'), lon: dmsParaDecimal(45, 22, 38.30, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA12", lat: dmsParaDecimal(24,  4, 53.30, 'S'), lon: dmsParaDecimal(46,  4, 30.00, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA13", lat: dmsParaDecimal(24, 18, 45.00, 'S'), lon: dmsParaDecimal(46, 10,  1.70, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA14", lat: dmsParaDecimal(24, 24, 40.00, 'S'), lon: dmsParaDecimal(46, 41, 48.30, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA15", lat: dmsParaDecimal(24, 19, 71.70, 'S'), lon: dmsParaDecimal(46, 47, 76.70, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA16", lat: dmsParaDecimal(23, 53, 85.00, 'S'), lon: dmsParaDecimal(47, 22, 16.70, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA17", lat: dmsParaDecimal(23, 40, 33.30, 'S'), lon: dmsParaDecimal(47, 40,  1.70, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA18", lat: dmsParaDecimal(23, 39,  0.00, 'S'), lon: dmsParaDecimal(47, 41, 76.70, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA19", lat: dmsParaDecimal(23, 16, 10.00, 'S'), lon: dmsParaDecimal(47, 48, 33.30, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA20", lat: dmsParaDecimal(23,  4,  3.30, 'S'), lon: dmsParaDecimal(47, 43, 63.30, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA21", lat: dmsParaDecimal(22, 51, 60.00, 'S'), lon: dmsParaDecimal(47, 38, 73.30, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA22", lat: dmsParaDecimal(22, 42, 26.70, 'S'), lon: dmsParaDecimal(47, 35, 10.00, 'W'), restricao: { fl: null, tipo: "" } },
    { nome: "TMA23", lat: dmsParaDecimal(22, 38, 78.30, 'S'), lon: dmsParaDecimal(47, 26, 43.30, 'W'), restricao: { fl: null, tipo: "" } }
];

/**
 * Tabela com as coordenadas dos 119 pontos da carta ATCSMAC
 */
export const pontosATCSMAC = {
    1:  { nome: "PT_1",  lat: dmsParaDecimal(23, 54, 37.66, 'S'), lon: dmsParaDecimal(45, 22, 23.57, 'W') },
    2:  { nome: "PT_2",  lat: dmsParaDecimal(24,  4, 32.38, 'S'), lon: dmsParaDecimal(46,  4, 18.19, 'W') },
    3:  { nome: "PT_3",  lat: dmsParaDecimal(24, 18, 27.07, 'S'), lon: dmsParaDecimal(46, 10,  1.60, 'W') },
    4:  { nome: "PT_4",  lat: dmsParaDecimal(24, 24, 24.52, 'S'), lon: dmsParaDecimal(46, 41, 29.97, 'W') },
    5:  { nome: "PT_5",  lat: dmsParaDecimal(23, 39,  0.16, 'S'), lon: dmsParaDecimal(47, 41, 46.07, 'W') },
    6:  { nome: "PT_6",  lat: dmsParaDecimal(23, 16,  6.72, 'S'), lon: dmsParaDecimal(47, 48, 20.71, 'W') },
    7:  { nome: "PT_7",  lat: dmsParaDecimal(22, 51, 36.91, 'S'), lon: dmsParaDecimal(47, 38, 44.84, 'W') },
    8:  { nome: "PT_8",  lat: dmsParaDecimal(22, 42, 16.59, 'S'), lon: dmsParaDecimal(47, 35,  6.22, 'W') },
    9:  { nome: "PT_9",  lat: dmsParaDecimal(22, 27, 40.86, 'S'), lon: dmsParaDecimal(46, 59,  6.86, 'W') },
    10: { nome: "PT_10", lat: dmsParaDecimal(22, 33, 28.43, 'S'), lon: dmsParaDecimal(46,  7, 22.49, 'W') },
    11: { nome: "PT_11", lat: dmsParaDecimal(22, 58, 29.76, 'S'), lon: dmsParaDecimal(45, 55, 33.74, 'W') },
    12: { nome: "PT_12", lat: dmsParaDecimal(23,  3,  8.26, 'S'), lon: dmsParaDecimal(45, 40,  1.59, 'W') },
    13: { nome: "PT_13", lat: dmsParaDecimal(23,  2, 19.08, 'S'), lon: dmsParaDecimal(45, 36, 20.01, 'W') },
    14: { nome: "PT_14", lat: dmsParaDecimal(23, 14, 44.46, 'S'), lon: dmsParaDecimal(45, 33,  2.39, 'W') },
    15: { nome: "PT_15", lat: dmsParaDecimal(23, 21, 10.69, 'S'), lon: dmsParaDecimal(45, 40, 10.95, 'W') },
    16: { nome: "PT_16", lat: dmsParaDecimal(23, 19, 49.80, 'S'), lon: dmsParaDecimal(45, 42, 34.51, 'W') },
    17: { nome: "PT_17", lat: dmsParaDecimal(23, 15, 18.20, 'S'), lon: dmsParaDecimal(45, 43,  6.36, 'W') },
    18: { nome: "PT_18", lat: dmsParaDecimal(23,  7,  3.69, 'S'), lon: dmsParaDecimal(46,  5, 10.85, 'W') },
    19: { nome: "PT_19", lat: dmsParaDecimal(23, 24, 36.04, 'S'), lon: dmsParaDecimal(45, 53, 19.24, 'W') },
    20: { nome: "PT_20", lat: dmsParaDecimal(23, 24, 25.91, 'S'), lon: dmsParaDecimal(45, 43, 47.96, 'W') },
    21: { nome: "PT_21", lat: dmsParaDecimal(23, 27, 47.32, 'S'), lon: dmsParaDecimal(46,  7, 57.61, 'W') },
    22: { nome: "PT_22", lat: dmsParaDecimal(23, 13, 21.19, 'S'), lon: dmsParaDecimal(46, 12, 34.30, 'W') },
    23: { nome: "PT_23", lat: dmsParaDecimal(23, 15, 46.43, 'S'), lon: dmsParaDecimal(46, 11, 48.68, 'W') },
    24: { nome: "PT_24", lat: dmsParaDecimal(23, 20, 29.19, 'S'), lon: dmsParaDecimal(46, 19, 53.65, 'W') },
    25: { nome: "PT_25", lat: dmsParaDecimal(23, 26, 18.46, 'S'), lon: dmsParaDecimal(46, 18, 27.67, 'W') },
    26: { nome: "PT_26", lat: dmsParaDecimal(23, 24,  3.53, 'S'), lon: dmsParaDecimal(46,  9,  9.26, 'W') },
    27: { nome: "PT_27", lat: dmsParaDecimal(23, 23, 54.57, 'S'), lon: dmsParaDecimal(46, 25, 47.51, 'W') },
    28: { nome: "PT_28", lat: dmsParaDecimal(23, 23, 26.79, 'S'), lon: dmsParaDecimal(46, 26, 12.50, 'W') },
    29: { nome: "PT_29", lat: dmsParaDecimal(23, 19, 33.62, 'S'), lon: dmsParaDecimal(46, 29, 42.06, 'W') },
    30: { nome: "PT_30", lat: dmsParaDecimal(23, 17, 21.36, 'S'), lon: dmsParaDecimal(46, 38,  5.23, 'W') },
    31: { nome: "PT_31", lat: dmsParaDecimal(23,  4, 25.22, 'S'), lon: dmsParaDecimal(46, 37, 16.30, 'W') },
    32: { nome: "PT_32", lat: dmsParaDecimal(22, 59, 39.29, 'S'), lon: dmsParaDecimal(46, 29, 44.18, 'W') },
    33: { nome: "PT_33", lat: dmsParaDecimal(23,  1, 41.46, 'S'), lon: dmsParaDecimal(46, 23, 28.81, 'W') },
    34: { nome: "PT_34", lat: dmsParaDecimal(23, 13, 31.84, 'S'), lon: dmsParaDecimal(46, 25, 22.87, 'W') },
    35: { nome: "PT_35", lat: dmsParaDecimal(23,  5, 35.63, 'S'), lon: dmsParaDecimal(46,  3, 31.82, 'W') },
    36: { nome: "PT_36", lat: dmsParaDecimal(22, 56, 27.83, 'S'), lon: dmsParaDecimal(46, 13, 29.97, 'W') },
    37: { nome: "PT_37", lat: dmsParaDecimal(22, 41, 54.05, 'S'), lon: dmsParaDecimal(46, 35, 38.10, 'W') },
    38: { nome: "PT_38", lat: dmsParaDecimal(22, 30, 41.40, 'S'), lon: dmsParaDecimal(46, 32, 34.43, 'W') },
    39: { nome: "PT_39", lat: dmsParaDecimal(22, 39,  5.92, 'S'), lon: dmsParaDecimal(46,  4, 43.62, 'W') },
    40: { nome: "PT_40", lat: dmsParaDecimal(23, 22, 27.93, 'S'), lon: dmsParaDecimal(46, 44, 56.06, 'W') },
    41: { nome: "PT_41", lat: dmsParaDecimal(23, 24, 22.97, 'S'), lon: dmsParaDecimal(46, 48, 12.25, 'W') },
    42: { nome: "PT_42", lat: dmsParaDecimal(23, 26, 24.89, 'S'), lon: dmsParaDecimal(46, 51, 41.18, 'W') },
    43: { nome: "PT_43", lat: dmsParaDecimal(23, 32, 56.81, 'S'), lon: dmsParaDecimal(46, 46, 51.82, 'W') },
    44: { nome: "PT_44", lat: dmsParaDecimal(23, 29, 48.09, 'S'), lon: dmsParaDecimal(46, 41, 32.12, 'W') },
    45: { nome: "PT_45", lat: dmsParaDecimal(23, 31, 31.40, 'S'), lon: dmsParaDecimal(46, 38, 40.30, 'W') },
    46: { nome: "PT_46", lat: dmsParaDecimal(23, 29, 18.20, 'S'), lon: dmsParaDecimal(46, 31, 11.01, 'W') },
    47: { nome: "PT_47", lat: dmsParaDecimal(23, 35,  9.45, 'S'), lon: dmsParaDecimal(46, 36,  9.96, 'W') },
    48: { nome: "PT_48", lat: dmsParaDecimal(23, 51, 25.13, 'S'), lon: dmsParaDecimal(46, 24, 50.52, 'W') },
    49: { nome: "PT_49", lat: dmsParaDecimal(23, 49, 27.98, 'S'), lon: dmsParaDecimal(46, 21, 38.23, 'W') },
    50: { nome: "PT_50", lat: dmsParaDecimal(23, 42, 49.73, 'S'), lon: dmsParaDecimal(46, 23, 58.71, 'W') },
    51: { nome: "PT_51", lat: dmsParaDecimal(23, 46, 57.24, 'S'), lon: dmsParaDecimal(46, 17, 22.55, 'W') },
    52: { nome: "PT_52", lat: dmsParaDecimal(23, 35, 38.36, 'S'), lon: dmsParaDecimal(46, 16,  3.17, 'W') },
    53: { nome: "PT_53", lat: dmsParaDecimal(23, 58, 58.64, 'S'), lon: dmsParaDecimal(46, 37, 39.24, 'W') },
    54: { nome: "PT_54", lat: dmsParaDecimal(24,  2,  0.46, 'S'), lon: dmsParaDecimal(46, 44,  0.04, 'W') },
    55: { nome: "PT_55", lat: dmsParaDecimal(23, 39, 11.95, 'S'), lon: dmsParaDecimal(46, 59, 30.54, 'W') },
    56: { nome: "PT_56", lat: dmsParaDecimal(23, 30,  8.77, 'S'), lon: dmsParaDecimal(47,  5, 38.08, 'W') },
    57: { nome: "PT_57", lat: dmsParaDecimal(23, 22, 38.20, 'S'), lon: dmsParaDecimal(47,  2, 40.74, 'W') },
    58: { nome: "PT_58", lat: dmsParaDecimal(23, 29, 53.00, 'S'), lon: dmsParaDecimal(46, 57, 36.63, 'W') },
    59: { nome: "PT_59", lat: dmsParaDecimal(23, 35, 42.62, 'S'), lon: dmsParaDecimal(46, 53, 35.90, 'W') },
    60: { nome: "PT_60", lat: dmsParaDecimal(23, 15, 23.85, 'S'), lon: dmsParaDecimal(47,  6, 32.39, 'W') },
    61: { nome: "PT_61", lat: dmsParaDecimal(23, 12, 42.34, 'S'), lon: dmsParaDecimal(47,  5,  7.63, 'W') },
    62: { nome: "PT_62", lat: dmsParaDecimal(23,  8, 44.12, 'S'), lon: dmsParaDecimal(46, 58, 46.99, 'W') },
    63: { nome: "PT_63", lat: dmsParaDecimal(23,  9, 47.52, 'S'), lon: dmsParaDecimal(46, 55, 20.65, 'W') },
    64: { nome: "PT_64", lat: dmsParaDecimal(23, 45,  6.51, 'S'), lon: dmsParaDecimal(45, 24, 56.57, 'W') },
    65: { nome: "PT_65", lat: dmsParaDecimal(23, 47, 20.32, 'S'), lon: dmsParaDecimal(45, 33,  3.71, 'W') },
    66: { nome: "PT_66", lat: dmsParaDecimal(23, 27, 39.23, 'S'), lon: dmsParaDecimal(46, 46,  1.60, 'W') },
    67: { nome: "PT_67", lat: dmsParaDecimal(23, 56, 54.65, 'S'), lon: dmsParaDecimal(45, 31, 57.49, 'W') },
    68: { nome: "PT_68", lat: dmsParaDecimal(23, 39, 50.81, 'S'), lon: dmsParaDecimal(46, 39, 17.74, 'W') },
    69: { nome: "PT_69", lat: dmsParaDecimal(23, 40,  0.10, 'S'), lon: dmsParaDecimal(46, 39, 20.45, 'W') },
    70: { nome: "PT_70", lat: dmsParaDecimal(23, 38, 29.90, 'S'), lon: dmsParaDecimal(46, 36, 59.99, 'W') },
    71: { nome: "PT_71", lat: dmsParaDecimal(23, 38, 39.19, 'S'), lon: dmsParaDecimal(46, 37,  2.69, 'W') },
    72: { nome: "PT_72", lat: dmsParaDecimal(23, 48, 13.12, 'S'), lon: dmsParaDecimal(46, 35, 18.81, 'W') },
    73: { nome: "PT_73", lat: dmsParaDecimal(23, 48, 22.41, 'S'), lon: dmsParaDecimal(46, 35, 21.52, 'W') },
    74: { nome: "PT_74", lat: dmsParaDecimal(23, 45, 21.01, 'S'), lon: dmsParaDecimal(46, 30, 25.91, 'W') },
    75: { nome: "PT_75", lat: dmsParaDecimal(23, 45, 30.31, 'S'), lon: dmsParaDecimal(46, 30, 28.62, 'W') },
    76: { nome: "PT_76", lat: dmsParaDecimal(23, 36, 39.72, 'S'), lon: dmsParaDecimal(46, 41, 39.05, 'W') },
    77: { nome: "PT_77", lat: dmsParaDecimal(23, 36, 39.14, 'S'), lon: dmsParaDecimal(46, 41, 30.31, 'W') },
    78: { nome: "PT_78", lat: dmsParaDecimal(23, 35, 18.84, 'S'), lon: dmsParaDecimal(46, 39, 21.33, 'W') },
    79: { nome: "PT_79", lat: dmsParaDecimal(23, 35, 18.26, 'S'), lon: dmsParaDecimal(46, 39, 12.59, 'W') },
    80: { nome: "PT_80", lat: dmsParaDecimal(23, 29, 48.12, 'S'), lon: dmsParaDecimal(46, 48, 12.11, 'W') },
    81: { nome: "PT_81", lat: dmsParaDecimal(23, 29, 47.55, 'S'), lon: dmsParaDecimal(46, 48,  3.38, 'W') },
    82: { nome: "PT_82", lat: dmsParaDecimal(23, 26, 55.84, 'S'), lon: dmsParaDecimal(46, 43, 10.89, 'W') },
    83: { nome: "PT_83", lat: dmsParaDecimal(23, 26, 56.41, 'S'), lon: dmsParaDecimal(46, 43, 19.62, 'W') },
    84: { nome: "PT_84", lat: dmsParaDecimal(23, 26, 47.15, 'S'), lon: dmsParaDecimal(46, 41, 32.25, 'W') },
    85: { nome: "PT_85", lat: dmsParaDecimal(23, 26, 30.09, 'S'), lon: dmsParaDecimal(46, 41, 15.98, 'W') },
    86: { nome: "PT_86", lat: dmsParaDecimal(23, 32,  3.24, 'S'), lon: dmsParaDecimal(46, 39, 52.47, 'W') },
    87: { nome: "PT_87", lat: dmsParaDecimal(23, 31, 46.18, 'S'), lon: dmsParaDecimal(46, 39, 36.20, 'W') },
    88: { nome: "PT_88", lat: dmsParaDecimal(23, 27, 57.24, 'S'), lon: dmsParaDecimal(46, 30, 24.34, 'W') },
    89: { nome: "PT_89", lat: dmsParaDecimal(23, 27, 40.17, 'S'), lon: dmsParaDecimal(46, 30,  8.10, 'W') },
    90: { nome: "PT_90", lat: dmsParaDecimal(23, 25, 32.79, 'S'), lon: dmsParaDecimal(46, 31, 10.12, 'W') },
    91: { nome: "PT_91", lat: dmsParaDecimal(23, 25,  1.72, 'S'), lon: dmsParaDecimal(46, 30, 53.88, 'W') },
    92: { nome: "PT_92", lat: dmsParaDecimal(23, 24, 14.68, 'S'), lon: dmsParaDecimal(46, 26, 20.89, 'W') },
    93: { nome: "PT_93", lat: dmsParaDecimal(23, 23, 52.57, 'S'), lon: dmsParaDecimal(46, 25, 46.08, 'W') },
    94: { nome: "PT_94", lat: dmsParaDecimal(23, 26, 16.99, 'S'), lon: dmsParaDecimal(46, 25,  0.22, 'W') },
    95: { nome: "PT_95", lat: dmsParaDecimal(23, 26, 39.11, 'S'), lon: dmsParaDecimal(46, 25, 35.04, 'W') },
    96: { nome: "PT_96", lat: dmsParaDecimal(23, 17, 44.70, 'S'), lon: dmsParaDecimal(46, 11, 25.64, 'W') },
    97: { nome: "PT_97", lat: dmsParaDecimal(23, 17, 22.53, 'S'), lon: dmsParaDecimal(46, 10, 50.90, 'W') },
    98: { nome: "PT_98", lat: dmsParaDecimal(23, 24, 17.54, 'S'), lon: dmsParaDecimal(46,  8, 38.30, 'W') },
    99: { nome: "PT_99", lat: dmsParaDecimal(23, 24, 39.72, 'S'), lon: dmsParaDecimal(46,  9, 13.07, 'W') },
    100: { nome: "PT_100", lat: dmsParaDecimal(23,  0, 54.64, 'S'), lon: dmsParaDecimal(47,  5, 12.28, 'W') },
    101: { nome: "PT_101", lat: dmsParaDecimal(23,  2, 53.71, 'S'), lon: dmsParaDecimal(47,  6, 51.75, 'W') },
    102: { nome: "PT_102", lat: dmsParaDecimal(23,  4, 49.47, 'S'), lon: dmsParaDecimal(46, 57, 30.68, 'W') },
    103: { nome: "PT_103", lat: dmsParaDecimal(23,  8, 47.76, 'S'), lon: dmsParaDecimal(47,  0, 49.53, 'W') },
    104: { nome: "PT_104", lat: dmsParaDecimal(22, 57, 59.70, 'S'), lon: dmsParaDecimal(47,  9, 16.61, 'W') },
    105: { nome: "PT_105", lat: dmsParaDecimal(22, 59, 58.72, 'S'), lon: dmsParaDecimal(47, 10, 56.10, 'W') },
    106: { nome: "PT_106", lat: dmsParaDecimal(22, 56,  3.24, 'S'), lon: dmsParaDecimal(47, 18, 37.04, 'W') },
    107: { nome: "PT_107", lat: dmsParaDecimal(22, 52,  5.33, 'S'), lon: dmsParaDecimal(47, 15, 17.98, 'W') },
    108: { nome: "PT_108", lat: dmsParaDecimal(23,  3, 41.26, 'S'), lon: dmsParaDecimal(46, 52, 12.07, 'W') },
    109: { nome: "PT_109", lat: dmsParaDecimal(22, 47,  0.01, 'S'), lon: dmsParaDecimal(47,  0, 42.62, 'W') },
    110: { nome: "PT_110", lat: dmsParaDecimal(23, 46, 50.24, 'S'), lon: dmsParaDecimal(46, 54, 19.66, 'W') },
    111: { nome: "PT_111", lat: dmsParaDecimal(23, 21, 18.47, 'S'), lon: dmsParaDecimal(46, 43, 23.34, 'W') },
    112: { nome: "PT_112", lat: dmsParaDecimal(23,  3, 53.75, 'S'), lon: dmsParaDecimal(45, 59,  9.61, 'W') },
    113: { nome: "PT_113", lat: dmsParaDecimal(23, 11, 13.74, 'S'), lon: dmsParaDecimal(45, 52, 30.75, 'W') },
    114: { nome: "PT_114", lat: dmsParaDecimal(23, 13,  0.29, 'S'), lon: dmsParaDecimal(45, 54, 25.75, 'W') },
    115: { nome: "PT_115", lat: dmsParaDecimal(23,  7, 16.80, 'S'), lon: dmsParaDecimal(46,  2, 48.97, 'W') },
    116: { nome: "PT_116", lat: dmsParaDecimal(23, 14, 22.68, 'S'), lon: dmsParaDecimal(45, 49,  5.73, 'W') },
    117: { nome: "PT_117", lat: dmsParaDecimal(23, 21, 17.53, 'S'), lon: dmsParaDecimal(45, 38, 55.24, 'W') },
    118: { nome: "PT_118", lat: dmsParaDecimal(23, 25, 35.57, 'S'), lon: dmsParaDecimal(45, 43, 33.37, 'W') },
    119: { nome: "PT_119", lat: dmsParaDecimal(23, 16,  9.27, 'S'), lon: dmsParaDecimal(45, 51,  0.73, 'W') }
};

/**
 * Ligações topológicas da carta ATCSMAC
 */
export const conexoesATCSMAC = [
    // Ligações internas principais
    [64,65],[65,67],


    [5, 55], [110,54], [54, 53], [53, 48], [48, 49],
    [49, 50], [50, 52], [52, 46], [46, 28],
    [29, 30], [30, 31], [31, 32], [32, 33], [33, 34],
    [34, 22], [22, 23], [23, 24], [24, 25], [25, 26],
    [26, 21], [21, 19], [19, 20],
    [20, 15], [15, 14],

    [23,21],

    [38, 37], [37, 32], [33, 36],[36,35], [36, 39],
    [11, 35], [35, 18], [18, 12], [18, 19], [18, 22],
    [12, 17], [17, 16], [16, 15], [19, 51], [51, 49],

    [27, 28], [24, 93],
    [29, 93],

    [40, 41], [41, 42], [42, 43], [43, 44],
    [44, 45], [45, 47],[47,46], [47, 48],

    [40, 111], [30, 111], [44, 111],
    [42,58],[58, 59], [59, 55], [42, 57], [57, 56],
    [56, 55], [47, 110], [110, 55],

    [48, 53],

    // Área 13 / contorno curvo (109 -> 60 é traçado como arco de 15NM ao norte)
    [60, 61], [61, 62], [62, 63], [63, 108], [108, 109],

    // Geometrias pequenas dos pontos 68–75
    [68, 70], [70, 74], [74, 72], [72, 68],

    // Geometrias dos pontos 76–83
    [80, 76], [76, 79], [79, 83], [83, 80],

    // Geometrias dos pontos 84–91
    [85, 87], [87, 89], [89, 91], [91, 85],

    // Geometrias dos pontos 92–99
    [92, 95], [95, 98], [98, 97], [97, 92],
    

    // Geometrias dos pontos 100–107
    [100, 101], [101, 103], [103, 102], [102, 100],
    [104, 105], [105, 106], [106, 107], [107, 104],

    // Geometrias dos pontos 112–119
    [112, 113], [113, 114], [114, 115], [115, 112],
    [116, 117], [117, 118], [118, 119], [119, 116]
];

/**
 * Geração de pontos intermediários para o arco de raio 15NM entre os pontos 109 e 60 (curvatura para cima / Norte-Noroeste)
 */
export const pontosArco109_60 = (() => {
    const pontos = [];
    const numPassos = 24;
    const cLat = -23.032435;
    const cLon = -46.988796;
    const kLon = Math.cos(cLat * Math.PI / 180.0);
    const rNM = 15.0;

    const a109 = 94.87 * Math.PI / 180.0;
    const a60 = 243.74 * Math.PI / 180.0;

    for (let i = 1; i < numPassos; i++) {
        const t = i / numPassos;
        const ang = a109 + t * (a60 - a109);
        const lat = cLat + (rNM * Math.sin(ang)) / 60.0;
        const lon = cLon + (rNM * Math.cos(ang)) / (60.0 * kLon);
        pontos.push({
            nome: `PT_ARC_${i}`,
            lat: lat,
            lon: lon
        });
    }
    return pontos;
})();

export const verticesSetor = [
    ...Object.values(pontosATCSMAC),
    ...pontosArco109_60,
    ...verticesTMA
];

export const estruturaEspacoAereo = {
    limiteTMA: [
        "TMA1", "TMA2", "TMA3", "TMA4", "TMA5", "TMA28", "TMA27", "TMA26", "TMA25", "TMA24", "TMA6", "TMA5", "TMA6", "TMA7", "TMA8", "TMA9", "TMA10",
        "TMA11", "TMA12", "TMA13", "TMA14", "TMA15", "TMA16", "TMA17", "TMA18", "TMA19", "TMA20",
        "TMA21", "TMA22", "TMA23", "TMA1"
    ],
    linhasFronteira: [
        ...conexoesATCSMAC.map(([p1, p2]) => [`PT_${p1}`, `PT_${p2}`]),
        ["PT_109", ...pontosArco109_60.map(p => p.nome), "PT_60"]
    ],
    setoresAltitude: [
        { vertices: ["PT_57", "PT_42", "PT_58", "PT_59", "PT_55", "PT_56"], altitude: "5100'" },
        { vertices: ["PT_42", "PT_41", "PT_40", "PT_111", "PT_44", "PT_43"], altitude: "5200'" },
        { vertices: ["PT_110", "PT_55", "PT_59", "PT_43","PT_47"], altitude: "4700'" },
        { vertices: ["PT_48", "PT_54", "PT_110"], altitude: "5100'" },
        // AREA 1
        { vertices: [
        "PT_38", "PT_10", "PT_39",
        "PT_36", "PT_32", "PT_37"
         ], altitude: "7300'" },


    // AREA 2
    { vertices: [
        "PT_36", "PT_39", "PT_11",
        "PT_35", "PT_18"
    ], altitude: "8400'" },


    // AREA 3
    { vertices: [
        "PT_36", "PT_33", "PT_34",
        "PT_22", "PT_18"
    ], altitude: "7000'" },


    // AREA 4
    { vertices: [
        "PT_32", "PT_33", "PT_34", "PT_31"
    ], altitude: "5900'" },


    // AREA 5
    { vertices: [
        "PT_30", "PT_29", "PT_27",
        "PT_40", "PT_111"
    ], altitude: "5100'" },


    // A9
    { vertices: [
        "PT_24", "PT_96", "PT_26", "PT_25"
    ], altitude: "4600'" },


    // AREA 10
    { vertices: [
        "PT_112", "PT_12",
        "PT_17"
    ], altitude: "5100'" },


    // AREA 11
    { vertices: [
        "PT_12", "PT_13", "PT_14",
        "PT_15", "PT_16", "PT_17"
    ], altitude: "5300'" },


    // AREA 12
    { vertices: [
        "PT_65", "PT_64", "PT_1", "PT_67"
    ], altitude: "6100'" },


    // AREA 15
    { vertices: [
        "PT_22", "PT_18", "PT_19",
        "PT_21", "PT_99", "PT_98",
        "PT_26", "PT_96", "PT_97", "PT_23"
    ], altitude: "5200'" },


    // AREA 16
    { vertices: [
        "PT_11", "PT_12",
        "PT_35", "PT_18"
    ], altitude: "5900'" },


    // AREA 7
    { vertices: [
        "PT_46", "PT_52", "PT_50",
        "PT_49", "PT_48", "PT_47"
    ], altitude: "5100'" },


    // AREA 8
    { vertices: [
        "PT_46", "PT_52","PT_19"
    ], altitude: "5500'" },

    // AREA 18
    { vertices: [
        "PT_4", "PT_54","PT_48","PT_67","PT_2","PT_3"
    ], altitude: "5600'" },

     // AREA 18
    { vertices: [
        "PT_5", "PT_55","PT_54","PT_4"
    ], altitude: "5600'" },

     // AREA 14
    { vertices: [
        "PT_5", "PT_6","PT_8","PT_57"
    ], altitude: "5500'" },

     // AREA 14
    { vertices: [
        "PT_38", "PT_9","PT_8","PT_31",
    ], altitude: "5500'" },

       // AREA 14
    { vertices: [
        "PT_57", "PT_42","PT_30","PT_108"
    ], altitude: "5500'" },

     // AREA 14
    { vertices: [
        "PT_48", "PT_19","PT_64","PT_1","PT_2",
    ], altitude: "5600'" },

     // FAVA 17
    { vertices: [
        "PT_76", "PT_79","PT_83","PT_80"
    ], altitude: "4200'" },

     // FAVA 35
    { vertices: [
        "PT_69", "PT_70","PT_75","PT_73"
    ], altitude: "4200'" },

     // FAVA 10
    { vertices: [
        "PT_84", "PT_91","PT_90","PT_86"
    ], altitude: "4100'" },

     // FAVA 28
    { vertices: [
        "PT_92", "PT_95","PT_25","PT_24"
    ], altitude: "4100'" },

     // FAVA 15
    { vertices: [
        "PT_104", "PT_105","PT_106","PT_107",
    ], altitude: "3700'" },

     // FAVA 33
    { vertices: [
        "PT_100", "PT_101","PT_103","PT_102"
    ], altitude: "3700'" },

     // FAVA 16
    { vertices: [
        "PT_112", "PT_115","PT_114","PT_113"
    ], altitude: "4000'" },

     // FAVA 34
    { vertices: [
        "PT_116", "PT_117","PT_118","PT_119"
    ], altitude: "4000'" }




   ]
};
