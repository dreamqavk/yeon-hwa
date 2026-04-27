document.getElementById('loginBtn').addEventListener('click', async () => {
    const login = document.getElementById('login').value;
    const password = document.getElementById('password').value;
    const errorElement = document.querySelector('.error');
    
    if (!login || !password) {
        errorElement.textContent = 'Заполните все поля!';
        return;
    }
    
    errorElement.textContent = '';
    
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
            errorElement.textContent = data.message || 'Неверный логин или пароль!';
        }
    } catch (error) {
        errorElement.textContent = 'Ошибка подключения к серверу';
    }
});

document.getElementById('forgotBtn').addEventListener('click', () => {
    const forgotForm = document.getElementById('forgotForm');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    forgotForm.classList.add('active');
});

document.getElementById('registerRedirectBtn').addEventListener('click', () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const forgotForm = document.getElementById('forgotForm');
    
    loginForm.classList.remove('active');
    forgotForm.classList.remove('active');
    registerForm.classList.add('active');
});

document.getElementById('backToLoginBtn').addEventListener('click', () => {
    const loginForm = document.getElementById('loginForm');
    const forgotForm = document.getElementById('forgotForm');
    const registerForm = document.getElementById('registerForm');
    
    forgotForm.classList.remove('active');
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
});

document.getElementById('backToLoginFromRegBtn').addEventListener('click', () => {
    const loginForm = document.getElementById('loginForm');
    const forgotForm = document.getElementById('forgotForm');
    const registerForm = document.getElementById('registerForm');
    
    registerForm.classList.remove('active');
    forgotForm.classList.remove('active');
    loginForm.classList.add('active');
});

document.getElementById('resetBtn').addEventListener('click', async () => {
    const email = document.getElementById('resetEmail').value;
    const errorElement = document.querySelector('.error-forgot');
    
    if (!email) {
        errorElement.textContent = 'Введите email!';
        return;
    }
    
    if (!email.includes('@')) {
        errorElement.textContent = 'Введите корректный email!';
        return;
    }
    
    errorElement.textContent = '';
    
    try {
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Временный пароль отправлен на ваш email');
            const loginForm = document.getElementById('loginForm');
            const forgotForm = document.getElementById('forgotForm');
            forgotForm.classList.remove('active');
            loginForm.classList.add('active');
        } else {
            errorElement.textContent = data.message || 'Ошибка восстановления';
        }
    } catch (error) {
        errorElement.textContent = 'Ошибка подключения к серверу';
    }
});

document.getElementById('registerBtn').addEventListener('click', async () => {
    const login = document.getElementById('regLogin').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const errorElement = document.querySelector('.error-register');
    
    if (!login || !email || !password || !confirmPassword) {
        errorElement.textContent = 'Заполните все поля!';
        return;
    }
    
    if (password !== confirmPassword) {
        errorElement.textContent = 'Пароли не совпадают!';
        return;
    }
    
    if (password.length < 6) {
        errorElement.textContent = 'Пароль должен быть не менее 6 символов!';
        return;
    }
    
    if (!email.includes('@')) {
        errorElement.textContent = 'Введите корректный email!';
        return;
    }
    
    errorElement.textContent = '';
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Регистрация успешна! Теперь войдите.');
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
        } else {
            errorElement.textContent = data.message || 'Ошибка регистрации';
        }
    } catch (error) {
        errorElement.textContent = 'Ошибка подключения к серверу';
    }
});

document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const activeForm = document.querySelector('.form-wrapper.active');
        if (activeForm.id === 'loginForm') {
            document.getElementById('loginBtn').click();
        } else if (activeForm.id === 'registerForm') {
            document.getElementById('registerBtn').click();
        } else if (activeForm.id === 'forgotForm') {
            document.getElementById('resetBtn').click();
        }
    }
});