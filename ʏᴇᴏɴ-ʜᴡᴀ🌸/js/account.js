checkAuthAndLoadUser();

document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Ошибка выхода:', error);
    }
});

async function checkAuthAndLoadUser() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = '/login.html';
        } else {
            document.getElementById('username').textContent = data.user.login;
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        window.location.href = '/login.html';
    }
}