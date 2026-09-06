/**
 * Duck Verse Web Audio Synthesizer & SFX Engine
 * Zero external dependencies — Pure Web Audio API
 */
class SoundController {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.reverbNode = null;
        this.reverbFilter = null;
        this.reverbGain = null;
        this.muted = false;
        this.masterVolume = 0.8;
        this._isUnlocked = false;

        // Restore mute preference safely
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                this.muted = localStorage.getItem('duckverse_muted') === 'true';
            } catch (e) {
                this.muted = false;
            }
        }

        // Auto-unlock on user interaction (pointerdown, keydown, touchstart)
        this._setupAutoUnlock();
    }

    _setupAutoUnlock() {
        if (typeof window === 'undefined') return;

        const unlockEvents = ['pointerdown', 'keydown', 'touchstart'];
        const unlockHandler = () => {
            this.unlockAudio();
            if (this.ctx && this.ctx.state === 'running') {
                unlockEvents.forEach(evt => {
                    window.removeEventListener(evt, unlockHandler, true);
                    document.removeEventListener(evt, unlockHandler, true);
                });
            }
        };

        unlockEvents.forEach(evt => {
            window.addEventListener(evt, unlockHandler, { capture: true, passive: true });
            document.addEventListener(evt, unlockHandler, { capture: true, passive: true });
        });
    }

    init() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();

                // Master volume gain node
                this.masterGain = this.ctx.createGain();
                const initialVol = this.muted ? 0.0001 : this.masterVolume;
                this.masterGain.gain.setValueAtTime(initialVol, this.ctx.currentTime);
                this.masterGain.connect(this.ctx.destination);

                // Procedural bright reverb impulse
                this._initReverb();
            }
        }

        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    unlockAudio() {
        this.init();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }

        // Silent single-sample buffer to unlock mobile/Safari audio context without clicks
        if (!this._isUnlocked && this.ctx.state === 'running') {
            try {
                const buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate || 44100);
                const source = this.ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(this.masterGain || this.ctx.destination);
                source.start(0);
                this._isUnlocked = true;
            } catch (e) {}
        }
    }

    get destination() {
        return this.masterGain || (this.ctx ? this.ctx.destination : null);
    }

    _initReverb() {
        if (!this.ctx || !this.masterGain) return;
        try {
            const sampleRate = this.ctx.sampleRate || 44100;
            const length = Math.floor(sampleRate * 0.45); // 0.45s glistening decay
            const impulse = this.ctx.createBuffer(2, length, sampleRate);
            const left = impulse.getChannelData(0);
            const right = impulse.getChannelData(1);
            const decay = 3.5;

            for (let i = 0; i < length; i++) {
                const t = i / length;
                const env = Math.exp(-t * decay);
                left[i] = (Math.random() * 2 - 1) * env;
                right[i] = (Math.random() * 2 - 1) * env;
            }

            this.reverbNode = this.ctx.createConvolver();
            this.reverbNode.buffer = impulse;

            // High-pass filter on reverb send to keep reflections bright and eliminate mud
            this.reverbFilter = this.ctx.createBiquadFilter();
            this.reverbFilter.type = 'highpass';
            this.reverbFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

            this.reverbGain = this.ctx.createGain();
            this.reverbGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

            this.reverbFilter.connect(this.reverbNode);
            this.reverbNode.connect(this.reverbGain);
            this.reverbGain.connect(this.masterGain);
        } catch (e) {
            this.reverbNode = null;
            this.reverbFilter = null;
            this.reverbGain = null;
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                localStorage.setItem('duckverse_muted', String(this.muted));
            } catch (e) {}
        }
        this.fadeMasterVolume(this.muted ? 0.0001 : this.masterVolume, 0.06);
        return this.muted;
    }

    setMasterVolume(val, fadeDuration = 0.05) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        if (!this.muted) {
            this.fadeMasterVolume(this.masterVolume, fadeDuration);
        }
    }

    fadeMasterVolume(target, duration = 0.05) {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        const current = this.masterGain.gain.value;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(current, now);
        this.masterGain.gain.linearRampToValueAtTime(Math.max(0.0001, Math.min(1, target)), now + duration);
    }

    /**
     * jump(): Punchy synth blip with pitch envelope (rising frequency from 150Hz to 380Hz)
     */
    jump() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'square';
        // Rising frequency from 150Hz to 380Hz
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.08);

        // Lowpass filter shaping for arcade synth punch without aliasing crackle
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3200, now);
        filter.frequency.exponentialRampToValueAtTime(1200, now + 0.10);

        // Click-free envelope (micro-attack + exponential decay)
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.20, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.11);
    }

    /**
     * explosion(): Rich noise burst with low-frequency sub-bass boom (decaying from 120Hz to 30Hz)
     * and high-shelf filter roll-off for shattering cube impact.
     */
    explosion() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Layer 1: Sub-bass boom (decaying from 120Hz to 30Hz)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(120, now);
        subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

        subGain.gain.setValueAtTime(0.0001, now);
        subGain.gain.linearRampToValueAtTime(0.42, now + 0.006);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

        subOsc.connect(subGain);
        subGain.connect(this.masterGain);
        subOsc.start(now);
        subOsc.stop(now + 0.39);

        // Layer 2: Rich noise burst with high-shelf filter roll-off for shattering cube impact
        const sampleRate = this.ctx.sampleRate || 44100;
        const bufferSize = Math.floor(sampleRate * 0.32);
        const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Dynamic sweep lowpass
        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(2200, now);
        lowpass.frequency.exponentialRampToValueAtTime(220, now + 0.30);

        // High-shelf filter roll-off for shattering cube debris
        const highShelf = this.ctx.createBiquadFilter();
        highShelf.type = 'highshelf';
        highShelf.frequency.setValueAtTime(2400, now);
        highShelf.gain.setValueAtTime(-14, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.linearRampToValueAtTime(0.38, now + 0.005);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.31);

        noise.connect(lowpass);
        lowpass.connect(highShelf);
        highShelf.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.32);
    }

    /**
     * coin(): Shimmering dual-tone arpeggio (B5 -> E6: ~987Hz -> ~1318Hz)
     * with triangle waveform and bright reverb decay.
     */
    coin() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [
            { freq: 987.77, start: 0, dur: 0.09, vol: 0.22 },     // B5
            { freq: 1318.51, start: 0.075, dur: 0.24, vol: 0.25 } // E6
        ];

        notes.forEach(({ freq, start, dur, vol }) => {
            const noteStart = now + start;
            const noteStop = noteStart + dur;

            // Primary triangle tone
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteStart);

            // Shimmering octave harmonic
            const shimmerOsc = this.ctx.createOscillator();
            const shimmerGain = this.ctx.createGain();
            shimmerOsc.type = 'sine';
            shimmerOsc.frequency.setValueAtTime(freq * 2, noteStart);

            gain.gain.setValueAtTime(0.0001, noteStart);
            gain.gain.linearRampToValueAtTime(vol, noteStart + 0.004);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteStop);

            shimmerGain.gain.setValueAtTime(0.0001, noteStart);
            shimmerGain.gain.linearRampToValueAtTime(vol * 0.25, noteStart + 0.004);
            shimmerGain.gain.exponentialRampToValueAtTime(0.0001, noteStop);

            osc.connect(gain);
            shimmerOsc.connect(shimmerGain);

            gain.connect(this.masterGain);
            shimmerGain.connect(this.masterGain);

            // Send to bright reverb for shimmering decay
            if (this.reverbFilter) {
                gain.connect(this.reverbFilter);
                shimmerGain.connect(this.reverbFilter);
            }

            osc.start(noteStart);
            osc.stop(noteStop + 0.01);
            shimmerOsc.start(noteStart);
            shimmerOsc.stop(noteStop + 0.01);
        });
    }

    /**
     * pad(): Elastic bouncy launch whoosh (pitch envelope starting low, shooting high with resonant filter peak)
     */
    pad() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const dur = 0.28;

        // Layer 1: Elastic bouncy pitch envelope: starting low (95Hz), shooting high (720Hz)
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';

        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.16);
        osc.frequency.exponentialRampToValueAtTime(460, now + dur);

        // Resonant filter peak creating dynamic elastic spring resonance
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(6.0, now);
        filter.frequency.setValueAtTime(180, now);
        filter.frequency.exponentialRampToValueAtTime(2600, now + 0.16);
        filter.frequency.exponentialRampToValueAtTime(1300, now + dur);

        oscGain.gain.setValueAtTime(0.0001, now);
        oscGain.gain.linearRampToValueAtTime(0.24, now + 0.01);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(this.masterGain);

        // Layer 2: Launch whoosh air displacement noise
        const sampleRate = this.ctx.sampleRate || 44100;
        const noiseLength = Math.floor(sampleRate * dur);
        const noiseBuffer = this.ctx.createBuffer(1, noiseLength, sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseLength; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.Q.setValueAtTime(4.5, now);
        noiseFilter.frequency.setValueAtTime(240, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(3200, now + 0.15);
        noiseFilter.frequency.exponentialRampToValueAtTime(1000, now + dur);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.0001, now);
        noiseGain.gain.linearRampToValueAtTime(0.22, now + 0.015);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + dur + 0.01);
        noise.start(now);
        noise.stop(now + dur + 0.01);
    }

    /**
     * victory(): Glorious 4-note victory fanfare arpeggio (C5 -> E5 -> G5 -> C6) with warm chords.
     */
    victory() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const fanfare = [
            { freq: 523.25, time: 0.00, dur: 0.36, vol: 0.22 }, // C5
            { freq: 659.25, time: 0.12, dur: 0.36, vol: 0.22 }, // E5
            { freq: 783.99, time: 0.24, dur: 0.36, vol: 0.24 }, // G5
            { freq: 1046.50, time: 0.36, dur: 0.80, vol: 0.28 } // C6 (climactic high note)
        ];

        // Glorious arpeggio melody
        fanfare.forEach(({ freq, time, dur, vol }) => {
            const noteStart = now + time;
            const noteEnd = noteStart + dur;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteStart);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2800, noteStart);

            gain.gain.setValueAtTime(0.0001, noteStart);
            gain.gain.linearRampToValueAtTime(vol, noteStart + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            if (this.reverbFilter) {
                gain.connect(this.reverbFilter);
            }

            osc.start(noteStart);
            osc.stop(noteEnd + 0.02);
        });

        // Underlying warm chord harmony (C major: C4, E4, G4)
        const chordNotes = [261.63, 329.63, 392.00];
        const chordStart = now + 0.24;
        const chordEnd = chordStart + 0.90;

        chordNotes.forEach((freq, idx) => {
            const chordOsc = this.ctx.createOscillator();
            const chordGain = this.ctx.createGain();
            const chordFilter = this.ctx.createBiquadFilter();

            chordOsc.type = 'sawtooth';
            chordOsc.frequency.setValueAtTime(freq, chordStart);
            chordOsc.detune.setValueAtTime((idx - 1) * 4, chordStart);

            chordFilter.type = 'lowpass';
            chordFilter.frequency.setValueAtTime(1200, chordStart);

            chordGain.gain.setValueAtTime(0.0001, chordStart);
            chordGain.gain.linearRampToValueAtTime(0.08, chordStart + 0.06);
            chordGain.gain.exponentialRampToValueAtTime(0.0001, chordEnd);

            chordOsc.connect(chordFilter);
            chordFilter.connect(chordGain);
            chordGain.connect(this.masterGain);

            if (this.reverbFilter) {
                chordGain.connect(this.reverbFilter);
            }

            chordOsc.start(chordStart);
            chordOsc.stop(chordEnd + 0.02);
        });
    }

    quack() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.Q.setValueAtTime(3.0, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.21);
    }

    pew() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    gameover() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [330, 293, 261, 196];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + idx * 0.12;
            const end = start + 0.12;

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.linearRampToValueAtTime(0.2, start + 0.004);
            gain.gain.exponentialRampToValueAtTime(0.0001, end);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(start);
            osc.stop(end + 0.01);
        });
    }
}

if (typeof window !== 'undefined') {
    window.sound = new SoundController();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundController;
}
