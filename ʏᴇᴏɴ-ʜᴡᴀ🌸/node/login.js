checkAuth();

const loginForm = document.getElementById('loginForm');
const forgotForm = document.getElementById('forgotForm');
const registerForm = document.getElementById('registerForm');
const mainContainer = document.querySelector('.main-container');
const mainImage = document.getElementById('mainImage');

function switchForm(formToShow, formType) {
    if (formType === 'forgot' || formType === 'register') {
        mainContainer.classList.add('swap');
        mainImage.style.transition = 'opacity 0.5s ease';
        mainImage.style.opacity = '0';
        
        setTimeout(() => {
            if (formType === 'forgot') {
                mainImage.src = 'images/Raichel login.png';
            } else if (formType === 'register') {
                mainImage.src = 'images/Raichel login.png';
            }
            mainImage.style.opacity = '1';
        }, 300);
    } else {
        mainContainer.classList.remove('swap');
        
        mainImage.style.opacity = '0';
        setTimeout(() => {
            mainImage.src = 'images/Raichel login.png';
            mainImage.style.opacity = '1';
        }, 300);
    }
    
    [loginForm, forgotForm, registerForm].forEach(form => {
        form.classList.remove('active');
    });
    formToShow.classList.add('active');
}

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
            errorElement.textContent = data.message || 'Неверный логин или пароль';
        }
    } catch (error) {
        errorElement.textContent = 'Ошибка подключения к серверу';
    }
});

document.getElementById('forgotBtn').addEventListener('click', () => {
    switchForm(forgotForm, 'forgot');
});

document.getElementById('registerRedirectBtn').addEventListener('click', () => {
    switchForm(registerForm, 'register');
});

document.getElementById('backToLoginBtn').addEventListener('click', () => {
    switchForm(loginForm, 'login');
});

document.getElementById('backToLoginFromRegBtn').addEventListener('click', () => {
    switchForm(loginForm, 'login');
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
            alert('Ссылка для восстановления отправлена на ваш email');
            switchForm(loginForm, 'login');
            document.getElementById('resetEmail').value = '';
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
            alert('Регистрация успешна! Теперь войдите в аккаунт.');
            switchForm(loginForm, 'login');
            document.getElementById('regLogin').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regConfirmPassword').value = '';
        } else {
            errorElement.textContent = data.message || 'Ошибка регистрации';
        }
    } catch (error) {
        errorElement.textContent = 'Ошибка подключения к серверу';
    }
});

document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (loginForm.classList.contains('active')) {
            document.getElementById('loginBtn').click();
        } else if (forgotForm.classList.contains('active')) {
            document.getElementById('resetBtn').click();
        } else if (registerForm.classList.contains('active')) {
            document.getElementById('registerBtn').click();
        }
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