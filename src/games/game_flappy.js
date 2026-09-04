class FlappyDuckGame {
    constructor(canvas, onGameOver, onAddCoins) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onGameOver = onGameOver;
        this.onAddCoins = onAddCoins;
        this.animationId = null;
        this.running = false;

        this.duck = {
            x: 80,
            y: 200,
            width: 38,
            height: 30,
            vy: 0,
            gravity: 0.38,
            jumpStrength: -6.5,
            rotation: 0
        };

        this.pipes = [];
        this.coins = [];
        this.particles = [];
        this.score = 0;
        this.collectedCoins = 0;
        this.frameCount = 0;
        this.speed = 2.4;

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
    }

    start() {
        this.running = true;
        this.duck.y = this.canvas.height / 2;
        this.duck.vy = 0;
        this.pipes = [];
        this.coins = [];
        this.particles = [];
        this.score = 0;
        this.collectedCoins = 0;
        this.frameCount = 0;

        window.addEventListener('keydown', this.handleKeyDown);
        this.canvas.addEventListener('pointerdown', this.handlePointerDown);

        this.loop();
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('keydown', this.handleKeyDown);
        this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    }

    flap() {
        if (!this.running) return;
        this.duck.vy = this.duck.jumpStrength;
        if (window.sound) window.sound.jump();

        // Spawn thruster particles
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: this.duck.x - 4,
                y: this.duck.y + 16,
                vx: -Math.random() * 3 - 1,
                vy: (Math.random() - 0.5) * 2,
                radius: Math.random() * 3 + 2,
                color: ['#00f3ff', '#ff007f', '#ffe600'][Math.floor(Math.random() * 3)],
                alpha: 1.0,
                life: 18
            });
        }
    }

    handleKeyDown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            this.flap();
        }
    }

    handlePointerDown(e) {
        e.preventDefault();
        this.flap();
    }

    update() {
        this.frameCount++;
        this.duck.vy += this.duck.gravity;
        this.duck.y += this.duck.vy;

        // Target rotation based on velocity
        const targetRot = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, this.duck.vy * 0.08));
        this.duck.rotation += (targetRot - this.duck.rotation) * 0.2;

        // Spawn pipes
        if (this.frameCount % 100 === 0) {
            const gap = 125;
            const minHeight = 50;
            const maxHeight = this.canvas.height - gap - minHeight;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;

            this.pipes.push({
                x: this.canvas.width,
                topHeight: topHeight,
                bottomY: topHeight + gap,
                width: 55,
                passed: false
            });

            // 50% chance of spawning coin in the gap
            if (Math.random() > 0.4) {
                this.coins.push({
                    x: this.canvas.width + 27,
                    y: topHeight + gap / 2,
                    radius: 10,
                    collected: false
                });
            }
        }

        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const p = this.pipes[i];
            p.x -= this.speed;

            // Score point
            if (!p.passed && p.x + p.width < this.duck.x) {
                p.passed = true;
                this.score++;
                if (window.sound) window.sound.quack();
            }

            // Collision check
            const duckBox = {
                left: this.duck.x,
                right: this.duck.x + this.duck.width,
                top: this.duck.y,
                bottom: this.duck.y + this.duck.height
            };

            const inPipeX = duckBox.right > p.x && duckBox.left < p.x + p.width;
            const hitTop = duckBox.top < p.topHeight;
            const hitBottom = duckBox.bottom > p.bottomY;

            if (inPipeX && (hitTop || hitBottom)) {
                this.endGame();
                return;
            }

            if (p.x + p.width < -10) {
                this.pipes.splice(i, 1);
            }
        }

        // Update coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];
            c.x -= this.speed;

            // Check collision with duck center
            const dx = (this.duck.x + this.duck.width / 2) - c.x;
            const dy = (this.duck.y + this.duck.height / 2) - c.y;
            const dist = Math.hypot(dx, dy);

            if (dist < c.radius + 18) {
                c.collected = true;
                this.collectedCoins++;
                if (window.sound) window.sound.coin();
                if (this.onAddCoins) this.onAddCoins(1);

                // Particle chime
                for (let j = 0; j < 8; j++) {
                    this.particles.push({
                        x: c.x,
                        y: c.y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        radius: 3,
                        color: '#ffe600',
                        alpha: 1,
                        life: 20
                    });
                }
                this.coins.splice(i, 1);
                continue;
            }

            if (c.x < -20) {
                this.coins.splice(i, 1);
            }
        }

        // Boundary collision
        if (this.duck.y + this.duck.height > this.canvas.height || this.duck.y < 0) {
            this.endGame();
            return;
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const part = this.particles[i];
            part.x += part.vx;
            part.y += part.vy;
            part.alpha -= 1 / part.life;
            if (part.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawDuck(x, y, rotation) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x + this.duck.width / 2, y + this.duck.height / 2);
        ctx.rotate(rotation);

        // Jetpack
        ctx.fillStyle = '#4a4d5a';
        ctx.beginPath();
        ctx.roundRect(-22, -4, 10, 18, 3);
        ctx.fill();
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Duck Body (Vibrant Yellow Cyber Duck)
        ctx.fillStyle = '#ffde00';
        ctx.beginPath();
        ctx.ellipse(0, 2, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wing
        ctx.fillStyle = '#f0c400';
        ctx.beginPath();
        ctx.ellipse(-4, 4, 9, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#ffde00';
        ctx.beginPath();
        ctx.arc(10, -6, 11, 0, Math.PI * 2);
        ctx.fill();

        // Cyber Visor / VR Goggles
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(8, -10, 11, 7, 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Visor glare
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, -9, 3, 2);

        // Cyber Beak (Orange neon)
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(17, -5);
        ctx.lineTo(26, -2);
        ctx.lineTo(16, 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Cyberpunk background grid
        ctx.fillStyle = '#0c0e18';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.strokeStyle = 'rgba(0, 243, 255, 0.07)';
        ctx.lineWidth = 1;
        const gridSize = 32;
        const offsetX = (this.frameCount * this.speed * 0.5) % gridSize;
        for (let x = -offsetX; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        // Draw Pipes (Neon Neon laser gates)
        this.pipes.forEach(p => {
            // Top pipe
            const gradTop = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
            gradTop.addColorStop(0, '#ff007f');
            gradTop.addColorStop(0.5, '#ff55b3');
            gradTop.addColorStop(1, '#99004d');
            ctx.fillStyle = gradTop;
            ctx.fillRect(p.x, 0, p.width, p.topHeight);

            // Cap
            ctx.fillStyle = '#00f3ff';
            ctx.fillRect(p.x - 3, p.topHeight - 12, p.width + 6, 12);

            // Bottom pipe
            const gradBottom = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
            gradBottom.addColorStop(0, '#ff007f');
            gradBottom.addColorStop(0.5, '#ff55b3');
            gradBottom.addColorStop(1, '#99004d');
            ctx.fillStyle = gradBottom;
            ctx.fillRect(p.x, p.bottomY, p.width, this.canvas.height - p.bottomY);

            // Bottom cap
            ctx.fillStyle = '#00f3ff';
            ctx.fillRect(p.x - 3, p.bottomY, p.width + 6, 12);
        });

        // Draw Coins
        this.coins.forEach(c => {
            ctx.save();
            ctx.shadowColor = '#ffe600';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#ffe600';
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#9e6200';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Q', c.x, c.y + 1);
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

        // Draw Duck
        this.drawDuck(this.duck.x, this.duck.y, this.duck.rotation);

        // Score overlay
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 10;
        ctx.fillText(this.score, this.canvas.width / 2, 45);
        ctx.shadowBlur = 0;

        // Quack coins collected in this run
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffe600';
        ctx.fillText(+ 🪙, this.canvas.width / 2, 70);
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    }

    endGame() {
        this.running = false;
        if (window.sound) window.sound.explosion();
        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                coins: this.collectedCoins
            });
        }
    }
}

window.FlappyDuckGame = FlappyDuckGame;
