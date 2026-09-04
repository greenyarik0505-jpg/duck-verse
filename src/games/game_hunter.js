class DuckHunterGame {
    constructor(canvas, onGameOver, onAddCoins) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onGameOver = onGameOver;
        this.onAddCoins = onAddCoins;
        this.animationId = null;
        this.running = false;

        this.ducks = [];
        this.particles = [];
        this.score = 0;
        this.combo = 1;
        this.timeLeft = 35;
        this.timer = null;
        this.collectedCoins = 0;
        this.crosshair = { x: canvas.width / 2, y: canvas.height / 2 };

        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
    }

    start() {
        this.running = true;
        this.ducks = [];
        this.particles = [];
        this.score = 0;
        this.combo = 1;
        this.timeLeft = 35;
        this.collectedCoins = 0;

        this.canvas.addEventListener('pointerdown', this.handlePointerDown);
        this.canvas.addEventListener('pointermove', this.handlePointerMove);

        // Spawn timer
        this.timer = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);

        this.loop();
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
        this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    }

    spawnDuck() {
        const fromLeft = Math.random() > 0.5;
        const speed = Math.random() * 2.5 + 2.0;
        const isGolden = Math.random() < 0.2;

        this.ducks.push({
            x: fromLeft ? -40 : this.canvas.width + 40,
            y: Math.random() * (this.canvas.height - 180) + 60,
            vx: fromLeft ? speed : -speed,
            vy: (Math.random() - 0.5) * 1.5,
            radius: isGolden ? 18 : 22,
            isGolden: isGolden,
            points: isGolden ? 100 : 30,
            wingFlap: 0
        });
    }

    handlePointerMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.crosshair.x = e.clientX - rect.left;
        this.crosshair.y = e.clientY - rect.top;
    }

    handlePointerDown(e) {
        if (!this.running) return;
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        if (window.sound) window.sound.pew();

        let hit = false;
        for (let i = this.ducks.length - 1; i >= 0; i--) {
            const d = this.ducks[i];
            const dist = Math.hypot(clickX - d.x, clickY - d.y);
            if (dist < d.radius + 8) {
                hit = true;
                const earned = d.points * this.combo;
                this.score += earned;
                this.combo++;

                if (d.isGolden) {
                    this.collectedCoins += 3;
                    if (this.onAddCoins) this.onAddCoins(3);
                    if (window.sound) window.sound.victory();
                } else {
                    if (window.sound) window.sound.quack();
                    if (Math.random() < 0.4) {
                        this.collectedCoins++;
                        if (this.onAddCoins) this.onAddCoins(1);
                    }
                }

                // Explosion particles
                for (let p = 0; p < 12; p++) {
                    this.particles.push({
                        x: d.x,
                        y: d.y,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        radius: Math.random() * 4 + 2,
                        color: d.isGolden ? '#ffe600' : '#00f3ff',
                        alpha: 1,
                        life: 25
                    });
                }

                this.ducks.splice(i, 1);
                break;
            }
        }

        if (!hit) {
            this.combo = 1; // reset combo on miss
        }
    }

    update() {
        // Spawn ducks
        if (Math.random() < 0.035 && this.ducks.length < 5) {
            this.spawnDuck();
        }

        // Update ducks
        for (let i = this.ducks.length - 1; i >= 0; i--) {
            const d = this.ducks[i];
            d.x += d.vx;
            d.y += d.vy;
            d.wingFlap += 0.2;

            if (d.y < 40 || d.y > this.canvas.height - 80) {
                d.vy *= -1;
            }

            if ((d.vx > 0 && d.x > this.canvas.width + 60) || (d.vx < 0 && d.x < -60)) {
                this.ducks.splice(i, 1);
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 1 / p.life;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Cyber Grid Background
        ctx.fillStyle = '#0a0d1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Horizon mountain glow
        const grad = ctx.createLinearGradient(0, this.canvas.height - 80, 0, this.canvas.height);
        grad.addColorStop(0, 'rgba(255, 0, 127, 0.15)');
        grad.addColorStop(1, 'rgba(0, 243, 255, 0.05)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, this.canvas.height - 80, this.canvas.width, 80);

        // Draw Ducks
        this.ducks.forEach(d => {
            ctx.save();
            ctx.translate(d.x, d.y);
            const facingLeft = d.vx < 0;
            if (facingLeft) ctx.scale(-1, 1);

            // Body
            ctx.fillStyle = d.isGolden ? '#ffe600' : '#ffde00';
            ctx.shadowColor = d.isGolden ? '#ffe600' : '#00f3ff';
            ctx.shadowBlur = d.isGolden ? 15 : 6;
            ctx.beginPath();
            ctx.ellipse(0, 0, d.radius, d.radius * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Wing animation
            const wingY = Math.sin(d.wingFlap) * 8;
            ctx.fillStyle = d.isGolden ? '#ffaa00' : '#e6be00';
            ctx.beginPath();
            ctx.ellipse(-2, wingY, d.radius * 0.5, d.radius * 0.3, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.fillStyle = d.isGolden ? '#ffe600' : '#ffde00';
            ctx.beginPath();
            ctx.arc(d.radius * 0.7, -d.radius * 0.3, d.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();

            // Beak
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.moveTo(d.radius * 1.1, -d.radius * 0.3);
            ctx.lineTo(d.radius * 1.5, -d.radius * 0.1);
            ctx.lineTo(d.radius * 1.1, 0);
            ctx.closePath();
            ctx.fill();

            // Cyber eye
            ctx.fillStyle = '#00f3ff';
            ctx.beginPath();
            ctx.arc(d.radius * 0.8, -d.radius * 0.4, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        // Particles
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Crosshair
        ctx.save();
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.crosshair.x, this.crosshair.y, 16, 0, Math.PI * 2);
        ctx.moveTo(this.crosshair.x - 24, this.crosshair.y);
        ctx.lineTo(this.crosshair.x + 24, this.crosshair.y);
        ctx.moveTo(this.crosshair.x, this.crosshair.y - 24);
        ctx.lineTo(this.crosshair.x, this.crosshair.y + 24);
        ctx.stroke();
        ctx.restore();

        // Top UI
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Счет: ${this.score}`, 16, 26);
        ctx.fillStyle = '#00f3ff';
        ctx.fillText(`Комбо: x${this.combo}`, 140, 26);

        ctx.textAlign = 'center';
        ctx.fillStyle = this.timeLeft <= 10 ? '#ff0055' : '#ffffff';
        ctx.fillText(`⏱️ ${this.timeLeft}с`, this.canvas.width / 2, 26);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffe600';
        ctx.fillText(`+${this.collectedCoins} 🪙`, this.canvas.width - 16, 26);
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    }

    endGame() {
        this.running = false;
        if (this.timer) clearInterval(this.timer);
        if (window.sound) window.sound.gameover();
        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                coins: this.collectedCoins
            });
        }
    }
}

window.DuckHunterGame = DuckHunterGame;
