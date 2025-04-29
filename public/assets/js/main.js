// main.js - Arquivo principal que inicializa o sistema

// Importar configurações
import { youtubeIds, allVideos, advancedVideos } from './config.js';

// Variáveis de estado
let currentVideoId = 'boasvindas';
let isLoggedIn = false;
let userData = null;
let videoProgress = {};

// Inicialização do sistema quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação do usuário
    checkAuthentication()
        .then(authenticated => {
            if (authenticated) {
                // Carregar progresso do usuário
                loadUserProgress()
                    .then(() => {
                        // Verificar disponibilidade de conteúdo avançado
                        return checkContentAvailability();
                    })
                    .then(() => {
                        // Inicializar UI
                        updateProgressUI();
                        setupEventListeners();
                        
                        // Carregar vídeo inicial
                        setTimeout(() => {
                            const welcomeLink = document.querySelector('.module-link[data-video-id="boasvindas"]');
                            if (welcomeLink) {
                                loadYouTubeVideo('boasvindas');
                            }
                        }, 500);
                    });
            } else {
                // Mostrar overlay de login
                showLoginOverlay();
            }
        })
        .catch(error => {
            console.error('Erro na inicialização:', error);
            showLoginOverlay();
        });
});

// Função para verificar autenticação
async function checkAuthentication() {
    try {
        const response = await fetch('/api/user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.status === 200) {
            const data = await response.json();
            userData = data.user;
            isLoggedIn = true;
            
            console.log('Usuário autenticado:', userData);
            return true;
        } else {
            isLoggedIn = false;
            return false;
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        isLoggedIn = false;
        return false;
    }
}

// Função para configurar event listeners
function setupEventListeners() {
    // Botão de login
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        });
    }
    
    // Botão de conclusão
    const completeButton = document.getElementById('completeButton');
    if (completeButton) {
        completeButton.addEventListener('click', markCurrentVideoAsCompleted);
    }
    
    // Botão para fechar popup de bloqueio de tempo
    const timeLockClose = document.getElementById('timeLockClose');
    if (timeLockClose) {
        timeLockClose.addEventListener('click', () => {
            document.getElementById('timeLockOverlay').style.display = 'none';
        });
    }
    
    // Botões de navegação
    setupNavigationButtons();
    
    // Configurar seções colapsáveis
    setupCollapsibleSections();
    
    // Configurar links de módulos
    setupModuleLinks();
    
    // Botão para obter certificado
    const getCertificateBtn = document.getElementById('getCertificateBtn');
    if (getCertificateBtn) {
        getCertificateBtn.addEventListener('click', () => {
            window.location.href = '/certificado';
        });
    }
}

// Exportar funções e variáveis que serão usadas em outros arquivos
export {
    currentVideoId,
    isLoggedIn,
    userData,
    videoProgress,
    allVideos,
    advancedVideos,
    youtubeIds,
    loadYouTubeVideo,
    updateProgressUI,
    markCurrentVideoAsCompleted,
    showLoginOverlay,
    showTimeLockPopup
};

// Importar funções de outros arquivos
import {
    loadYouTubeVideo,
    updateNavigationButtons,
    setupNavigationButtons,
    setupCollapsibleSections,
    setupModuleLinks,
    showLoginOverlay,
    showTimeLockPopup
} from './videoPlayer.js';

import {
    updateProgressUI,
    markCurrentVideoAsCompleted,
    loadUserProgress,
    saveVideoProgress,
    checkContentAvailability
} from './progressManager.js';

// Adicione isso após obter o usuário e seus dados
function forceHideLoginOverlay() {
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) {
        console.log('Forçando esconder overlay de login');
        loginOverlay.style.display = 'none';
    }
}

// Execute essa função após a autenticação
if (window.isLoggedIn) {
    forceHideLoginOverlay();
    // Para garantir, execute novamente após um breve atraso
    setTimeout(forceHideLoginOverlay, 500);
}