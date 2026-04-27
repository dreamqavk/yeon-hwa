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

// ============ ЛИДЕРБОРД НА ГЛАВНОЙ ============

async function loadLeaderboardStats() {
    try {
        const response = await fetch('/api/global-stats');
        const data = await response.json();
        
        if (data.success) {
            const totalEl = document.querySelector('#totalPlayers .stat-value');
            const avgKdaEl = document.querySelector('#avgKda .stat-value');
            const bestKdaEl = document.querySelector('#bestKda .stat-value');
            const bestWinrateEl = document.querySelector('#bestWinrate .stat-value');
            
            if (totalEl) totalEl.textContent = data.data.total_players || 0;
            if (avgKdaEl) avgKdaEl.textContent = (data.data.avg_kda || 0).toFixed(2);
            if (bestKdaEl) bestKdaEl.textContent = (data.data.best_kda || 0).toFixed(2);
            if (bestWinrateEl) bestWinrateEl.textContent = Math.round(data.data.best_winrate || 0) + '%';
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

async function loadLeaderboard() {
    try {
        const response = await fetch('/api/leaderboard/kda');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            // Топ-3 игрока
            const top3 = data.data.slice(0, 3);
            
            // Обновляем пьедестал
            if (top3[0]) updatePodiumCard(1, top3[0]);
            if (top3[1]) updatePodiumCard(2, top3[1]);
            if (top3[2]) updatePodiumCard(3, top3[2]);
            
            // Остальные игроки (4+ место)
            const others = data.data.slice(3);
            const otherGrid = document.getElementById('otherPlayersGrid');
            
            if (others.length > 0) {
                otherGrid.innerHTML = others.map((player, index) => createOtherCard(player, index + 4)).join('');
            } else {
                otherGrid.innerHTML = '<div class="loading-spinner">Нет других игроков</div>';
            }
        } else {
            const otherGrid = document.getElementById('otherPlayersGrid');
            if (otherGrid) otherGrid.innerHTML = '<div class="loading-spinner">Пока нет игроков с заполненной статистикой</div>';
        }
    } catch (error) {
        console.error('Ошибка загрузки лидерборда:', error);
        const otherGrid = document.getElementById('otherPlayersGrid');
        if (otherGrid) otherGrid.innerHTML = '<div class="loading-spinner">Ошибка загрузки данных</div>';
    }
}

function updatePodiumCard(place, player) {
    const card = document.getElementById(`podium${place}`);
    if (!card) return;
    
    const avatarUrl = player.avatar || '/images/avatar-user/default.png';
    const rank = player.rank || 'Unranked';
    const kda = (player.kda || 0).toFixed(2);
    const winRate = (player.win_rate || 0).toFixed(1);
    const username = escapeHtml(player.username);
    
    card.querySelector('.podium-avatar').src = avatarUrl;
    card.querySelector('.podium-name').textContent = username;
    card.querySelector('.podium-rank-name').textContent = rank;
    card.querySelectorAll('.podium-stat')[0].querySelector('.podium-stat-value').textContent = kda;
    card.querySelectorAll('.podium-stat')[1].querySelector('.podium-stat-value').textContent = winRate + '%';
}

function createOtherCard(player, rank) {
    const avatarUrl = player.avatar || '/images/avatar-user/default.png';
    const rankName = player.rank || 'Unranked';
    const wins = player.wins || 0;
    const losses = player.losses || 0;
    const matches = player.matches_played || 0;
    const winRate = (player.win_rate || 0).toFixed(1);
    const kda = (player.kda || 0).toFixed(2);
    const hs = (player.headshot_percentage || 0).toFixed(1);
    const username = escapeHtml(player.username);
    
    return `
        <div class="other-player-card">
            <div class="other-rank-number">#${rank}</div>
            <img class="other-avatar" src="${avatarUrl}" alt="${username}">
            <div class="other-info">
                <div class="other-name">${username}</div>
                <div class="other-rank-name">${rankName}</div>
            </div>
            <div class="other-stats">
                <div class="other-stat">
                    <div class="other-stat-value">${wins}</div>
                    <div class="other-stat-label">Победы</div>
                </div>
                <div class="other-stat">
                    <div class="other-stat-value">${losses}</div>
                    <div class="other-stat-label">Поражения</div>
                </div>
                <div class="other-stat">
                    <div class="other-stat-value">${matches}</div>
                    <div class="other-stat-label">Матчи</div>
                </div>
                <div class="other-stat">
                    <div class="other-stat-value">${winRate}%</div>
                    <div class="other-stat-label">Winrate</div>
                </div>
                <div class="other-stat">
                    <div class="other-stat-value">${kda}</div>
                    <div class="other-stat-label">KDA</div>
                </div>
                <div class="other-stat">
                    <div class="other-stat-value">${hs}%</div>
                    <div class="other-stat-label">HS%</div>
                </div>
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Запускаем лидерборд, если блок существует
if (document.querySelector('.lider-board')) {
    loadLeaderboardStats();
    loadLeaderboard();
}