import { dmsParaDecimal, latCentro, lonCentro } from '../utils/utils.js';

export const aerodromos = [
    {
        nome: "SBSP",
        lat: latCentro,
        lon: lonCentro,
        elevacaoFt: 2631,
        rumoPista: 170,
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
                        id: "17R",
                        rumo: 170,
                        frontCourseDeg: 170,
                        elevacaoFt: 2631,
                        ils: {
                            ident: "ISBP", freq: "109.5", front_course_deg: 170, gs_angle_deg: 3.0,
                            loc_max_distance_nm: 30.0, gs_max_distance_nm: 30.0, loc_capture_angle_deg: 2.5,
                            loc_valid: true, gs_valid: true, enabled: true
                        }
                    },
                    "35L": {
                        id: "35L",
                        rumo: 350,
                        frontCourseDeg: 350,
                        elevacaoFt: 2631,
                        ils: {
                            ident: "ICGN", freq: "110.1", front_course_deg: 350, gs_angle_deg: 3.0,
                            loc_max_distance_nm: 30.0, gs_max_distance_nm: 30.0, loc_capture_angle_deg: 2.5,
                            loc_valid: true, gs_valid: true, enabled: true
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
                    "17L": { id: "17L", rumo: 170, frontCourseDeg: 170, elevacaoFt: 2631, ils: { enabled: false, loc_valid: false, gs_valid: false } },
                    "35R": { id: "35R", rumo: 350, frontCourseDeg: 350, elevacaoFt: 2631, ils: { enabled: false, loc_valid: false, gs_valid: false } }
                }
            }
        ]
    },
    {
        nome: "SBJH", lat: dmsParaDecimal(23, 25, 37, 'S'), lon: dmsParaDecimal(47,  9, 57, 'W'), rumoPista: 120,
        pistas: [{ id: "12/30", rumo: 120, compNM: 1.33, larguraPx: 3.0, sepY: 0 }]
    },
    {
        nome: "SBKP", lat: dmsParaDecimal(23,  0, 25, 'S'), lon: dmsParaDecimal(47,  8,  4, 'W'), rumoPista: 150,
        pistas: [{
            id: "15/33", rumo: 150, compNM: 1.75, larguraPx: 3.5, sepY: 0,
            prolongamento: { tracosAntes: 6, tracosDepois: 6, tamanhoTracoNM: 1.0, espacoNM: 1.0, afastamentoNM: 1.0, cor: '#ffffff' }
        }]
    },
    {
        nome: "SBMT", lat: dmsParaDecimal(23, 30, 33, 'S'), lon: dmsParaDecimal(46, 38, 15, 'W'), rumoPista: 120,
        pistas: [{ id: "12/30", rumo: 120, compNM: 0.994, larguraPx: 3.0, sepY: 0 }]
    },
    {
        nome: "SBGR",
        lat: dmsParaDecimal(23, 26, 8, 'S'),
        lon: dmsParaDecimal(46, 28, 23, 'W'),
        elevacaoFt: 2461,
        rumoPista: 100,
        pistas: [
            {
                id: "10R/28L", rumo: 100, compNM: 1.86, larguraPx: 3.0, sepY: 4,
                prolongamento: { tracosAntes: 4, tracosDepois: 5, tamanhoTracoNM: 1.0, espacoNM: 1.0, afastamentoNM: 1.0, cor: '#ffffff' },
                cabeceiras: {
                    "10R": {
                        id: "10R", rumo: 96, frontCourseDeg: 96, elevacaoFt: 2461,
                        ils: { ident: "IGRU", freq: "110.5", front_course_deg: 96, gs_angle_deg: 3.0, loc_max_distance_nm: 30.0, gs_max_distance_nm: 30.0, loc_capture_angle_deg: 2.5, loc_valid: true, gs_valid: true, enabled: true }
                    },
                    "28L": {
                        id: "28L", rumo: 276, frontCourseDeg: 276, elevacaoFt: 2461,
                        ils: { ident: "IGRL", freq: "111.5", front_course_deg: 276, gs_angle_deg: 3.0, loc_max_distance_nm: 30.0, gs_max_distance_nm: 30.0, loc_capture_angle_deg: 2.5, loc_valid: true, gs_valid: true, enabled: true }
                    }
                }
            },
            {
                id: "10L/28R", rumo: 100, compNM: 2.3, larguraPx: 3.0, sepY: -4, sepX: 24,
                prolongamento: { tracosAntes: 5, tracosDepois: 4, tamanhoTracoNM: 1.0, espacoNM: 1.0, afastamentoNM: 1.0, cor: '#ffffff' },
                cabeceiras: {
                    "10L": { id: "10L", rumo: 96, frontCourseDeg: 96, elevacaoFt: 2461, ils: { enabled: false, loc_valid: false, gs_valid: false } },
                    "28R": { id: "28R", rumo: 276, frontCourseDeg: 276, elevacaoFt: 2461, ils: { enabled: false, loc_valid: false, gs_valid: false } }
                }
            }
        ]
    }
];
