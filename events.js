import { state } from './state.js';
import { correcaoLon } from './utils.js';
import { deltaParaTela, telaParaDelta, pegarAeronaveProxima, pegarPontoProximo, pegarVetorProximo, desenharRadar } from './render.js';
import { scratchpadUI, menuNivelUI } from './ui.js';

/**
 * ============================================================================
 * GERENCIADOR DE INTERAÇÃO DO USUÁRIO E EVENTOS (EVENTS & CONTROLS)
 * ============================================================================
 * Este ficheiro gerencia todas as entradas de hardware (mouse, teclado e redimensionamento):
 * 1. Limites de pan e zoom para manter o espaço aéreo visível (`aplicarLimites`).
 * 2. Gestão de cliques do mouse: seleção de aeronaves, arraste de etiquetas,
 *    abertura de menus de nível, ancoragem e seleção de vetores de medição.
 * 3. Zoom focalizado na posição do cursor do mouse (Scroll Wheel).
 * 4. Atalhos de teclado operacionais padrão ATC (0-9, O, F, V, X, Z).
 * 5. Responsividade dinâmica da tela ao redimensionar a janela.
 * ============================================================================
 */

/**
 * Mantém o enquadramento da câmara, zoom e navegação completamente livres,
 * contendo apenas proteção matemática contra escala nula ou negativa (divisão por zero).
 * 
 * @param {boolean} duranteArraste - Flag mantida para compatibilidade de assinatura.
 */
export function aplicarLimites(duranteArraste = false) {
    // Permite zoom out livre e navegação sem travas; apenas evita divisão por zero ou valor negativo
    if (state.escala < 0.1) state.escala = 0.1;
}

/**
 * Funções wrappers mantidas para compatibilidade retroativa (delegam para a camada ui.js).
 */
export function inicializarMenuNiveis() {
    menuNivelUI.inicializar();
}

export function mostrarMenuNivel(x, y) {
    if (state.aeroEditandoNivel) {
        menuNivelUI.abrir(state.aeroEditandoNivel, x, y);
    }
}

export function mostrarInputTexto(aero) {
    scratchpadUI.abrir(aero);
}

export function ocultarInputTexto() {
    scratchpadUI.confirmar();
}

/**
 * Inicializa todos os ouvintes de eventos (Listeners) da interface:
 * - Mouse: mousedown, mousemove, mouseup, mouseleave, contextmenu, wheel.
 * - Teclado: keydown (atalhos operacionais ATC).
 * - Janela: resize.
 */
export function configurarEventosUsuario() {
    // -------------------------------------------------------------------------
    // 1. EVENTOS DE MOUSE NO CANVAS
    // -------------------------------------------------------------------------
    state.canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Botão esquerdo do mouse
            
            // Fecha menu dropdown de Flight Level se aberto
            if (menuNivelUI.estaAberto()) {
                menuNivelUI.fechar();
            }
            
            // Ignora cliques que atingiram painéis HTML flutuantes, botões de topo ou o scratchpad
            if (e.target.closest('#painelFluxo') || e.target.closest('#painelVento') || e.target.closest('#btnToggleFluxo') || e.target.closest('#btnToggleVento') || (scratchpadUI.el && e.target === scratchpadUI.el)) return;

            // 1.1. FERRAMENTA DE MEDIÇÃO / VETOR EM ANDAMENTO (Criado pela tecla 'O')
            if (state.vetorAtivo) {
                if (state.vetoresFixos.length < 20) {
                    let pDest = pegarPontoProximo(e.clientX, e.clientY);
                    state.vetorAtivo.destino = pDest.aero ? null : pDest.delta;
                    state.vetorAtivo.aeroDestino = pDest.aero || null;
                    state.vetoresFixos.push(state.vetorAtivo); 
                    state.vetorSelecionadoIndex = -1; // Mantém deselecionado após ancorar
                }
                state.vetorAtivo = null; 
                desenharRadar(); 
                return; 
            }
            
            // 1.2. DETECÇÃO DE CLIQUE EM ETIQUETAS DE AERONAVES (HIT-TEST)
            let clicouEtiqueta = false;
            let clicouEmTextoAtivo = false;

            for (let aero of state.aeronaves) {
                let pt = deltaParaTela(aero); 
                let isRight = Math.cos(aero.labelAngle) >= 0;
                
                let lx = pt.x + Math.cos(aero.labelAngle) * aero.labelDist; 
                let ly = pt.y - Math.sin(aero.labelAngle) * aero.labelDist;
                
                let minX = isRight ? lx + 5 : lx - 135; 
                let maxX = isRight ? lx + 135 : lx - 5;
                
                // Se o clique caiu dentro da Bounding Box da etiqueta
                if (e.clientX >= minX && e.clientX <= maxX && e.clientY >= ly - 25 && e.clientY <= ly + 40) {
                    clicouEtiqueta = true;
                    
                    if (e.clientY >= ly + 14) { 
                        // Linha 4 da etiqueta: Scratchpad / Texto Livre
                        clicouEmTextoAtivo = true;
                        if (state.aeroEditandoTexto !== aero) {
                            state.aeroArrastandoLabel = null;
                            scratchpadUI.abrir(aero);
                        }
                    } else if (e.clientY >= ly - 14 && e.clientY <= ly + 2) {
                        // Linha 2 da etiqueta: Altitude Atual e Nível Autorizado (CFL)
                        let clicouNoNivel = false;
                        if (isRight && e.clientX >= lx + 50 && e.clientX <= lx + 90) clicouNoNivel = true;
                        if (!isRight && e.clientX >= lx - 45 && e.clientX <= lx - 5) clicouNoNivel = true;
                        
                        if (clicouNoNivel) { 
                            scratchpadUI.confirmar();
                            menuNivelUI.abrir(aero, e.clientX, e.clientY);
                            return; 
                        } else { 
                            // Clicou fora do campo CFL: inicia reposicionamento da etiqueta
                            state.aeroArrastandoLabel = aero; 
                        }
                    } else { 
                        // Linha 1 (Callsign) ou Linha 3 (Velocidade): inicia reposicionamento da etiqueta
                        state.aeroArrastandoLabel = aero; 
                    }
                    
                    state.arrastouLabel = false; 
                    state.labelClickX = e.clientX; 
                    state.labelClickY = e.clientY; 
                    break;
                }
            }

            if (clicouEtiqueta) {
                // Se clicou na etiqueta mas não no scratchpad, confirma edição anterior
                if (!clicouEmTextoAtivo && scratchpadUI.estaAtivo()) {
                    scratchpadUI.confirmar();
                }
                // Desmarca vetor selecionado ao clicar fora dele
                if (state.vetorSelecionadoIndex !== -1) {
                    state.vetorSelecionadoIndex = -1;
                    desenharRadar();
                }
                return; 
            } 
            
            // 1.3. DETECÇÃO DE CLIQUE EM VETOR DE MEDIÇÃO
            // Permite selecionar uma linha de vetor já traçada clicando diretamente nela
            let vetorClicado = pegarVetorProximo(e.clientX, e.clientY);
            if (vetorClicado !== -1) {
                if (scratchpadUI.estaAtivo()) {
                    scratchpadUI.confirmar();
                }
                state.vetorSelecionadoIndex = vetorClicado;
                desenharRadar();
                return;
            } else if (state.vetorSelecionadoIndex !== -1) {
                // Clicou fora de qualquer vetor com o botão esquerdo: desmarca o vetor selecionado
                state.vetorSelecionadoIndex = -1;
                desenharRadar();
            }

            // 1.4. ARRASTE DO FUNDO DO RADAR (PANNING DA CÂMARA)
            if (scratchpadUI.estaAtivo()) {
                scratchpadUI.confirmar();
            }
            state.arrastando = true; 
            state.cliqueInicialX = e.clientX - state.offsetX; 
            state.cliqueInicialY = e.clientY - state.offsetY;
        }
    });

    state.canvas.addEventListener('mousemove', (e) => {
        state.mouseTelaX = e.clientX; 
        state.mouseTelaY = e.clientY;
        
        // 1. Reposicionamento de Etiqueta (Arraste da Linha Guia)
        if (state.aeroArrastandoLabel) {
            // Histerese de 3px para evitar movimentações acidentais em cliques curtos
            if (Math.hypot(state.mouseTelaX - state.labelClickX, state.mouseTelaY - state.labelClickY) > 3) {
                state.arrastouLabel = true;
            }
            
            if (state.arrastouLabel) {
                let dx = state.mouseTelaX - deltaParaTela(state.aeroArrastandoLabel).x; 
                let dy = deltaParaTela(state.aeroArrastandoLabel).y - state.mouseTelaY; 
                state.aeroArrastandoLabel.labelAngle = Math.atan2(dy, dx); 
                state.aeroArrastandoLabel.labelDist = Math.max(20, Math.hypot(dx, dy)); 
            } 
            return;
        }
        
        // 2. Arraste do Fundo do Radar (Pan)
        if (state.arrastando) { 
            state.offsetX = state.mouseTelaX - state.cliqueInicialX; 
            state.offsetY = state.mouseTelaY - state.cliqueInicialY; 
            aplicarLimites(true); 
        }
    });

    state.canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            // Se clicou na etiqueta e soltou sem arrastar, abre o Scratchpad para digitação
            if (state.aeroArrastandoLabel && !state.arrastouLabel) {
                scratchpadUI.abrir(state.aeroArrastandoLabel);
            }
            state.arrastando = false; 
            state.aeroArrastandoLabel = null;
        }
    });
    
    // Cancela estados de arraste se o cursor sair da janela do navegador
    state.canvas.addEventListener('mouseleave', () => { 
        state.arrastando = false; 
        state.aeroArrastandoLabel = null; 
    });

    // Desabilita o menu de contexto nativo do navegador no botão direito
    state.canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // -------------------------------------------------------------------------
    // 2. ZOOM DA CÂMARA VIA SCROLL DO MOUSE (WHEEL)
    // -------------------------------------------------------------------------
    state.canvas.addEventListener('wheel', (e) => {
        e.preventDefault(); 
        const direcao = e.deltaY < 0 ? 1.1 : 0.9; // 10% de zoom in ou out
        
        // Mantém a posição geográfica sob o cursor do mouse estacionária durante o zoom
        const distCentroX = state.mouseTelaX - (state.centroX + state.offsetX); 
        const distCentroY = state.mouseTelaY - (state.centroY + state.offsetY);
        
        state.escala *= direcao; 
        state.offsetX -= distCentroX * (direcao - 1); 
        state.offsetY -= distCentroY * (direcao - 1); 
        
        aplicarLimites(false); 
    }, { passive: false });

    // -------------------------------------------------------------------------
    // 3. ATALHOS DE TECLADO OPERACIONAIS ATC
    // -------------------------------------------------------------------------
    window.addEventListener('keydown', (e) => {
        // Ignora atalhos globais se o usuário estiver digitando em campos de texto
        if (scratchpadUI.estaAtivo() || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; 

        const tecla = e.key.toUpperCase();
        
        // TECLAS 0-9: Configura a extensão do vetor de velocidade / paliteiro em minutos
        if (tecla >= '0' && tecla <= '9') { 
            state.minutosPaliteiro = parseInt(tecla, 10); 
            desenharRadar(); 
            return; 
        }
        
        // TECLA 'O' (Origem): Inicia a criação de um vetor de medição (magnético exclusivamente em plot e etiqueta de aeronave)
        if (tecla === 'O') {
            if (state.vetoresFixos.length < 20) {
                let pOrig = pegarPontoProximo(state.mouseTelaX, state.mouseTelaY);
                state.vetorAtivo = { 
                    origem: pOrig.aero ? null : pOrig.delta, 
                    aeroOrigem: pOrig.aero || null, 
                    destino: null, 
                    aeroDestino: null 
                };
                state.vetorSelecionadoIndex = -1; // Deseleciona anterior ao iniciar um novo
                desenharRadar();
            }
        }
        
        // TECLA 'F' (Fim):
        // 1. Ancora o vetor ativo em criação na posição atual do cursor
        // 2. Com vetor medida já fixo, ao selecionar e apertar 'F', o fim/destino do vetor é feito para a posição do cursor
        if (tecla === 'F') {
            if (state.vetorAtivo) {
                if (state.vetoresFixos.length < 20) {
                    let pDest = pegarPontoProximo(state.mouseTelaX, state.mouseTelaY);
                    state.vetorAtivo.destino = pDest.aero ? null : pDest.delta;
                    state.vetorAtivo.aeroDestino = pDest.aero || null;
                    state.vetoresFixos.push(state.vetorAtivo); 
                    state.vetorSelecionadoIndex = -1; // Mantém deselecionado
                }
                state.vetorAtivo = null; 
                desenharRadar();
            } else if (state.vetorSelecionadoIndex >= 0 && state.vetorSelecionadoIndex < state.vetoresFixos.length) {
                let pDest = pegarPontoProximo(state.mouseTelaX, state.mouseTelaY);
                let vSel = state.vetoresFixos[state.vetorSelecionadoIndex];
                vSel.destino = pDest.aero ? null : pDest.delta;
                vSel.aeroDestino = pDest.aero || null;
                desenharRadar();
            }
        }
        
        // TECLA 'V': Alterna sequencialmente a seleção entre os vetores de medição existentes
        if (tecla === 'V' && state.vetoresFixos.length > 0) { 
            state.vetorSelecionadoIndex = (state.vetorSelecionadoIndex + 1) % state.vetoresFixos.length; 
            desenharRadar(); 
        }
        
        // TECLA 'Z': Apaga o vetor selecionado (ou o último vetor se nenhum estiver selecionado)
        // Regra operacional: Ao apagar, não seleciona automaticamente o próximo (reseta para -1)
        if (tecla === 'Z' && state.vetoresFixos.length > 0) {
            if (state.vetorSelecionadoIndex >= 0 && state.vetorSelecionadoIndex < state.vetoresFixos.length) {
                state.vetoresFixos.splice(state.vetorSelecionadoIndex, 1); 
            } else {
                state.vetoresFixos.pop(); 
            }
            state.vetorSelecionadoIndex = -1; 
            desenharRadar();
        }
        
        // TECLA 'X': Limpa e exclui todos os vetores de medição ativos de uma vez
        if (tecla === 'X') { 
            state.vetoresFixos = []; 
            state.vetorAtivo = null; 
            state.vetorSelecionadoIndex = -1; 
            desenharRadar(); 
        }
    });
    
    // -------------------------------------------------------------------------
    // 4. RESPONSIVIDADE E REDIMENSIONAMENTO DA JANELA (RESIZE)
    // -------------------------------------------------------------------------
    window.addEventListener('resize', () => {
        state.canvas.width = window.innerWidth; 
        state.canvas.height = window.innerHeight;
        state.centroX = state.canvas.width / 2; 
        state.centroY = state.canvas.height / 2; 
        aplicarLimites(false);
    });
}