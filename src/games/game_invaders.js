/**
 * Duck Verse — Galactic Invaders (Космічний Захисник)
 * Розробка: Yarik0505 (SCRUM-20)
 * 
 * Жанр: Космічний ретро-шутер / Shoot 'em up
 * Керування: Стрілки (← / →) або Миша (A та D вимкнено згідно з вимогою замовника).
 * Стрільба: Пробіл або Клік миші (з авто-вогнем при затисканні).
 */

class DuckInvadersGame {
    constructor(canvas, onGameOver, onAddCoins) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onGameOver = onGameOver;
        this.onAddCoins = onAddCoins;
        this.animationId = null;
        this.running = false;
        this.gameOver = false;

        this.player = {
            x: (canvas ? canvas.width : 850) / 2 - 21,
            y: (canvas ? canvas.height : 480) - 55,
            width: 42,
            height: 34,
            speed: 6.0,
            invulnerableTime: 0
        };

        this.keys = {};
        this.isPointerDown = false;
        this.lasers = [];
        this.enemyBombs = [];
        this.enemies = [];
        this.particles = [];
        this.score = 0;
        this.bestScore = 0;
        try {
            this.bestScore = parseInt(localStorage.getItem('duckverse_invaders_best') || '0', 10) || 0;
        } catch (e) {}

        this.lives = 3;
        this.wave = 1;
        this.enemyDirection = 1;
        this.enemySpeed = 1.0;
        this.lastShotTime = 0;
        this.lastBombTime = 0;
        this.collectedCoins = 0;
        this.waveTransitionTimer = 0;

        this.stars = [];
        const w = canvas ? canvas.width : 850;
        const h = canvas ? canvas.height : 480;
        for (let i = 0; i < 45; i++) {
            this.stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 1.5 + 0.6
            });
        }

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
    }

    start() {
        this.running = true;
        this.gameOver = false;
        this.player.x = this.canvas.width / 2 - 21;
        this.player.y = this.canvas.height - 55;
        this.player.invulnerableTime = 0;
        this.lasers = [];
        this.enemyBombs = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        this.collectedCoins = 0;
        this.waveTransitionTimer = 0;
        this.spawnWave();

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('blur', this.handleBlur);
        this.canvas.addEventListener('pointermove', this.handlePointerMove);
        this.canvas.addEventListener('pointerdown', this.handlePointerDown);
        window.addEventListener('pointerup', this.handlePointerUp);

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.loop();
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('blur', this.handleBlur);
        if (this.canvas) {
            this.canvas.removeEventListener('pointermove', this.handlePointerMove);
            this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
        }
        window.removeEventListener('pointerup', this.handlePointerUp);
    }

    restart() {
        this.start();
    }

    resize(w, h, force) {
        if (this.canvas) {
            this.canvas.width = w;
            this.canvas.height = h;
            this.player.y = h - 55;
            this.player.x = Math.max(0, Math.min(w - this.player.width, this.player.x));
        }
    }

    spawnWave() {
        this.enemies = [];
        this.enemyBombs = [];
        const rows = 3 + Math.min(2, Math.floor((this.wave - 1) / 2));
        const cols = 7;
        const spacingX = 52;
        const spacingY = 38;
        const startX = Math.max(20, (this.canvas.width - cols * spacingX) / 2 + 15);
        const startY = 60;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.enemies.push({
                    x: startX + c * spacingX,
                    y: startY + r * spacingY,
                    width: 30,
                    height: 24,
                    type: r === 0 ? 'drone' : (r === 1 ? 'toast' : 'goose'),
                    points: (3 - r) * 25
                });
            }
        }
        this.enemySpeed = 0.9 + this.wave * 0.22;
        this.enemyDirection = 1;
        this.waveTransitionTimer = 70; // show wave banner for ~1.2s
    }

    handleKeyDown(e) {
        // Strict requirement: A and D do NOT move the ship!
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
        }

        this.keys[e.code] = true;

        if (e.code === 'Space' || e.code === 'ArrowUp') {
            if (this.gameOver) {
                this.restart();
            } else {
                this.shoot();
            }
        }

        if (e.code === 'KeyR') {
            this.restart();
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    handleBlur() {
        this.keys = {};
        this.isPointerDown = false;
    }

    handlePointerMove(e) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width > 0) {
            const scaleX = this.canvas.width / rect.width;
            const mouseX = (e.clientX - rect.left) * scaleX;
            this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, mouseX - this.player.width / 2));
        }
    }

    handlePointerDown(e) {
        if (this.gameOver) {
            this.restart();
            return;
        }
        this.isPointerDown = true;
        this.handlePointerMove(e);
        this.shoot();
    }

    handlePointerUp() {
        this.isPointerDown = false;
    }

    shoot() {
        if (!this.running || this.gameOver) return;
        const now = performance.now();
        if (now - this.lastShotTime < 160) return; // rate limit
        this.lastShotTime = now;

        // Dual plasma cannons
        this.lasers.push({
            x: this.player.x + 5,
            y: this.player.y - 6,
            width: 4,
            height: 14,
            vy: -10
        });
        this.lasers.push({
            x: this.player.x + this.player.width - 9,
            y: this.player.y - 6,
            width: 4,
            height: 14,
            vy: -10
        });

        if (window.sound && typeof window.sound.pew === 'function') {
            window.sound.pew();
        }
    }

    update() {
        // Starfield
        this.stars.forEach(s => {
            s.y += s.speed;
            if (s.y > this.canvas.height) {
                s.y = 0;
                s.x = Math.random() * this.canvas.width;
            }
        });

        if (this.gameOver) return;

        if (this.player.invulnerableTime > 0) {
            this.player.invulnerableTime--;
        }

        if (this.waveTransitionTimer > 0) {
            this.waveTransitionTimer--;
        }

        // Keyboard movement: STRICTLY Arrow keys (ArrowLeft / ArrowRight)
        // A and D do NOT move the player per requirement!
        if (this.keys['ArrowLeft']) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight']) {
            this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.speed);
        }

        // Auto-fire while holding Space or mouse button
        if (this.keys['Space'] || this.keys['ArrowUp'] || this.isPointerDown) {
            this.shoot();
        }

        // Player Lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const l = this.lasers[i];
            l.y += l.vy;
            if (l.y < -20) {
                this.lasers.splice(i, 1);
            }
        }

        // Enemy Bombs
        for (let i = this.enemyBombs.length - 1; i >= 0; i--) {
            const b = this.enemyBombs[i];
            b.y += b.vy;

            // Check hit against player
            if (this.player.invulnerableTime <= 0) {
                const px = this.player.x + 4;
                const pw = this.player.width - 8;
                const py = this.player.y + 2;
                const ph = this.player.height - 4;

                if (b.x + b.width > px && b.x < px + pw && b.y + b.height > py && b.y < py + ph) {
                    this.enemyBombs.splice(i, 1);
                    this.takeDamage();
                    continue;
                }
            }

            if (b.y > this.canvas.height + 20) {
                this.enemyBombs.splice(i, 1);
            }
        }

        // Random enemy bomb drops
        const now = performance.now();
        if (this.enemies.length > 0 && now - this.lastBombTime > Math.max(700, 1500 - this.wave * 120)) {
            this.lastBombTime = now;
            const randomEnemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];
            this.enemyBombs.push({
                x: randomEnemy.x + randomEnemy.width / 2 - 2,
                y: randomEnemy.y + randomEnemy.height,
                width: 5,
                height: 11,
                vy: 3.5 + this.wave * 0.3
            });
        }

        // Enemies movement
        let switchDirection = false;
        let reachBottom = false;

        this.enemies.forEach(e => {
            e.x += this.enemySpeed * this.enemyDirection;
            if (e.x < 12 || e.x + e.width > this.canvas.width - 12) {
                switchDirection = true;
            }
            if (e.y + e.height >= this.player.y) {
                reachBottom = true;
            }
        });

        if (switchDirection) {
            this.enemyDirection *= -1;
            this.enemies.forEach(e => {
                e.y += 14;
            });
        }

        if (reachBottom) {
            this.lives = 0;
            this.triggerGameOver();
            return;
        }

        // Check player laser hits against enemies
        for (let li = this.lasers.length - 1; li >= 0; li--) {
            const laser = this.lasers[li];
            for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
                const enemy = this.enemies[ei];
                if (
                    laser.x + laser.width > enemy.x &&
                    laser.x < enemy.x + enemy.width &&
                    laser.y + laser.height > enemy.y &&
                    laser.y < enemy.y + enemy.height
                ) {
                    this.score += enemy.points;
                    if (this.score > this.bestScore) {
                        this.bestScore = this.score;
                        try {
                            localStorage.setItem('duckverse_invaders_best', this.bestScore.toString());
                        } catch (e) {}
                    }

                    this.lasers.splice(li, 1);
                    this.enemies.splice(ei, 1);

                    if (window.sound && typeof window.sound.quack === 'function') {
                        window.sound.quack();
                    }

                    // Coin drop chance (35%)
                    if (Math.random() < 0.35) {
                        this.collectedCoins++;
                        if (this.onAddCoins) this.onAddCoins(1);
                        if (window.sound && typeof window.sound.coin === 'function') {
                            window.sound.coin();
                        }
                    }

                    // Explosion particles
                    for (let p = 0; p < 8; p++) {
                        this.particles.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y + enemy.height / 2,
                            vx: (Math.random() - 0.5) * 5,
                            vy: (Math.random() - 0.5) * 5,
                            radius: Math.random() * 3 + 2,
                            color: enemy.type === 'toast' ? '#f59e0b' : (enemy.type === 'drone' ? '#00f3ff' : '#ff007f'),
                            alpha: 1,
                            life: 20
                        });
                    }
                    break;
                }
            }
        }

        // Particle update
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const part = this.particles[i];
            part.x += part.vx;
            part.y += part.vy;
            part.alpha -= 1 / part.life;
            if (part.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Next wave check
        if (this.enemies.length === 0) {
            this.wave++;
            this.score += 400;
            this.collectedCoins += 2;
            if (this.onAddCoins) this.onAddCoins(2);
            if (window.sound && typeof window.sound.victory === 'function') {
                window.sound.victory();
            }
            this.spawnWave();
        }
    }

    takeDamage() {
        this.lives--;
        this.player.invulnerableTime = 60; // 1 second invulnerability

        if (window.sound && typeof window.sound.explosion === 'function') {
            window.sound.explosion();
        }

        // Sparks
        for (let p = 0; p < 12; p++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                radius: 3,
                color: '#ef4444',
                alpha: 1,
                life: 22
            });
        }

        if (this.lives <= 0) {
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        this.gameOver = true;
        if (window.sound && typeof window.sound.gameover === 'function') {
            window.sound.gameover();
        }
        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                wave: this.wave,
                best: this.bestScore,
                coins: this.collectedCoins
            });
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Deep space starfield
        ctx.fillStyle = '#060714';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Stars
        this.stars.forEach(s => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        // Player Duck Starship (with invulnerability blinking)
        const isBlinking = this.player.invulnerableTime > 0 && Math.floor(this.player.invulnerableTime / 4) % 2 === 0;
        if (!isBlinking && (!this.gameOver || this.lives > 0)) {
            ctx.save();
            ctx.translate(this.player.x, this.player.y);

            // Left & Right Plasma Blasters
            ctx.fillStyle = '#00f3ff';
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 8;
            ctx.fillRect(2, 12, 6, 18);
            ctx.fillRect(34, 12, 6, 18);

            // Main Cyber Duck Cockpit
            ctx.fillStyle = '#ffde00';
            ctx.beginPath();
            ctx.ellipse(21, 18, 15, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Visor
            ctx.fillStyle = '#ff007f';
            ctx.shadowColor = '#ff007f';
            ctx.beginPath();
            ctx.roundRect(15, 8, 12, 6, 2);
            ctx.fill();

            // Beak Nose Cannon
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.moveTo(18, 8);
            ctx.lineTo(21, 0);
            ctx.lineTo(24, 8);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        // Draw Player Lasers
        ctx.save();
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
        this.lasers.forEach(l => {
            ctx.fillRect(l.x, l.y, l.width, l.height);
        });
        ctx.restore();

        // Draw Enemy Bombs
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        this.enemyBombs.forEach(b => {
            ctx.fillRect(b.x, b.y, b.width, b.height);
        });
        ctx.restore();

        // Draw Enemies
        this.enemies.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);

            if (e.type === 'toast') {
                ctx.fillStyle = '#b45309';
                ctx.beginPath();
                ctx.roundRect(2, 2, 26, 20, 4);
                ctx.fill();
                ctx.fillStyle = '#fde68a';
                ctx.fillRect(6, 6, 18, 12);
            } else if (e.type === 'drone') {
                ctx.fillStyle = '#ff007f';
                ctx.shadowColor = '#ff007f';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(15, 12, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(12, 10, 6, 4);
            } else {
                ctx.fillStyle = '#e2e8f0';
                ctx.beginPath();
                ctx.ellipse(15, 12, 13, 9, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#f97316';
                ctx.fillRect(12, 2, 6, 6);
            }
            ctx.restore();
        });

        // Draw Particles
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // HUD Bar
        ctx.save();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 15px sans-serif';
        ctx.fillText('ОЧКИ: ' + this.score, 16, 24);

        // Lives indicators
        let livesText = '';
        for (let l = 0; l < 3; l++) {
            livesText += l < this.lives ? '🛡️ ' : '✖ ';
        }
        ctx.font = '13px sans-serif';
        ctx.fillText('ЩИТ: ' + livesText, 16, 46);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#00f3ff';
        ctx.font = '900 15px sans-serif';
        ctx.fillText('ХВИЛЯ ' + this.wave, this.canvas.width / 2, 24);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#facc15';
        ctx.fillText('+' + this.collectedCoins + ' 🪙', this.canvas.width - 16, 24);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText('РЕКОРД: ' + this.bestScore, this.canvas.width - 16, 44);
        ctx.restore();

        // Wave Transition Banner
        if (this.waveTransitionTimer > 0 && !this.gameOver) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 243, 255, 0.15)';
            ctx.fillRect(0, this.canvas.height / 2 - 40, this.canvas.width, 80);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#00f3ff';
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 15;
            ctx.font = '900 32px sans-serif';
            ctx.fillText('ХВИЛЯ ' + this.wave, this.canvas.width / 2, this.canvas.height / 2);
            ctx.restore();
        }

        // Game Over Overlay
        if (this.gameOver) {
            ctx.save();
            ctx.fillStyle = 'rgba(6, 7, 20, 0.85)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 20;
            ctx.font = '900 36px sans-serif';
            ctx.fillText('МІСІЯ ПРОВАЛЕНА', this.canvas.width / 2, this.canvas.height / 2 - 50);

            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 20px sans-serif';
            ctx.fillText('Фінальні очки: ' + this.score + ' | Хвиля: ' + this.wave, this.canvas.width / 2, this.canvas.height / 2);

            ctx.fillStyle = '#facc15';
            ctx.font = '15px sans-serif';
            ctx.fillText('Зібрано монет: +' + this.collectedCoins + ' 🪙 | Найкращий рахунок: ' + this.bestScore, this.canvas.width / 2, this.canvas.height / 2 + 35);

            ctx.fillStyle = '#38bdf8';
            ctx.font = '900 16px sans-serif';
            ctx.fillText('Натисніть [R], [Пробіл] або Клікніть мишкою, щоб зіграти знову', this.canvas.width / 2, this.canvas.height / 2 + 80);

            ctx.restore();
        }
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    }

    endGame() {
        this.triggerGameOver();
    }
}

if (typeof window !== 'undefined') {
    window.DuckInvadersGame = DuckInvadersGame;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DuckInvadersGame;
}
