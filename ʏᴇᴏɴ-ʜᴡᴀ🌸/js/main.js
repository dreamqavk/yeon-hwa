async function updateLoginButton() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        const loginLink = document.querySelector('.icon-link[href="login.html"]');
        
        if (loginLink) {
            if (data.authenticated) {
                const loginImg = loginLink.querySelector('img');
                if (loginImg) {
                    loginImg.src = 'images/icons/profile.png';
                    loginImg.alt = 'Личный кабинет';
                }
            } else {
                loginLink.href = 'login.html';
                const loginImg = loginLink.querySelector('img');
                if (loginImg) {
                    loginImg.src = 'images/icons/login.png';
                    loginImg.alt = 'Логин';
                }
            }
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateLoginButton();
});