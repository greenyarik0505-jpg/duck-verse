/**
 * Duck Verse — Geometry Dash Game Engine (Класичний солід-стиль "Без неона")
 * Культовий ритм-платформер (60 FPS, Web Audio API 130 BPM, Canvas 2D)
 */

const GD_SKINS_CONFIG = {
    neon_green: {
        id: 'neon_green',
        name: 'Classic Green',
        primaryColor: '#00e676',
        secondaryColor: '#00b4d8',
        glowColor: 'transparent',
        trailColor: '#00e676',
        faceType: 'classic'
    },
    cyber_cyan: {
        id: 'cyber_cyan',
        name: 'Cyber Cyan',
        primaryColor: '#00b4d8',
        secondaryColor: '#0077b6',
        glowColor: 'transparent',
        trailColor: '#00b4d8',
        faceType: 'cyber'
    },
    magenta_fury: {
        id: 'magenta_fury',
        name: 'Magenta Fury',
        primaryColor: '#f72585',
        secondaryColor: '#7209b7',
        glowColor: 'transparent',
        trailColor: '#f72585',
        faceType: 'fury'
    },
    golden_god: {
        id: 'golden_god',
        name: 'Golden God',
        primaryColor: '#ffd000',
        secondaryColor: '#fb8500',
        glowColor: 'transparent',
        trailColor: '#ffd000',
        faceType: 'god'
    },
    stealth_void: {
        id: 'stealth_void',
        name: 'Stealth Void',
        primaryColor: '#212529',
        secondaryColor: '#e63946',
        glowColor: 'transparent',
        trailColor: '#e63946',
        faceType: 'void'
    }
};

class GeometryDashGame {
    constructor(canvas, onGameOver, onVictory, onAddCoins) {
        this.canvas = canvas;
        this.ctx = canvas ? canvas.getContext('2d') : null;
        this.onGameOver = onGameOver;
        this.onVictory = onVictory;
        this.onAddCoins = onAddCoins;
        this.animationId = null;
        this.deathTimer = null;
        this.running = false;
        this.won = false;

        // Логічна роздільна здатність світу (фізика та рівень завжди в цих координатах)
        this.baseWidth = 850;
        this.baseHeight = 480;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scaleX = 1;
        this.scaleY = 1;

        // VFX шейку та буферизація стрибків
        this.shake = 0;
        this.jumpBuffer = 0;

        let storedAttempts = '1';
        let storedBest = '0';
        try {
            const storage = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
            if (storage) {
                storedAttempts = storage.getItem('duckverse_gd_attempts') || '1';
                storedBest = storage.getItem('duckverse_gd_best') || '0';
            }
        } catch (e) {}

        this.attempts = parseInt(storedAttempts, 10) || 1;
        this.bestPercent = parseInt(storedBest, 10) || 0;

        this.cubeSize = 36;
        this.floorY = this.baseHeight - 70;
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
        this.levelLength = 17280; // Повна хвилинна траса (~55s при 60 FPS, синхронізовано з 130 BPM)

        // Властивості музичного синтезатора
        this.musicTimer = null;
        this.musicBeat = 0;

        this.initLevel();

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handleInputCancel = this.handleInputCancel.bind(this);
        this.handleResize = this.handleResize.bind(this);

        this.resize(this.baseWidth, this.baseHeight, false);
    }

    // 1. Рівномірне масштабування та збереження пропорцій без спотворення кубика
    resize(cssWidth, cssHeight, fill) {
        if (!this.canvas) return;
        const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
        const w = Math.max(1, Math.round(cssWidth || this.baseWidth));
        const h = Math.max(1, Math.round(cssHeight || this.baseHeight));
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
        if (this.canvas.style) {
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = fill ? h + 'px' : 'auto';
        }

        // Рівномірний масштаб та центрування перегляду (letterboxing)
        this.scale = Math.min(this.canvas.width / this.baseWidth, this.canvas.height / this.baseHeight);
        this.offsetX = (this.canvas.width - this.baseWidth * this.scale) / 2;
        this.offsetY = (this.canvas.height - this.baseHeight * this.scale) / 2;

        this.scaleX = this.scale;
        this.scaleY = this.scale;

        if (!this.running) this.draw();
    }

    handleResize() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        const isFullscreen = typeof document !== 'undefined' && !!document.fullscreenElement;
        if (isFullscreen && typeof window !== 'undefined') {
            this.resize(window.innerWidth, window.innerHeight, true);
        } else if (parent && parent.clientWidth > 0) {
            const w = Math.min(parent.clientWidth, this.baseWidth);
            const h = Math.round(w * (this.baseHeight / this.baseWidth));
            this.resize(w, h, false);
        } else {
            this.resize(this.baseWidth, this.baseHeight, false);
        }
    }

    initLevel() {
        // Елементи рівня: блоки, шипи, трампліни, орби, монети
        const f = this.floorY;
        const b = this.cubeSize;

        this.level = [
            // ==========================================
            // PART 1: 0% - 25% (Beats 0 - 30, x: 0 - 4320)
            // Intro & Cyber Warmup: Rhythm Basics & Single Spikes
            // ==========================================
            // Beat 3.5 (x: 504) - Single spike #1 (Warmup jump on Beat 3 at x: 432)
            { type: 'spike', x: 504, y: f - 34, w: 32, h: 34 },

            // Beat 5.5 (x: 792) - Single spike #2 (Jump on Beat 5 at x: 720)
            { type: 'spike', x: 792, y: f - 34, w: 32, h: 34 },

            // Beat 7.0 - 7.5 (x: 1008) - Small block hop
            { type: 'block', x: 1008, y: f - b, w: b, h: b },
            { type: 'spike', x: 1080, y: f - 34, w: 32, h: 34 },

            // Beat 9.0 - 9.75 (x: 1296) - Double block runway + floor spike
            { type: 'block', x: 1296, y: f - b, w: b * 2, h: b },
            { type: 'spike', x: 1404, y: f - 34, w: 32, h: 34 },

            // Beat 11.0 (x: 1584) - Jump pad launch to high runway + Secret Coin 1 (x: 1782)
            { type: 'pad', x: 1584, y: f - 10, w: 36, h: 10 },
            { type: 'spike', x: 1656, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 1688, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 1728, y: f - b * 2, w: b * 5, h: b },
            { type: 'coin', x: 1782, y: f - b * 3 - 20, r: 12, collected: false },

            // Beat 15.0 (x: 2160) - Drop down & single spike
            { type: 'spike', x: 2160, y: f - 34, w: 32, h: 34 },

            // Beat 17.0 (x: 2448) - Intro Yellow Jump Orb over spike
            { type: 'spike', x: 2448, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 2448, y: f - 85, r: 18, used: false },

            // Beat 19.0 - 21.5 (x: 2736 - 3096) - Ascending block stairs
            { type: 'block', x: 2736, y: f - b, w: b, h: b },
            { type: 'block', x: 2772, y: f - b * 2, w: b, h: b * 2 },
            { type: 'block', x: 2808, y: f - b * 3, w: b, h: b * 3 },
            { type: 'spike', x: 2952, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 3096, y: f - b * 2, w: b * 3, h: b },

            // Beat 24.0 - 27.0 (x: 3456 - 3888) - Double Orb sequence
            { type: 'spike', x: 3456, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 3456, y: f - 85, r: 18, used: false },
            { type: 'spike', x: 3744, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 3744, y: f - 85, r: 18, used: false },
            { type: 'block', x: 3888, y: f - b, w: b * 3, h: b },

            // ==========================================
            // PART 2: 25% - 50% (Beats 30 - 60, x: 4320 - 8640)
            // Neon Elevation & Beat Drop: Double Spikes & Elevated Pad Jumps
            // ==========================================
            // Beat 30.0 (x: 4320) - Introduction to Double Spikes
            { type: 'spike', x: 4320, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 4352, y: f - 34, w: 32, h: 34 },

            // Beat 31.0 - 32.5 (x: 4464 - 4608) - Elevated pad jump over spikes to 3b ledge
            { type: 'pad', x: 4464, y: f - 10, w: 36, h: 10 },
            { type: 'spike', x: 4536, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 4568, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 4608, y: f - b * 3, w: b * 4, h: b },

            // Beat 34.0 (x: 4896) - Double spikes on floor
            { type: 'spike', x: 4896, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 4928, y: f - 34, w: 32, h: 34 },

            // Beat 36.0 - 40.0 (x: 5184 - 5760) - Rhythmic floating platforms
            { type: 'block', x: 5184, y: f - b, w: b * 2, h: b },
            { type: 'spike', x: 5328, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 5472, y: f - b * 2, w: b * 2, h: b },
            { type: 'spike', x: 5616, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 5760, y: f - b, w: b * 2, h: b },

            // Beat 42.5 (x: 6120) - Double spikes
            { type: 'spike', x: 6120, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 6152, y: f - 34, w: 32, h: 34 },

            // Beat 45.0 (x: 6480) - Pad launch over wide spike pit to high ledge
            { type: 'pad', x: 6480, y: f - 10, w: 36, h: 10 },
            { type: 'spike', x: 6552, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 6584, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 6616, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 6624, y: f - b * 3, w: b * 5, h: b },

            // Beat 49.0 (x: 7056) - High altitude orb jump
            { type: 'spike', x: 7056, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 7092, y: f - 95, r: 18, used: false },
            { type: 'block', x: 7200, y: f - b * 2, w: b * 3, h: b },

            // Beat 52.0 (x: 7488) - Double spikes
            { type: 'spike', x: 7488, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 7520, y: f - 34, w: 32, h: 34 },

            // Beat 54.0 - 59.0 (x: 7776 - 8496) - Syncopated hops & elevated pad launch
            { type: 'block', x: 7776, y: f - b, w: b, h: b },
            { type: 'spike', x: 7920, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 8064, y: f - b, w: b, h: b },
            { type: 'spike', x: 8208, y: f - 34, w: 32, h: 34 },
            { type: 'pad', x: 8352, y: f - 10, w: 36, h: 10 },
            { type: 'block', x: 8496, y: f - b * 2, w: b * 3, h: b },

            // ==========================================
            // PART 3: 50% - 75% (Beats 60 - 90, x: 8640 - 12960)
            // Synth Pulse: Orb Chains, Tight Ceiling Drops, Secret Coin 2
            // ==========================================
            // Beat 62.0 (x: 8928) - Single spike rhythm
            { type: 'spike', x: 8928, y: f - 34, w: 32, h: 34 },

            // Beat 63.5 (x: 9144) - Double spikes
            { type: 'spike', x: 9144, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 9176, y: f - 34, w: 32, h: 34 },

            // Beat 65.0 - 67.0 (x: 9360 - 9648) - Orb jump to Secret Coin 2
            { type: 'pad', x: 9360, y: f - 10, w: 36, h: 10 },
            { type: 'orb', x: 9504, y: f - 120, r: 18, used: false },
            { type: 'coin', x: 9576, y: f - b * 4 - 15, r: 12, collected: false },
            { type: 'block', x: 9648, y: f - b * 3, w: b * 3, h: b },
            { type: 'spike', x: 9936, y: f - 34, w: 32, h: 34 },

            // Beat 70.0 - 72.5 (x: 10080 - 10440) - Tight Ceiling Drop
            // Platform at 2b height (y: 338). Player drops down into 1-cube clearance tunnel under ceiling.
            { type: 'block', x: 10080, y: f - b * 2, w: b * 2, h: b * 2 },
            { type: 'block', x: 10152, y: f - b * 3, w: b * 6, h: b },
            { type: 'spike', x: 10440, y: f - 34, w: 32, h: 34 },

            // Beat 74.0 - 78.0 (x: 10656 - 11232) - Rapid 3-Orb Chain over spike pit
            { type: 'spike', x: 10728, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 10760, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 10764, y: f - 85, r: 18, used: false },
            { type: 'spike', x: 10908, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 10908, y: f - 85, r: 18, used: false },
            { type: 'spike', x: 11052, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 11052, y: f - 85, r: 18, used: false },
            { type: 'block', x: 11160, y: f - b, w: b * 3, h: b },

            // Beat 81.0 (x: 11664) - Double spikes
            { type: 'spike', x: 11664, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 11696, y: f - 34, w: 32, h: 34 },

            // Beat 83.0 (x: 11952) - High platform jump
            { type: 'pad', x: 11952, y: f - 10, w: 36, h: 10 },
            { type: 'block', x: 12096, y: f - b * 2, w: b * 4, h: b },
            { type: 'spike', x: 12384, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 12672, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 12816, y: f - b, w: b * 2, h: b },

            // ==========================================
            // PART 4: 75% - 100% (Beats 90 - 120, x: 12960 - 17280)
            // High-Intensity Climax: Triple Spikes & Final Celebration Gate
            // ==========================================
            // Beat 90.0 - 94.0 (x: 12960 - 13536) - Ascending speed runway
            { type: 'block', x: 12960, y: f - b, w: b * 2, h: b },
            { type: 'spike', x: 13104, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 13248, y: f - b * 2, w: b * 2, h: b },
            { type: 'spike', x: 13392, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 13536, y: f - b * 3, w: b * 3, h: b },

            // Beat 96.0 (x: 13824) - Rapid Pad launch sequence
            { type: 'pad', x: 13824, y: f - 10, w: 36, h: 10 },
            { type: 'spike', x: 13896, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 13928, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 13968, y: f - b * 2, w: b * 4, h: b },

            // Beat 100.0 - 103.0 (x: 14400 - 14832) - High Air Orbs & Secret Coin 3
            { type: 'spike', x: 14400, y: f - 34, w: 32, h: 34 },
            { type: 'orb', x: 14472, y: f - 90, r: 18, used: false },
            { type: 'pad', x: 14544, y: f - 10, w: 36, h: 10 },
            { type: 'coin', x: 14616, y: f - b * 4 - 20, r: 12, collected: false },
            { type: 'block', x: 14688, y: f - b * 3, w: b * 5, h: b },

            // Beat 106.0 (x: 15264) - Double spike prelude
            { type: 'spike', x: 15264, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 15296, y: f - 34, w: 32, h: 34 },

            // Beat 108.0 (x: 15552) - TRIPLE SPIKE CLIMAX #1
            { type: 'spike', x: 15552, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 15584, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 15616, y: f - 34, w: 32, h: 34 },

            // Beat 111.0 (x: 15984) - TRIPLE SPIKE CLIMAX #2 (Final Test)
            { type: 'spike', x: 15984, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 16016, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 16048, y: f - 34, w: 32, h: 34 },

            // Beat 113.0 (x: 16272) - Final launch to Victory Bridge
            { type: 'pad', x: 16272, y: f - 10, w: 36, h: 10 },
            { type: 'spike', x: 16344, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 16376, y: f - 34, w: 32, h: 34 },
            { type: 'block', x: 16416, y: f - b * 2, w: b * 7, h: b },

            // Beat 117.0 (x: 16848) - Final ground run before Victory Gate
            { type: 'spike', x: 16848, y: f - 34, w: 32, h: 34 },
            { type: 'spike', x: 16880, y: f - 34, w: 32, h: 34 }
        ];
    }

    start() {
        // Скасування можливих «хвостів» попередньої сесії
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.deathTimer) {
            clearTimeout(this.deathTimer);
            this.deathTimer = null;
        }

        this.running = true;
        this.won = false;
        this.holdingJump = false;
        this.jumpBuffer = 0;
        this.shake = 0;
        this.cameraX = 0;
        this.particles = [];
        this.player.x = 90;
        this.player.y = this.floorY - this.cubeSize;
        this.player.vy = 0;
        this.player.rotation = 0;
        this.player.grounded = true;
        this.player.trail = [];
        this.initLevel();

        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', this.handleKeyDown);
            window.addEventListener('keyup', this.handleKeyUp);
            window.addEventListener('pointerup', this.handlePointerUp);
            window.addEventListener('pointercancel', this.handleInputCancel);
            window.addEventListener('blur', this.handleInputCancel);
            window.addEventListener('resize', this.handleResize);
        }

        if (this.canvas && this.canvas.addEventListener) {
            this.canvas.addEventListener('pointerdown', this.handlePointerDown);
        }

        if (typeof document !== 'undefined') {
            document.addEventListener('fullscreenchange', this.handleResize);
        }

        this.handleResize();
        this.startMusic();
        this.loop();
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.deathTimer) {
            clearTimeout(this.deathTimer);
            this.deathTimer = null;
        }
        this.stopMusic();

        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', this.handleKeyDown);
            window.removeEventListener('keyup', this.handleKeyUp);
            window.removeEventListener('pointerup', this.handlePointerUp);
            window.removeEventListener('pointercancel', this.handleInputCancel);
            window.removeEventListener('blur', this.handleInputCancel);
            window.removeEventListener('resize', this.handleResize);
        }

        if (this.canvas && this.canvas.removeEventListener) {
            this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
        }

        if (typeof document !== 'undefined') {
            document.removeEventListener('fullscreenchange', this.handleResize);
        }
    }

    restart() {
        this.stop();
        this.attempts++;
        try {
            const storage = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
            if (storage) {
                storage.setItem('duckverse_gd_attempts', this.attempts.toString());
            }
        } catch (e) {}
        this.start();
    }

    startMusic() {
        this.stopMusic();
        if (typeof window === 'undefined' || !window.sound || window.sound.muted) return;
        window.sound.init();
        if (!window.sound.ctx) return;

        // Динамічний 130 BPM електронний бас-синтезатор
        const bpm = 130;
        const interval = (60 / bpm) * 1000 / 2; // восьмі ноти
        const bassNotes = [110, 110, 130.81, 110, 146.83, 130.81, 110, 164.81]; // басова лінія A2
        this.musicBeat = 0;

        this.musicTimer = setInterval(() => {
            if (!this.running || typeof window === 'undefined' || !window.sound || window.sound.muted || !window.sound.ctx) return;
            const ctx = window.sound.ctx;
            const now = ctx.currentTime;
            const freq = bassNotes[this.musicBeat % bassNotes.length];

            // Басовий синт
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

            // Снейр / хай-хет через бит
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
        if (e && e.preventDefault) e.preventDefault();
        this.holdingJump = true;
        this.tryJump();
    }

    handlePointerUp() {
        this.holdingJump = false;
    }

    // Скидання «застряглого» стрибка при скасуванні дотику чи втраті фокуса вікна
    handleInputCancel() {
        this.holdingJump = false;
    }

    // Активація жовтого орба, якщо гравець у його радіусі
    tryActivateOrb() {
        for (let item of this.level) {
            if (item.type === 'orb' && !item.used) {
                const px = this.player.x + this.cubeSize / 2;
                const py = this.player.y + this.cubeSize / 2;
                const dist = Math.hypot(px - item.x, py - item.y);
                if (dist < item.r + 24) {
                    item.used = true;
                    this.player.vy = this.jumpForce * 1.1;
                    this.player.grounded = false;
                    this.jumpBuffer = 0;
                    if (typeof window !== 'undefined' && window.sound) window.sound.jump();

                    // Вибух кільця орба (солідні частинки без розмиття)
                    for (let i = 0; i < 10; i++) {
                        this.particles.push({
                            x: item.x,
                            y: item.y,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            radius: 3,
                            color: '#ffd000',
                            alpha: 1,
                            life: 20
                        });
                    }
                    return true;
                }
            }
        }
        return false;
    }

    // 2. Буферизація стрибка: запам'ятовування введення в повітрі на ~120мс
    tryJump() {
        if (!this.running) return;

        // Спочатку перевірка орба (працює і в повітрі)
        if (this.tryActivateOrb()) {
            this.jumpBuffer = 0;
            return;
        }

        // Стандартний стрибок із землі / блока
        if (this.player.grounded) {
            this.player.vy = this.jumpForce;
            this.player.grounded = false;
            this.jumpBuffer = 0;
            if (typeof window !== 'undefined' && window.sound) window.sound.jump();

            const skin = this.getEquippedSkin();
            // Частинки пилу при стрибку у фірмовому кольорі скіна
            for (let i = 0; i < 6; i++) {
                this.particles.push({
                    x: this.player.x + Math.random() * this.cubeSize,
                    y: this.player.y + this.cubeSize,
                    vx: -Math.random() * 3 - 1,
                    vy: -Math.random() * 2,
                    radius: 3,
                    color: skin.primaryColor || '#00e676',
                    alpha: 1,
                    life: 15
                });
            }
        } else {
            // Гравець у повітрі — зберігаємо буфер стрибка на ~120 мс
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            this.jumpBuffer = now + 120;
        }
    }

    // 4. Отримання активного скіна з localStorage згідно з lib/skins.js
    getEquippedSkin() {
        let skinId = 'neon_green';
        try {
            const storage = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
            if (storage) {
                const raw = storage.getItem('duckverse_equipped_skin') ||
                            storage.getItem('duckverse_active_skin') ||
                            storage.getItem('duckverse_skins') ||
                            storage.getItem('duckverse_skin');
                if (raw) {
                    if (raw.startsWith('{')) {
                        const parsed = JSON.parse(raw);
                        skinId = parsed.equipped || parsed.active || parsed.id || skinId;
                    } else if (raw.startsWith('[')) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            skinId = parsed[0];
                        }
                    } else {
                        skinId = raw.trim();
                    }
                }
            }
        } catch (e) {
            skinId = 'neon_green';
        }
        return GD_SKINS_CONFIG[skinId] || GD_SKINS_CONFIG.neon_green;
    }

    // Малювання чіткого солід-обличчя кубика відповідно до обраного скіна (Без неона)
    drawSkinFace(ctx, skin) {
        ctx.shadowBlur = 0;
        switch (skin.faceType) {
            case 'cyber': {
                // Cyber Cyan: Чіткий солід візор та кібер-ґрати
                ctx.fillStyle = '#00b4d8';
                ctx.fillRect(-8, -7, 16, 4);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-4, -6, 8, 2);

                // Кібер-рот
                ctx.fillStyle = '#001a40';
                ctx.fillRect(-6, 3, 12, 2.5);
                ctx.fillStyle = '#00b4d8';
                ctx.fillRect(-3, 3.5, 2, 1.5);
                ctx.fillRect(1, 3.5, 2, 1.5);
                break;
            }
            case 'fury': {
                // Magenta Fury: Чіткі агресивні скошені очі та зубата посмішка
                ctx.fillStyle = '#ffffff';
                // Ліве скошене око
                ctx.beginPath();
                ctx.moveTo(-8, -8);
                ctx.lineTo(-2, -5);
                ctx.lineTo(-3, -2);
                ctx.lineTo(-8, -4);
                ctx.closePath();
                ctx.fill();

                // Праве скошене око
                ctx.beginPath();
                ctx.moveTo(8, -8);
                ctx.lineTo(2, -5);
                ctx.lineTo(3, -2);
                ctx.lineTo(8, -4);
                ctx.closePath();
                ctx.fill();

                // Зіниці
                ctx.fillStyle = '#f72585';
                ctx.fillRect(-5, -5, 2, 2);
                ctx.fillRect(3, -5, 2, 2);

                // Зуби
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-6, 3, 12, 3);
                ctx.fillStyle = '#7209b7';
                ctx.fillRect(-3, 3.5, 1.5, 3);
                ctx.fillRect(1.5, 3.5, 1.5, 3);
                break;
            }
            case 'god': {
                // Golden God: Чіткі темні окуляри з білим відблиском та усмішка
                ctx.fillStyle = '#1a1200';
                ctx.fillRect(-8, -8, 7, 6);
                ctx.fillRect(1, -8, 7, 6);
                ctx.fillRect(-1, -7, 2, 2);

                // Відблиск лінз
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-7, -7, 2, 2);
                ctx.fillRect(2, -7, 2, 2);

                // Впевнена посмішка
                ctx.fillStyle = '#5c3a00';
                ctx.beginPath();
                ctx.moveTo(-5, 4);
                ctx.lineTo(4, 3);
                ctx.lineTo(5, 5);
                ctx.lineTo(-5, 5.5);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 'void': {
                // Stealth Void: Чіткі червоні очі-розрізи та солідна лінія рота
                ctx.fillStyle = '#e63946';
                ctx.fillRect(-8, -7, 6, 2.5);
                ctx.fillRect(2, -7, 6, 2.5);

                // Розріз рота
                ctx.fillRect(-5, 3, 10, 2);
                break;
            }
            case 'classic':
            default: {
                // Classic Green: Класичні два чорні квадратні очі та широка посмішка
                ctx.fillStyle = '#000000';
                ctx.fillRect(-8, -8, 5, 5);
                ctx.fillRect(3, -8, 5, 5);
                ctx.fillRect(-6, 3, 12, 3);
                break;
            }
        }
    }

    update() {
        // Рух гравця вперед
        this.player.x += this.speed;
        this.cameraX = this.player.x - 140;

        // Гравітація
        this.player.vy += this.gravity;
        this.player.y += this.player.vy;

        // Обертання в повітрі (плавні 90 градусів за стандартний стрибок)
        if (!this.player.grounded) {
            const rotSpeed = (Math.PI / 2) / (Math.abs(this.jumpForce) * 2 / this.gravity);
            this.player.rotation += rotSpeed;
        } else {
            // Прив'язка кута до найближчих 90 градусів на підлозі / платформі
            const snap = Math.round(this.player.rotation / (Math.PI / 2)) * (Math.PI / 2);
            if (Math.abs(snap - this.player.rotation) < 0.02) {
                this.player.rotation = snap;
            } else {
                this.player.rotation += (snap - this.player.rotation) * 0.45;
            }
        }

        // Запис сліду
        if (this.running) {
            this.player.trail.unshift({
                x: this.player.x,
                y: this.player.y,
                rotation: this.player.rotation,
                alpha: 0.6
            });
            if (this.player.trail.length > 8) this.player.trail.pop();
        }

        // Колізія з підлогою
        let onPlatform = false;
        if (this.player.y + this.cubeSize >= this.floorY) {
            this.player.y = this.floorY - this.cubeSize;
            this.player.vy = 0;
            this.player.grounded = true;
            onPlatform = true;
        }

        // Перевірка об'єктів
        const pBox = {
            l: this.player.x + 3,
            r: this.player.x + this.cubeSize - 3,
            t: this.player.y + 3,
            b: this.player.y + this.cubeSize
        };

        for (let item of this.level) {
            // Перевіряємо лише об'єкти поруч із гравцем (з урахуванням ширини об'єкта!)
            const itemRight = item.x + (item.w || 0);
            if (itemRight < this.player.x - 120 || item.x > this.player.x + 200) continue;

            if (item.type === 'spike') {
                // Справедливий трикутний хітбокс шипа (як в оригіналі Geometry Dash)
                const spikeT = item.y + 7;
                const spikeB = item.y + item.h;

                if (pBox.b > spikeT && pBox.t < spikeB) {
                    const ratio = Math.max(0, Math.min(1, (spikeB - pBox.b) / item.h));
                    const inset = 6 + ratio * (item.w / 2 - 7);
                    const dynamicL = item.x + inset;
                    const dynamicR = item.x + item.w - inset;

                    if (pBox.r > dynamicL && pBox.l < dynamicR) {
                        this.die();
                        return;
                    }
                }
            } else if (item.type === 'block') {
                const bL = item.x;
                const bR = item.x + item.w;
                const bT = item.y;
                const bB = item.y + item.h;

                const overlapX = pBox.r > bL && pBox.l < bR;
                if (overlapX) {
                    // Приземлення зверху
                    const prevY = this.player.y - this.player.vy;
                    if (prevY + this.cubeSize <= bT + 12 && this.player.vy >= 0) {
                        this.player.y = bT - this.cubeSize;
                        this.player.vy = 0;
                        this.player.grounded = true;
                        onPlatform = true;
                    } else if (pBox.b > bT + 8 && pBox.t < bB) {
                        // Зіткнення з боком / низом блока
                        this.die();
                        return;
                    }
                }
            } else if (item.type === 'pad') {
                const padL = item.x;
                const padR = item.x + item.w;
                const padT = item.y;
                if (pBox.r > padL && pBox.l < padR && pBox.b >= padT && pBox.t < padT + item.h) {
                    // Суперпоштовх!
                    this.player.vy = this.jumpForce * 1.35;
                    this.player.grounded = false;
                    this.jumpBuffer = 0;
                    if (typeof window !== 'undefined' && window.sound) {
                        if (typeof window.sound.pad === 'function') window.sound.pad();
                        else window.sound.jump();
                    }

                    // Солідні частинки трампліна
                    for (let i = 0; i < 8; i++) {
                        this.particles.push({
                            x: item.x + item.w / 2,
                            y: item.y,
                            vx: (Math.random() - 0.5) * 4,
                            vy: -Math.random() * 5 - 2,
                            radius: 3,
                            color: '#ffd000',
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
                    if (typeof window !== 'undefined' && window.sound) window.sound.coin();
                    if (this.onAddCoins) this.onAddCoins(10); // Секретна монета GD дає 10 монет!
                    for (let i = 0; i < 12; i++) {
                        this.particles.push({
                            x: item.x,
                            y: item.y,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            radius: 4,
                            color: '#ffd000',
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

        // Обробка стрибка: перевірка jumpBuffer або затиснутої клавіші (holdingJump)
        if (this.player.grounded) {
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            if (this.jumpBuffer > 0 && now <= this.jumpBuffer) {
                this.jumpBuffer = 0;
                this.tryJump();
            } else if (this.holdingJump) {
                this.tryJump();
            }
            if (this.jumpBuffer > 0 && now > this.jumpBuffer) {
                this.jumpBuffer = 0;
            }
        } else if (this.holdingJump) {
            this.tryActivateOrb();
        }

        this.updateParticles();

        // Перевірка перемоги
        if (this.player.x >= this.levelLength) {
            this.victory();
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 1 / p.life;
            if (p.alpha <= 0) this.particles.splice(i, 1);
        }
    }

    // Анімація частинок та шейку після зупинки гри (вибух при смерті / фінал перемоги)
    animateAfterStop() {
        if (this.running) return;
        this.updateParticles();
        this.draw();
        if (this.particles.length > 0 || this.shake > 0) {
            if (typeof requestAnimationFrame !== 'undefined') {
                this.animationId = requestAnimationFrame(() => this.animateAfterStop());
            }
        }
    }

    // 3. Screen Shake VFX on Death: трясіння екрана (shake = 18) при аварії
    die() {
        this.running = false;
        this.stopMusic();
        this.shake = 18; // Шейк камери при смерті
        this.jumpBuffer = 0;
        if (typeof window !== 'undefined' && window.sound) window.sound.explosion();

        const skin = this.getEquippedSkin();
        const colors = [skin.primaryColor, skin.secondaryColor, '#ffd000', '#ffffff'];

        // Частинки розбитого куба (чистий солід-стиль)
        for (let i = 0; i < 26; i++) {
            this.particles.push({
                x: this.player.x + this.cubeSize / 2,
                y: this.player.y + this.cubeSize / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                radius: Math.random() * 5 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                life: 35
            });
        }

        // Продовжуємо анімацію вибуху та шейку, доки вони не згаснуть
        this.animateAfterStop();

        const percent = Math.min(100, Math.floor((this.player.x / this.levelLength) * 100));
        if (percent > this.bestPercent) {
            this.bestPercent = percent;
            try {
                const storage = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
                if (storage) {
                    storage.setItem('duckverse_gd_best', this.bestPercent);
                }
            } catch (e) {}
        }
        this.attempts++;
        try {
            const storage = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
            if (storage) {
                storage.setItem('duckverse_gd_attempts', this.attempts);
            }
        } catch (e) {}

        this.deathTimer = setTimeout(() => {
            this.deathTimer = null;
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
        this.won = true;
        this.stopMusic();
        if (typeof window !== 'undefined' && window.sound) window.sound.victory();

        this.bestPercent = 100;
        try {
            const storage = (typeof window !== 'undefined' && window.localStorage) ? window.localStorage : (typeof localStorage !== 'undefined' ? localStorage : null);
            if (storage) {
                storage.setItem('duckverse_gd_best', 100);
            }
        } catch (e) {}

        // Дооцінюємо фінальні кадри (згасаючий слід тощо)
        this.animateAfterStop();

        if (this.onVictory) {
            this.onVictory({
                percent: 100,
                attempts: this.attempts
            });
        }
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const w = this.baseWidth;
        const h = this.baseHeight;

        // Всі неонові розмиття вимкнено ("Без неона")
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // 1. Скидання матриці та очищення всього полотна (letterbox)
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = '#0a0d18';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Встановлення рівномірного масштабування та центрування
        ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);

        // Розрахунок screen shake при смерті
        let shakeCamX = 0;
        let shakeCamY = 0;
        if (this.shake > 0) {
            shakeCamX = (Math.random() - 0.5) * this.shake;
            shakeCamY = (Math.random() - 0.5) * this.shake;
            this.shake *= 0.85; // швидке загасання
            if (this.shake < 0.2) this.shake = 0;
        }

        // Чіткий солід-градієнт фону (глибокий аркадний стиль Geometry Dash)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0a1428');
        bgGrad.addColorStop(0.7, '#0f2042');
        bgGrad.addColorStop(1, '#182442');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Фонова сітка (тонкі чіткі лінії без розмиття)
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        const bgOffset = ((this.cameraX + shakeCamX) * 0.3) % 40;
        for (let x = -bgOffset; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.floorY);
            ctx.stroke();
        }
        ctx.restore();

        // Зсув камери разом зі зсувом шейку
        ctx.save();
        ctx.translate(-this.cameraX + shakeCamX, shakeCamY);

        // Солідна підлога
        const floorGrad = ctx.createLinearGradient(0, this.floorY, 0, h);
        floorGrad.addColorStop(0, '#001a33');
        floorGrad.addColorStop(1, '#000d1a');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(this.cameraX - 100, this.floorY, w + 200, h - this.floorY);

        // Чітка верхня лінія підлоги (без неону, чітка лінія 3px)
        ctx.strokeStyle = '#00c8ff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(this.cameraX - 100, this.floorY);
        ctx.lineTo(this.cameraX + w + 100, this.floorY);
        ctx.stroke();

        // Елементи рівня: чітка культова солідна графіка Geometry Dash
        for (let item of this.level) {
            const itemRight = item.x + (item.w || 0);
            if (itemRight < this.cameraX - 60 || item.x > this.cameraX + w + 60) continue;

            if (item.type === 'spike') {
                // Класичний шип: чорний монолітний трикутник із чітким контуром та внутрішнім акцентом
                ctx.save();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#0a0a0e';
                ctx.strokeStyle = '#ff2255';
                ctx.lineWidth = 2.5;

                ctx.beginPath();
                ctx.moveTo(item.x, item.y + item.h);
                ctx.lineTo(item.x + item.w / 2, item.y);
                ctx.lineTo(item.x + item.w, item.y + item.h);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Внутрішній акцентний трикутник
                ctx.fillStyle = '#ff2255';
                ctx.beginPath();
                ctx.moveTo(item.x + 8, item.y + item.h - 3);
                ctx.lineTo(item.x + item.w / 2, item.y + 10);
                ctx.lineTo(item.x + item.w - 8, item.y + item.h - 3);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else if (item.type === 'block') {
                // Солідний блок: чіткий монолітний темний корпус, контрастна рамка, геометричний інсет
                ctx.save();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#0b162c';
                ctx.fillRect(item.x, item.y, item.w, item.h);
                ctx.strokeStyle = '#00b4d8';
                ctx.lineWidth = 2.5;
                ctx.strokeRect(item.x, item.y, item.w, item.h);

                // Внутрішня геометрія блока
                ctx.strokeStyle = 'rgba(0, 180, 216, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(item.x + 4, item.y + 4, item.w - 8, item.h - 8);
                ctx.fillStyle = 'rgba(0, 180, 216, 0.15)';
                ctx.fillRect(item.x + 5, item.y + 5, item.w - 10, item.h - 10);
                ctx.restore();
            } else if (item.type === 'pad') {
                // Трамплін: солідний жовтий еліпс із білим кантом
                ctx.save();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffd000';
                ctx.beginPath();
                ctx.ellipse(item.x + item.w / 2, item.y + item.h / 2, item.w / 2, item.h / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            } else if (item.type === 'orb' && !item.used) {
                // Орб: солідне золоте коло та внутрішнє кільце
                ctx.save();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffd000';
                ctx.beginPath();
                ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Внутрішнє кільце
                ctx.beginPath();
                ctx.arc(item.x, item.y, item.r * 0.55, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            } else if (item.type === 'coin' && !item.collected) {
                // Секретна монета: чітка золота монета із зіркою
                ctx.save();
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffbe0b';
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

        // Фінішні ворота
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#00e676';
        ctx.fillRect(this.levelLength, 0, 16, this.floorY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.levelLength, 0, 16, this.floorY);
        ctx.restore();

        const activeSkin = this.getEquippedSkin();

        // Слід куба у кольорі скіна (чіткі солідні квадрати з прозорістю)
        this.player.trail.forEach((t, i) => {
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.translate(t.x + this.cubeSize / 2, t.y + this.cubeSize / 2);
            ctx.rotate(t.rotation);
            ctx.globalAlpha = (1 - i / this.player.trail.length) * 0.35;
            ctx.fillStyle = activeSkin.trailColor || '#00e676';
            ctx.fillRect(-this.cubeSize / 2, -this.cubeSize / 2, this.cubeSize, this.cubeSize);
            ctx.restore();
        });

        // Куб гравця з підтримкою скінів (чистий солід-стиль без розмиття)
        if (this.running || this.won) {
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.translate(this.player.x + this.cubeSize / 2, this.player.y + this.cubeSize / 2);
            ctx.rotate(this.player.rotation);

            const b = this.cubeSize;
            const halfB = b / 2;

            // Зовнішній солідний квадрат у кольорі скіна
            ctx.fillStyle = activeSkin.primaryColor;
            ctx.fillRect(-halfB, -halfB, b, b);

            // Чорна контрастна товста обводка 3px
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeRect(-halfB, -halfB, b, b);

            // Внутрішній вторинний квадрат обличчя
            ctx.fillStyle = activeSkin.secondaryColor;
            ctx.fillRect(-b / 4, -b / 4, b / 2, b / 2);

            // Індивідуальне обличчя скіна
            this.drawSkinFace(ctx, activeSkin);

            ctx.restore();
        }

        // Частинки (солідні диски)
        this.particles.forEach(p => {
            ctx.save();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.restore(); // кінець зсуву камери
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        // Не плануємо наступний кадр, якщо update() зупинив гру (смерть/перемога)
        if (this.running) {
            if (typeof requestAnimationFrame !== 'undefined') {
                this.animationId = requestAnimationFrame(() => this.loop());
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.GeometryDashGame = GeometryDashGame;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeometryDashGame;
}
