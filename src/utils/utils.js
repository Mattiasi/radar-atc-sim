/**
 * Converte coordenadas geográficas do formato Graus, Minutos e Segundos (DMS) 
 * para formato Decimal (usado internamente pelo Javascript para cálculos de ponto flutuante).
 * 
 * @param {number} graus - Valor dos graus
 * @param {number} minutos - Valor dos minutos (0-59)
 * @param {number} segundos - Valor dos segundos (0-59)
 * @param {string} direcao - 'N' (Norte), 'S' (Sul), 'E' (Este), 'W' (Oeste)
 * @returns {number} Coordenada em graus decimais (Sul e Oeste resultam em valores negativos)
 */
export function dmsParaDecimal(graus, minutos, segundos, direcao) {
    let decimal = graus + (minutos / 60) + (segundos / 3600);
    // Hemisfério Sul ou Oeste devem ser representados como valores negativos no plano cartesiano
    return (direcao === 'S' || direcao === 'W') ? decimal * -1 : decimal;
}

// =======================================================================
// REFERÊNCIA CENTRAL DO RADAR
// Todas as distâncias no simulador são calculadas em relação a este ponto (Eixo da Pista 17R de SBSP)
// =======================================================================
export const latCentro = dmsParaDecimal(23, 37, 33.21, 'S');
export const lonCentro = dmsParaDecimal(46, 39, 25.41, 'W');

/**
 * Declinação Magnética da TMA São Paulo (Terminal SBSP/SBGR/SBKP).
 * Oficial DECEA: ~22.4° W.
 * Em telas operacionais ATC (SAGITARIO / X-Muda), a tela é orientada com o
 * Norte Magnético para cima (+Y). Isto permite que as proas aeronáuticas magnéticas (ex: 170° da pista 17R)
 * coincidam perfeitamente com a orientação geométrica na tela e no voo das aeronaves.
 */
export const DECLINACAO_MAGNETICA = 22.4; // Graus a Oeste
const thetaRot = DECLINACAO_MAGNETICA * (Math.PI / 180);
const cosRot = Math.cos(thetaRot);
const sinRot = Math.sin(thetaRot);

/**
 * Fator de correção de Longitude (Projeção Cilíndrica Equidistante / Flat-Earth Approximation).
 * Como a Terra é uma esfera, os meridianos (linhas de longitude) aproximam-se uns dos outros
 * à medida que nos afastamos do Equador. 
 * Multiplicar a longitude pelo Cosseno da latitude central evita que o mapa fique "esticado" horizontalmente.
 */
export const correcaoLon = Math.cos(latCentro * (Math.PI / 180));

/**
 * Converte coordenadas geográficas reais WGS-84 (Lat/Lon decimais)
 * para o referencial local de projeção do radar (com Norte Magnético orientado para cima).
 * 
 * @param {number} lat - Latitude geográfica decimal
 * @param {number} lon - Longitude geográfica decimal
 * @returns {Object} { deltaLat, deltaLon }
 */
export function geoParaDelta(lat, lon) {
    const dLat = lat - latCentro;
    const dLon = lon - lonCentro;
    
    // Distâncias ortogonais verdadeiras em Milhas Náuticas
    const yTrue = dLat * 60;
    const xTrue = dLon * correcaoLon * 60;
    
    // Rotaciona pela Declinação Magnética (22.4° W) para que o Norte Magnético aponte para +Y (topo do ecrã)
    const xMag = xTrue * cosRot + yTrue * sinRot;
    const yMag = -xTrue * sinRot + yTrue * cosRot;
    
    return {
        deltaLat: yMag / 60,
        deltaLon: xMag / (60 * correcaoLon)
    };
}

/**
 * Converte coordenadas relativas do radar de volta para coordenadas geográficas WGS-84 reais.
 * Faz a rotação inversa de Norte Magnético para Norte Verdadeiro.
 * 
 * @param {number} deltaLat 
 * @param {number} deltaLon 
 * @returns {Object} { lat, lon }
 */
export function deltaParaGeo(deltaLat, deltaLon) {
    const yMag = deltaLat * 60;
    const xMag = deltaLon * (60 * correcaoLon);
    
    // Rotação inversa (matriz transposta)
    const xTrue = xMag * cosRot - yMag * sinRot;
    const yTrue = xMag * sinRot + yMag * cosRot;
    
    return {
        lat: latCentro + yTrue / 60,
        lon: lonCentro + xTrue / (60 * correcaoLon)
    };
}

/**
 * Calcula a distância em Milhas Náuticas (NM) e o rumo magnético entre dois pontos.
 * Utiliza o plano cartesiano magnético do radar (onde o eixo Y é o Norte Magnético).
 * 
 * @param {Object} origem - Objeto contendo {deltaLat, deltaLon} do ponto de partida
 * @param {Object} destino - Objeto contendo {deltaLat, deltaLon} do ponto de chegada
 * @returns {Object} { distanciaNM (float), distancia (string com 1 casa decimal), rumo (string formatada ex: "090") }
 */
export function calcularRumoDistancia(origem, destino) {
    // 1. Calcula a diferença entre as posições magnéticas
    const dLat = destino.deltaLat - origem.deltaLat;
    const dLon = (destino.deltaLon - origem.deltaLon) * correcaoLon;
    
    // 2. Calcula a Distância em Milhas Náuticas
    const distNM = Math.sqrt(Math.pow(dLat * 60, 2) + Math.pow(dLon * 60, 2));
    
    // 3. Calcula o Ângulo / Rumo Magnético
    let rumo = Math.atan2(dLon, dLat) * (180 / Math.PI);
    
    if (rumo < 0) rumo += 360;
    let rRound = Math.round(rumo);
    if (rRound === 0 || rRound === 360) rRound = 360;
    
    return { 
        distanciaNM: distNM, // Valor matemático bruto para a máquina (física)
        distancia: distNM.toFixed(1), // Valor formatado com 1 casa decimal para o ecrã (ex: "12.5")
        rumo: rRound.toString().padStart(3, '0') // Formata a proa para 3 dígitos (ex: "5" vira "005", Norte vira "360")
    };
}

/**
 * Determina se um identificador de fixo/ponto representa uma cabeceira física ou limiar de pista.
 * Reconhece formatos como: RW10R, RW15, RWY33, RW17R, R10RGR, R15KP, etc.
 * @param {string} nome
 * @returns {boolean}
 */
export function isFixoDePista(nome) {
    if (!nome || typeof nome !== 'string') return false;
    if (/^RWY?\d{1,2}[LRC]?$/i.test(nome)) return true;
    if (/^R\d{2}[LRC]?([A-Z]{2})?$/i.test(nome)) return true;
    return false;
}

/**
 * Converte coordenadas decimais para o formato Graus, Minutos e Segundos (DMS).
 * Suporta formatação completa de aviação civil (DMS, DMM e código Javascript).
 * 
 * @param {number} grausDecimais - Latitude ou Longitude em formato decimal
 * @param {boolean} isLatitude - True para Latitude (-90 a 90), False para Longitude (-180 a 180)
 * @returns {Object} { graus, minutos, segundos, direcao, textoDMS, textoDMM, codigoJS }
 */
export function decimalParaDMS(grausDecimais, isLatitude = true) {
    const direcao = isLatitude 
        ? (grausDecimais < 0 ? 'S' : 'N') 
        : (grausDecimais < 0 ? 'W' : 'E');
    
    let absVal = Math.abs(grausDecimais);
    let graus = Math.floor(absVal);
    let minTotal = (absVal - graus) * 60;
    let minutos = Math.floor(minTotal);
    let segundos = (minTotal - minutos) * 60;

    // Arredondamento para 2 casas decimais e ajuste de carry
    segundos = Math.round(segundos * 100) / 100;
    if (segundos >= 60) {
        segundos = 0;
        minutos += 1;
    }
    if (minutos >= 60) {
        minutos = 0;
        graus += 1;
    }

    const grauPad = isLatitude ? 2 : 3;
    const strGrau = String(graus).padStart(grauPad, '0');
    const strMin = String(minutos).padStart(2, '0');
    const strSeg = segundos.toFixed(2).padStart(5, '0');

    return {
        graus,
        minutos,
        segundos,
        direcao,
        textoDMS: `${strGrau}° ${strMin}' ${strSeg}" ${direcao}`,
        textoDMM: `${strGrau}° ${minTotal.toFixed(2).padStart(5, '0')}' ${direcao}`,
        codigoJS: `dmsParaDecimal(${graus}, ${minutos}, ${segundos.toFixed(2)}, '${direcao}')`
    };
}
