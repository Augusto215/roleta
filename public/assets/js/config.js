// config.js - Configurações globais do sistema

// Mapeamento de IDs de vídeos internos para IDs do YouTube
export const youtubeIds = {
    'boasvindas': 'v5TW4rUHeHU',
    'expectativas': 'tmVM2iKJnKY',
    'cuidado': '6O3z_DObbIU',
    'rendaextra': 'WUmlmmZxaEY',
    'comolucrar': 'fv_ni8L0p0c',
    'estrategia1': 'ygJANHgIF_M',
    'estrategia2': '39TYO_0HbuM',
    'estrategia3': 'rFceMPoSu5E',
    'estrategia4': 'ctbpMG7rMF8',
    'estrategia5': 'AqYlXI0ZT-M',
    'ultimaaula': 'VHBACHucNtU',
    'bonus': 'uMVMtSDE0f8'
};

// Lista de todos os vídeos do curso
export const allVideos = [
    'boasvindas', 'expectativas', 'cuidado', 'rendaextra', 'comolucrar',
    'estrategia1', 'estrategia2', 'estrategia3', 'estrategia4', 'estrategia5',
    'ultimaaula', 'bonus'
];

// Lista de vídeos básicos (disponíveis imediatamente)
export const basicVideos = [
    'boasvindas', 'expectativas', 'cuidado', 'rendaextra', 'comolucrar'
];

// Lista de vídeos avançados (bloqueados nos primeiros 7 dias)
export const advancedVideos = [
    'estrategia1', 'estrategia2', 'estrategia3', 'estrategia4', 'estrategia5',
    'ultimaaula', 'bonus'
];

// IDs das seções no HTML
export const sectionIds = {
    inicio: 'inicio',
    ferramenta: 'ferramenta',
    estrategias: 'estrategias',
    final: 'final'
};

// Mapeamento de vídeos para seções
export const videoSections = {
    'boasvindas': sectionIds.inicio,
    'expectativas': sectionIds.inicio,
    'cuidado': sectionIds.ferramenta,
    'rendaextra': sectionIds.ferramenta,
    'comolucrar': sectionIds.ferramenta,
    'estrategia1': sectionIds.estrategias,
    'estrategia2': sectionIds.estrategias,
    'estrategia3': sectionIds.estrategias,
    'estrategia4': sectionIds.estrategias,
    'estrategia5': sectionIds.estrategias,
    'ultimaaula': sectionIds.final,
    'bonus': sectionIds.final
};

// Mapeamento de seções para títulos
export const sectionTitles = {
    [sectionIds.inicio]: 'O início',
    [sectionIds.ferramenta]: 'A ferramenta mais importante',
    [sectionIds.estrategias]: 'Estratégias números exatos',
    [sectionIds.final]: 'Final'
};

// Configurações de API
export const apiConfig = {
    baseUrl: '/api',
    endpoints: {
        user: '/user',
        login: '/login',
        logout: '/logout',
        register: '/register',
        videoProgress: '/video-progress',
        contentAvailability: '/content-availability',
        certificateStatus: '/certificate-status'
    }
};

// Configurações de progresso
export const progressConfig = {
    // Porcentagem a partir da qual um vídeo é considerado completo
    completionThreshold: 98,
    
    // Tempo mínimo (em dias) para liberar conteúdo avançado
    unlockDays: 7,
    
    // Progresso inicial para novos vídeos visualizados
    initialProgress: 30
};

// Configurações de UI
export const uiConfig = {
    // Tempo (em ms) para esconder mensagens de erro
    errorMessageTimeout: 5000,
    
    // Tempo (em ms) para efeitos visuais
    pulseEffectDuration: 1000,
    highlightButtonDuration: 2000,
    
    // Configuração de ícones
    icons: {
        notStarted: 'fas fa-circle module-icon',
        inProgress: 'fas fa-play-circle module-icon',
        completed: 'fas fa-check-circle completed-icon',
        locked: 'fas fa-lock locked-icon'
    }
};