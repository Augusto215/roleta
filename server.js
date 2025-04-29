// server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Substitua pela sua senha
    database: 'tlucky_roulette',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'tlucky-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Função para inicializar o banco de dados
async function initDatabase() {
    try {
        const connection = await pool.getConnection();
        
        // Criar tabela de usuários se não existir
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                fullname VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                certificate_eligible BOOLEAN DEFAULT FALSE,
                course_completed_at TIMESTAMP NULL
            )
        `);
        
        // Criar tabela de progresso de vídeos se não existir
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS video_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                video_id VARCHAR(50) NOT NULL,
                progress FLOAT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_video (user_id, video_id)
            )
        `);
        
        connection.release();
        console.log('Banco de dados inicializado com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        process.exit(1);
    }
}

// Middleware para verificar autenticação
const requireAuth = async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Não autenticado' });
    }
    next();
};

const requireLogin = (req, res, next) => {
    const publicPaths = ['/', '/login', '/register', '/api/login', '/api/register', '/api/content-availability'];

    // Se a rota for pública, libera
    if (publicPaths.includes(req.path)) {
        return next();
    }

    // Se a rota começar com /course ou /certificado, exige login
    if (req.path.startsWith('/course') || req.path.startsWith('/certificado')) {
        if (!req.session.userId) {
            return res.redirect('/login?redirect=' + encodeURIComponent(req.path));
        }
    }

    // Caso contrário, segue
    next();
};
app.use(requireLogin);

// Registration endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { fullname, email, username, password } = req.body;

        // Validate input
        if (!fullname || !email || !username || !password) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
        }

        // Verificar se o usuário já existe
        const [existingUsers] = await pool.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Usuário ou email já cadastrado' });
        }

        // Hash da senha
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Gerar ID único
        const userId = Date.now().toString();
        
        // Inserir novo usuário
        await pool.execute(
            'INSERT INTO users (id, fullname, email, username, password) VALUES (?, ?, ?, ?, ?)',
            [userId, fullname, email, username, hashedPassword]
        );

        // Retornar dados do usuário (sem a senha)
        const [userRows] = await pool.execute(
            'SELECT id, fullname, email, username, created_at FROM users WHERE id = ?',
            [userId]
        );

        return res.status(201).json({ 
            message: 'Usuário registrado com sucesso',
            user: userRows[0]
        });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
        }

        // Find user
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Usuário ou senha incorretos' });
        }

        const user = users[0];

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Usuário ou senha incorretos' });
        }

        // Set session
        req.session.userId = user.id;

        // Return success (sem a senha)
        return res.status(200).json({ 
            message: 'Login realizado com sucesso',
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                username: user.username,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// User info endpoint
app.get('/api/user', requireAuth, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, fullname, email, username, created_at FROM users WHERE id = ?',
            [req.session.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const user = users[0];

        return res.status(200).json({
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                username: user.username,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Erro ao obter informações do usuário:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    return res.status(200).json({ message: 'Logout realizado com sucesso' });
});

// Endpoint para salvar progresso do vídeo
app.post('/api/video-progress', requireAuth, async (req, res) => {
    try {
        const { videoProgress } = req.body;
        
        if (!videoProgress) {
            return res.status(400).json({ message: 'Dados de progresso são obrigatórios' });
        }

        // Atualizar ou inserir o progresso para cada vídeo
        for (const [videoId, progress] of Object.entries(videoProgress)) {
            await pool.execute(
                `INSERT INTO video_progress (user_id, video_id, progress) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE progress = ?`,
                [req.session.userId, videoId, progress, progress]
            );
        }

        // Lista de todos os vídeos que devem ser completados
        const requiredVideos = [
            'boasvindas', 'expectativas', 'cuidado', 'rendaextra', 'comolucrar',
            'estrategia1', 'estrategia2', 'estrategia3', 'estrategia4', 'estrategia5',
            'ultimaaula', 'bonus'
        ];
        
        // Verificar se todos os vídeos requeridos estão com progresso >= 98%
        const [progressRows] = await pool.execute(
            `SELECT video_id, progress FROM video_progress 
             WHERE user_id = ? AND video_id IN (${requiredVideos.map(() => '?').join(',')})`,
            [req.session.userId, ...requiredVideos]
        );
        
        // Criar um mapa de progresso
        const progressMap = {};
        progressRows.forEach(row => {
            progressMap[row.video_id] = row.progress;
        });
        
        // Verificar se todos os vídeos estão completos
        const allCompleted = requiredVideos.every(videoId => 
            (progressMap[videoId] || 0) >= 98
        );
        
        // Se todos os vídeos estiverem completos, atualizar o status de certificado
        if (allCompleted) {
            await pool.execute(
                `UPDATE users SET certificate_eligible = TRUE, course_completed_at = NOW() 
                 WHERE id = ?`,
                [req.session.userId]
            );
        }

        // Buscar progresso atualizado para retornar ao cliente
        const [updatedProgress] = await pool.execute(
            'SELECT video_id, progress FROM video_progress WHERE user_id = ?',
            [req.session.userId]
        );
        
        // Converter para o formato esperado pelo frontend
        const responseProgress = {};
        updatedProgress.forEach(row => {
            responseProgress[row.video_id] = row.progress;
        });

        return res.status(200).json({ 
            message: 'Progresso salvo com sucesso',
            videoProgress: responseProgress
        });
    } catch (error) {
        console.error('Erro ao salvar progresso:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Endpoint para obter progresso do vídeo
app.get('/api/video-progress', requireAuth, async (req, res) => {
    try {
        const [progressRows] = await pool.execute(
            'SELECT video_id, progress FROM video_progress WHERE user_id = ?',
            [req.session.userId]
        );
        
        // Converter para o formato esperado pelo frontend
        const videoProgress = {};
        progressRows.forEach(row => {
            videoProgress[row.video_id] = row.progress;
        });

        return res.status(200).json({ videoProgress });
    } catch (error) {
        console.error('Erro ao obter progresso:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Endpoint para verificar a disponibilidade de conteúdo baseado na data de criação do usuário
app.get('/api/content-availability', requireAuth, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT created_at FROM users WHERE id = ?',
            [req.session.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        
        const createdAt = new Date(users[0].created_at);
        const now = new Date();
        
        // Calcular a diferença em dias
        const timeDiff = now.getTime() - createdAt.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        
        // Verificar se passaram 7 dias
        const advancedContentAvailable = daysDiff >= 7;
        
        // Se não estiver disponível, calcular o tempo restante
        let remainingTime = null;
        if (!advancedContentAvailable) {
            const unlockDate = new Date(createdAt);
            unlockDate.setDate(unlockDate.getDate() + 7);
            
            const remainingMs = unlockDate.getTime() - now.getTime();
            const remainingDays = Math.floor(remainingMs / (1000 * 3600 * 24));
            const remainingHours = Math.floor((remainingMs % (1000 * 3600 * 24)) / (1000 * 3600));
            
            remainingTime = {
                days: remainingDays,
                hours: remainingHours,
                unlockDate: unlockDate.toISOString()
            };
        }
        
        return res.status(200).json({
            advancedContentAvailable,
            remainingTime,
            createdAt: createdAt.toISOString()
        });
    } catch (error) {
        console.error('Erro ao verificar disponibilidade de conteúdo:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Endpoint para verificar elegibilidade para certificado
app.get('/api/certificate-status', requireAuth, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT certificate_eligible, course_completed_at FROM users WHERE id = ?',
            [req.session.userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        return res.status(200).json({ 
            certificateEligible: users[0].certificate_eligible || false,
            courseCompletedAt: users[0].course_completed_at || null
        });
    } catch (error) {
        console.error('Erro ao verificar status do certificado:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Endpoint para gerar certificado (rota básica)
app.get('/certificado', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login?redirect=certificado');
    }

    try {
        const [users] = await pool.execute(
            'SELECT certificate_eligible FROM users WHERE id = ?',
            [req.session.userId]
        );
        
        if (users.length === 0 || !users[0].certificate_eligible) {
            return res.status(403).send('Você precisa completar todos os vídeos para acessar o certificado.');
        }

        // Em uma implementação real, você geraria um PDF ou uma página HTML com o certificado
        res.sendFile(path.join(__dirname, 'public', 'certificado.html'));
    } catch (error) {
        console.error('Erro ao gerar certificado:', error);
        return res.status(500).send('Erro ao gerar certificado. Tente novamente mais tarde.');
    }
});

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve register page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Content routes - Verificar autenticação para rotas de conteúdo
app.get('/course', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login?redirect=course');
    }
    res.sendFile(path.join(__dirname, 'public', 'course.html'));
});

// Inicializar banco de dados e iniciar o servidor
initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Falha ao iniciar o servidor:', err);
    });