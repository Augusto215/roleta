// authManager.js - Gerenciamento da autenticação e usuário

// Importar dependências
import { apiConfig, uiConfig } from './config.js';

// Estado global
let isLoggedIn = false;
let userData = null;

// Manipuladores de eventos de login e registro
document.addEventListener('DOMContentLoaded', function() {
    console.log('AuthManager: Inicializando...');
    
    // Verificar se estamos na página de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        setupLoginForm();
    }
    
    // Verificar se estamos na página de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        setupRegisterForm();
    }
    
    // Verificar estado de login a partir do localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            userData = JSON.parse(storedUser);
            isLoggedIn = true;
            console.log('AuthManager: Usuário recuperado do localStorage', userData);
        } catch (e) {
            console.error('Erro ao recuperar dados do usuário do localStorage:', e);
            localStorage.removeItem('user');
        }
    }
    
    // Verificar status de login com o servidor
    checkLoginStatus().then(() => {
        // Atualizar exibição da página com base no status de login
        checkAndUpdateLoginDisplay();
    });
});

// Verificar status de login
async function checkLoginStatus() {
    try {
        console.log('AuthManager: Verificando status de login...');
        const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.user}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            // Usuário está logado
            const data = await response.json();
            
            // Armazenar dados do usuário
            updateUserData(data.user);
            console.log('AuthManager: Usuário autenticado:', data.user);
            
            // Atualizar UI para usuário logado
            updateUIForLoggedUser(data.user);
            
            return data.user;
        } else {
            // Usuário não está logado
            console.log('AuthManager: Usuário não autenticado');
            clearUserData();
            
            // Se estamos em uma página protegida, redirecionar para login
            if (isProtectedPage()) {
                redirectToLogin();
            }
            
            return null;
        }
    } catch (error) {
        console.error('Erro ao verificar status de login:', error);
        
        // Em caso de erro, assumir que não está logado
        clearUserData();
        return null;
    }
}

// Modificação na função checkAndUpdateLoginDisplay
function checkAndUpdateLoginDisplay() {
    console.log('AuthManager: Atualizando exibição do login. isLoggedIn =', isLoggedIn);
    const loginOverlay = document.getElementById('loginOverlay');
    
    if (isLoggedIn && loginOverlay) {
        console.log('AuthManager: Escondendo overlay de login');
        loginOverlay.style.cssText = 'display: none !important;';
        
        // Também adicionar uma classe CSS que garante que o overlay fique escondido
        loginOverlay.classList.add('hidden-overlay');
    } else if (!isLoggedIn && loginOverlay) {
        console.log('AuthManager: Mostrando overlay de login');
        loginOverlay.style.cssText = 'display: flex !important;';
        loginOverlay.classList.remove('hidden-overlay');
    }
}

// Configurar formulário de login
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const loginSpinner = document.getElementById('login-spinner');
    
    // Verificar elementos necessários
    if (!loginForm || !usernameInput || !passwordInput || !loginButton) {
        console.error('Elementos de login não encontrados');
        return;
    }
    
    // Adicionar manipulador de eventos para o formulário
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });
    
    // Adicionar manipulador para tecla Enter no campo de senha
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleLogin();
        }
    });
    
    // Adicionar manipulador para o botão de login
    if (loginButton) {
        loginButton.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // Função para processar o login
    async function handleLogin() {
        // Obter valores dos campos
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        // Validar campos
        if (!username || !password) {
            showError('Usuário e senha são obrigatórios');
            return;
        }
        
        // Mostrar spinner de carregamento
        if (loginSpinner) {
            loginSpinner.style.display = 'inline-block';
        }
        
        // Desabilitar botão
        if (loginButton) {
            loginButton.disabled = true;
        }
        
        try {
            // Fazer requisição de login
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            // Esconder spinner
            if (loginSpinner) {
                loginSpinner.style.display = 'none';
            }
            
            // Habilitar botão
            if (loginButton) {
                loginButton.disabled = false;
            }
            
            if (response.ok) {
                // Login bem-sucedido
                updateUserData(data.user);
                
                // Redirecionar para a página solicitada ou para o curso
                const redirectUrl = getRedirectUrl() || '/course';
                window.location.href = redirectUrl;
            } else {
                // Mostrar mensagem de erro
                showError(data.message || 'Erro ao fazer login');
            }
        } catch (error) {
            console.error('Erro durante o login:', error);
            
            // Esconder spinner
            if (loginSpinner) {
                loginSpinner.style.display = 'none';
            }
            
            // Habilitar botão
            if (loginButton) {
                loginButton.disabled = false;
            }
            
            // Mostrar mensagem de erro
            showError('Erro ao conectar com o servidor');
        }
    }
}

// Configurar formulário de registro
function setupRegisterForm() {
    const registerForm = document.getElementById('register-form');
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const registerButton = document.getElementById('register-button');
    const registerSpinner = document.getElementById('register-spinner');
    
    // Verificar elementos necessários
    if (!registerForm || !fullnameInput || !emailInput || !usernameInput || !passwordInput || !registerButton) {
        console.error('Elementos de registro não encontrados');
        return;
    }
    
    // Adicionar manipulador de eventos para o formulário
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleRegister();
    });
    
    // Adicionar manipulador para o botão de registro
    registerButton.addEventListener('click', function(e) {
        e.preventDefault();
        handleRegister();
    });
    
    // Função para processar o registro
    async function handleRegister() {
        // Obter valores dos campos
        const fullname = fullnameInput.value.trim();
        const email = emailInput.value.trim();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        // Validar campos
        if (!fullname || !email || !username || !password) {
            showError('Todos os campos são obrigatórios');
            return;
        }
        
        // Validar email
        if (!isValidEmail(email)) {
            showError('Email inválido');
            return;
        }
        
        // Validar senha (mínimo 6 caracteres)
        if (password.length < 6) {
            showError('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        
        // Mostrar spinner de carregamento
        if (registerSpinner) {
            registerSpinner.style.display = 'inline-block';
        }
        
        // Desabilitar botão
        registerButton.disabled = true;
        
        try {
            // Fazer requisição de registro
            const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.register}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullname, email, username, password }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            // Esconder spinner
            if (registerSpinner) {
                registerSpinner.style.display = 'none';
            }
            
            // Habilitar botão
            registerButton.disabled = false;
            
            if (response.ok) {
                // Registro bem-sucedido
                updateUserData(data.user);
                
                // Redirecionar para a página de curso
                window.location.href = '/course';
            } else {
                // Mostrar mensagem de erro
                showError(data.message || 'Erro ao registrar usuário');
            }
        } catch (error) {
            console.error('Erro durante o registro:', error);
            
            // Esconder spinner
            if (registerSpinner) {
                registerSpinner.style.display = 'none';
            }
            
            // Habilitar botão
            registerButton.disabled = false;
            
            // Mostrar mensagem de erro
            showError('Erro ao conectar com o servidor');
        }
    }
}

// Função de logout
async function logout() {
    try {
        console.log('AuthManager: Fazendo logout...');
        await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.logout}`, {
            method: 'POST',
            credentials: 'include'
        });
        
        // Limpar dados do usuário
        clearUserData();
        
        // Redirecionar para página de login
        window.location.href = '/login';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Atualizar dados do usuário
function updateUserData(user) {
    // Armazenar no localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    // Atualizar estado global
    isLoggedIn = true;
    userData = user;
    
    // Atualizar estado global da janela para compatibilidade
    window.isLoggedIn = true;
    window.userData = user;
    
    console.log('AuthManager: Dados do usuário atualizados', user);
}

// Limpar dados do usuário
function clearUserData() {
    // Remover do localStorage
    localStorage.removeItem('user');
    
    // Atualizar estado global
    isLoggedIn = false;
    userData = null;
    
    // Atualizar estado global da janela para compatibilidade
    window.isLoggedIn = false;
    window.userData = null;
    
    console.log('AuthManager: Dados do usuário limpos');
}

// Atualizar UI para usuário logado
function updateUIForLoggedUser(user) {
    // Esconder overlay de login se existir
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) {
        loginOverlay.style.display = 'none';
    }
    
    // Atualizar avatar e nome do usuário
    const userAvatar = document.querySelector('.user-avatar');
    const userNameElement = document.querySelector('.user-name');
    
    if (userAvatar) {
        // Se não tiver um ícone de usuário, adicionar iniciais
        if (!userAvatar.querySelector('i')) {
            userAvatar.innerHTML = getInitials(user.fullname);
        }
    }
    
    if (userNameElement) {
        userNameElement.textContent = user.fullname;
    }
    
    // Adicionar manipulador para botão de logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    
    // Esconder elementos para usuários não logados
    const guestElements = document.querySelectorAll('.guest-only');
    guestElements.forEach(el => {
        el.style.display = 'none';
    });
    
    // Mostrar elementos para usuários logados
    const authElements = document.querySelectorAll('.auth-only');
    authElements.forEach(el => {
        el.style.display = 'block';
    });
    
    console.log('AuthManager: UI atualizada para usuário logado');
}

// Funções auxiliares

// Mostrar mensagem de erro
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (!errorElement) return;
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Esconder mensagem depois de um tempo
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, uiConfig.errorMessageTimeout);
}

// Obter URL de redirecionamento dos parâmetros da URL
function getRedirectUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('redirect');
}

// Verificar se a página atual é protegida
function isProtectedPage() {
    // Páginas que exigem autenticação
    const protectedPaths = ['/course', '/certificado'];
    return protectedPaths.some(path => window.location.pathname.startsWith(path));
}

// Redirecionar para página de login
function redirectToLogin() {
    const currentPath = encodeURIComponent(window.location.pathname);
    window.location.href = `/login?redirect=${currentPath}`;
}

// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Obter iniciais do nome
function getInitials(fullname) {
    if (!fullname) return '';
    
    return fullname
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}



// Exportar funções públicas (sem duplicar logout)
export {
    checkLoginStatus,
    logout,
    checkAndUpdateLoginDisplay,
    isLoggedIn,
    userData
};