// progressManager.js - Gerenciamento do progresso do usuário e bloqueio de conteúdo

// Importar dependências
import { 
    allVideos, 
    advancedVideos, 
    apiConfig, 
    progressConfig, 
    uiConfig 
} from './config.js';

import { 
    showTimeLockPopup, 
    showCompletionModal 
} from './videoPlayer.js';

// Variáveis de estado compartilhadas
export let currentVideoId = 'boasvindas';
export let isLoggedIn = false;
export let userData = null;
export let videoProgress = {};

// Carregar progresso do usuário
export async function loadUserProgress() {
    try {
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.videoProgress}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.status === 200) {
            const data = await response.json();
            videoProgress = data.videoProgress || {};
            
            console.log('Progresso carregado:', videoProgress);
            
            // Atualizar UI com o progresso
            updateProgressUI();
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Erro ao carregar progresso:', error);
        return false;
    }
}

// Salvar progresso no servidor
export async function saveVideoProgress() {
    if (!isLoggedIn) return;
    
    try {
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.videoProgress}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoProgress: videoProgress
            }),
            credentials: 'include'
        });
        
        if (response.status === 200) {
            const data = await response.json();
            console.log('Progresso salvo com sucesso:', data);
            
            // Atualizar progresso local com o retornado pelo servidor
            if (data.videoProgress) {
                videoProgress = data.videoProgress;
                updateProgressUI();
            }
            
            // Verificar se o certificado está disponível
            if (data.certificateEligible) {
                showCertificateAvailable();
            }
            
            return true;
        } else {
            console.error('Erro ao salvar progresso:', response.statusText);
            return false;
        }
    } catch (error) {
        console.error('Falha ao enviar progresso:', error);
        return false;
    }
}

// Verificar disponibilidade de conteúdo avançado baseado em tempo
export async function checkContentAvailability() {
    try {
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.contentAvailability}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.status === 200) {
            const data = await response.json();
            window.advancedContentAvailable = data.advancedContentAvailable;
            
            console.log('Disponibilidade de conteúdo avançado:', window.advancedContentAvailable);
            
            // Se o conteúdo avançado não estiver disponível
            if (!window.advancedContentAvailable) {
                lockAdvancedContent(data.remainingTime);
            }
            
            return window.advancedContentAvailable;
        }
        
        return false;
    } catch (error) {
        console.error('Erro ao verificar disponibilidade de conteúdo:', error);
        return false;
    }
}

// Bloquear conteúdo avançado
export function lockAdvancedContent(remainingTime) {
    // Bloquear as seções avançadas
    const estrategiasSection = document.querySelector('[data-section="estrategias"]');
    const finalSection = document.querySelector('[data-section="final"]');
    
    if (estrategiasSection) {
        estrategiasSection.classList.add('section-locked');
        
        // Desabilitar links de módulos
        const moduleLinks = estrategiasSection.querySelectorAll('.module-link');
        moduleLinks.forEach(link => {
            link.onclick = function(e) {
                e.preventDefault();
                showTimeLockPopup(e);
            };
            link.classList.add('locked');
        });
    }
    
    if (finalSection) {
        finalSection.classList.add('section-locked');
        
        // Desabilitar links de módulos
        const moduleLinks = finalSection.querySelectorAll('.module-link');
        moduleLinks.forEach(link => {
            link.onclick = function(e) {
                e.preventDefault();
                showTimeLockPopup(e);
            };
            link.classList.add('locked');
        });
    }
    
    // Atualizar temporizador na popup
    if (remainingTime) {
        const remainingDaysEl = document.getElementById('remainingDays');
        const remainingHoursEl = document.getElementById('remainingHours');
        
        if (remainingDaysEl && remainingHoursEl) {
            remainingDaysEl.textContent = remainingTime.days;
            remainingHoursEl.textContent = remainingTime.hours;
        }
    }
    
    // Se estiver visualizando um vídeo bloqueado, redirecionar
    if (advancedVideos.includes(currentVideoId)) {
        currentVideoId = 'boasvindas';
        const firstAvailableLink = document.querySelector('[data-video-id="boasvindas"]');
        if (firstAvailableLink) {
            document.querySelector('.course-title').textContent = firstAvailableLink.dataset.title;
            document.querySelectorAll('.module-link').forEach(link => {
                link.classList.remove('active');
            });
            firstAvailableLink.classList.add('active');
            
            // Recarregar o vídeo de boas-vindas
            const videoPlayer = document.querySelector('.video-player');
            const youtubeId = 'v5TW4rUHeHU';
            let iframe = videoPlayer.querySelector('iframe');
            
            if (iframe) {
                iframe.src = `https://www.youtube.com/embed/${youtubeId}?rel=0&showinfo=0&autoplay=1`;
            }
        }
    }
}

// Atualizar UI de progresso
export function updateProgressUI() {
    // Contador de vídeos completados
    let completedCount = 0;
    let totalProgress = 0;
    
    // Atualizar cada item no menu
    allVideos.forEach(videoId => {
        const progress = videoProgress[videoId] || 0;
        
        // Atualizar ou criar elementos de progresso
        const moduleLink = document.querySelector(`.module-link[data-video-id="${videoId}"]`);
        if (moduleLink) {
            // Verificar/criar/atualizar indicador de progresso
            let progressEl = moduleLink.querySelector('.module-completion');
            if (!progressEl && progress > 0) {
                progressEl = document.createElement('span');
                progressEl.className = 'module-completion';
                moduleLink.appendChild(progressEl);
            }
            
            if (progressEl) {
                progressEl.textContent = `${Math.floor(progress)}%`;
            }
            
            // Atualizar ícone baseado no progresso
            const icon = moduleLink.querySelector('i');
            if (icon) {
                if (progress >= progressConfig.completionThreshold) {
                    // Completado
                    icon.className = uiConfig.icons.completed;
                    completedCount++;
                } else if (progress > 0) {
                    // Em progresso
                    icon.className = uiConfig.icons.inProgress;
                } else {
                    // Não iniciado
                    icon.className = uiConfig.icons.notStarted;
                }
            }
        }
        
        // Adicionar ao progresso total
        totalProgress += progress;
    });
    
    // Atualizar progresso global
    const overallProgressEl = document.getElementById('overallProgress');
    const progressBarFill = document.getElementById('progressBarFill');
    const overallPercentage = Math.floor(totalProgress / allVideos.length);
    
    if (overallProgressEl) {
        overallProgressEl.textContent = `${overallPercentage}%`;
    }
    
    if (progressBarFill) {
        progressBarFill.style.width = `${overallPercentage}%`;
    }
    
    // Atualizar contador de aulas completadas
    const completedCountEl = document.getElementById('completedCount');
    if (completedCountEl) {
        completedCountEl.textContent = `${completedCount} de ${allVideos.length} aulas`;
    }
    
    // Verificar elegibilidade para certificado
    if (completedCount === allVideos.length) {
        showCertificateAvailable();
    }
    
    // Atualizar badge no avatar
    updateUserAvatar(overallPercentage);
    
    // Atualizar o estado do botão de conclusão
    updateCompleteButtonState();
}

// Marcar vídeo atual como concluído
export function markCurrentVideoAsCompleted() {
    if (!isLoggedIn) {
        showLoginOverlay();
        return;
    }
    
    // Se já estiver concluído, não fazer nada
    const completeButton = document.getElementById('completeButton');
    if (completeButton.classList.contains('completed')) {
        return;
    }
    
    // Definir progresso como 100%
    videoProgress[currentVideoId] = 100;
    
    // Salvar no servidor
    saveVideoProgress();
    
    // Atualizar estado do botão
    completeButton.classList.add('completed');
    const spanElement = completeButton.querySelector('span');
    if (spanElement) {
        spanElement.textContent = 'Concluído';
    } else {
        completeButton.innerHTML = '<i class="fas fa-check"></i> <span>Concluído</span>';
    }
    
    // Atualizar ícone na lista de módulos
    const moduleLink = document.querySelector(`.module-link[data-video-id="${currentVideoId}"]`);
    if (moduleLink) {
        const icon = moduleLink.querySelector('i');
        if (icon) {
            icon.className = uiConfig.icons.completed;
        }
        
        // Adicionar ou atualizar indicador de progresso
        let progressSpan = moduleLink.querySelector('.module-completion');
        if (!progressSpan) {
            progressSpan = document.createElement('span');
            progressSpan.className = 'module-completion';
            moduleLink.appendChild(progressSpan);
        }
        progressSpan.textContent = '100%';
    }
    
    // Atualizar UI
    updateProgressUI();
    
    // Adicionar efeito visual
    completeButton.classList.add('pulse-once');
    setTimeout(() => {
        completeButton.classList.remove('pulse-once');
    }, uiConfig.pulseEffectDuration);
    
    // Verificar se há próximo vídeo
    const nextButton = document.querySelector('.nav-button.next');
    const hasNextVideo = nextButton && nextButton.style.visibility !== 'hidden';
    
    // Mostrar modal de conclusão
    showCompletionModal(hasNextVideo);
    
    // Destacar botão de próximo, se disponível
    if (hasNextVideo) {
        nextButton.classList.add('attention');
        setTimeout(() => {
            nextButton.classList.remove('attention');
        }, uiConfig.highlightButtonDuration);
    }
}

// Atualizar estado do botão de conclusão
export function updateCompleteButtonState() {
    const completeButton = document.getElementById('completeButton');
    if (!completeButton) return;
    
    const progress = videoProgress[currentVideoId] || 0;
    
    if (progress >= progressConfig.completionThreshold) {
        completeButton.classList.add('completed');
        const spanElement = completeButton.querySelector('span');
        if (spanElement) {
            spanElement.textContent = 'Concluído';
        } else {
            completeButton.innerHTML = '<i class="fas fa-check"></i> <span>Concluído</span>';
        }
    } else {
        completeButton.classList.remove('completed');
        const spanElement = completeButton.querySelector('span');
        if (spanElement) {
            spanElement.textContent = 'Marcar como concluído';
        } else {
            completeButton.innerHTML = '<i class="fas fa-check"></i> <span>Marcar como concluído</span>';
        }
    }
}

// Atualizar badge no avatar do usuário
export function updateUserAvatar(percentage) {
    const userAvatar = document.querySelector('.user-avatar');
    if (!userAvatar) return;
    
    // Remover badge existente, se houver
    const existingBadge = userAvatar.querySelector('.completion-badge');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    // Adicionar nova badge se o progresso for maior que 0
    if (percentage > 0) {
        const badge = document.createElement('span');
        badge.className = 'completion-badge';
        badge.textContent = `${percentage}%`;
        userAvatar.appendChild(badge);
        
        // Se completou 100%, mudar a cor para verde
        if (percentage === 100) {
            badge.style.backgroundColor = '#4CAF50';
        }
    }
}

// Mostrar certificado disponível
export function showCertificateAvailable() {
    const certificateAvailable = document.getElementById('certificateAvailable');
    if (certificateAvailable) {
        certificateAvailable.style.display = 'block';
    }
}
