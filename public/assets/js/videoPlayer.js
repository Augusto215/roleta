// videoPlayer.js - Gerenciamento do player de vídeo e navegação

// Importar dependências
import { 
    youtubeIds, 
    advancedVideos, 
    uiConfig 
} from './config.js';

import {
    currentVideoId,
    isLoggedIn,
    videoProgress,
    saveVideoProgress,
    updateProgressUI,
    updateCompleteButtonState
} from './progressManager.js';

// Função para carregar um vídeo do YouTube
export function loadYouTubeVideo(internalVideoId) {
    // Verificar autenticação
    if (!isLoggedIn) {
        showLoginOverlay();
        return;
    }
    
    // Verificar se o vídeo está bloqueado
    const videoLink = document.querySelector(`.module-link[data-video-id="${internalVideoId}"]`);
    if (videoLink && videoLink.classList.contains('locked')) {
        showTimeLockPopup(new Event('custom'));
        return;
    }
    
    // Para vídeos avançados, verificar disponibilidade
    if (advancedVideos.includes(internalVideoId) && !window.advancedContentAvailable) {
        showTimeLockPopup(new Event('custom'));
        return;
    }
    
    // Obter ID do YouTube
    const youtubeId = youtubeIds[internalVideoId] || 'v5TW4rUHeHU';
    
    // Obter container do vídeo
    const videoPlayer = document.querySelector('.video-player');
    
    // Criar ou atualizar o iframe
    let iframe = videoPlayer.querySelector('iframe');
    if (!iframe) {
        // Remover botão de play se existir
        const playButton = videoPlayer.querySelector('.play-button');
        if (playButton) playButton.remove();
        
        // Criar iframe
        iframe = document.createElement('iframe');
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.frameborder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        
        // Adicionar iframe ao player
        videoPlayer.appendChild(iframe);
    }
    
    // Atualizar src do iframe com autoplay
    iframe.src = `https://www.youtube.com/embed/${youtubeId}?rel=0&showinfo=0&autoplay=1`;
    
    // Atualizar atributo de dados do player
    videoPlayer.dataset.videoId = internalVideoId;
    
    // Atualizar variável global do ID do vídeo atual
    window.currentVideoId = internalVideoId;
    
    // Atualizar título
    if (videoLink && !videoLink.classList.contains('locked')) {
        document.querySelector('.course-title').textContent = videoLink.dataset.title;
    }
    
    // Atualizar links ativos
    document.querySelectorAll('.module-link').forEach(link => {
        link.classList.remove('active');
    });
    if (videoLink && !videoLink.classList.contains('locked')) {
        videoLink.classList.add('active');
    }
    
    // Atualizar navegação
    updateNavigationButtons();
    
    // Atualizar botão de conclusão
    if (typeof updateCompleteButtonState === 'function') {
        setTimeout(updateCompleteButtonState, 300);
    }
    
    // Registrar visualização parcial após 5 segundos
    setTimeout(() => {
        if (window.currentVideoId === internalVideoId) {
            // Se ainda estivermos no mesmo vídeo após 5 segundos
            if (!videoProgress[internalVideoId] || videoProgress[internalVideoId] < 30) {
                // Definir progresso inicial se não existir ou for menor que 30%
                window.videoProgress[internalVideoId] = 30;
                saveVideoProgress();
            }
        }
    }, 5000);
}

// Atualizar botões de navegação
export function updateNavigationButtons() {
    const activeLink = document.querySelector('.module-link.active');
    if (!activeLink) return;
    
    const activeModule = activeLink.closest('.module-item');
    let prevModule = activeModule.previousElementSibling;
    let nextModule = activeModule.nextElementSibling;
    
    const prevButton = document.querySelector('.nav-button.prev');
    const nextButton = document.querySelector('.nav-button.next');
    
    // Botão anterior
    if (prevButton) {
        if (prevModule) {
            const prevLink = prevModule.querySelector('.module-link');
            if (prevLink) {
                prevButton.dataset.videoId = prevLink.dataset.videoId;
                prevButton.style.visibility = 'visible';
                
                // Adicionar classe visual se o link estiver bloqueado
                if (prevLink.classList.contains('locked')) {
                    prevButton.classList.add('locked-nav');
                } else {
                    prevButton.classList.remove('locked-nav');
                }
            }
        } else {
            prevButton.style.visibility = 'hidden';
        }
    }
    
    // Botão próximo
    if (nextButton) {
        if (nextModule) {
            const nextLink = nextModule.querySelector('.module-link');
            if (nextLink) {
                nextButton.dataset.videoId = nextLink.dataset.videoId;
                nextButton.style.visibility = 'visible';
                
                // Adicionar classe visual se o link estiver bloqueado
                if (nextLink.classList.contains('locked')) {
                    nextButton.classList.add('locked-nav');
                } else {
                    nextButton.classList.remove('locked-nav');
                }
            }
        } else {
            nextButton.style.visibility = 'hidden';
        }
    }
}

// Configurar botões de navegação
export function setupNavigationButtons() {
    const prevButton = document.querySelector('.nav-button.prev');
    const nextButton = document.querySelector('.nav-button.next');
    
    if (prevButton) {
        prevButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.dataset.videoId) {
                const targetLink = document.querySelector(`.module-link[data-video-id="${this.dataset.videoId}"]`);
                
                if (targetLink && targetLink.classList.contains('locked')) {
                    showTimeLockPopup(e);
                    return;
                }
                
                loadYouTubeVideo(this.dataset.videoId);
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.dataset.videoId) {
                const targetLink = document.querySelector(`.module-link[data-video-id="${this.dataset.videoId}"]`);
                
                if (targetLink && targetLink.classList.contains('locked')) {
                    showTimeLockPopup(e);
                    return;
                }
                
                loadYouTubeVideo(this.dataset.videoId);
            }
        });
    }
}

// Configurar seções colapsáveis
export function setupCollapsibleSections() {
    const sectionHeaders = document.querySelectorAll('.section-title');
    sectionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const arrowIcon = this.querySelector('.section-toggle');
            arrowIcon.classList.toggle('rotate');
            
            const sectionElement = this.closest('.course-section');
            const moduleList = sectionElement.querySelector('.module-list');
            moduleList.classList.toggle('show');
        });
    });
}

// Configurar links de módulos
export function setupModuleLinks() {
    const moduleLinks = document.querySelectorAll('.module-link');
    moduleLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.classList.contains('locked')) {
                showTimeLockPopup(e);
                return;
            }
            
            const videoId = this.getAttribute('data-video-id');
            if (videoId) {
                loadYouTubeVideo(videoId);
            }
        });
    });
}

// Mostrar overlay de login
export function showLoginOverlay() {
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) {
        loginOverlay.style.display = 'flex';
    }
}

// Mostrar popup de bloqueio de tempo
export function showTimeLockPopup(e) {
    e.preventDefault();
    const timeLockOverlay = document.getElementById('timeLockOverlay');
    if (timeLockOverlay) {
        timeLockOverlay.style.display = 'flex';
    }
}

// Mostrar modal de conclusão
export function showCompletionModal(hasNextVideo = false) {
    const completionModal = document.getElementById('completionModal');
    const nextButton = document.getElementById('completionNextButton');
    
    if (completionModal) {
        // Mostrar ou esconder botão "Próxima aula" dependendo se existe próximo vídeo
        if (nextButton) {
            nextButton.style.display = hasNextVideo ? 'block' : 'none';
            
            // Configurar botão para próximo vídeo
            if (hasNextVideo) {
                const nextVideoId = document.querySelector('.nav-button.next').dataset.videoId;
                nextButton.onclick = () => {
                    completionModal.style.display = 'none';
                    loadYouTubeVideo(nextVideoId);
                };
            }
        }
        
        // Configurar botão fechar
        const closeButton = document.getElementById('completionCloseButton');
        if (closeButton) {
            closeButton.onclick = () => {
                completionModal.style.display = 'none';
            };
        }
        
        completionModal.style.display = 'flex';
    }
}