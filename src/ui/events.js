import { state } from '../core/state.js';
import { correcaoLon } from '../utils/utils.js';
import { deltaParaTela, telaParaDelta, pegarAeronaveProxima, pegarVetorProximo, desenharRadar } from './render.js';
import { scratchpadUI, menuNivelUI, menuProaUI, menuVelocidadeUI, painelFluxoUI } from './ui.js';
import { menuRazaoController, estaLinhasExtrasVisiveis, obterEstadoProaVelATC } from './RadarTagController.js';
import { coordinateToolController, CURSOR_CROSSHAIR_PRETO } from './CoordinateToolController.js';
import { annotationController } from './AnnotationController.js';

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
    scratchpadUI.cancelar();
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
            
            // Fecha menu dropdown de Flight Level, Razão Vertical, Proa e Velocidade se abertos
            if (menuNivelUI.estaAberto()) {
                menuNivelUI.fechar();
            }
            if (menuRazaoController.estaAberto()) {
                menuRazaoController.fechar();
            }
            if (menuProaUI.estaAberto()) {
                menuProaUI.fechar();
            }
            if (menuVelocidadeUI.estaAberto()) {
                menuVelocidadeUI.fechar();
            }
            
            // Ignora cliques que atingiram painéis HTML flutuantes, botões de topo, scratchpad, menus ou ferramenta de coordenadas
            if (e.target.closest('#painelFluxo') || e.target.closest('#painelVento') || e.target.closest('#btnToggleFluxo') || e.target.closest('#btnToggleVento') || e.target.closest('#menuProa') || e.target.closest('#menuVelocidade') || e.target.closest('#menuNivel') || e.target.closest('#cardCoordenadas') || e.target.closest('#bannerModoCoordenadas') || (scratchpadUI.el && e.target === scratchpadUI.el)) return;

            // 1.0. FERRAMENTA DE LEITURA DE COORDENADAS (TECLA C)
            if (state.modoCoordenadas) {
                coordinateToolController.capturar(e.clientX, e.clientY);
                state.arrastando = true;
                state.cliqueInicialX = e.clientX - state.offsetX;
                state.cliqueInicialY = e.clientY - state.offsetY;
                return;
            }

            // 1.1. FERRAMENTA DE MEDIÇÃO / VETOR EM ANDAMENTO (Criado pela tecla 'O')
            if (state.vetorAtivo) {
                // Não fixa imediatamente no mousedown!
                // Permite segurar o clique e arrastar o mapa sem que o vetor fique fixo.
                state.cliqueVetorAtivoX = e.clientX;
                state.cliqueVetorAtivoY = e.clientY;
                state.arrastouVetorAtivo = false;
                state.arrastando = true;
                state.cliqueInicialX = e.clientX - state.offsetX;
                state.cliqueInicialY = e.clientY - state.offsetY;
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
                const TAG_WIDTH = 95;
                let textX = isRight ? (lx + 12) : (lx - 10 - TAG_WIDTH);
                
                let minX = textX - 4; 
                let maxX = textX + TAG_WIDTH + 8;
                
                const linhasExtras = estaLinhasExtrasVisiveis(aero);
                const maxEtiquetaY = linhasExtras ? (ly + 58) : (ly + 28);
                
                // Se o clique caiu dentro da Bounding Box da etiqueta
                if (e.clientX >= minX && e.clientX <= maxX && e.clientY >= ly - 27 && e.clientY <= maxEtiquetaY) {
                    clicouEtiqueta = true;
                    
                    const { temProa, temVel } = obterEstadoProaVelATC(aero);
                    const linha5Visivel = aero.expandida || temProa || temVel;
                    const temModVertical = Boolean(
                        aero.temModificacaoVertical ||
                        (aero.posicaoRadar && (aero.posicaoRadar.verticalMode === 'ATC-R' || aero.posicaoRadar.verticalMode === 'EXPD' || aero.posicaoRadar.clampedAtStructural)) ||
                        aero.clampedAtStructural
                    );
                    const linha6Visivel = aero.expandida || temModVertical;

                    if (linha6Visivel && e.clientY >= ly + 38 && e.clientY <= ly + 58) {
                        // Linha 6 da etiqueta: Razão Vertical e Modo (AUTO, ATC-R, EXPD)
                        scratchpadUI.cancelar();
                        menuRazaoController.abrir(aero, e.clientX, e.clientY);
                        return;
                    } else if (linha5Visivel && e.clientY >= ly + 26 && e.clientY < ly + 38) {
                        // Linha 5 da etiqueta: Proa Real, Proa Autorizada e Velocidade Autorizada
                        let clicouNaProa = false;
                        let clicouNaVel = false;

                        if (e.clientX >= textX + 26 && e.clientX <= textX + 57 && (aero.expandida || temProa)) clicouNaProa = true;
                        else if (e.clientX >= textX + 58 && e.clientX <= textX + 98 && (aero.expandida || temVel)) clicouNaVel = true;

                        if (clicouNaProa) {
                            scratchpadUI.cancelar();
                            menuProaUI.abrir(aero, e.clientX, e.clientY);
                            return;
                        } else if (clicouNaVel) {
                            scratchpadUI.cancelar();
                            menuVelocidadeUI.abrir(aero, e.clientX, e.clientY);
                            return;
                        } else {
                            state.aeroClicadoCallsign = null;
                            state.aeroArrastandoLabel = aero;
                        }
                    } else if (e.clientY >= ly + 12 && e.clientY <= ly + 26) { 
                        // Linha 4 da etiqueta: Scratchpad / Texto Livre
                        // Hitbox precisa diretamente sobre a área de texto (textX até textX + 80)
                        let clicouNoTexto = (e.clientX >= textX && e.clientX <= textX + 80 && e.clientY >= ly + 12 && e.clientY <= ly + 26);
                        if (clicouNoTexto) {
                            clicouEmTextoAtivo = true;
                            if (state.aeroEditandoTexto !== aero) {
                                state.aeroArrastandoLabel = null;
                                scratchpadUI.abrir(aero);
                            }
                        } else {
                            // Clicou fora do texto da Linha 4: inicia reposicionamento da etiqueta
                            state.aeroArrastandoLabel = aero;
                            state.aeroClicadoCallsign = null;
                        }
                    } else if (e.clientY >= ly - 14 && e.clientY <= ly + 1) {
                        // Linha 2 da etiqueta: Altitude Atual e Nível Autorizado (CFL)
                        // Hitbox precisa e ajustada diretamente sobre o número do Nível Autorizado (textX + 43 até textX + 71)
                        let clicouNoNivel = (e.clientX >= textX + 43 && e.clientX <= textX + 71 && e.clientY >= ly - 14 && e.clientY <= ly);
                        
                        if (clicouNoNivel) { 
                            scratchpadUI.cancelar();
                            menuNivelUI.abrir(aero, e.clientX, e.clientY);
                            return; 
                        } else { 
                            // Clicou fora do campo CFL (ex: na altitude atual ou espaço livre): inicia reposicionamento da etiqueta
                            state.aeroArrastandoLabel = aero; 
                            state.aeroClicadoCallsign = null;
                        }
                    } else if (e.clientY >= ly - 27 && e.clientY <= ly - 12) {
                        // Linha 1 da etiqueta: Callsign e Tipo de Aeronave
                        // Hitbox precisa diretamente sobre o texto do Callsign (textX até textX + 58 e ly - 26 até ly - 13)
                        let clicouNoCallsign = (e.clientX >= textX && e.clientX <= textX + 58 && e.clientY >= ly - 26 && e.clientY <= ly - 13);
                        if (clicouNoCallsign) {
                            state.aeroClicadoCallsign = aero;
                        } else {
                            state.aeroClicadoCallsign = null;
                        }
                        state.aeroArrastandoLabel = aero;
                    } else { 
                        // Linha 3 (Velocidade) ou área livre: inicia reposicionamento da etiqueta
                        state.aeroClicadoCallsign = null;
                        state.aeroArrastandoLabel = aero; 
                    }
                    
                    state.arrastouLabel = false; 
                    state.labelClickX = e.clientX; 
                    state.labelClickY = e.clientY; 
                    break;
                }
            }

            // Se não clicou na etiqueta, verifica clique direto no plot/blip (símbolo)
            if (!clicouEtiqueta) {
                for (let aero of state.aeronaves) {
                    let pt = deltaParaTela(aero);
                    let dist = Math.hypot(pt.x - e.clientX, pt.y - e.clientY);
                    if (dist < 15) {
                        // Clicou no plot do avião: gruda a etiqueta no plot
                        aero.labelDist = 40;
                        aero.labelAngle = Math.PI / 4;
                        desenharRadar();
                        return;
                    }
                }
            }

            if (clicouEtiqueta) {
                // Se clicou na etiqueta mas não no scratchpad, cancela edição anterior não validada por Enter
                if (!clicouEmTextoAtivo && scratchpadUI.estaAtivo()) {
                    scratchpadUI.cancelar();
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
                    scratchpadUI.cancelar();
                }
                state.vetorSelecionadoIndex = vetorClicado;
                desenharRadar();
                return;
            } else if (state.vetorSelecionadoIndex !== -1) {
                // Clicou fora de qualquer vetor com o botão esquerdo: desmarca o vetor selecionado
                state.vetorSelecionadoIndex = -1;
                desenharRadar();
            }

            // 1.4. ARRASTE DO FUNDO DO RADAR (PANNING DA CÂMARA) OU CLIQUE NO RADAR
            if (scratchpadUI.estaAtivo()) {
                scratchpadUI.cancelar();
            }
            state.arrastando = true; 
            state.cliqueInicialX = e.clientX - state.offsetX; 
            state.cliqueInicialY = e.clientY - state.offsetY;
        }
    });

    state.canvas.addEventListener('mousemove', (e) => {
        state.mouseTelaX = e.clientX; 
        state.mouseTelaY = e.clientY;
        
        // 0. Atualização do cursor do mouse: se mira de coordenadas ativa, mantém crosshair preto
        if (state.modoCoordenadas) {
            state.canvas.style.cursor = CURSOR_CROSSHAIR_PRETO;
        } else if (!state.arrastando && !state.aeroArrastandoLabel && !state.vetorAtivo) {
            if (state.vetoresFixos.length > 0 && pegarVetorProximo(e.clientX, e.clientY) !== -1) {
                state.canvas.style.cursor = 'pointer';
            } else {
                state.canvas.style.cursor = 'default';
            }
        }

        // 1. Se estiver com vetor ativo e com clique pressionado (arraste da tela durante medição)
        if (state.vetorAtivo && state.cliqueVetorAtivoX !== null) {
            if (Math.hypot(e.clientX - state.cliqueVetorAtivoX, e.clientY - state.cliqueVetorAtivoY) > 5) {
                state.arrastouVetorAtivo = true;
            }
            if (state.arrastando) {
                state.offsetX = state.mouseTelaX - state.cliqueInicialX;
                state.offsetY = state.mouseTelaY - state.cliqueInicialY;
                aplicarLimites(true);
            }
            desenharRadar();
            return;
        }

        // 2. Reposicionamento de Etiqueta (Arraste da Linha Guia)
        if (state.aeroArrastandoLabel) {
            // Histerese de 5px para evitar movimentações acidentais em cliques curtos
            if (Math.hypot(state.mouseTelaX - state.labelClickX, state.mouseTelaY - state.labelClickY) > 5) {
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
        
        // 3. Arraste do Fundo do Radar (Pan)
        if (state.arrastando) { 
            state.offsetX = state.mouseTelaX - state.cliqueInicialX; 
            state.offsetY = state.mouseTelaY - state.cliqueInicialY; 
            aplicarLimites(true); 
        }
    });

    state.canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            // 0. Modo de coordenadas ativo (Tecla C): encerra qualquer arraste e mantém o cursor em crosshair preto
            if (state.modoCoordenadas) {
                state.arrastando = false;
                state.canvas.style.cursor = CURSOR_CROSSHAIR_PRETO;
                desenharRadar();
                return;
            }

            // 1. Finalização ou arraste durante Vetor Ativo de medição
            if (state.vetorAtivo && state.cliqueVetorAtivoX !== null) {
                if (!state.arrastouVetorAtivo) {
                    // Clicou sem arrastar -> O VETOR PRENDA!
                    if (state.vetoresFixos.length < 20) {
                        let aero = pegarAeronaveProxima(e.clientX, e.clientY);
                        if (aero) {
                            state.vetorAtivo.destino = null;
                            state.vetorAtivo.aeroDestino = aero; // Gruda no plot da aeronave!
                        } else {
                            state.vetorAtivo.destino = telaParaDelta(e.clientX, e.clientY);
                            state.vetorAtivo.aeroDestino = null;
                        }
                        state.vetoresFixos.push(state.vetorAtivo); 
                        state.vetorSelecionadoIndex = -1;
                    }
                    state.vetorAtivo = null;
                }
                // Se segurou o clique e arrastou, o vetor NÃO fica fixo! Apenas encerra o arraste da tela.
                state.cliqueVetorAtivoX = null;
                state.cliqueVetorAtivoY = null;
                state.arrastouVetorAtivo = false;
                state.arrastando = false;
                desenharRadar();
                return;
            }

            // 2. Se clicou na etiqueta e soltou sem arrastar:
            if (state.aeroArrastandoLabel && !state.arrastouLabel) {
                const aero = state.aeroArrastandoLabel;
                if (state.aeroClicadoCallsign === aero) {
                    // Clique no Callsign (Linha 1): alterna expansão da etiqueta
                    aero.expandida = !aero.expandida;
                    desenharRadar();
                }
                // Se clicou em qualquer outra parte da etiqueta sem arrastar: não faz nada, preserva a posição atual
            }
            state.aeroClicadoCallsign = null;
            state.arrastando = false; 
            state.aeroArrastandoLabel = null;
        }
    });
    
    // Cancela estados de arraste se o cursor sair da janela do navegador
    state.canvas.addEventListener('mouseleave', () => { 
        state.arrastando = false; 
        state.aeroArrastandoLabel = null; 
        state.aeroClicadoCallsign = null;
        state.cliqueVetorAtivoX = null;
        state.arrastouVetorAtivo = false;
        state.canvas.style.cursor = state.modoCoordenadas ? CURSOR_CROSSHAIR_PRETO : 'default';
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
        if (scratchpadUI.estaAtivo() || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return; 

        const tecla = e.key.toUpperCase();
        
        // TECLA 'C': Alterna ferramenta de mira e captura de coordenadas geográficas
        if (tecla === 'C') {
            coordinateToolController.toggle();
            desenharRadar();
            return;
        }

        // TECLA 'E': Alterna HUD de Telemetria de Energia e Aproximação (Seção 24)
        if (tecla === 'E') {
            state.mostrarHUDEnergia = !state.mostrarHUDEnergia;
            desenharRadar();
            return;
        }

        // TECLAS 0-9: Configura a extensão do vetor de velocidade / paliteiro em minutos
        if (tecla >= '0' && tecla <= '9') { 
            state.minutosPaliteiro = parseInt(tecla, 10); 
            desenharRadar(); 
            return; 
        }
        
        // TECLA 'O' (Origem): Inicia a criação de um vetor de medição
        // Se estiver sobre aeronave/etiqueta, gruda no plot. Senão, inicia livre nas coordenadas do cursor.
        if (tecla === 'O') {
            if (state.vetoresFixos.length < 20) {
                let aero = pegarAeronaveProxima(state.mouseTelaX, state.mouseTelaY);
                state.vetorAtivo = { 
                    origem: aero ? null : telaParaDelta(state.mouseTelaX, state.mouseTelaY), 
                    aeroOrigem: aero || null, 
                    destino: null, 
                    aeroDestino: null 
                };
                state.cliqueVetorAtivoX = null;
                state.cliqueVetorAtivoY = null;
                state.arrastouVetorAtivo = false;
                state.vetorSelecionadoIndex = -1; // Deseleciona anterior ao iniciar um novo
                state.canvas.style.cursor = 'default';
                desenharRadar();
            }
        }
        
        // TECLA 'F' (Fim):
        // 1. Ancora o vetor ativo em criação (gruda no plot se sobre aeronave/etiqueta, senão livre)
        // 2. Com vetor medida já fixo, ancora o destino
        if (tecla === 'F') {
            if (state.vetorAtivo) {
                if (state.vetoresFixos.length < 20) {
                    let aero = pegarAeronaveProxima(state.mouseTelaX, state.mouseTelaY);
                    if (aero) {
                        state.vetorAtivo.destino = null;
                        state.vetorAtivo.aeroDestino = aero;
                    } else {
                        state.vetorAtivo.destino = telaParaDelta(state.mouseTelaX, state.mouseTelaY);
                        state.vetorAtivo.aeroDestino = null;
                    }
                    state.vetoresFixos.push(state.vetorAtivo); 
                    state.vetorSelecionadoIndex = -1; // Mantém deselecionado
                }
                state.vetorAtivo = null; 
                state.cliqueVetorAtivoX = null;
                state.cliqueVetorAtivoY = null;
                state.arrastouVetorAtivo = false;
                desenharRadar();
            } else if (state.vetorSelecionadoIndex >= 0 && state.vetorSelecionadoIndex < state.vetoresFixos.length) {
                let aero = pegarAeronaveProxima(state.mouseTelaX, state.mouseTelaY);
                let vSel = state.vetoresFixos[state.vetorSelecionadoIndex];
                if (aero) {
                    vSel.destino = null;
                    vSel.aeroDestino = aero;
                } else {
                    vSel.destino = telaParaDelta(state.mouseTelaX, state.mouseTelaY);
                    vSel.aeroDestino = null;
                }
                desenharRadar();
            }
        }
        
        // ATALHO 'P': Alterna Camada de Anotação e Caneta do Instrutor
        if (tecla === 'P' && !e.ctrlKey && !e.altKey) {
            annotationController.toggle();
            return;
        }

        // ATALHOS DE DESFAZER / REFAZER ANOTAÇÕES (CTRL+Z e CTRL+Y / CTRL+SHIFT+Z)
        if (e.ctrlKey && tecla === 'Z' && !e.shiftKey) {
            e.preventDefault();
            annotationController.desfazer();
            return;
        }

        if ((e.ctrlKey && tecla === 'Y') || (e.ctrlKey && e.shiftKey && tecla === 'Z')) {
            e.preventDefault();
            annotationController.refazer();
            return;
        }

        // TECLA 'V': Alterna sequencialmente a seleção entre os vetores de medição existentes
        if (tecla === 'V' && state.vetoresFixos.length > 0) { 
            state.vetorSelecionadoIndex = (state.vetorSelecionadoIndex + 1) % state.vetoresFixos.length; 
            desenharRadar(); 
        }
        
        // TECLA 'Z': Apaga o vetor selecionado (ou o último vetor se nenhum estiver selecionado)
        // Regra operacional: Ao apagar, não seleciona automaticamente o próximo (reseta para -1)
        if (!e.ctrlKey && tecla === 'Z' && state.vetoresFixos.length > 0) {
            if (state.vetorSelecionadoIndex >= 0 && state.vetorSelecionadoIndex < state.vetoresFixos.length) {
                state.vetoresFixos.splice(state.vetorSelecionadoIndex, 1); 
            } else {
                state.vetoresFixos.pop(); 
            }
            state.vetorSelecionadoIndex = -1; 
            desenharRadar();
        }
        
        // TECLA ESCAPE: Cancela modo de coordenadas, painel de anotação, painel de fluxo aberto ou vetor ativo em criação
        if (e.key === 'Escape') {
            if (annotationController.estaAberto()) {
                annotationController.fechar();
                return;
            }
            if (state.modoCoordenadas) {
                coordinateToolController.desativar();
                desenharRadar();
                return;
            }
            if (painelFluxoUI.estaAberto()) {
                painelFluxoUI.fechar();
                return;
            }
            if (state.vetorAtivo) {
                state.vetorAtivo = null;
                state.cliqueVetorAtivoX = null;
                state.cliqueVetorAtivoY = null;
                state.arrastouVetorAtivo = false;
                state.arrastando = false;
                state.canvas.style.cursor = 'default';
                desenharRadar();
            }
        }

        // TECLA 'X': Limpa e exclui todos os vetores de medição ativos de uma vez
        if (tecla === 'X') { 
            state.vetoresFixos = []; 
            state.vetorAtivo = null; 
            state.cliqueVetorAtivoX = null;
            state.cliqueVetorAtivoY = null;
            state.arrastouVetorAtivo = false;
            state.vetorSelecionadoIndex = -1; 
            state.canvas.style.cursor = 'default';
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