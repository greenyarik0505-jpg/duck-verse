/**
 * Duck Verse — Flappy Duck (SCRUM-18)
 * Класична аркадна гра Flappy Bird без неону.
 * Автентичний ретро-стиль: блакитне небо, зелені труби, плавна фізика,
 * анімована качечка з крилами, золоті монети та підрахунок очок.
 */

class FlappyDuckGame {
    constructor(canvas, onGameOver, onVictoryOrCoins, onAddCoins) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onGameOver = onGameOver;
        
        // Handle flexible callback signatures
        if (typeof onVictoryOrCoins === 'function' && typeof onAddCoins === 'function') {
            this.onVictory = onVictoryOrCoins;
            this.onAddCoins = onAddCoins;
        } else if (typeof onVictoryOrCoins === 'function') {
            this.onAddCoins = onVictoryOrCoins;
            this.onVictory = null;
        } else {
            this.onAddCoins = null;
            this.onVictory = null;
        }

        this.animationId = null;
        this.running = false;
        this.state = 'ready'; // 'ready', 'playing', 'gameover'

        this.groundHeight = 64;
        this.groundOffset = 0;

        this.duck = {
            x: 90,
            y: 200,
            width: 36,
            height: 28,
            vy: 0,
            gravity: 0.38,
            jumpStrength: -6.8,
            maxFallSpeed: 8.5,
            rotation: 0,
            wingFrame: 0,
            wingDirection: 1
        };

        this.pipes = [];
        this.coins = [];
        this.particles = [];
        this.clouds = [];

        this.score = 0;
        this.collectedCoins = 0;
        this.bestScore = 0;
        this.frameCount = 0;
        this.speed = 2.4;
        this.pipeSpawnTimer = 0;
        this.pipeInterval = 105; // frames between pipe spawns (~1.75s at 60fps)

        try {
            if (typeof localStorage !== 'undefined') {
                this.bestScore = parseInt(localStorage.getItem('duckverse_flappy_best') || '0', 10) || 0;
            }
        } catch (e) {
            this.bestScore = 0;
        }

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);

        this.initClouds();
    }

    initClouds() {
        this.clouds = [
            { x: 50, y: 60, speed: 0.4, scale: 1.2 },
            { x: 280, y: 110, speed: 0.25, scale: 0.9 },
            { x: 520, y: 50, speed: 0.5, scale: 1.4 },
            { x: 740, y: 95, speed: 0.3, scale: 1.0 }
        ];
    }

    resize(width, height) {
        if (!width || !height) return;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    start() {
        this.state = 'ready';
        this.running = true;
        this.score = 0;
        this.collectedCoins = 0;
        this.frameCount = 0;
        this.pipeSpawnTimer = 0;
        this.groundOffset = 0;

        const centerY = (this.canvas.height - this.groundHeight) / 2;
        this.duck.y = centerY;
        this.duck.vy = 0;
        this.duck.rotation = 0;
        this.duck.wingFrame = 0;

        this.pipes = [];
        this.coins = [];
        this.particles = [];

        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', this.handleKeyDown);
        }
        if (this.canvas && this.canvas.removeEventListener) {
            this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
        }

        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', this.handleKeyDown);
        }
        if (this.canvas && this.canvas.addEventListener) {
            this.canvas.addEventListener('pointerdown', this.handlePointerDown);
        }

        if (this.animationId && typeof cancelAnimationFrame !== 'undefined') {
            cancelAnimationFrame(this.animationId);
        }
        this.loop();
    }

    restart() {
        this.start();
    }

    stop() {
        this.running = false;
        if (this.animationId && typeof cancelAnimationFrame !== 'undefined') {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', this.handleKeyDown);
        }
        if (this.canvas && this.canvas.removeEventListener) {
            this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
        }
    }

    handleAction() {
        if (this.state === 'ready') {
            this.state = 'playing';
            this.flap();
        } else if (this.state === 'playing') {
            this.flap();
        } else if (this.state === 'gameover') {
            // Restart after brief debounce
            if (this.gameOverTimer > 25) {
                this.start();
            }
        }
    }

    flap() {
        if (!this.running || this.state !== 'playing') return;
        this.duck.vy = this.duck.jumpStrength;

        // Wing flap burst
        this.duck.wingFrame = 1;

        if (typeof window !== 'undefined' && window.sound && typeof window.sound.jump === 'function') {
            window.sound.jump();
        }

        // Small feather/dust puff
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: this.duck.x + 2,
                y: this.duck.y + 18,
                vx: -Math.random() * 2 - 0.5,
                vy: (Math.random() - 0.5) * 1.5,
                radius: Math.random() * 2.5 + 1.5,
                color: '#ffffff',
                alpha: 0.8,
                life: 14
            });
        }
    }

    handleKeyDown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            e.preventDefault();
            this.handleAction();
        }
    }

    handlePointerDown(e) {
        e.preventDefault();
        this.handleAction();
    }

    spawnPipe() {
        const gap = 135;
        const availableHeight = this.canvas.height - this.groundHeight;
        const minHeight = 60;
        const maxHeight = availableHeight - gap - minHeight;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;

        this.pipes.push({
            x: this.canvas.width + 10,
            topHeight: topHeight,
            bottomY: topHeight + gap,
            width: 62,
            passed: false
        });

        // 60% chance to spawn gold coin in the gap
        if (Math.random() > 0.4) {
            this.coins.push({
                x: this.canvas.width + 41,
                y: topHeight + gap / 2,
                radius: 11,
                spin: Math.random() * Math.PI,
                collected: false
            });
        }
    }

    update() {
        this.frameCount++;

        // Update clouds (even in ready state)
        for (const cloud of this.clouds) {
            cloud.x -= cloud.speed;
            if (cloud.x + 100 * cloud.scale < 0) {
                cloud.x = this.canvas.width + 40;
                cloud.y = Math.random() * (this.canvas.height * 0.4) + 20;
            }
        }

        if (this.state === 'ready') {
            // Gentle hovering animation
            this.duck.y = (this.canvas.height - this.groundHeight) / 2 + Math.sin(this.frameCount * 0.08) * 7;
            this.duck.rotation = 0;
            this.animateWings(0.12);
            this.groundOffset = (this.groundOffset + this.speed) % 24;
            return;
        }

        if (this.state === 'gameover') {
            this.gameOverTimer = (this.gameOverTimer || 0) + 1;
            // Fall to ground if in air
            if (this.duck.y + this.duck.height < this.canvas.height - this.groundHeight) {
                this.duck.vy += this.duck.gravity * 1.2;
                this.duck.y += this.duck.vy;
                this.duck.rotation = Math.PI / 2; // face plant down
            }
            this.updateParticles();
            return;
        }

        // Active playing state
        this.groundOffset = (this.groundOffset + this.speed) % 24;

        // Duck physics
        this.duck.vy = Math.min(this.duck.vy + this.duck.gravity, this.duck.maxFallSpeed);
        this.duck.y += this.duck.vy;

        // Smooth rotation: tilt up when rising, tilt down when falling
        if (this.duck.vy < 0) {
            this.duck.rotation = Math.max(-0.4, this.duck.vy * 0.06);
            this.animateWings(0.25);
        } else {
            this.duck.rotation = Math.min(1.2, this.duck.rotation + 0.045);
            this.animateWings(0.08);
        }

        // Pipe spawning
        this.pipeSpawnTimer++;
        if (this.pipeSpawnTimer >= this.pipeInterval) {
            this.pipeSpawnTimer = 0;
            this.spawnPipe();
        }

        // Update pipes & collisions
        const duckPadding = 4;
        const duckBox = {
            left: this.duck.x + duckPadding,
            right: this.duck.x + this.duck.width - duckPadding,
            top: this.duck.y + duckPadding,
            bottom: this.duck.y + this.duck.height - duckPadding
        };

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const p = this.pipes[i];
            p.x -= this.speed;

            // Score point
            if (!p.passed && p.x + p.width < this.duck.x) {
                p.passed = true;
                this.score++;
                if (this.score > this.bestScore) {
                    this.bestScore = this.score;
                    try {
                        if (typeof localStorage !== 'undefined') {
                            localStorage.setItem('duckverse_flappy_best', this.bestScore.toString());
                        }
                    } catch (e) {}
                }
                if (typeof window !== 'undefined' && window.sound && typeof window.sound.quack === 'function') {
                    window.sound.quack();
                }
            }

            // Pipe collision
            const inPipeX = duckBox.right > p.x && duckBox.left < p.x + p.width;
            const hitTop = duckBox.top < p.topHeight;
            const hitBottom = duckBox.bottom > p.bottomY;

            if (inPipeX && (hitTop || hitBottom)) {
                this.triggerGameOver();
                return;
            }

            if (p.x + p.width < -20) {
                this.pipes.splice(i, 1);
            }
        }

        // Update coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const c = this.coins[i];
            c.x -= this.speed;
            c.spin += 0.08;

            const duckCenterX = this.duck.x + this.duck.width / 2;
            const duckCenterY = this.duck.y + this.duck.height / 2;
            const dist = Math.hypot(duckCenterX - c.x, duckCenterY - c.y);

            if (dist < c.radius + 16) {
                c.collected = true;
                this.collectedCoins++;
                if (typeof window !== 'undefined' && window.sound && typeof window.sound.coin === 'function') {
                    window.sound.coin();
                }
                if (this.onAddCoins) {
                    this.onAddCoins(1);
                }

                // Golden sparkle particles
                for (let j = 0; j < 8; j++) {
                    const angle = (Math.PI * 2 * j) / 8;
                    this.particles.push({
                        x: c.x,
                        y: c.y,
                        vx: Math.cos(angle) * (Math.random() * 2 + 1.5),
                        vy: Math.sin(angle) * (Math.random() * 2 + 1.5),
                        radius: 2.5,
                        color: '#fcd000',
                        alpha: 1,
                        life: 20
                    });
                }

                this.coins.splice(i, 1);
                continue;
            }

            if (c.x < -30) {
                this.coins.splice(i, 1);
            }
        }

        // Boundary collision (ground or ceiling)
        const groundY = this.canvas.height - this.groundHeight;
        if (this.duck.y + this.duck.height >= groundY) {
            this.duck.y = groundY - this.duck.height;
            this.triggerGameOver();
            return;
        }

        if (this.duck.y < 0) {
            this.duck.y = 0;
            this.duck.vy = 0;
        }

        this.updateParticles();
    }

    animateWings(speed) {
        this.duck.wingFrame += speed * this.duck.wingDirection;
        if (this.duck.wingFrame > 1) {
            this.duck.wingFrame = 1;
            this.duck.wingDirection = -1;
        } else if (this.duck.wingFrame < -0.8) {
            this.duck.wingFrame = -0.8;
            this.duck.wingDirection = 1;
        }
    }

    updateParticles() {
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

    triggerGameOver() {
        this.state = 'gameover';
        this.gameOverTimer = 0;

        if (typeof window !== 'undefined' && window.sound && typeof window.sound.explosion === 'function') {
            window.sound.explosion();
        }

        // Collision stars / feathers
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x: this.duck.x + this.duck.width / 2,
                y: this.duck.y + this.duck.height / 2,
                vx: Math.cos(angle) * (Math.random() * 4 + 1),
                vy: Math.sin(angle) * (Math.random() * 4 + 1),
                radius: Math.random() * 3 + 2,
                color: ['#fcd000', '#ff6f00', '#ffffff'][i % 3],
                alpha: 1,
                life: 25
            });
        }

        if (this.onGameOver) {
            this.onGameOver({
                score: this.score,
                coins: this.collectedCoins,
                bestScore: this.bestScore
            });
        }
    }

    // --- DRAWING METHODS (Classic Cartoon / Retro Style) ---

    drawBackground() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Classic retro day sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height - this.groundHeight);
        skyGradient.addColorStop(0, '#4ec0ca');
        skyGradient.addColorStop(0.7, '#78d5df');
        skyGradient.addColorStop(1, '#a3e8ef');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);

        // Distant hills / city skyline silhouette
        ctx.fillStyle = '#65bd82';
        ctx.beginPath();
        ctx.moveTo(0, height - this.groundHeight);
        for (let x = 0; x <= width; x += 120) {
            ctx.quadraticCurveTo(x + 60, height - this.groundHeight - 25, x + 120, height - this.groundHeight);
        }
        ctx.lineTo(width, height - this.groundHeight);
        ctx.closePath();
        ctx.fill();

        // Fluffy cartoon clouds
        for (const c of this.clouds) {
            this.drawCloud(c.x, c.y, c.scale);
        }
    }

    drawCloud(x, y, scale) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(20, 20, 18, 0, Math.PI * 2);
        ctx.arc(42, 12, 22, 0, Math.PI * 2);
        ctx.arc(68, 18, 17, 0, Math.PI * 2);
        ctx.arc(52, 26, 16, 0, Math.PI * 2);
        ctx.arc(28, 26, 15, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawGround() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const groundY = height - this.groundHeight;

        // Grass strip on top of ground
        ctx.fillStyle = '#73bf2e';
        ctx.fillRect(0, groundY, width, 14);

        // Dark grass border
        ctx.fillStyle = '#558022';
        ctx.fillRect(0, groundY + 12, width, 3);

        // Dirt/Sand layer
        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, groundY + 15, width, this.groundHeight - 15);

        // Moving diagonal stripes for ground texture
        ctx.fillStyle = '#d0c878';
        const stripeWidth = 14;
        const totalStripes = Math.ceil(width / stripeWidth) + 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, groundY + 15, width, this.groundHeight - 15);
        ctx.clip();
        for (let i = -2; i < totalStripes; i++) {
            const sx = i * stripeWidth - this.groundOffset;
            ctx.beginPath();
            ctx.moveTo(sx, groundY + 15);
            ctx.lineTo(sx + 8, groundY + 15);
            ctx.lineTo(sx + 2, height);
            ctx.lineTo(sx - 6, height);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Very top crisp outline
        ctx.fillStyle = '#2c4211';
        ctx.fillRect(0, groundY, width, 2);
    }

    drawPipe(pipe) {
        const ctx = this.ctx;
        const { x, topHeight, bottomY, width } = pipe;
        const collarHeight = 26;
        const collarOverhang = 4;
        const groundY = this.canvas.height - this.groundHeight;

        // Palette for classic green pipe
        const borderCol = '#2c4211';
        const baseGreen = '#73bf2e';
        const lightGreen = '#8be039';
        const darkGreen = '#558022';
        const specularGreen = '#b4f05c';

        // 1. TOP PIPE BODY
        if (topHeight - collarHeight > 0) {
            const bodyH = topHeight - collarHeight;
            this.drawPipeSection(x, 0, width, bodyH, baseGreen, lightGreen, darkGreen, specularGreen, borderCol);
        }

        // 2. TOP PIPE COLLAR
        this.drawPipeSection(
            x - collarOverhang,
            topHeight - collarHeight,
            width + collarOverhang * 2,
            collarHeight,
            baseGreen,
            lightGreen,
            darkGreen,
            specularGreen,
            borderCol
        );

        // 3. BOTTOM PIPE COLLAR
        this.drawPipeSection(
            x - collarOverhang,
            bottomY,
            width + collarOverhang * 2,
            collarHeight,
            baseGreen,
            lightGreen,
            darkGreen,
            specularGreen,
            borderCol
        );

        // 4. BOTTOM PIPE BODY
        const bottomBodyH = groundY - (bottomY + collarHeight);
        if (bottomBodyH > 0) {
            this.drawPipeSection(
                x,
                bottomY + collarHeight,
                width,
                bottomBodyH,
                baseGreen,
                lightGreen,
                darkGreen,
                specularGreen,
                borderCol
            );
        }
    }

    drawPipeSection(x, y, w, h, base, light, dark, specular, border) {
        const ctx = this.ctx;
        ctx.save();

        // Base color fill
        ctx.fillStyle = base;
        ctx.fillRect(x, y, w, h);

        // Highlight stripe (left side)
        ctx.fillStyle = light;
        ctx.fillRect(x + 5, y, 9, h);

        // Specular super-highlight line
        ctx.fillStyle = specular;
        ctx.fillRect(x + 7, y, 3, h);

        // Shadow strip (right side)
        ctx.fillStyle = dark;
        ctx.fillRect(x + w - 10, y, 10, h);

        // Crisp retro border
        ctx.strokeStyle = border;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);

        ctx.restore();
    }

    drawCoin(coin) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(coin.x, coin.y);

        // 3D spinning effect via horizontal scale
        const scaleX = Math.cos(coin.spin);
        ctx.scale(Math.abs(scaleX) < 0.15 ? 0.15 : scaleX, 1);

        // Outer coin rim
        ctx.fillStyle = '#e6a100';
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner coin face
        ctx.fillStyle = '#fcd000';
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius - 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Star / shine emboss
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 1);

        // Retro outline
        ctx.strokeStyle = '#7c5200';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    drawDuck(x, y, rotation) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x + this.duck.width / 2, y + this.duck.height / 2);
        ctx.rotate(rotation);

        const borderCol = '#804e00';

        // Little Tail
        ctx.fillStyle = '#fcd000';
        ctx.beginPath();
        ctx.moveTo(-16, -1);
        ctx.lineTo(-24, -7);
        ctx.lineTo(-18, 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Duck Body (Chubby Cute Yellow Duck)
        ctx.fillStyle = '#fcd000';
        ctx.beginPath();
        ctx.ellipse(-1, 2, 17, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Softer belly shading
        ctx.fillStyle = '#ffe96a';
        ctx.beginPath();
        ctx.ellipse(-2, 5, 12, 8, -0.1, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#fcd000';
        ctx.beginPath();
        ctx.arc(10, -5, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cute Big Cartoon Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(13, -7, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Eye Pupil
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(15, -7, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pupil Glint / Highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(14, -8, 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Orange Beak
        ctx.fillStyle = '#f75314';
        ctx.beginPath();
        ctx.moveTo(17, -4);
        ctx.quadraticCurveTo(27, -4, 29, -1);
        ctx.quadraticCurveTo(25, 5, 16, 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#7c2500';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Animated Wing
        const wingYOffset = this.duck.wingFrame * 5;
        const wingRot = this.duck.wingFrame * 0.35;
        ctx.save();
        ctx.translate(-5, 2);
        ctx.rotate(wingRot);
        ctx.fillStyle = '#f0b800';
        ctx.beginPath();
        ctx.ellipse(0, wingYOffset, 10, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Cheerful Cheek Blush
        ctx.fillStyle = 'rgba(255, 120, 70, 0.4)';
        ctx.beginPath();
        ctx.arc(8, 1, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawScore() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;

        // Big Classic Retro Score Number
        ctx.save();
        ctx.font = '900 42px "Impact", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Black stroke / drop shadow
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'miter';
        ctx.strokeText(this.score.toString(), centerX, 24);

        // Crisp White fill
        ctx.fillStyle = '#ffffff';
        ctx.fillText(this.score.toString(), centerX, 24);

        // Coin counter in top-left
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(`🪙 ${this.collectedCoins}`, 20, 30);
        ctx.fillText(`🪙 ${this.collectedCoins}`, 20, 30);

        ctx.restore();
    }

    drawReadyScreen() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        ctx.save();
        ctx.textAlign = 'center';

        // Title
        ctx.font = '900 36px "Impact", "Arial Black", sans-serif';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.strokeText('FLAPPY DUCK', centerX, centerY - 80);
        ctx.fillStyle = '#fcd000';
        ctx.fillText('FLAPPY DUCK', centerX, centerY - 80);

        // Instructions banner
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        ctx.strokeText('НАТИСНІТЬ ПРОБІЛ АБО КЛІКНІТЬ', centerX, centerY + 65);
        ctx.fillText('НАТИСНІТЬ ПРОБІЛ АБО КЛІКНІТЬ', centerX, centerY + 65);

        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.strokeText('Щоб махати крилами та летіти', centerX, centerY + 90);
        ctx.fillText('Щоб махати крилами та летіти', centerX, centerY + 90);

        // Best score preview
        if (this.bestScore > 0) {
            ctx.font = 'bold 13px "Segoe UI", sans-serif';
            ctx.fillStyle = '#ffe600';
            ctx.strokeText(`РЕКОРД: ${this.bestScore}`, centerX, centerY + 120);
            ctx.fillText(`РЕКОРД: ${this.bestScore}`, centerX, centerY + 120);
        }

        ctx.restore();
    }

    drawGameOverScreen() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        ctx.save();

        // Game Over Banner
        ctx.textAlign = 'center';
        ctx.font = '900 38px "Impact", "Arial Black", sans-serif';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.strokeText('ГРА ЗАКІНЧЕНА', centerX, centerY - 95);
        ctx.fillStyle = '#f75314';
        ctx.fillText('ГРА ЗАКІНЧЕНА', centerX, centerY - 95);

        // Score Card Board
        const boardW = 260;
        const boardH = 130;
        const boardX = centerX - boardW / 2;
        const boardY = centerY - 60;

        // Card background
        ctx.fillStyle = '#ded895';
        ctx.fillRect(boardX, boardY, boardW, boardH);
        ctx.strokeStyle = '#558022';
        ctx.lineWidth = 4;
        ctx.strokeRect(boardX, boardY, boardW, boardH);

        // Card inner border
        ctx.strokeStyle = '#2c4211';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(boardX + 4, boardY + 4, boardW - 8, boardH - 8);

        // Card Labels & Values
        ctx.textAlign = 'left';
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillStyle = '#804e00';
        ctx.fillText('РАХУНОК:', boardX + 22, boardY + 38);
        ctx.fillText('РЕКОРД:', boardX + 22, boardY + 74);
        ctx.fillText('МОНЕТИ:', boardX + 22, boardY + 106);

        ctx.textAlign = 'right';
        ctx.font = '900 22px "Impact", sans-serif';
        ctx.fillStyle = '#111111';
        ctx.fillText(this.score.toString(), boardX + boardW - 24, boardY + 38);
        ctx.fillText(this.bestScore.toString(), boardX + boardW - 24, boardY + 74);
        ctx.fillStyle = '#d49b00';
        ctx.fillText(`+${this.collectedCoins} 🪙`, boardX + boardW - 24, boardY + 106);

        // Restart prompt
        ctx.textAlign = 'center';
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('НАТИСНІТЬ ДЛЯ РЕСТАРТУ', centerX, centerY + 105);
        ctx.fillText('НАТИСНІТЬ ДЛЯ РЕСТАРТУ', centerX, centerY + 105);

        ctx.restore();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Sky & Clouds
        this.drawBackground();

        // 2. Pipes
        for (const pipe of this.pipes) {
            this.drawPipe(pipe);
        }

        // 3. Coins
        for (const coin of this.coins) {
            this.drawCoin(coin);
        }

        // 4. Ground
        this.drawGround();

        // 5. Particles
        for (const p of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // 6. Duck
        this.drawDuck(this.duck.x, this.duck.y, this.duck.rotation);

        // 7. Overlays & HUD
        if (this.state === 'ready') {
            this.drawReadyScreen();
        } else if (this.state === 'playing') {
            this.drawScore();
        } else if (this.state === 'gameover') {
            this.drawGameOverScreen();
        }
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    }
}

// Global browser window attachment
if (typeof window !== 'undefined') {
    window.FlappyDuckGame = FlappyDuckGame;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlappyDuckGame;
}
