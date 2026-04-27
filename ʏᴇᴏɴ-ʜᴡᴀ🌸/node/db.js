const { Client } = require("pg");
const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));

app.use(session({
    secret: 'your-secret-key-here',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: null,
        httpOnly: true
    }
}));

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
});

client.connect((err) => {
    if (err) {
        console.error('Ошибка подключения:', err.message);
    } else {
        console.log('Подключено к PostgreSQL');
    }
});

// Настройка загрузки аватаров
const avatarDir = path.join(__dirname, '..', 'images', 'avatar-user');
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ============ АВТОРИЗАЦИЯ ============

app.post('/api/register', async (req, res) => {
    const { login, email, password, avatarUrl } = req.body;
    
    if (!login || !email || !password) {
        return res.json({ success: false, message: 'Заполните все поля!' });
    }
    
    if (password.length < 6) {
        return res.json({ success: false, message: 'Пароль должен быть не менее 6 символов!' });
    }
    
    if (!email.includes('@')) {
        return res.json({ success: false, message: 'Введите корректный email!' });
    }
    
    try {
        const checkResult = await client.query('SELECT * FROM users WHERE login = $1 OR email = $2', [login, email]);
        
        if (checkResult.rows.length > 0) {
            return res.json({ success: false, message: 'Пользователь уже существует!' });
        }
        
        const defaultAvatar = avatarUrl || '/images/avatar-user/default.png';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await client.query(
            'INSERT INTO users (login, email, password, avatar) VALUES ($1, $2, $3, $4) RETURNING id',
            [login, email, hashedPassword, defaultAvatar]
        );
        
        // Создаем запись в статистике для нового пользователя
        await client.query(
            `INSERT INTO player_stats (user_id, username, avatar) VALUES ($1, $2, $3)`,
            [result.rows[0].id, login, defaultAvatar]
        );
        
        res.json({ success: true, message: 'Регистрация успешна!' });
    } catch (err) {
        console.error('Ошибка регистрации:', err);
        res.json({ success: false, message: 'Ошибка сервера' });
    }
});

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    
    if (!login || !password) {
        return res.json({ success: false, message: 'Заполните все поля' });
    }
    
    try {
        const result = await client.query('SELECT * FROM users WHERE login = $1 OR email = $1', [login]);
        
        if (result.rows.length === 0) {
            return res.json({ success: false, message: 'Пользователь не найден!' });
        }
        
        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password);
        
        if (isValid) {
            req.session.user = {
                id: user.id,
                login: user.login,
                email: user.email,
                avatar: user.avatar
            };
            
            res.json({ success: true, message: 'Вход выполнен!' });
        } else {
            res.json({ success: false, message: 'Неверный пароль!' });
        }
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Ошибка сервера' });
    }
});

app.post('/api/upload-avatar', upload.single('avatar'), async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Не авторизован' });
    }
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Файл не загружен' });
    }
    
    try {
        const avatarUrl = `/images/avatar-user/${req.file.filename}`;
        
        if (req.session.user.avatar && req.session.user.avatar !== '/images/avatar-user/default.png') {
            const oldAvatarPath = path.join(__dirname, '..', req.session.user.avatar);
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }
        
        await client.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatarUrl, req.session.user.id]);
        await client.query('UPDATE player_stats SET avatar = $1 WHERE user_id = $2', [avatarUrl, req.session.user.id]);
        
        req.session.user.avatar = avatarUrl;
        
        res.json({ success: true, avatarUrl: avatarUrl });
    } catch (err) {
        console.error('Ошибка загрузки аватара:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// ============ СТАТИСТИКА ИГРОКА (ВВОД В ЛИЧНОМ КАБИНЕТЕ) ============

// Сохранение статистики из личного кабинета
app.post('/api/save-stats', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Не авторизован' });
    }
    
    const { rank, wins, losses, matchesPlayed, winRate, kda, headshot } = req.body;
    
    try {
        await client.query(
            `UPDATE player_stats 
             SET rank = $1, wins = $2, losses = $3, matches_played = $4, 
                 win_rate = $5, kda = $6, headshot_percentage = $7, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $8`,
            [rank, wins, losses, matchesPlayed, winRate, kda, headshot, req.session.user.id]
        );
        
        res.json({ success: true, message: 'Статистика сохранена!' });
    } catch (err) {
        console.error('Ошибка сохранения статистики:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// Получение статистики текущего пользователя
app.get('/api/my-stats', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Не авторизован' });
    }
    
    try {
        const result = await client.query(
            'SELECT * FROM player_stats WHERE user_id = $1',
            [req.session.user.id]
        );
        
        res.json({ success: true, stats: result.rows[0] || null });
    } catch (err) {
        console.error('Ошибка получения статистики:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// ============ ЛИДЕРБОРД ============

app.get('/api/leaderboard/:sort', async (req, res) => {
    const { sort } = req.params;
    let orderBy = '';
    
    switch(sort) {
        case 'kda':
            orderBy = 'kda DESC';
            break;
        case 'winrate':
            orderBy = 'win_rate DESC';
            break;
        case 'matches':
            orderBy = 'matches_played DESC';
            break;
        case 'wins':
            orderBy = 'wins DESC';
            break;
        default:
            orderBy = 'kda DESC';
    }
    
    try {
        const result = await client.query(`
            SELECT 
                id, user_id, username, avatar, rank, 
                wins, losses, matches_played, win_rate, 
                kda, headshot_percentage
            FROM player_stats 
            WHERE matches_played > 0 OR kda > 0
            ORDER BY ${orderBy}
            LIMIT 50
        `);
        
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Ошибка получения лидерборда:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

app.get('/api/global-stats', async (req, res) => {
    try {
        const result = await client.query(`
            SELECT 
                COUNT(*) as total_players,
                COALESCE(AVG(kda), 0) as avg_kda,
                COALESCE(MAX(kda), 0) as best_kda,
                COALESCE(MAX(win_rate), 0) as best_winrate,
                COALESCE(MAX(matches_played), 0) as most_matches
            FROM player_stats
            WHERE matches_played > 0
        `);
        
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Ошибка получения глобальной статистики:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// ============ ОСНОВНЫЕ ЭНДПОИНТЫ ============

app.get('/api/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({ success: true, user: req.session.user });
    } else {
        res.json({ success: false });
    }
});

app.listen(3000, () => {
    console.log('Сервер на http://localhost:3000');
});