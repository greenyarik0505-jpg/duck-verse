class GeometryDashGame {
    constructor(canvas, onGameOver, onVictory, onAddCoins) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onGameOver = onGameOver;
        this.onVictory = onVictory;
        this.onAddCoins = onAddCoins;
        this.animationId = null;
        this.running = false;

        this.attempts = parseInt(localStorage.getItem('duckverse_gd_attempts') || '1', 10);
        this.bestPercent = parseInt(localStorage.getItem('duckverse_gd_best') || '0', 10);

        this.cubeSize = 36;
        this.floorY = canvas.height - 70;
        this.gravity = 0.95;
        this.jumpForce = -13.5;
        this.speed = 5.2;

        this.player = {
            x: 90,
            y: this.floorY - this.cubeSize,
            vy: 0,
            rotation: 0,
            grounded: true,
            trail: []
        };

        this.cameraX = 0;
        this.particles = [];
        this.holdingJump = false;
        this.levelLength = 17280; // Full 1-minute track (~55s at 60 FPS, 130 BPM synced)

        // Music synth loop properties
        this.musicTimer = null;
        this.musicBeat = 0;

        this.initLevel();

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
    }

    initLevel() {
        // Level elements: blocks, spikes, pads, orbs, coins
        const f = this.floorY;
        const b = this.cubeSize;

        this.level = [
            // ==========================================
            // PART 1: 0% - 25% (Intro & Cyber Warmup)
            // ==========================================
            { type: 'spike', x: 450, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 750, y: f - 34, w: 32, h: 34 },

            // Small block hop
            { type: 'block', x: 1050, y: f - b, w: b, h: b },
            { type: 'spike', x: 1086, y: f - 34, w: 32, h: 34 },

            // Double block
            { type: 'block', x: 1350, y: f - b, w: b * 2, h: b },
            { type: 'spike', x: 1350 + b * 2 + 12, y: f - 34, w: 32, h: 34 },

            // Jump pad launch to high runway + Secret Coin 1 (x: 1850)
            { type: 'pad', x: 1620, y: f - 10, w: 36, h: 10 },
            { type: 'spike', x: 1700, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 1732, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 1800, y: f - b * 2, w: b * 3, h: b },
            { type: 'coin', x: 1850, y: f - b * 3 - 25, r: 12, collected: false },

            // Drop down & single spike
            { type: 'spike', x: 2150, y: f - 34, w: 32, h: 34 },

            // Yellow Jump Orb over spikes
            { type: 'spike', x: 2450, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 2482, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 2466, y: f - 90, r: 18, used: false },

            // Block stairs (ascending)
            { type: 'block', x: 2750, y: f - b, w: b, h: b },
            { type: 'block', x: 2786, y: f - b * 2, w: b, h: b * 2 },
            { type: 'block', x: 2822, y: f - b * 3, w: b, h: b * 3 },
            { type: 'spike', x: 2950, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 2982, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 3100, y: f - b * 2, w: b * 2, h: b },

            // Double Orb sequence
            { type: 'spike', x: 3450, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 3482, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 3466, y: f - 85, r: 18, used: false },
            { type: 'spike', x: 3750, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 3766, y: f - 80, r: 18, used: false },
            { type: 'block', x: 3900, y: f - b, w: b * 3, h: b },

            // ==========================================
            // PART 2: 25% - 50% (Neon Elevation & Beat Drop)
            // ==========================================
            { type: 'spike', x: 4320, y: f - 34, w: 32, h: 34 },
            { type: 'pad', x: 4500, y: f - 10, w: 36, h: 10 },
            { type: 'block', x: 4620, y: f - b * 3, w: b * 3, h: b },
            { type: 'spike', x: 4850, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 4882, y: f - 34, w: 32, h: 34 },

            // Rhythmic floating platforms
            { type: 'block', x: 5180, y: f - b, w: b * 2, h: b },
            { type: 'spike', x: 5320, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 5450, y: f - b * 2, w: b * 2, h: b },
            { type: 'spike', x: 5600, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 5750, y: f - b, w: b * 2, h: b },

            // Triple spike challenge 1
            { type: 'spike', x: 6150, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 6182, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 6214, y: f - 34, w: 32, h: 34 },

            // Pad launch over pit of spikes to high ledge
            { type: 'pad', x: 6480, y: f - 10, w: 36, h: 10 },
            { type: 'spike', x: 6580, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 6612, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 6644, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 6720, y: f - b * 3, w: b * 4, h: b },

            // High-altitude orb jump
            { type: 'spike', x: 7100, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 7116, y: f - 100, r: 18, used: false },
            { type: 'block', x: 7250, y: f - b * 2, w: b * 3, h: b },
            { type: 'spike', x: 7500, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 7532, y: f - 34, w: 32, h: 34 },

            // Syncopated hops
            { type: 'block', x: 7800, y: f - b, w: b, h: b },
            { type: 'spike', x: 7950, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 8100, y: f - b, w: b, h: b },
            { type: 'spike', x: 8250, y: f - 34, w: 32, h: 34 },
            { type: 'pad', x: 8400, y: f - 10, w: 36, h: 10 },
            { type: 'block', x: 8520, y: f - b * 2, w: b * 3, h: b },

            // ==========================================
            // PART 3: 50% - 75% (Synth Pulse & Secret Coin 2)
            // ==========================================
            { type: 'spike', x: 8900, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 9150, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 9182, y: f - 34, w: 32, h: 34 },

            // Orb jump to Secret Coin 2 (x: 9600)
            { type: 'pad', x: 9400, y: f - 10, w: 36, h: 10 },
            { type: 'orb', x: 9550, y: f - 120, r: 18, used: false },
            { type: 'coin', x: 9600, y: f - b * 4 - 15, r: 12, collected: false },
            { type: 'block', x: 9650, y: f - b * 3, w: b * 3, h: b },
            { type: 'spike', x: 9900, y: f - 34, w: 32, h: 34 },

            // Stairway descent & fast rhythm
            { type: 'block', x: 10150, y: f - b * 3, w: b, h: b * 3 },
            { type: 'block', x: 10186, y: f - b * 2, w: b, h: b * 2 },
            { type: 'block', x: 10222, y: f - b, w: b, h: b },
            { type: 'spike', x: 10400, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 10432, y: f - 34, w: 32, h: 34 },

            // Dual jump orbs chain
            { type: 'spike', x: 10750, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 10782, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 10766, y: f - 85, r: 18, used: false },
            { type: 'spike', x: 11050, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 11082, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 11066, y: f - 85, r: 18, used: false },
            { type: 'block', x: 11200, y: f - b, w: b * 3, h: b },

            // Triple spike challenge 2
            { type: 'spike', x: 11600, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 11632, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 11664, y: f - 34, w: 32, h: 34 },

            // High platform jump
            { type: 'pad', x: 11950, y: f - 10, w: 36, h: 10 },
            { type: 'block', x: 12100, y: f - b * 2, w: b * 4, h: b },
            { type: 'spike', x: 12400, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 12650, y: f - 34, w: 32, h: 34 },

            // ==========================================
            // PART 4: 75% - 100% (Final Climax & Secret Coin 3)
            // ==========================================
            { type: 'block', x: 12900, y: f - b, w: b * 2, h: b },
            { type: 'spike', x: 13050, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 13200, y: f - b * 2, w: b * 2, h: b },
            { type: 'spike', x: 13350, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 13500, y: f - b * 3, w: b * 3, h: b },

            // Rapid Pad launch sequence
            { type: 'pad', x: 13850, y: f - 10, w: 36, h: 10 },
            { type: 'spike', x: 13950, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 13982, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 14100, y: f - b * 2, w: b * 3, h: b },

            // High air orbs & Secret Coin 3 (x: 14750)
            { type: 'spike', x: 14450, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 14482, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 14466, y: f - 90, r: 18, used: false },
            { type: 'pad', x: 14650, y: f - 10, w: 36, h: 10 },
            { type: 'coin', x: 14750, y: f - b * 4 - 20, r: 12, collected: false },
            { type: 'block', x: 14850, y: f - b * 3, w: b * 4, h: b },

            // Final gauntlet of spikes
            { type: 'spike', x: 15300, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 15550, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 15582, y: f - 34, w: 32, h: 34 },

            // Triple Spike climax
            { type: 'spike', x: 15900, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 15932, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 15964, y: f - 34, w: 32, h: 34 },

            // Final leap to Victory Gate
            { type: 'pad', x: 16300, y: f - 10, w: 36, h: 10 },
            { type: 'block', x: 16450, y: f - b * 2, w: b * 5, h: b },
            { type: 'spike', x: 16800, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 16832, y: f - 34, w: 32, h: 34 }
        ];
    }

    start() {
        this.running = true;
        this.cameraX = 0;
        this.particles = [];
        this.player.x = 90;
        this.player.y = this.floorY - this.cubeSize;
        this.player.vy = 0;
        this.player.rotation = 0;
        this.player.grounded = true;
        this.player.trail = [];
        this.initLevel();

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        this.canvas.addEventListener('pointerdown', this.handlePointerDown);
        window.addEventListener('pointerup', this.handlePointerUp);

        this.startMusic();
        this.loop();
    }

    stop() {
        this.running = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.stopMusic();

        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
        window.removeEventListener('pointerup', this.handlePointerUp);
    }

    startMusic() {
        this.stopMusic();
        if (!window.sound || window.sound.muted) return;
        window.sound.init();
        if (!window.sound.ctx) return;

        // Dynamic 130 BPM electronic baseline synthesizer
        const bpm = 132;
        const interval = (60 / bpm) * 1000 / 2; // eighth notes
        const bassNotes = [110, 110, 130.81, 110, 146.83, 130.81, 110, 164.81]; // A2 bassline
        this.musicBeat = 0;

        this.musicTimer = setInterval(() => {
            if (!this.running || !window.sound || window.sound.muted || !window.sound.ctx) return;
            const ctx = window.sound.ctx;
            const now = ctx.currentTime;
            const freq = bassNotes[this.musicBeat % bassNotes.length];

            // Bass synth
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, now);
            filter.frequency.exponentialRampToValueAtTime(150, now + 0.18);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.2);

            // Snare / Hihat on alternate beats
            if (this.musicBeat % 2 === 1) {
                const noise = ctx.createBufferSource();
                const bufferSize = ctx.sampleRate * 0.05;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                noise.buffer = buffer;

                const ngain = ctx.createGain();
                ngain.gain.setValueAtTime(0.08, now);
                ngain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

                const nfilter = ctx.createBiquadFilter();
                nfilter.type = 'highpass';
                nfilter.frequency.setValueAtTime(4000, now);

                noise.connect(nfilter);
                nfilter.connect(ngain);
                ngain.connect(ctx.destination);

                noise.start(now);
            }

            this.musicBeat++;
        }, interval);
    }

    stopMusic() {
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    }

    handleKeyDown(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            e.preventDefault();
            this.holdingJump = true;
            this.tryJump();
        }
    }

    handleKeyUp(e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            this.holdingJump = false;
        }
    }

    handlePointerDown(e) {
        e.preventDefault();
        this.holdingJump = true;
        this.tryJump();
    }

    handlePointerUp() {
        this.holdingJump = false;
    }

    tryJump() {
        if (!this.running) return;

        // Check if inside jump orb
        for (let item of this.level) {
            if (item.type === 'orb' && !item.used) {
                const px = this.player.x + this.cubeSize / 2;
                const py = this.player.y + this.cubeSize / 2;
                const dist = Math.hypot(px - item.x, py - item.y);
                if (dist < item.r + 24) {
                    item.used = true;
                    this.player.vy = this.jumpForce * 1.1;
                    this.player.grounded = false;
                    if (window.sound) window.sound.jump();

                    // Orb ring explosion
                    for (let i = 0; i < 10; i++) {
                        this.particles.push({
                            x: item.x,
                            y: item.y,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            radius: 3,
                            color: '#ffe600',
                            alpha: 1,
                            life: 20
                        });
                    }
                    return;
                }
            }
        }

        // Standard ground / block jump
        if (this.player.grounded) {
            this.player.vy = this.jumpForce;
            this.player.grounded = false;
            if (window.sound) window.sound.jump();

            // Jump dust particles
            for (let i = 0; i < 6; i++) {
                this.particles.push({
                    x: this.player.x + Math.random() * this.cubeSize,
                    y: this.player.y + this.cubeSize,
                    vx: -Math.random() * 3 - 1,
                    vy: -Math.random() * 2,
                    radius: 3,
                    color: '#00f3ff',
                    alpha: 1,
                    life: 15
                });
            }
        }
    }

    update() {
        // Move player forward
        this.player.x += this.speed;
        this.cameraX = this.player.x - 140;

        // Auto jump if holding key and grounded
        if (this.holdingJump && this.player.grounded) {
            this.tryJump();
        }

        // Apply gravity
        this.player.vy += this.gravity;
        this.player.y += this.player.vy;

        // Rotation in air (smooth 90 degrees rotation per standard jump)
        if (!this.player.grounded) {
            const rotSpeed = (Math.PI / 2) / (Math.abs(this.jumpForce) * 2 / this.gravity);
            this.player.rotation += rotSpeed;
        } else {
            // Fix angle to nearest 90 degrees on floor / platform
            const snap = Math.round(this.player.rotation / (Math.PI / 2)) * (Math.PI / 2);
            if (Math.abs(snap - this.player.rotation) < 0.02) {
                this.player.rotation = snap;
            } else {
                this.player.rotation += (snap - this.player.rotation) * 0.45;
            }
        }

        // Record trail
        if (this.running) {
            this.player.trail.unshift({
                x: this.player.x,
                y: this.player.y,
                rotation: this.player.rotation,
                alpha: 0.6
            });
            if (this.player.trail.length > 8) this.player.trail.pop();
        }

        // Floor collision
        let onPlatform = false;
        if (this.player.y + this.cubeSize >= this.floorY) {
            this.player.y = this.floorY - this.cubeSize;
            this.player.vy = 0;
            this.player.grounded = true;
            onPlatform = true;
        }

        // Check objects
        const pBox = {
            l: this.player.x + 3,
            r: this.player.x + this.cubeSize - 3,
            t: this.player.y + 3,
            b: this.player.y + this.cubeSize
        };

        for (let item of this.level) {
            // Only check objects near player
            if (item.x < this.player.x - 100 || item.x > this.player.x + 200) continue;

            if (item.type === 'spike') {
                // Triangle spike hitbox
                const spikeL = item.x + 6;
                const spikeR = item.x + item.w - 6;
                const spikeT = item.y + 8;
                const spikeB = item.y + item.h;

                if (pBox.r > spikeL && pBox.l < spikeR && pBox.b > spikeT && pBox.t < spikeB) {
                    this.die();
                    return;
                }
            } else if (item.type === 'block') {
                const bL = item.x;
                const bR = item.x + item.w;
                const bT = item.y;
                const bB = item.y + item.h;

                const overlapX = pBox.r > bL && pBox.l < bR;
                if (overlapX) {
                    // Landing on top
                    const prevY = this.player.y - this.player.vy;
                    if (prevY + this.cubeSize <= bT + 12 && this.player.vy >= 0) {
                        this.player.y = bT - this.cubeSize;
                        this.player.vy = 0;
                        this.player.grounded = true;
                        onPlatform = true;
                    } else if (pBox.b > bT + 8 && pBox.t < bB) {
                        // Crash into side/bottom of block
                        this.die();
                        return;
                    }
                }
            } else if (item.type === 'pad') {
                const padL = item.x;
                const padR = item.x + item.w;
                const padT = item.y;
                if (pBox.r > padL && pBox.l < padR && pBox.b >= padT && pBox.t < padT + item.h) {
                    // Super launch!
                    this.player.vy = this.jumpForce * 1.35;
                    this.player.grounded = false;
                    if (window.sound) window.sound.jump();

                    // Pad particles
                    for (let i = 0; i < 8; i++) {
                        this.particles.push({
                            x: item.x + item.w / 2,
                            y: item.y,
                            vx: (Math.random() - 0.5) * 4,
                            vy: -Math.random() * 5 - 2,
                            radius: 3,
                            color: '#ffe600',
                            alpha: 1,
                            life: 15
                        });
                    }
                }
            } else if (item.type === 'coin' && !item.collected) {
                const px = this.player.x + this.cubeSize / 2;
                const py = this.player.y + this.cubeSize / 2;
                if (Math.hypot(px - item.x, py - item.y) < item.r + this.cubeSize / 2) {
                    item.collected = true;
                    if (window.sound) window.sound.coin();
                    if (this.onAddCoins) this.onAddCoins(10); // GD secret coins reward 10 coins!
                    for (let i = 0; i < 12; i++) {
                        this.particles.push({
                            x: item.x,
                            y: item.y,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            radius: 4,
                            color: '#ffe600',
                            alpha: 1,
                            life: 25
                        });
                    }
                }
            }
        }

        if (!onPlatform && this.player.y + this.cubeSize < this.floorY) {
            this.player.grounded = false;
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 1 / p.life;
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }

        // Victory check
        if (this.player.x >= this.levelLength) {
            this.victory();
        }
    }

    die() {
        this.running = false;
        this.stopMusic();
        if (window.sound) window.sound.explosion();

        // Shatter cube particles
        for (let i = 0; i < 24; i++) {
            this.particles.push({
                x: this.player.x + this.cubeSize / 2,
                y: this.player.y + this.cubeSize / 2,
                vx: (Math.random() - 0.5) * 9,
                vy: (Math.random() - 0.5) * 9,
                radius: Math.random() * 5 + 3,
                color: ['#00f3ff', '#ffe600', '#ff007f'][Math.floor(Math.random() * 3)],
                alpha: 1,
                life: 35
            });
        }

        const percent = Math.min(100, Math.floor((this.player.x / this.levelLength) * 100));
        if (percent > this.bestPercent) {
            this.bestPercent = percent;
            localStorage.setItem('duckverse_gd_best', this.bestPercent);
        }
        this.attempts++;
        localStorage.setItem('duckverse_gd_attempts', this.attempts);

        setTimeout(() => {
            if (this.onGameOver) {
                this.onGameOver({
                    percent: percent,
                    bestPercent: this.bestPercent,
                    attempts: this.attempts
                });
            }
        }, 500);
    }

    victory() {
        this.running = false;
        this.stopMusic();
        if (window.sound) window.sound.victory();

        this.bestPercent = 100;
        localStorage.setItem('duckverse_gd_best', 100);

        if (this.onVictory) {
            this.onVictory({
                percent: 100,
                attempts: this.attempts
            });
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Neon Gradient Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#040b1a');
        bgGrad.addColorStop(0.7, '#0d1b3a');
        bgGrad.addColorStop(1, '#1b0a2a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Parallax background grid / pulsating squares
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
        ctx.lineWidth = 1.5;
        const bgOffset = (this.cameraX * 0.3) % 40;
        for (let x = -bgOffset; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.floorY);
            ctx.stroke();
        }
        ctx.restore();

        // Camera translation
        ctx.save();
        ctx.translate(-this.cameraX, 0);

        // Floor Grid
        const floorGrad = ctx.createLinearGradient(0, this.floorY, 0, h);
        floorGrad.addColorStop(0, '#00f3ff');
        floorGrad.addColorStop(0.08, '#060f26');
        floorGrad.addColorStop(1, '#020612');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(this.cameraX - 100, this.floorY, w + 200, h - this.floorY);

        // Glowing Floor line
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(this.cameraX - 100, this.floorY);
        ctx.lineTo(this.cameraX + w + 100, this.floorY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Level Elements
        for (let item of this.level) {
            if (item.x < this.cameraX - 60 || item.x > this.cameraX + w + 60) continue;

            if (item.type === 'spike') {
                ctx.save();
                ctx.fillStyle = '#000000';
                ctx.strokeStyle = '#ff0055';
                ctx.lineWidth = 2.5;
                ctx.shadowColor = '#ff0055';
                ctx.shadowBlur = 10;

                ctx.beginPath();
                ctx.moveTo(item.x, item.y + item.h);
                ctx.lineTo(item.x + item.w / 2, item.y);
                ctx.lineTo(item.x + item.w, item.y + item.h);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Inner neon accent triangle
                ctx.fillStyle = '#ff0055';
                ctx.beginPath();
                ctx.moveTo(item.x + 8, item.y + item.h - 3);
                ctx.lineTo(item.x + item.w / 2, item.y + 10);
                ctx.lineTo(item.x + item.w - 8, item.y + item.h - 3);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else if (item.type === 'block') {
                ctx.save();
                ctx.fillStyle = '#0a1026';
                ctx.strokeStyle = '#00f3ff';
                ctx.lineWidth = 2.5;
                ctx.shadowColor = '#00f3ff';
                ctx.shadowBlur = 8;
                ctx.strokeRect(item.x, item.y, item.w, item.h);
                ctx.shadowBlur = 0;
                ctx.fillRect(item.x, item.y, item.w, item.h);

                // Inner block decoration
                ctx.fillStyle = 'rgba(0, 243, 255, 0.2)';
                ctx.fillRect(item.x + 4, item.y + 4, item.w - 8, item.h - 8);
                ctx.restore();
            } else if (item.type === 'pad') {
                ctx.save();
                ctx.fillStyle = '#ffe600';
                ctx.shadowColor = '#ffe600';
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.ellipse(item.x + item.w / 2, item.y + item.h / 2, item.w / 2, item.h / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (item.type === 'orb' && !item.used) {
                ctx.save();
                ctx.fillStyle = '#ffe600';
                ctx.shadowColor = '#ffe600';
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
                ctx.fill();

                // Inner pulse ring
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(item.x, item.y, item.r * 0.6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            } else if (item.type === 'coin' && !item.collected) {
                ctx.save();
                ctx.fillStyle = '#ffe600';
                ctx.shadowColor = '#ffe600';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = '#7a4e00';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('★', item.x, item.y);
                ctx.restore();
            }
        }

        // Finish Gate
        ctx.save();
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 20;
        ctx.fillRect(this.levelLength, 0, 16, this.floorY);
        ctx.restore();

        // Trail
        this.player.trail.forEach((t, i) => {
            ctx.save();
            ctx.translate(t.x + this.cubeSize / 2, t.y + this.cubeSize / 2);
            ctx.rotate(t.rotation);
            ctx.globalAlpha = (1 - i / this.player.trail.length) * 0.35;
            ctx.fillStyle = '#00f3ff';
            ctx.fillRect(-this.cubeSize / 2, -this.cubeSize / 2, this.cubeSize, this.cubeSize);
            ctx.restore();
        });

        // Player Cube (Classic Geometry Dash Icon)
        if (this.running) {
            ctx.save();
            ctx.translate(this.player.x + this.cubeSize / 2, this.player.y + this.cubeSize / 2);
            ctx.rotate(this.player.rotation);

            // Outer Neon Green/Cyan Box
            ctx.fillStyle = '#00ff99';
            ctx.shadowColor = '#00ff99';
            ctx.shadowBlur = 12;
            ctx.fillRect(-this.cubeSize / 2, -this.cubeSize / 2, this.cubeSize, this.cubeSize);
            ctx.shadowBlur = 0;

            // Black Border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeRect(-this.cubeSize / 2, -this.cubeSize / 2, this.cubeSize, this.cubeSize);

            // Inner Cyan Face Box
            ctx.fillStyle = '#00e5ff';
            ctx.fillRect(-this.cubeSize / 4, -this.cubeSize / 4, this.cubeSize / 2, this.cubeSize / 2);

            // Eyes
            ctx.fillStyle = '#000000';
            ctx.fillRect(-8, -8, 5, 5);
            ctx.fillRect(3, -8, 5, 5);

            // Smile
            ctx.fillRect(-6, 3, 12, 3);

            ctx.restore();
        }

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

        ctx.restore(); // end camera translation

        // Top UI: Progress Bar (Classic Geometry Dash!)
        const percent = Math.min(100, Math.floor((this.player.x / this.levelLength) * 100));

        // Bar container
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.roundRect(w / 2 - 160, 16, 320, 14, 7);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Bar Fill
        const barWidth = Math.max(0, (percent / 100) * 316);
        const barGrad = ctx.createLinearGradient(w / 2 - 158, 0, w / 2 - 158 + barWidth, 0);
        barGrad.addColorStop(0, '#00f3ff');
        barGrad.addColorStop(1, '#00ff99');
        ctx.fillStyle = barGrad;
        ctx.roundRect(w / 2 - 158, 18, barWidth, 10, 5);
        ctx.fill();

        // Percent Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(`${percent}%`, w / 2, 48);

        // Attempt counter
        ctx.textAlign = 'left';
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillStyle = '#00f3ff';
        ctx.fillText(`Попытка ${this.attempts}`, 20, 32);

        // Best percent
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffe600';
        ctx.fillText(`Рекорд: ${this.bestPercent}%`, w - 20, 32);
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    }
}

window.GeometryDashGame = GeometryDashGame;
