const { Client } = require("pg");
const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');

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

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
    
    if (!login || !password) {
        return res.status(400).json({ success: false, message: 'Заполните все поля' });
    }
    
    try {
        const query = 'SELECT * FROM users WHERE login = $1 OR email = $1';
        const result = await client.query(query, [login]);
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const dbPassword = String(user.password);
            const inputPassword = String(password);
            
            let isValidPassword = false;
            
            if (dbPassword.startsWith('$2')) {
                isValidPassword = await bcrypt.compare(inputPassword, dbPassword);
            } else {
                isValidPassword = (inputPassword === dbPassword);
            }
            
            if (isValidPassword) {
                req.session.user = {
                    id: user.id,
                    login: user.login,
                    email: user.email
                };
                res.json({ success: true, message: 'Вход выполнен!' });
            } else {
                res.json({ success: false, message: 'Неверный логин или пароль!' });
            }
        } else {
            res.json({ success: false, message: 'Пользователь не найден!' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

app.post('/api/register', async (req, res) => {
    const { login, email, password } = req.body;
    
    if (!login || !email || !password) {
        return res.status(400).json({ success: false, message: 'Заполните все поля!' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Пароль должен быть не менее 6 символов!' });
    }
    
    if (!email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Введите корректный email!' });
    }
    
    try {
        const checkQuery = 'SELECT * FROM users WHERE login = $1 OR email = $2';
        const checkResult = await client.query(checkQuery, [login, email]);
        
        if (checkResult.rows.length > 0) {
            const existingUser = checkResult.rows[0];
            if (existingUser.login === login) {
                return res.json({ success: false, message: 'Логин уже занят!' });
            }
            if (existingUser.email === email) {
                return res.json({ success: false, message: 'Email уже зарегистрирован!' });
            }
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertQuery = 'INSERT INTO users (login, email, password) VALUES ($1, $2, $3) RETURNING id, login, email';
        const result = await client.query(insertQuery, [login, email, hashedPassword]);
        
        res.json({ success: true, message: 'Регистрация успешна!' });
        
    } catch (err) {
        console.error('Ошибка регистрации:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера при регистрации' });
    }
});

app.post('/api/reset-password', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, message: 'Введите email!' });
    }
    
    try {
        const checkQuery = 'SELECT * FROM users WHERE email = $1';
        const checkResult = await client.query(checkQuery, [email]);
        
        if (checkResult.rows.length === 0) {
            return res.json({ success: false, message: 'Пользователь с таким email не найден!' });
        }
        
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const updateQuery = 'UPDATE users SET password = $1 WHERE email = $2';
        await client.query(updateQuery, [hashedPassword, email]);
        
        console.log(`Временный пароль для ${email}: ${tempPassword}`);
        
        res.json({ 
            success: true, 
            message: `Временный пароль отправлен на ${email}`,
            tempPassword: tempPassword
        });
        
    } catch (err) {
        console.error('Ошибка восстановления:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

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
        res.json({ success: false, message: 'Не авторизован' });
    }
});

app.listen(3000, () => {
    console.log('Сервер на http://localhost:3000');
});