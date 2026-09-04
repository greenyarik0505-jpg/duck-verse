class DuckInvadersGame {
    constructor(canvas, onGameOver, onAddCoins) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onGameOver = onGameOver;
        this.onAddCoins = onAddCoins;
        this.animationId = null;
        this.running = false;

        this.player = {
            x: canvas.width / 2 - 20,
            y: canvas.height - 50,
            width: 40,
            height: 32,
            speed: 5
        };

        this.keys = {};
        this.lasers = [];
        this.enemies = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        this.enemyDirection = 1;
        this.enemySpeed = 1.0;
        this.lastShotTime = 0;
        this.collectedCoins = 0;

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
    }

    start() {
        this.running = true;
        this.player.x = this.canvas.width / 2 - 20;
        this.lasers = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.wave = 1;
        this.collectedCoins = 0;
        this.spawnWave();

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        this.canvas.addEventListener('pointermove', this.handlePointerMove);
        this.canvas.addEventListener('pointerdown', this.handlePointerDown);

        this.loop();
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('pointermove', this.handlePointerMove);
        this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    }

    spawnWave() {
        this.enemies = [];
        const rows = 3 + Math.min(2, Math.floor(this.wave / 2));
        const cols = 7;
        const spacingX = 45;
        const spacingY = 35;
        const startX = (this.canvas.width - cols * spacingX) / 2 + 15;
        const startY = 50;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.enemies.push({
                    x: startX + c * spacingX,
                    y: startY + r * spacingY,
                    width: 28,
                    height: 22,
                    type: r === 0 ? 'drone' : (r === 1 ? 'bread' : 'goose'),
                    points: (3 - r) * 20
                });
            }
        }
        this.enemySpeed = 0.8 + this.wave * 0.25;
    }

    handleKeyDown(e) {
        this.keys[e.code] = true;
        if (e.code === 'Space') {
            e.preventDefault();
            this.shoot();
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    handlePointerMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, mouseX - this.player.width / 2));
    }

    handlePointerDown(e) {
        this.shoot();
    }

    shoot() {
        if (!this.running) return;
        const now = performance.now();
        if (now - this.lastShotTime < 180) return; // rate limit
        this.lastShotTime = now;

        this.lasers.push({
            x: this.player.x + this.player.width / 2 - 2,
            y: this.player.y - 4,
            width: 4,
            height: 12,
            vy: -8
        });

        if (window.sound) window.sound.pew();
    }

    update() {
        // Keyboard movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.speed);
        }

        // Lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const l = this.lasers[i];
            l.y += l.vy;
            if (l.y < -15) {
                this.lasers.splice(i, 1);
            }
        }

        // Enemies movement
        let switchDirection = false;
        let reachBottom = false;

        this.enemies.forEach(e => {
            e.x += this.enemySpeed * this.enemyDirection;
            if (e.x < 10 || e.x + e.width > this.canvas.width - 10) {
                switchDirection = true;
            }
            if (e.y + e.height >= this.player.y) {
                reachBottom = true;
            }
        });

        if (switchDirection) {
            this.enemyDirection *= -1;
            this.enemies.forEach(e => {
                e.y += 12;
            });
        }

        if (reachBottom) {
            this.lives = 0;
            this.endGame();
            return;
        }

        // Check laser hits
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
                    // Hit!
                    this.score += enemy.points;
                    this.lasers.splice(li, 1);
                    this.enemies.splice(ei, 1);

                    if (window.sound) window.sound.quack();

                    // Coin drop chance (35%)
                    if (Math.random() < 0.35) {
                        this.collectedCoins++;
                        if (this.onAddCoins) this.onAddCoins(1);
                    }

                    // Explosion particles
                    for (let p = 0; p < 8; p++) {
                        this.particles.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y + enemy.height / 2,
                            vx: (Math.random() - 0.5) * 5,
                            vy: (Math.random() - 0.5) * 5,
                            radius: Math.random() * 3 + 2,
                            color: enemy.type === 'bread' ? '#d4a373' : (enemy.type === 'drone' ? '#00f3ff' : '#ff007f'),
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
            if (window.sound) window.sound.victory();
            this.spawnWave();
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Deep space starfield
        ctx.fillStyle = '#060714';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 73 + performance.now() * 0.02) % this.canvas.width;
            const sy = (i * 109) % this.canvas.height;
            ctx.fillRect(sx, sy, (i % 3) + 1, (i % 3) + 1);
        }

        // Player Duck Starship
        ctx.save();
        ctx.translate(this.player.x, this.player.y);

        // Wings/Guns
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 8;
        ctx.fillRect(2, 10, 6, 16);
        ctx.fillRect(32, 10, 6, 16);

        // Main Yellow Duck Cockpit
        ctx.fillStyle = '#ffde00';
        ctx.beginPath();
        ctx.ellipse(20, 16, 14, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cyber Visor
        ctx.fillStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.beginPath();
        ctx.roundRect(14, 6, 12, 6, 2);
        ctx.fill();

        // Neon Beak cannon
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(17, 6);
        ctx.lineTo(20, -2);
        ctx.lineTo(23, 6);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Draw Lasers
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
        this.lasers.forEach(l => {
            ctx.fillRect(l.x, l.y, l.width, l.height);
        });
        ctx.shadowBlur = 0;

        // Draw Enemies
        this.enemies.forEach(e => {
            ctx.save();
            ctx.translate(e.x, e.y);

            if (e.type === 'bread') {
                // Cyber Space Toast
                ctx.fillStyle = '#b07d62';
                ctx.beginPath();
                ctx.roundRect(2, 2, 24, 18, 4);
                ctx.fill();
                ctx.fillStyle = '#e0a96d';
                ctx.fillRect(6, 6, 16, 10);
            } else if (e.type === 'drone') {
                // Red Laser Drone
                ctx.fillStyle = '#ff007f';
                ctx.shadowColor = '#ff007f';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(14, 11, 9, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(11, 9, 6, 4);
            } else {
                // Mutant Cyber Goose
                ctx.fillStyle = '#e2e8f0';
                ctx.beginPath();
                ctx.ellipse(14, 11, 12, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ff5722';
                ctx.fillRect(11, 1, 6, 6);
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

        // UI Bar
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(Счет: , 16, 26);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#00f3ff';
        ctx.fillText(Волна , this.canvas.width / 2, 26);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffe600';
        ctx.fillText(+ 🪙, this.canvas.width - 16, 26);
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    }

    endGame() {
        this.running = false;
        if (window.sound) window.sound.gameover();
        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                coins: this.collectedCoins
            });
        }
    }
}

window.DuckInvadersGame = DuckInvadersGame;
