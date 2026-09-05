class DuckVerseHub {
    constructor() {
        this.coins = parseInt(localStorage.getItem('duckverse_coins') || '50', 10);
        this.activeGame = null;
        this.activeGameId = null;

        this.games = [
            {
                id: 'geometry_dash',
                title: 'Geometry Dash Neon',
                tag: 'RHYTHM & ACTION',
                badge: '🔥 ГЛАВНАЯ ИГРА',
                desc: 'Культовый ритм-платформер! Прыгай через неоновые шипы, используй батуты, орбы и пройди уровень на 100%.',
                rating: '5.0 ★',
                players: '12.4k',
                bgClass: 'game-bg-gd',
                category: 'action'
            },
            {
                id: 'flappy',
                title: 'Cyber Flap',
                tag: 'ARCADE',
                badge: 'ХИТ',
                desc: 'Управляй реактивным полетом через лазерные ворота и собирай квантовые монеты.',
                rating: '4.8 ★',
                players: '8.1k',
                bgClass: 'game-bg-flappy',
                category: 'arcade'
            },
            {
                id: 'invaders',
                title: 'Galactic Invaders',
                tag: 'SHOOTER',
                badge: 'АРКАДА',
                desc: 'Космический ретро-шутер: уничтожай волны кибер-захватчиков и дронов.',
                rating: '4.9 ★',
                players: '6.7k',
                bgClass: 'game-bg-invaders',
                category: 'action'
            },
            {
                id: 'clicker',
                title: 'Multiverse Tycoon',
                tag: 'IDLE / CLICKER',
                badge: 'ПАССИВНЫЙ ДОХОД',
                desc: 'Кликай, покупай квантовые апгрейды и строй мультиверс империю.',
                rating: '4.7 ★',
                players: '15.2k',
                bgClass: 'game-bg-clicker',
                category: 'casual'
            },
            {
                id: 'hunter',
                title: 'Arcade Hunter',
                tag: 'REFLEX',
                badge: 'РЕАКЦИЯ',
                desc: 'Динамичный неоновый тир на точность и скорость реакции. Успей за 35 секунд!',
                rating: '4.6 ★',
                players: '4.3k',
                bgClass: 'game-bg-hunter',
                category: 'arcade'
            }
        ];

        this.achievements = [
            { id: 'first_play', title: 'Первый запуск', desc: 'Запусти любую игру в Duck Verse', unlocked: false, reward: 20 },
            { id: 'gd_50', title: 'Ритм-воин', desc: 'Достигни 50% в Geometry Dash', unlocked: false, reward: 50 },
            { id: 'gd_100', title: 'Geometry God', desc: 'Пройди Geometry Dash на 100%', unlocked: false, reward: 200 },
            { id: 'rich_player', title: 'Крипто-магнат', desc: 'Собери 250 монет в Duck Verse', unlocked: false, reward: 100 }
        ];

        this.loadAchievements();
        this.initDOM();
    }

    loadAchievements() {
        const saved = localStorage.getItem('duckverse_achievements');
        if (saved) {
            try {
                const map = JSON.parse(saved);
                this.achievements.forEach(a => {
                    if (map[a.id]) a.unlocked = true;
                });
            } catch (e) {}
        }
    }

    saveAchievements() {
        const map = {};
        this.achievements.forEach(a => { map[a.id] = a.unlocked; });
        localStorage.setItem('duckverse_achievements', JSON.stringify(map));
    }

    unlockAchievement(id) {
        const ach = this.achievements.find(a => a.id === id);
        if (ach && !ach.unlocked) {
            ach.unlocked = true;
            this.addCoins(ach.reward);
            this.saveAchievements();
            this.showToast(`🏆 Достижение: "${ach.title}" (+${ach.reward} 🪙)`);
            if (window.sound) window.sound.victory();
        }
    }

    addCoins(amount) {
        this.coins += amount;
        localStorage.setItem('duckverse_coins', this.coins);
        this.updateCoinUI();
        if (this.coins >= 250) {
            this.unlockAchievement('rich_player');
        }
    }

    updateCoinUI() {
        const els = document.querySelectorAll('.user-coins-val');
        els.forEach(el => el.innerText = this.coins);
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'hub-toast';
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 20);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

    initDOM() {
        this.updateCoinUI();
        this.renderGameCards('all');

        // Mute toggle
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            const isMuted = localStorage.getItem('duckverse_muted') === 'true';
            muteBtn.innerText = isMuted ? '🔇 Звук: Выкл' : '🔊 Звук: Вкл';
            muteBtn.addEventListener('click', () => {
                const muted = window.sound.toggleMute();
                muteBtn.innerText = muted ? '🔇 Звук: Выкл' : '🔊 Звук: Вкл';
            });
        }

        // Category filter buttons
        const catButtons = document.querySelectorAll('.cat-btn');
        catButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                catButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderGameCards(btn.dataset.category);
            });
        });

        // Search input
        const searchInput = document.getElementById('game-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase().trim();
                this.renderGameCards('all', q);
            });
        }
    }

    renderGameCards(category = 'all', searchQuery = '') {
        const grid = document.getElementById('games-grid');
        if (!grid) return;

        let filtered = this.games;
        if (category !== 'all') {
            filtered = filtered.filter(g => g.category === category);
        }
        if (searchQuery) {
            filtered = filtered.filter(g => 
                g.title.toLowerCase().includes(searchQuery) ||
                g.desc.toLowerCase().includes(searchQuery) ||
                g.tag.toLowerCase().includes(searchQuery)
            );
        }

        grid.innerHTML = filtered.map(game => `
            <div class="game-card ${game.bgClass}">
                <div class="card-glow"></div>
                <div class="card-top">
                    <span class="card-badge">${game.badge}</span>
                    <span class="card-tag">${game.tag}</span>
                </div>
                <div class="card-visual">
                    ${this.renderCardGraphic(game.id)}
                </div>
                <div class="card-body">
                    <h3 class="card-title">${game.title}</h3>
                    <p class="card-desc">${game.desc}</p>
                    <div class="card-meta">
                        <span class="meta-rating">${game.rating}</span>
                        <span class="meta-players">👥 ${game.players}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="play-btn" onclick="window.hub.launchGame('${game.id}')">
                        <span>ИГРАТЬ</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderCardGraphic(id) {
        if (id === 'geometry_dash') {
            return `
                <div class="gd-card-preview">
                    <div class="gd-cube-icon"></div>
                    <div class="gd-spike-icon"></div>
                    <div class="gd-orb-icon"></div>
                </div>
            `;
        } else if (id === 'flappy') {
            return `<div class="card-icon-emoji">🦆💨</div>`;
        } else if (id === 'invaders') {
            return `<div class="card-icon-emoji">🚀👾</div>`;
        } else if (id === 'clicker') {
            return `<div class="card-icon-emoji">🪙⚡</div>`;
        } else {
            return `<div class="card-icon-emoji">🎯⚡</div>`;
        }
    }

    launchGame(gameId) {
        const modal = document.getElementById('game-modal');
        const titleEl = document.getElementById('modal-game-title');
        const container = document.getElementById('game-container');
        if (!modal || !container) return;

        const gameDef = this.games.find(g => g.id === gameId);
        if (!gameDef) return;

        titleEl.innerText = gameDef.title;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        this.unlockAchievement('first_play');
        this.activeGameId = gameId;

        // Clean container
        container.innerHTML = '';

        if (gameId === 'clicker') {
            const clickerWrap = document.createElement('div');
            clickerWrap.id = 'clicker-root';
            container.appendChild(clickerWrap);
            this.activeGame = new QuackClickerGame(clickerWrap, (coins) => this.addCoins(coins));
            this.activeGame.start();
        } else {
            const canvas = document.createElement('canvas');
            canvas.id = 'game-canvas';
            canvas.width = 850;
            canvas.height = 480;
            container.appendChild(canvas);

            if (gameId === 'geometry_dash') {
                this.activeGame = new GeometryDashGame(
                    canvas,
                    (res) => {
                        this.showGameOverModal('Geometry Dash Neon', res.percent + '%', 'Рекорд: ' + res.bestPercent + '% (Попытка ' + res.attempts + ')');
                        if (res.percent >= 50) this.unlockAchievement('gd_50');
                    },
                    (res) => {
                        this.showVictoryModal('Поздравляем! 100% Geometry Dash пройден!', res.attempts);
                        this.unlockAchievement('gd_100');
                    },
                    (coins) => this.addCoins(coins)
                );
            } else if (gameId === 'flappy') {
                this.activeGame = new FlappyDuckGame(
                    canvas,
                    (res) => this.showGameOverModal('Cyber Flap', res.score + ' очков', '+' + res.coins + ' 🪙'),
                    (coins) => this.addCoins(coins)
                );
            } else if (gameId === 'invaders') {
                this.activeGame = new DuckInvadersGame(
                    canvas,
                    (res) => this.showGameOverModal('Galactic Invaders', res.score + ' очков', '+' + res.coins + ' 🪙'),
                    (coins) => this.addCoins(coins)
                );
            } else if (gameId === 'hunter') {
                this.activeGame = new DuckHunterGame(
                    canvas,
                    (res) => this.showGameOverModal('Arcade Hunter', res.score + ' очков', '+' + res.coins + ' 🪙'),
                    (coins) => this.addCoins(coins)
                );
            }

            this.activeGame.start();
        }
    }

    closeGame() {
        if (this.activeGame) {
            this.activeGame.stop();
            this.activeGame = null;
        }
        const modal = document.getElementById('game-modal');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
        this.activeGameId = null;
    }

    restartActiveGame() {
        if (this.activeGameId) {
            const id = this.activeGameId;
            this.closeGame();
            setTimeout(() => this.launchGame(id), 50);
        }
    }

    showGameOverModal(title, scoreText, subText) {
        const overlay = document.getElementById('result-modal');
        if (!overlay) return;

        document.getElementById('result-title').innerText = 'ИГРА ОКОНЧЕНА';
        document.getElementById('result-game-name').innerText = title;
        document.getElementById('result-score').innerText = scoreText;
        document.getElementById('result-sub').innerText = subText || '';

        overlay.classList.add('active');
    }

    showVictoryModal(title, attempts) {
        const overlay = document.getElementById('result-modal');
        if (!overlay) return;

        document.getElementById('result-title').innerText = '🎉 ПОБЕДА! УРОВЕНЬ ПРОЙДЕН!';
        document.getElementById('result-game-name').innerText = title;
        document.getElementById('result-score').innerText = '100%';
        document.getElementById('result-sub').innerText = 'Потрачено попыток: ' + attempts + ' | Награда: +50 🪙';
        this.addCoins(50);

        overlay.classList.add('active');
    }

    closeResultModal() {
        const overlay = document.getElementById('result-modal');
        if (overlay) overlay.classList.remove('active');
    }

    restartFromResult() {
        this.closeResultModal();
        this.restartActiveGame();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.hub = new DuckVerseHub();
});
