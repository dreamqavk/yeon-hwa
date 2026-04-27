async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = '/login.html';
            return;
        }
        
        if (data.user) {
            document.getElementById('profileName').textContent = data.user.login;
            document.getElementById('profileEmail').textContent = data.user.email;
            
            if (data.user.avatar) {
                document.getElementById('profileAvatar').src = data.user.avatar;
            }
            
            const joinDate = new Date();
            document.getElementById('memberSince').textContent = joinDate.toLocaleDateString('ru-RU');
        }
        
        await loadRiotAccount();
        await loadValorantStats();
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        window.location.href = '/login.html';
    }
}

async function loadRiotAccount() {
    try {
        const response = await fetch('/api/user-riot');
        const data = await response.json();
        
        const riotIdElement = document.getElementById('riotIdDisplay');
        if (data.success && data.accounts && data.accounts.length > 0) {
            riotIdElement.textContent = data.accounts[0].riot_id;
            riotIdElement.style.color = '#ffd700';
        } else {
            riotIdElement.textContent = 'Не привязан';
            riotIdElement.style.color = '#ffb6c1';
        }
    } catch (error) {
        console.error('Ошибка загрузки Riot ID:', error);
    }
}

async function loadValorantStats() {
    try {
        const response = await fetch('/api/valorant-stats');
        const data = await response.json();
        
        if (data.success && data.stats) {
            const stats = data.stats;
            document.getElementById('wins').textContent = stats.wins || 0;
            document.getElementById('losses').textContent = stats.losses || 0;
            document.getElementById('matches').textContent = stats.matches_played || 0;
            document.getElementById('winrate').textContent = (stats.win_rate || 0) + '%';
            document.getElementById('kda').textContent = stats.kda || 0;
            document.getElementById('hs').textContent = (stats.headshot_percentage || 0) + '%';
            document.getElementById('rankName').textContent = stats.rank || 'Unranked';
            
            const winrateValue = parseFloat(stats.win_rate) || 0;
            const circumference = 339.292;
            const offset = circumference - (winrateValue / 100) * circumference;
            const winrateCircle = document.getElementById('winrateCircle');
            if (winrateCircle) {
                winrateCircle.style.strokeDashoffset = offset;
            }
            document.getElementById('winrateText').textContent = Math.round(winrateValue) + '%';
        }
        
        if (data.success && data.agents && data.agents.length > 0) {
            const agentsList = document.getElementById('agentsList');
            if (agentsList) {
                agentsList.innerHTML = data.agents.map(agent => `
                    <div class="agent-stat">
                        <img src="https://media.valorant-api.com/agents/${getAgentUuid(agent.agent_name)}/displayicon.png" 
                             onerror="this.src='https://cdn.discordapp.com/attachments/1325657863112355872/1359581535198183526/logo.png'"
                             alt="${agent.agent_name}">
                        <span>${agent.agent_name}</span>
                        <div class="agent-hours">${agent.matches_played || 0} матчей</div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

function getAgentUuid(agentName) {
    const agents = {
        'Jett': '5f8d3a7f-467b-97f3-923c-5d6c5e2a3f1c',
        'Reyna': 'a3bfb853-43b2-7238-a4f1-ad90e9e46bcc',
        'Omen': '8e2531d0-4c05-31dd-1b6c-84f4b3c8b5d1',
        'Killjoy': '1e58de9c-4950-5125-93e9-a0aee9f9c3c1',
        'Sova': '320b2a48-4d9c-7f6c-8c3a-8e9c2b6a1f2a',
        'Phoenix': 'eb9c6d3a-4d8a-1f5c-9c8a-2d3e4f5a6b7c',
        'Sage': '569f3b6c-4b8a-4d8a-8f2a-1c2d3e4f5a6b',
        'Chamber': '6f3e4c5a-4b8a-4d8a-8f2a-1c2d3e4f5a6b',
        'Neon': 'b2c5b5f4-4b8a-4d8a-8f2a-1c2d3e4f5a6b',
        'Fade': '6f3e4c5a-4b8a-4d8a-8f2a-1c2d3e4f5a6b'
    };
    return agents[agentName] || '5f8d3a7f-467b-97f3-923c-5d6c5e2a3f1c';
}

async function syncStats() {
    const btn = document.getElementById('syncStatsBtn');
    const originalText = btn?.textContent;
    
    if (btn) {
        btn.textContent = '🔄 Синхронизация...';
        btn.disabled = true;
    }
    
    try {
        const response = await fetch('/api/sync-valorant-stats', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            alert('✅ ' + data.message);
            await loadValorantStats();
        } else {
            alert('❌ ' + (data.message || 'Ошибка синхронизации'));
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Ошибка подключения к серверу');
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

function openRiotModal() {
    const modal = document.getElementById('riotModal');
    if (modal) {
        modal.style.display = 'flex';
        const input = document.getElementById('riotIdInput');
        if (input) input.value = '';
    }
}

function closeRiotModal() {
    const modal = document.getElementById('riotModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function saveRiotId() {
    const riotId = document.getElementById('riotIdInput').value.trim();
    
    if (!riotId) {
        alert('Введите Riot ID');
        return;
    }
    
    if (!riotId.includes('#')) {
        alert('Riot ID должен быть в формате Имя#Тег\nПример: TenZ#0505');
        return;
    }
    
    try {
        const response = await fetch('/api/link-riot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ riotId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Riot ID успешно привязан!');
            closeRiotModal();
            await loadRiotAccount();
            await syncStats();
        } else {
            alert('❌ ' + (data.message || 'Ошибка привязки'));
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Ошибка подключения к серверу');
    }
}

async function changeAvatar() {
    const fileInput = document.getElementById('avatarInput');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
        const response = await fetch('/api/upload-avatar', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('profileAvatar').src = data.avatarUrl;
            alert('✅ Аватар обновлен!');
        } else {
            alert('❌ ' + (data.message || 'Ошибка загрузки'));
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('❌ Ошибка подключения к серверу');
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Ошибка выхода:', error);
    }
});

document.getElementById('syncStatsBtn')?.addEventListener('click', syncStats);
document.getElementById('linkRiotBtn')?.addEventListener('click', openRiotModal);
document.getElementById('saveRiotBtn')?.addEventListener('click', saveRiotId);
document.getElementById('cancelRiotBtn')?.addEventListener('click', closeRiotModal);
document.getElementById('changeAvatarBtn')?.addEventListener('click', () => {
    document.getElementById('avatarInput').click();
});
document.getElementById('avatarInput')?.addEventListener('change', changeAvatar);
document.querySelector('.close-modal')?.addEventListener('click', closeRiotModal);

window.addEventListener('click', (e) => {
    const modal = document.getElementById('riotModal');
    if (e.target === modal) {
        closeRiotModal();
    }
});

const tabs = document.querySelectorAll('.game-tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const game = tab.dataset.game;
        const valorantStats = document.getElementById('valorantStats');
        const cs2Stats = document.getElementById('cs2Stats');
        const lolStats = document.getElementById('lolStats');
        
        if (valorantStats) valorantStats.style.display = 'none';
        if (cs2Stats) cs2Stats.style.display = 'none';
        if (lolStats) lolStats.style.display = 'none';
        
        if (game === 'valorant' && valorantStats) valorantStats.style.display = 'block';
        if (game === 'cs2' && cs2Stats) cs2Stats.style.display = 'block';
        if (game === 'lol' && lolStats) lolStats.style.display = 'block';
    });
});

checkAuth();