import { cartasNavegacao } from '../data/cartas.js?v=2';
import { radarLayerState, state } from '../core/state.js';
import { painelFluxoUI } from './ui.js';

/**
 * Mapeamento opcional de nomes amigáveis de aeródromos para exibição operacional.
 */
const NOMES_AERODROMOS = {
    "SBSP": "Congonhas",
    "SBGR": "Guarulhos",
    "SBKP": "Viracopos",
    "SBSJ": "São José dos Campos",
    "SBMT": "Campo de Marte",
    "SBJD": "Jundiaí",
    "SBJH": "Catarina",
    "SDCO": "Sorocaba",
    "SBBP": "Bragança Paulista",
    "SBST": "Santos",
    "SDAI": "Americana",
    "SDAM": "Amarais",
    "SBRJ": "Santos Dumont",
    "SBGL": "Galeão",
    "SBBR": "Brasília"
};

/**
 * ============================================================================
 * VideoMapDrawerController
 * ============================================================================
 * Controlador do menu lateral retrátil (drawer) de Controle de Vídeo-Mapa e Brilho.
 * 
 * Funcionalidades:
 * - Botão hambúrguer no canto superior esquerdo (top: 12px, left: 12px).
 * - Painel retrátil suspenso com animação suave e tema escuro ATC.
 * - Seção 'Vídeo mapa' com acordeão aninhado dinâmico (Aeródromos -> Cabeceiras).
 * - Seção 'Brilho' com sliders de opacidade contínuos para STAR, SID e IAC.
 * - Gerenciamento reativo centralizado do radarLayerState.
 * ============================================================================
 */
export class VideoMapDrawerController {
    constructor() {
        this.btnTrigger = null;
        this.painelDrawer = null;
        this.aberto = false;
        
        // Elementos internos do acordeão
        this.secaoVideoMapa = null;
        this.secaoBrilho = null;
        
        this.init();
    }

    init() {
        this._criarElementosDOM();
        this._construirSecaoVideoMapa();
        this._construirSecaoBrilho();
        this._configurarEventosGlobais();
    }

    /**
     * Cria os containers base do botão hambúrguer e do painel retrátil se ainda não existirem.
     */
    _criarElementosDOM() {
        // 1. Botão Hambúrguer
        let btn = document.getElementById('btnHamburgerDrawer');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'btnHamburgerDrawer';
            btn.className = 'btn-hamburger-atc';
            btn.title = 'Menu Vídeo-Mapa e Brilho';
            btn.innerHTML = '&#9776;'; // Símbolo ☰
            document.body.appendChild(btn);
        }
        this.btnTrigger = btn;

        // 2. Container do Painel Lateral Retrátil
        let painel = document.getElementById('painelVideoMapaDrawer');
        if (!painel) {
            painel = document.createElement('div');
            painel.id = 'painelVideoMapaDrawer';
            painel.className = 'drawer-atc recolhido';
            document.body.appendChild(painel);
        }
        this.painelDrawer = painel;
        this.painelDrawer.innerHTML = ''; // Limpa para renderização dinâmica

        // Previne que cliques/arrastes dentro do painel interfiram com o canvas do radar
        this.painelDrawer.addEventListener('mousedown', (e) => e.stopPropagation());
        this.painelDrawer.addEventListener('click', (e) => e.stopPropagation());
        this.btnTrigger.addEventListener('mousedown', (e) => e.stopPropagation());

        // Toggle ao clicar no botão
        this.btnTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDrawer();
        });
    }

    /**
     * Alterna a visibilidade do painel vertical.
     */
    toggleDrawer() {
        if (this.aberto) {
            this.fecharDrawer();
        } else {
            this.abrirDrawer();
        }
    }

    abrirDrawer() {
        this.aberto = true;
        this.painelDrawer.classList.remove('recolhido');
        this.painelDrawer.classList.add('expandido');
        this.btnTrigger.classList.add('ativo');
    }

    fecharDrawer() {
        this.aberto = false;
        this.painelDrawer.classList.remove('expandido');
        this.painelDrawer.classList.add('recolhido');
        this.btnTrigger.classList.remove('ativo');
    }

    /**
     * Constrói a Seção "Vídeo mapa" com acordeão aninhado:
     * - Cabeçalho: Vídeo mapa ▼ (inicia recolhido)
     * - Sub-acordeão por Aeródromo (SBSP, SBGR, etc., inicia recolhido)
     * - Checkboxes por cabeceira (17R, 10R, etc.)
     */
    _construirSecaoVideoMapa() {
        const blocoSecao = document.createElement('div');
        blocoSecao.className = 'drawer-secao';

        // Cabeçalho da Seção Principal
        const header = document.createElement('div');
        header.className = 'drawer-secao-header';
        header.innerHTML = `
            <span class="drawer-secao-titulo">VÍDEO MAPA</span>
            <span class="drawer-secao-seta">&#9656;</span>
        `;

        const conteudo = document.createElement('div');
        conteudo.className = 'drawer-secao-conteudo recolhido';

        // Evento de colapso do acordeão principal "Vídeo mapa"
        header.addEventListener('click', () => {
            const estaRecolhido = conteudo.classList.contains('recolhido');
            const seta = header.querySelector('.drawer-secao-seta');
            if (estaRecolhido) {
                conteudo.classList.remove('recolhido');
                seta.innerHTML = '&#9662;'; // ▼
            } else {
                conteudo.classList.add('recolhido');
                seta.innerHTML = '&#9656;'; // ▶
            }
        });

        // Geração Dinâmica Data-Driven a partir de cartasNavegacao
        if (cartasNavegacao && typeof cartasNavegacao === 'object') {
            Object.entries(cartasNavegacao).forEach(([icao, aerodromoObj]) => {
                const subBlocoAero = document.createElement('div');
                subBlocoAero.className = 'drawer-aero-bloco';

                const nomeAmigavel = NOMES_AERODROMOS[icao] ? `${icao} - ${NOMES_AERODROMOS[icao]}` : icao;

                const aeroHeader = document.createElement('div');
                aeroHeader.className = 'drawer-aero-header';
                aeroHeader.innerHTML = `
                    <span class="drawer-aero-titulo">${nomeAmigavel}</span>
                    <span class="drawer-aero-seta">&#9656;</span>
                `;

                const aeroConteudo = document.createElement('div');
                aeroConteudo.className = 'drawer-aero-conteudo recolhido';

                // Toggle do sub-acordeão do aeródromo
                aeroHeader.addEventListener('click', () => {
                    const estaRecolhido = aeroConteudo.classList.contains('recolhido');
                    const seta = aeroHeader.querySelector('.drawer-aero-seta');
                    if (estaRecolhido) {
                        aeroConteudo.classList.remove('recolhido');
                        seta.innerHTML = '&#9662;';
                    } else {
                        aeroConteudo.classList.add('recolhido');
                        seta.innerHTML = '&#9656;';
                    }
                });

                // Lista de Cabeceiras
                const listaPistas = document.createElement('div');
                listaPistas.className = 'drawer-lista-pistas';

                // Agrupa as cabeceiras pelo número da pista (removendo letras como R, L, C)
                const pistasAgrupadas = new Map();
                Object.keys(aerodromoObj).forEach(cabeceiraKey => {
                    const numPista = cabeceiraKey.replace(/[^0-9]/g, '') || cabeceiraKey;
                    if (!pistasAgrupadas.has(numPista)) {
                        pistasAgrupadas.set(numPista, []);
                    }
                    pistasAgrupadas.get(numPista).push(cabeceiraKey);
                });

                // Ordena as pistas numericamente (ex: 10, 28 ou 15, 33 ou 17, 35)
                const numerosOrdenados = Array.from(pistasAgrupadas.keys()).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

                numerosOrdenados.forEach(numPista => {
                    const groupKey = `${icao}-${numPista}`;
                    const chavesAssociadas = pistasAgrupadas.get(numPista);

                    // Coleta todas as cartas (STAR, IAC, SID) pertencentes a essas cabeceiras agrupadas
                    const cartasDaPista = [];
                    const nomesCartasUnicas = new Set();
                    chavesAssociadas.forEach(cabeceiraKey => {
                        const cabObj = aerodromoObj[cabeceiraKey];
                        if (cabObj && typeof cabObj === 'object') {
                            Object.values(cabObj).forEach(categoria => {
                                if (categoria && typeof categoria === 'object') {
                                    Object.values(categoria).forEach(carta => {
                                        if (carta && carta.nome && !nomesCartasUnicas.has(carta.nome)) {
                                            nomesCartasUnicas.add(carta.nome);
                                            cartasDaPista.push({
                                                nome: carta.nome,
                                                cor: carta.cor || '#ff9900'
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });

                    // Verifica se a cabeceira está ativa
                    const pistaAtiva = radarLayerState.activeRunways.has(groupKey) ||
                                       chavesAssociadas.some(k => radarLayerState.activeRunways.has(`${icao}-${k}`));

                    // Container do bloco da pista (contém a linha da pista e a sub-lista de cartas)
                    const blocoPista = document.createElement('div');
                    blocoPista.className = 'drawer-bloco-pista';

                    const itemPista = document.createElement('label');
                    itemPista.className = 'drawer-item-pista';

                    const chkPista = document.createElement('input');
                    chkPista.type = 'checkbox';
                    chkPista.checked = pistaAtiva;
                    chkPista.dataset.runwayKey = groupKey;

                    const rotuloTexto = document.createElement('span');
                    rotuloTexto.className = 'drawer-rotulo-pista';
                    rotuloTexto.textContent = `RWY ${numPista}`;

                    itemPista.appendChild(chkPista);
                    itemPista.appendChild(rotuloTexto);
                    blocoPista.appendChild(itemPista);

                    // Sub-lista de Cartas / Procedimentos
                    const listaCartas = document.createElement('div');
                    listaCartas.className = 'drawer-lista-cartas';
                    if (!pistaAtiva) {
                        listaCartas.classList.add('oculto');
                    }

                    const chksCartas = [];

                    cartasDaPista.forEach(cartaObj => {
                        const itemCarta = document.createElement('label');
                        itemCarta.className = 'drawer-item-carta';

                        const chkCarta = document.createElement('input');
                        chkCarta.type = 'checkbox';
                        chkCarta.dataset.cartaNome = cartaObj.nome;
                        const cartaAtiva = radarLayerState.activeCharts ? radarLayerState.activeCharts.has(cartaObj.nome) : false;
                        chkCarta.checked = cartaAtiva;
                        chksCartas.push(chkCarta);

                        const dotCor = document.createElement('span');
                        dotCor.className = 'drawer-indicador-cor-carta';
                        dotCor.style.backgroundColor = cartaObj.cor;

                        const rotuloCarta = document.createElement('span');
                        rotuloCarta.className = 'drawer-rotulo-carta';
                        rotuloCarta.textContent = cartaObj.nome;

                        chkCarta.addEventListener('change', () => {
                            if (!radarLayerState.activeCharts) radarLayerState.activeCharts = new Set();
                            if (chkCarta.checked) {
                                radarLayerState.activeCharts.add(cartaObj.nome);
                            } else {
                                radarLayerState.activeCharts.delete(cartaObj.nome);
                            }

                            // Sincroniza o checkbox da pista pai
                            const algumaCartaAtiva = chksCartas.some(c => c.checked);
                            if (algumaCartaAtiva && !chkPista.checked) {
                                chkPista.checked = true;
                                radarLayerState.activeRunways.add(groupKey);
                                chavesAssociadas.forEach(k => radarLayerState.activeRunways.add(`${icao}-${k}`));
                                listaCartas.classList.remove('oculto');
                            } else if (!algumaCartaAtiva && chkPista.checked) {
                                chkPista.checked = false;
                                radarLayerState.activeRunways.delete(groupKey);
                                chavesAssociadas.forEach(k => radarLayerState.activeRunways.delete(`${icao}-${k}`));
                            }

                            if (painelFluxoUI && typeof painelFluxoUI.renderizarEsteiras === 'function') {
                                painelFluxoUI.renderizarEsteiras();
                            }
                        });

                        itemCarta.appendChild(chkCarta);
                        itemCarta.appendChild(dotCor);
                        itemCarta.appendChild(rotuloCarta);
                        listaCartas.appendChild(itemCarta);
                    });

                    // Evento da pista mestre
                    chkPista.addEventListener('change', () => {
                        if (chkPista.checked) {
                            radarLayerState.activeRunways.add(groupKey);
                            chavesAssociadas.forEach(k => radarLayerState.activeRunways.add(`${icao}-${k}`));
                            listaCartas.classList.remove('oculto');

                            // Ativa todas as cartas filhas
                            if (!radarLayerState.activeCharts) radarLayerState.activeCharts = new Set();
                            chksCartas.forEach(c => {
                                c.checked = true;
                                radarLayerState.activeCharts.add(c.dataset.cartaNome);
                            });
                        } else {
                            radarLayerState.activeRunways.delete(groupKey);
                            chavesAssociadas.forEach(k => radarLayerState.activeRunways.delete(`${icao}-${k}`));
                            listaCartas.classList.add('oculto');

                            // Desativa todas as cartas filhas
                            if (radarLayerState.activeCharts) {
                                chksCartas.forEach(c => {
                                    c.checked = false;
                                    radarLayerState.activeCharts.delete(c.dataset.cartaNome);
                                });
                            }
                        }

                        if (painelFluxoUI && typeof painelFluxoUI.renderizarEsteiras === 'function') {
                            painelFluxoUI.renderizarEsteiras();
                        }
                    });

                    blocoPista.appendChild(listaCartas);
                    listaPistas.appendChild(blocoPista);
                });

                aeroConteudo.appendChild(listaPistas);
                subBlocoAero.appendChild(aeroHeader);
                subBlocoAero.appendChild(aeroConteudo);
                conteudo.appendChild(subBlocoAero);
            });
        }

        blocoSecao.appendChild(header);
        blocoSecao.appendChild(conteudo);
        this.painelDrawer.appendChild(blocoSecao);
    }

    /**
     * Constrói a Seção "Brilho" com acordeão:
     * - Cabeçalho: Brilho ▼ (inicia recolhido)
     * - Sliders reativos para STAR, SID, IAC com indicador percentual
     */
    _construirSecaoBrilho() {
        const blocoSecao = document.createElement('div');
        blocoSecao.className = 'drawer-secao';

        const header = document.createElement('div');
        header.className = 'drawer-secao-header';
        header.innerHTML = `
            <span class="drawer-secao-titulo">BRILHO</span>
            <span class="drawer-secao-seta">&#9656;</span>
        `;

        const conteudo = document.createElement('div');
        conteudo.className = 'drawer-secao-conteudo recolhido';

        header.addEventListener('click', () => {
            const estaRecolhido = conteudo.classList.contains('recolhido');
            const seta = header.querySelector('.drawer-secao-seta');
            if (estaRecolhido) {
                conteudo.classList.remove('recolhido');
                seta.innerHTML = '&#9662;';
            } else {
                conteudo.classList.add('recolhido');
                seta.innerHTML = '&#9656;';
            }
        });

        // Definição dos canais de procedimentos e vídeo-mapa
        const canais = [
            { tipo: "STAR",    rotulo: "STAR (Chegada)",   valorPadrao: radarLayerState.opacity.STAR ?? 0.8 },
            { tipo: "SID",     rotulo: "SID (Saída)",      valorPadrao: radarLayerState.opacity.SID ?? 0.8 },
            { tipo: "IAC",     rotulo: "IAC (Aprox)",      valorPadrao: radarLayerState.opacity.IAC ?? 0.8 },
            { tipo: "ATCSMAC", rotulo: "ATCSMAC (Setores)", valorPadrao: radarLayerState.opacity.ATCSMAC ?? 0.0 }
        ];

        canais.forEach(canal => {
            const row = document.createElement('div');
            row.className = 'drawer-slider-row';

            const headerRow = document.createElement('div');
            headerRow.className = 'drawer-slider-label-row';

            const lblNome = document.createElement('span');
            lblNome.className = 'drawer-slider-nome';
            lblNome.textContent = canal.rotulo;

            const lblVal = document.createElement('span');
            lblVal.className = 'drawer-slider-val';
            lblVal.textContent = `${Math.round(canal.valorPadrao * 100)}%`;

            headerRow.appendChild(lblNome);
            headerRow.appendChild(lblVal);

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'drawer-slider';
            slider.min = '0';
            slider.max = '1';
            slider.step = '0.05';
            slider.value = canal.valorPadrao.toString();

            // Atualização reativa de opacidade em tempo real
            slider.addEventListener('input', () => {
                const val = parseFloat(slider.value);
                radarLayerState.opacity[canal.tipo] = val;
                lblVal.textContent = `${Math.round(val * 100)}%`;
            });

            row.appendChild(headerRow);
            row.appendChild(slider);
            conteudo.appendChild(row);
        });

        blocoSecao.appendChild(header);
        blocoSecao.appendChild(conteudo);
        this.painelDrawer.appendChild(blocoSecao);
    }

    _configurarEventosGlobais() {
        // Fechar ao pressionar Escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.aberto) {
                this.fecharDrawer();
            }
        });
    }
}

// Instância singleton inicializável
export let videoMapDrawerController = null;

export function inicializarVideoMapDrawer() {
    if (!videoMapDrawerController) {
        videoMapDrawerController = new VideoMapDrawerController();
    }
    return videoMapDrawerController;
}

