checkAuth();

document.getElementById('loginBtn').addEventListener('click', async () => {
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    
    if (!login || !password) {
        alert('Заполните все поля!');
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = '/account.html';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
});

document.getElementById('forgotBtn').addEventListener('click', () => {
    alert('Свяжитесь с администратором');
});

document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('loginBtn').click();
    }
});

async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (data.authenticated) {
            window.location.href = '/account.html';
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
    }
}