/**
 * Duck Verse — Neon Hacker Engine (SCRUM-19)
 * Математика кілець фаєрволів, логіка зламу шифрів, аудіо.
 */

// ─────────────────────────────────────────────
// FIREWALL RING CONFIGURATION
// ─────────────────────────────────────────────

/**
 * Build ring descriptors for a given level (0-based).
 * Each ring: { radius, speed (rad/frame), angle, gapSize (rad), direction }
 */
export function buildRings(level) {
  const ringCount = Math.min(2 + level, 6);
  const rings = [];

  for (let i = 0; i < ringCount; i++) {
    const dir = i % 2 === 0 ? 1 : -1; // alternate directions
    const baseSpeed = 0.012 + level * 0.004 + i * 0.003;
    rings.push({
      radius: 60 + i * 48,
      speed: baseSpeed * dir,
      angle: Math.random() * Math.PI * 2,
      // gap shrinks each level: starts at 1.1 rad, min 0.45 rad
      gapSize: Math.max(0.45, 1.1 - level * 0.06 - i * 0.04),
      direction: dir,
      color: i % 3 === 0 ? '#00ff99' : i % 3 === 1 ? '#bf00ff' : '#00f3ff',
    });
  }
  return rings;
}

/**
 * Advance all ring angles by one frame.
 */
export function stepRings(rings) {
  for (const r of rings) {
    r.angle += r.speed;
  }
}

/**
 * Check if angle `a` falls inside the gap of ring `r`.
 * Gap is centred at r.angle; opening spans r.gapSize radians.
 */
export function isInsideGap(ring, testAngle) {
  const half = ring.gapSize / 2;
  let diff = ((testAngle - ring.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  return Math.abs(diff) < half;
}

/**
 * When the player fires a pulse, check it passes through every ring gap.
 * Returns { success: boolean, failedRing: number | null }
 */
export function checkPulse(rings, pulseAngle) {
  for (let i = 0; i < rings.length; i++) {
    if (!isInsideGap(rings[i], pulseAngle)) {
      return { success: false, failedRing: i };
    }
  }
  return { success: true, failedRing: null };
}

// ─────────────────────────────────────────────
// CIPHER SEQUENCE (terminal mini-game)
// ─────────────────────────────────────────────

const CIPHER_CHARS = '0123456789ABCDEF';

/**
 * Generate a random cipher sequence of given length.
 */
export function generateCipher(length = 6) {
  return Array.from({ length }, () =>
    CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)]
  ).join('');
}

/**
 * Score for cipher timing: returns 0-100 based on how fast player finished.
 * timeMs: elapsed ms, maxMs: allowed ms.
 */
export function cipherScore(timeMs, maxMs) {
  return Math.max(0, Math.round(100 * (1 - timeMs / maxMs)));
}

// ─────────────────────────────────────────────
// SCORING
// ─────────────────────────────────────────────

export function calcScore({ level, combo, cipherBonus }) {
  return (level * 100 + combo * 25 + cipherBonus) * Math.max(1, combo);
}

// ─────────────────────────────────────────────
// WEB AUDIO HELPERS
// ─────────────────────────────────────────────

export function createAudioCtx() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(ctx, freq, type, gainVal, duration, startTime = 0) {
  if (!ctx) return;
  const now = ctx.currentTime + startTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(gainVal, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export function playSuccess(ctx) {
  playTone(ctx, 440, 'sine', 0.18, 0.12);
  playTone(ctx, 660, 'sine', 0.14, 0.1, 0.12);
  playTone(ctx, 880, 'triangle', 0.1, 0.18, 0.22);
}

export function playFail(ctx) {
  playTone(ctx, 120, 'sawtooth', 0.22, 0.25);
  playTone(ctx, 80, 'square', 0.15, 0.2, 0.1);
}

export function playClick(ctx) {
  playTone(ctx, 1200, 'square', 0.08, 0.04);
}

export function playCipherKey(ctx) {
  const freq = 300 + Math.random() * 600;
  playTone(ctx, freq, 'triangle', 0.1, 0.05);
}

export function playVictory(ctx) {
  [523, 659, 784, 1047].forEach((f, i) =>
    playTone(ctx, f, 'sine', 0.15, 0.18, i * 0.15)
  );
}
