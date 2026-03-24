const gamesData = [
    { image: "https://fons.grizly.club/uploads/posts/2025-06/26/17509434006283.jpg", name: "Minecraft" },
    { image: "https://www.kinonews.ru/insimgs/2020/poster/poster94404_1.jpg", name: "Valorant" },
    { image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQek_z7yyC4fLjKLPqXccvXYe1YpvmLb0O3uA&s", name: "CS 2" },
    { image: "https://fons.grizly.club/uploads/posts/2025-06/26/1750930811559.jpg", name: "Dota 2" },
    { image: "https://i.playground.ru/i/pix/3117450/image.jpg", name: "Genshin Impact" },
    { image: "https://cdn1.epicgames.com/offer/24b9b5e323bc40eea252a10cdd3b2f10/EGS_LeagueofLegends_RiotGames_S2_1200x1600-112729f9da450fe377e11d40029c4831", name: "League of Legends" },
    { image: "https://cdn.itmo.events/covers/116576/cover.webp", name: "OSU!"}
];

document.addEventListener('DOMContentLoaded', function() {
    const scrollContainer = document.getElementById('scrollContainer');
    const imageRow = document.getElementById('imageRow');
    
    if (!scrollContainer || !imageRow) {
        console.error('Элементы галереи не найдены!');
        return;
    }
    
    let autoScrollInterval = null;
    let isAutoScrolling = true;
    let cardWidth = 530;
    
    function buildGallery() {
        imageRow.innerHTML = '';
        
        gamesData.forEach((game) => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <img src="${game.image}" alt="${game.name}" 
                     onerror="this.src='https://via.placeholder.com/500x350/ff1493/ffffff?text=${encodeURIComponent(game.name)}'">
                <div class="game-card-title">${game.name}</div>
            `;
            imageRow.appendChild(card);
        });
        
        setTimeout(() => {
            const firstCard = document.querySelector('.game-card');
            if (firstCard) {
                const cardWidthValue = firstCard.offsetWidth;
                const gap = 30;
                cardWidth = cardWidthValue + gap;
            }
        }, 100);
    }
    
    function startAutoScroll() {
        if (autoScrollInterval) clearInterval(autoScrollInterval);
        
        autoScrollInterval = setInterval(() => {
            if (!isAutoScrolling) return;
            
            const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
            const currentScroll = scrollContainer.scrollLeft;
            
            if (currentScroll >= maxScroll - 10) {
                scrollContainer.scrollTo({
                    left: 0,
                    behavior: 'smooth'
                });
            } else {
                scrollContainer.scrollBy({
                    left: cardWidth,
                    behavior: 'smooth'
                });
            }
        }, 3500);
    }
    
    function pauseAutoScroll() {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            autoScrollInterval = null;
        }
    }
    
    function resumeAutoScroll() {
        if (!autoScrollInterval && isAutoScrolling) {
            startAutoScroll();
        }
    }
    
    scrollContainer.addEventListener('mouseenter', () => {
        pauseAutoScroll();
    });
    
    scrollContainer.addEventListener('mouseleave', () => {
        if (isAutoScrolling) {
            startAutoScroll();
        }
    });
    
    let isDown = false;
    let startX;
    let startScrollLeft;
    
    scrollContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        scrollContainer.style.cursor = 'grabbing';
        startX = e.pageX - scrollContainer.offsetLeft;
        startScrollLeft = scrollContainer.scrollLeft;
        pauseAutoScroll();
    });
    
    window.addEventListener('mouseup', () => {
        if (isDown) {
            isDown = false;
            scrollContainer.style.cursor = 'grab';
            if (isAutoScrolling) {
                startAutoScroll();
            }
        }
    });
    
    scrollContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - scrollContainer.offsetLeft;
        const walk = (x - startX) * 1.5;
        scrollContainer.scrollLeft = startScrollLeft - walk;
    });
    
    window.addEventListener('resize', () => {
        const firstCard = document.querySelector('.game-card');
        if (firstCard) {
            const cardWidthValue = firstCard.offsetWidth;
            const gap = 30;
            cardWidth = cardWidthValue + gap;
        }
    });
    
    buildGallery();
    
    setTimeout(() => {
        startAutoScroll();
    }, 500);
});