const { Client } = require("pg");
const express = require('express');
const session = require('express-session');
const path = require('path');
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
        const query = 'SELECT * FROM users WHERE login = $1 AND password = $2';
        const result = await client.query(query, [login, password]);
        
        if (result.rows.length > 0) {
            req.session.user = {
                id: result.rows[0].id,
                login: result.rows[0].login
            };
            res.json({ success: true, message: 'Вход выполнен!' });
        } else {
            res.json({ success: false, message: 'Неверный логин или пароль!' });
        }
    } catch (err) {
        console.error(err);
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

app.listen(3000, () => {
    console.log('Сервер на http://localhost:3000');
});