// index.js - Arquivo principal de entrada que importa todos os módulos

// Importar módulos
import { checkLoginStatus } from './authManager.js';
import { loadYouTubeVideo, updateNavigationButtons } from './videoPlayer.js';
import { updateProgressUI, markCurrentVideoAsCompleted, checkContentAvailability } from './progressManager.js';

// Estado global inicial
window.currentVideoId = 'boasvindas';
window.isLoggedIn = false;
window.userData = null;
window.videoProgress = {};
window.advancedContentAvailable = false;
window.advancedContentCheckComplete = false;

// Inicialização quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicializando sistema de curso...');
    
    // Verificar autenticação do usuário
    const user = await checkLoginStatus();
    
    // Se o usuário estiver logado, carregar dados do curso
    if (user) {
        console.log('Usuário autenticado:', user.username);
        window.isLoggedIn = true;
        window.userData = user;
        
        // Verificar disponibilidade de conteúdo avançado
        const contentAvailable = await checkContentAvailability();
        window.advancedContentAvailable = contentAvailable;
        window.advancedContentCheckComplete = true;
        
        console.log('Conteúdo avançado disponível:', contentAvailable);
        
        // Verificar elegibilidade para certificado        
        // Atualizar UI com progresso
        updateProgressUI();
        
        // Inicializar elementos interativos 
        setupEventListeners();
        
        // Carregar vídeo inicial
        setTimeout(function() {
            const welcomeLink = document.querySelector('.module-link[data-video-id="boasvindas"]');
            if (welcomeLink) {
                loadYouTubeVideo('boasvindas');
            }
        }, 500);
    } else {
        console.log('Usuário não autenticado');
    }
});

// Configurar ouvintes de eventos
function setupEventListeners() {
    // Login Button
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        });
    }
    
    // Botão de conclusão
    const completeButton = document.getElementById('completeButton');
    if (completeButton) {
        completeButton.addEventListener('click', markCurrentVideoAsCompleted);
    }
    
    // Botão de fechar popup de bloqueio de tempo
    const timeLockClose = document.getElementById('timeLockClose');
    if (timeLockClose) {
        timeLockClose.addEventListener('click', function() {
            const timeLockOverlay = document.getElementById('timeLockOverlay');
            if (timeLockOverlay) {
                timeLockOverlay.style.display = 'none';
            }
        });
    }
    
    // Configurar botões de navegação
    setupNavigationButtons();
    
    // Configurar seções colapsáveis
    setupCollapsibleSections();
    
    // Configurar links de módulos
    setupModuleLinks();
    
    // Botão para obter certificado
    const getCertificateBtn = document.getElementById('getCertificateBtn');
    if (getCertificateBtn) {
        getCertificateBtn.addEventListener('click', function() {
            window.location.href = '/certificado';
        });
    }
    
    // Botão de logout no cabeçalho
    const logoutBtn = document.querySelector('.logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Configurar botões de navegação
function setupNavigationButtons() {
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
function setupCollapsibleSections() {
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
function setupModuleLinks() {
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



// Mostrar popup de bloqueio de tempo
function showTimeLockPopup(e) {
    if (e) e.preventDefault();
    const timeLockOverlay = document.getElementById('timeLockOverlay');
    if (timeLockOverlay) {
        timeLockOverlay.style.display = 'flex';
    }
}

// Função de logout
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            // Limpar dados locais
            window.isLoggedIn = false;
            window.userData = null;
            localStorage.removeItem('user');
            
            // Redirecionar para a página inicial
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Exportar funções e variáveis globais
export {
    loadYouTubeVideo,
    updateProgressUI,
    showTimeLockPopup,
    logout
};