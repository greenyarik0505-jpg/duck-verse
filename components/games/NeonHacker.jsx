'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  buildRings,
  stepRings,
  checkPulse,
  generateCipher,
  cipherScore,
  calcScore,
  createAudioCtx,
  playSuccess,
  playFail,
  playClick,
  playCipherKey,
  playVictory,
} from '../../lib/games/neonHackerEngine';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const CANVAS_W = 520;
const CANVAS_H = 520;
const CX = CANVAS_W / 2;
const CY = CANVAS_H / 2;

const PHASE = {
  IDLE: 'idle',
  HACKING: 'hacking',  // firewall rings phase
  CIPHER: 'cipher',    // terminal cipher phase
  SUCCESS: 'success',
  FAIL: 'fail',
  WIN: 'win',
};

const TOTAL_CORES = 5;         // cores to hack to win
const FAIL_FLASH_MS = 900;
const SUCCESS_FLASH_MS = 600;
const CIPHER_MAX_MS = 8000;    // time limit per cipher

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function NeonHacker({ onAddCoins, onGameOver, onVictory }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);   // mutable game state
  const rafRef    = useRef(null);
  const audioCtx  = useRef(null);

  // React UI state (only what needs re-render)
  const [uiPhase, setUiPhase]       = useState(PHASE.IDLE);
  const [score, setScore]           = useState(0);
  const [level, setLevel]           = useState(1);
  const [combo, setCombo]           = useState(0);
  const [coresLeft, setCoresLeft]   = useState(TOTAL_CORES);
  const [cipherSeq, setCipherSeq]   = useState('');
  const [cipherInput, setCipherInput] = useState('');
  const [cipherTimeLeft, setCipherTimeLeft] = useState(100); // 0-100 pct
  const [flashMsg, setFlashMsg]     = useState('');

  // ── init game state ──────────────────────────
  const initState = useCallback((lvl = 1) => {
    return {
      phase: PHASE.HACKING,
      level: lvl,
      rings: buildRings(lvl - 1),
      combo: 0,
      score: 0,
      coresHacked: 0,
      cipherStartMs: null,
      cipherSeq: '',
      cipherInput: '',
      pulses: [],            // animated pulses
      particles: [],         // success/fail particles
      flashTimer: 0,
      flashColor: '',
    };
  }, []);

  // ── canvas render loop ───────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s   = stateRef.current;
    if (!s) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    const bg = ctx.createRadialGradient(CX, CY, 20, CX, CY, 280);
    bg.addColorStop(0, '#050d1a');
    bg.addColorStop(1, '#020509');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,255,153,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }

    if (s.phase === PHASE.HACKING || s.phase === PHASE.SUCCESS || s.phase === PHASE.FAIL) {
      drawHackPhase(ctx, s);
    }

    // Particles
    for (const p of s.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Flash overlay
    if (s.flashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.22 * (s.flashTimer / FAIL_FLASH_MS);
      ctx.fillStyle = s.flashColor;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();
    }

    // HUD
    drawHUD(ctx, s);
  }, []);

  // ── draw hacking rings ───────────────────────
  function drawHackPhase(ctx, s) {
    // Core glow
    const coreGlow = ctx.createRadialGradient(CX, CY, 0, CX, CY, 28);
    coreGlow.addColorStop(0, 'rgba(0,255,153,1)');
    coreGlow.addColorStop(0.5, 'rgba(0,255,153,0.4)');
    coreGlow.addColorStop(1, 'rgba(0,255,153,0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(CX, CY, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#001a0a';
    ctx.beginPath();
    ctx.arc(CX, CY, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00ff99';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CORE', CX, CY);

    // Firewall rings
    for (const ring of s.rings) {
      const full = Math.PI * 2;
      const gapStart = ring.angle - ring.gapSize / 2;
      const gapEnd   = ring.angle + ring.gapSize / 2;

      // Blocked arc (the firewall)
      ctx.save();
      ctx.shadowColor = ring.color;
      ctx.shadowBlur  = 18;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth   = 9;
      ctx.beginPath();
      ctx.arc(CX, CY, ring.radius, gapEnd, gapStart + full);
      ctx.stroke();
      ctx.restore();

      // Gap indicator tick marks
      for (const angle of [gapStart, gapEnd]) {
        const ex = CX + Math.cos(angle) * ring.radius;
        const ey = CY + Math.sin(angle) * ring.radius;
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Arrow showing direction
      const arrowAngle = ring.angle + ring.speed * 60;
      const ax = CX + Math.cos(arrowAngle) * (ring.radius + 14);
      const ay = CY + Math.sin(arrowAngle) * (ring.radius + 14);
      ctx.save();
      ctx.fillStyle = ring.color;
      ctx.globalAlpha = 0.7;
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ring.direction > 0 ? '↻' : '↺', ax, ay);
      ctx.restore();
    }

    // Animated pulses
    for (const p of s.pulses) {
      ctx.save();
      ctx.strokeStyle = '#00ff99';
      ctx.shadowColor  = '#00ff99';
      ctx.shadowBlur   = 20;
      ctx.lineWidth    = 3;
      ctx.globalAlpha  = p.alpha;
      ctx.beginPath();
      ctx.arc(CX, CY, p.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Aim crosshair at top (12 o'clock = fire direction)
    const aimAngle = -Math.PI / 2; // always fires up
    const outerR = (s.rings.at(-1)?.radius ?? 60) + 30;
    const ax = CX + Math.cos(aimAngle) * outerR;
    const ay = CY + Math.sin(aimAngle) * outerR;
    ctx.save();
    ctx.strokeStyle = '#ffe600';
    ctx.shadowColor = '#ffe600';
    ctx.shadowBlur  = 14;
    ctx.lineWidth   = 2;
    // crosshair lines
    ctx.beginPath(); ctx.moveTo(ax - 10, ay); ctx.lineTo(ax + 10, ay); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay - 10); ctx.lineTo(ax, ay + 10); ctx.stroke();
    ctx.restore();
  }

  function drawHUD(ctx, s) {
    ctx.save();
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00ff99';
    ctx.shadowColor = '#00ff99';
    ctx.shadowBlur = 8;
    ctx.fillText(`SCORE: ${s.score}`, 14, 24);
    ctx.fillText(`LVL: ${s.level}`, 14, 44);
    ctx.fillStyle = '#bf00ff';
    ctx.shadowColor = '#bf00ff';
    ctx.fillText(`COMBO ×${s.combo}`, 14, 64);

    // cores
    ctx.textAlign = 'right';
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.fillText(`CORES: ${TOTAL_CORES - s.coresHacked}/${TOTAL_CORES}`, CANVAS_W - 14, 24);
    ctx.restore();
  }

  // ── game tick ────────────────────────────────
  const tick = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;

    if (s.phase === PHASE.HACKING) {
      stepRings(s.rings);
    }

    // update pulses
    s.pulses = s.pulses
      .map(p => ({ ...p, r: p.r + 5, alpha: p.alpha - 0.06 }))
      .filter(p => p.alpha > 0);

    // update particles
    s.particles = s.particles
      .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, alpha: p.alpha - 0.03, r: p.r * 0.96 }))
      .filter(p => p.alpha > 0);

    // flash timer
    if (s.flashTimer > 0) s.flashTimer -= 16;

    render();
    rafRef.current = requestAnimationFrame(tick);
  }, [render]);

  // ── spawn particles ──────────────────────────
  function spawnParticles(cx, cy, color, count = 18) {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      s.particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 3 + Math.random() * 4,
        alpha: 1,
        color,
      });
    }
  }

  // ── fire pulse (player action) ───────────────
  const firePulse = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase !== PHASE.HACKING) return;

    playClick(audioCtx.current);

    const pulseAngle = -Math.PI / 2; // 12 o'clock
    const result = checkPulse(s.rings, pulseAngle);

    s.pulses.push({ r: 10, alpha: 1 });

    if (result.success) {
      // core breached!
      playSuccess(audioCtx.current);
      spawnParticles(CX, CY, '#00ff99', 24);
      s.coresHacked += 1;
      s.combo += 1;

      const bonus = calcScore({ level: s.level, combo: s.combo, cipherBonus: 0 });
      s.score += bonus;

      setScore(s.score);
      setCombo(s.combo);
      setCoresLeft(TOTAL_CORES - s.coresHacked);
      setFlashMsg(`✔ BREACH +${bonus}`);

      if (s.coresHacked >= TOTAL_CORES) {
        // game won
        s.phase = PHASE.WIN;
        setUiPhase(PHASE.WIN);
        playVictory(audioCtx.current);
        if (onVictory) onVictory({ score: s.score });
        if (onAddCoins) onAddCoins(Math.floor(s.score / 10));
        cancelAnimationFrame(rafRef.current);
        return;
      }

      // enter cipher phase
      const seq = generateCipher(4 + Math.floor(s.level / 2));
      s.cipherSeq   = seq;
      s.cipherInput = '';
      s.cipherStartMs = performance.now();
      s.phase = PHASE.CIPHER;
      setCipherSeq(seq);
      setCipherInput('');
      setCipherTimeLeft(100);
      setUiPhase(PHASE.CIPHER);
    } else {
      // miss — ring blocked
      playFail(audioCtx.current);
      spawnParticles(CX, CY, '#ff0055', 16);
      s.combo = 0;
      s.flashTimer = FAIL_FLASH_MS;
      s.flashColor  = '#ff0000';
      setCombo(0);
      setFlashMsg('✘ BLOCKED');
    }
  }, [onAddCoins, onVictory]);

  // ── cipher key press ─────────────────────────
  const handleCipherKey = useCallback((char) => {
    const s = stateRef.current;
    if (!s || s.phase !== PHASE.CIPHER) return;

    playCipherKey(audioCtx.current);
    const next = s.cipherInput + char;
    s.cipherInput = next;
    setCipherInput(next);

    if (next.length >= s.cipherSeq.length) {
      const elapsed = performance.now() - s.cipherStartMs;
      const bonus   = cipherScore(elapsed, CIPHER_MAX_MS);
      const totalBonus = bonus * 2;

      if (next === s.cipherSeq) {
        playSuccess(audioCtx.current);
        s.score += totalBonus;
        setScore(s.score);
        setFlashMsg(`🔓 CIPHER +${totalBonus}`);
        spawnParticles(CX, CY, '#bf00ff', 20);
      } else {
        playFail(audioCtx.current);
        s.combo = Math.max(0, s.combo - 1);
        setCombo(s.combo);
        setFlashMsg('✘ CIPHER FAIL');
      }

      // advance level, back to hacking
      s.level += 1;
      s.rings = buildRings(s.level - 1);
      s.phase = PHASE.HACKING;
      setLevel(s.level);
      setUiPhase(PHASE.HACKING);
      setCipherSeq('');
      setCipherInput('');
    }
  }, []);

  // cipher timeout ticker (separate interval)
  useEffect(() => {
    if (uiPhase !== PHASE.CIPHER) return;
    const interval = setInterval(() => {
      const s = stateRef.current;
      if (!s || s.phase !== PHASE.CIPHER) { clearInterval(interval); return; }
      const elapsed = performance.now() - s.cipherStartMs;
      const pct     = Math.max(0, 100 - (elapsed / CIPHER_MAX_MS) * 100);
      setCipherTimeLeft(pct);
      if (pct <= 0) {
        clearInterval(interval);
        playFail(audioCtx.current);
        s.combo = Math.max(0, s.combo - 1);
        s.level += 1;
        s.rings  = buildRings(s.level - 1);
        s.phase  = PHASE.HACKING;
        setCombo(s.combo);
        setLevel(s.level);
        setUiPhase(PHASE.HACKING);
        setFlashMsg('⏱ TIMEOUT');
      }
    }, 60);
    return () => clearInterval(interval);
  }, [uiPhase]);

  // flash message auto-clear
  useEffect(() => {
    if (!flashMsg) return;
    const t = setTimeout(() => setFlashMsg(''), 1200);
    return () => clearTimeout(t);
  }, [flashMsg]);

  // ── keyboard handler ─────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        firePulse();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [firePulse]);

  // ── start / cleanup ───────────────────────────
  const startGame = useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = createAudioCtx();
    }
    const s = initState(1);
    stateRef.current = s;
    setUiPhase(PHASE.HACKING);
    setScore(0);
    setLevel(1);
    setCombo(0);
    setCoresLeft(TOTAL_CORES);
    setCipherSeq('');
    setCipherInput('');
    setFlashMsg('');
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [initState, tick]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (audioCtx.current) {
        audioCtx.current.close();
        audioCtx.current = null;
      }
    };
  }, []);

  // ── CIPHER KEYBOARD GRID ─────────────────────
  const CIPHER_KEYS = '0123456789ABCDEF'.split('');

  // ── RENDER ───────────────────────────────────
  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>☠ NEON HACKER</span>
        <span style={styles.subtitle}>Кіберпанк-взломщик фаєрволів</span>
      </div>

      {/* Canvas */}
      <div style={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={styles.canvas}
          onClick={uiPhase === PHASE.HACKING ? firePulse : undefined}
        />

        {/* Flash message overlay */}
        {flashMsg && (
          <div style={styles.flashMsg}>{flashMsg}</div>
        )}

        {/* IDLE / START screen */}
        {uiPhase === PHASE.IDLE && (
          <div style={styles.overlay}>
            <div style={styles.overlayCard}>
              <div style={styles.bigIcon}>💻</div>
              <h2 style={styles.overlayTitle}>NEON HACKER</h2>
              <p style={styles.overlayDesc}>
                Зламай <strong style={{color:'#00ff99'}}>{TOTAL_CORES} фаєрволів</strong>, стріляй імпульсом<br/>
                через проміжки в кільцях. Потім зламай шифр терміналу!
              </p>
              <p style={styles.controls}>⌨ Space / Enter або 🖱 Клік — запустити імпульс</p>
              <button style={styles.startBtn} onClick={startGame}>▶ ПОЧАТИ ЗЛом</button>
            </div>
          </div>
        )}

        {/* WIN screen */}
        {uiPhase === PHASE.WIN && (
          <div style={styles.overlay}>
            <div style={{...styles.overlayCard, borderColor:'#00ff99'}}>
              <div style={styles.bigIcon}>🏆</div>
              <h2 style={{...styles.overlayTitle, color:'#00ff99'}}>СИСТЕМА ЗЛАМАНА!</h2>
              <p style={styles.overlayDesc}>Фінальний рахунок: <strong style={{color:'#ffe600'}}>{score}</strong></p>
              <button style={{...styles.startBtn, background:'rgba(0,255,153,0.15)', borderColor:'#00ff99'}}
                onClick={startGame}>↺ Грати ще</button>
            </div>
          </div>
        )}
      </div>

      {/* Cipher terminal panel */}
      {uiPhase === PHASE.CIPHER && (
        <div style={styles.cipherPanel}>
          <div style={styles.cipherTitle}>🔐 ВВЕДИ ШИФР ТЕРМІНАЛУ</div>

          {/* timer bar */}
          <div style={styles.timerBarWrap}>
            <div style={{
              ...styles.timerBar,
              width: `${cipherTimeLeft}%`,
              background: cipherTimeLeft > 50 ? '#00ff99' : cipherTimeLeft > 25 ? '#ffe600' : '#ff0055',
            }}/>
          </div>

          {/* expected vs typed */}
          <div style={styles.cipherDisplay}>
            {cipherSeq.split('').map((ch, i) => (
              <span key={i} style={{
                ...styles.cipherChar,
                color: i < cipherInput.length
                  ? (cipherInput[i] === ch ? '#00ff99' : '#ff0055')
                  : '#aaaaaa',
                textShadow: i < cipherInput.length && cipherInput[i] === ch
                  ? '0 0 10px #00ff99' : 'none',
              }}>{ch}</span>
            ))}
          </div>

          {/* hex keyboard */}
          <div style={styles.hexGrid}>
            {CIPHER_KEYS.map(k => (
              <button key={k} style={styles.hexKey} onClick={() => handleCipherKey(k)}>
                {k}
              </button>
            ))}
            <button style={{...styles.hexKey, gridColumn:'span 2', color:'#ff0055'}}
              onClick={() => {
                const s = stateRef.current;
                if (s) { s.cipherInput = ''; }
                setCipherInput('');
              }}>⌫ CLR</button>
          </div>
        </div>
      )}

      {/* Bottom controls hint */}
      {uiPhase === PHASE.HACKING && (
        <div style={styles.hint}>
          🖱 <strong>Клік на Canvas</strong> або <strong>Space / Enter</strong> — запустити імпульс через проміжок
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// INLINE STYLES (no external CSS needed)
// ─────────────────────────────────────────────
const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#020509',
    minHeight: '100%',
    padding: '12px 8px 20px',
    fontFamily: 'monospace',
    userSelect: 'none',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ff99',
    textShadow: '0 0 16px #00ff99',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#bf00ff',
    letterSpacing: 2,
    marginTop: 2,
  },
  canvasWrap: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    border: '2px solid rgba(0,255,153,0.3)',
    boxShadow: '0 0 40px rgba(0,255,153,0.12)',
  },
  canvas: {
    display: 'block',
    cursor: 'crosshair',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(2,5,9,0.85)',
  },
  overlayCard: {
    border: '2px solid rgba(191,0,255,0.5)',
    borderRadius: 12,
    padding: '28px 36px',
    textAlign: 'center',
    background: 'rgba(5,13,26,0.96)',
    maxWidth: 360,
  },
  bigIcon: { fontSize: 48, marginBottom: 8 },
  overlayTitle: {
    color: '#bf00ff',
    textShadow: '0 0 18px #bf00ff',
    fontSize: 22,
    letterSpacing: 3,
    margin: '0 0 12px',
  },
  overlayDesc: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 1.6,
    marginBottom: 14,
  },
  controls: {
    color: '#00f3ff',
    fontSize: 12,
    marginBottom: 18,
  },
  startBtn: {
    background: 'rgba(191,0,255,0.15)',
    border: '2px solid #bf00ff',
    color: '#bf00ff',
    borderRadius: 8,
    padding: '10px 28px',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 2,
    cursor: 'pointer',
    fontFamily: 'monospace',
    transition: 'all 0.2s',
  },
  flashMsg: {
    position: 'absolute',
    top: '42%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffe600',
    textShadow: '0 0 20px #ffe600',
    pointerEvents: 'none',
    letterSpacing: 2,
    whiteSpace: 'nowrap',
  },
  cipherPanel: {
    marginTop: 14,
    width: CANVAS_W,
    background: 'rgba(5,13,26,0.95)',
    border: '2px solid rgba(191,0,255,0.4)',
    borderRadius: 10,
    padding: '14px 18px',
  },
  cipherTitle: {
    color: '#bf00ff',
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 10,
    textShadow: '0 0 10px #bf00ff',
    textAlign: 'center',
  },
  timerBarWrap: {
    height: 6,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  timerBar: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.06s linear, background 0.3s',
  },
  cipherDisplay: {
    display: 'flex',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cipherChar: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
    minWidth: 24,
    textAlign: 'center',
  },
  hexGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 6,
  },
  hexKey: {
    background: 'rgba(0,255,153,0.08)',
    border: '1px solid rgba(0,255,153,0.3)',
    color: '#00ff99',
    borderRadius: 6,
    padding: '9px 0',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    color: '#555',
    letterSpacing: 1,
  },
};
