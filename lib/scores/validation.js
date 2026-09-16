/**
 * Duck Verse — Scores API Validation & Security Rules (SCRUM-38)
 */

export const ALLOWED_GAMES = new Set([
  'geometry_dash',
  'neon-hacker',
  'invaders',
  'clicker',
  'flappy',
  'hunter',
]);

export const USERNAME_REGEX = /^[\p{L}\p{N}_\-\s]{2,30}$/u;
export const MAX_PAYLOAD_BYTES = 8192; // 8 KB

export function validateScore(game, score) {
  if (score === null || score === undefined) return false;

  switch (game) {
    case 'geometry_dash': {
      if (typeof score === 'string') {
        const match = score.trim().match(/^(\d{1,3})%$/);
        if (!match) return false;
        const val = parseInt(match[1], 10);
        return val >= 0 && val <= 100;
      }
      if (typeof score === 'number' && Number.isFinite(score)) {
        return score >= 0 && score <= 100;
      }
      return false;
    }
    case 'invaders':
    case 'flappy':
    case 'hunter':
    case 'neon-hacker': {
      const num = typeof score === 'number' ? score : parseInt(String(score).trim(), 10);
      if (!Number.isFinite(num) || isNaN(num)) return false;
      return num >= 0 && num <= 10_000_000;
    }
    case 'clicker': {
      const num = typeof score === 'number' ? score : Number(String(score).trim());
      if (!Number.isFinite(num) || isNaN(num)) return false;
      return num >= 0 && num <= 1_000_000_000_000;
    }
    default:
      return false;
  }
}

export function sanitizeUsername(raw) {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().replace(/\s+/g, ' ');
  if (!USERNAME_REGEX.test(normalized)) return null;
  return normalized;
}
