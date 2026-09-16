/**
 * Duck Verse — Hub Themes System (SCRUM-33)
 * Конфігурація тем хабу: Cyberpunk (default), Space, Arcade
 */

export const THEMES = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    icon: '⚡',
    desc: 'Класика Duck Verse — неонові блакитні акценти на темному тлі.',
    locked: false,
    unlockHint: null,
    vars: {
      '--bg-primary': '#080c14',
      '--bg-secondary': '#0a0f1a',
      '--bg-card': '#0d1424',
      '--primary': '#0284c7',
      '--primary-hover': '#0ea5e9',
      '--accent': '#38bdf8',
      '--accent-glow': 'rgba(56,189,248,0.18)',
      '--border-subtle': 'rgba(56,189,248,0.12)',
      '--border-hover': 'rgba(56,189,248,0.3)',
      '--text-main': '#e2e8f0',
      '--text-muted': '#94a3b8',
      '--text-dim': '#64748b',
    },
  },
  {
    id: 'space',
    name: 'Deep Space',
    icon: '🚀',
    desc: 'Фіолетові зоряні відтінки — для тих, хто прагне нескінченності.',
    locked: false,
    unlockHint: null,
    vars: {
      '--bg-primary': '#07050f',
      '--bg-secondary': '#0b0818',
      '--bg-card': '#100d1e',
      '--primary': '#7c3aed',
      '--primary-hover': '#8b5cf6',
      '--accent': '#a78bfa',
      '--accent-glow': 'rgba(167,139,250,0.18)',
      '--border-subtle': 'rgba(167,139,250,0.14)',
      '--border-hover': 'rgba(167,139,250,0.35)',
      '--text-main': '#ede9fe',
      '--text-muted': '#a78bfa',
      '--text-dim': '#7c3aed',
    },
  },
  {
    id: 'arcade',
    name: 'Retro Arcade',
    icon: '🕹️',
    desc: 'Помаранчево-зелений ретро-стиль на честь старих автоматів.',
    locked: false,
    unlockHint: null,
    vars: {
      '--bg-primary': '#0a0800',
      '--bg-secondary': '#0f0d02',
      '--bg-card': '#141100',
      '--primary': '#d97706',
      '--primary-hover': '#f59e0b',
      '--accent': '#fbbf24',
      '--accent-glow': 'rgba(251,191,36,0.18)',
      '--border-subtle': 'rgba(251,191,36,0.14)',
      '--border-hover': 'rgba(251,191,36,0.35)',
      '--text-main': '#fef3c7',
      '--text-muted': '#fde68a',
      '--text-dim': '#d97706',
    },
  },
  {
    id: 'neon_green',
    name: 'Neon Matrix',
    icon: '🟩',
    desc: 'Зелений матриць-стиль. Відкривається після 5 ігор.',
    locked: true,
    unlockHint: 'Зіграй 5 ігор, щоб розблокувати цю тему.',
    vars: {
      '--bg-primary': '#020d02',
      '--bg-secondary': '#041204',
      '--bg-card': '#061806',
      '--primary': '#16a34a',
      '--primary-hover': '#22c55e',
      '--accent': '#4ade80',
      '--accent-glow': 'rgba(74,222,128,0.18)',
      '--border-subtle': 'rgba(74,222,128,0.14)',
      '--border-hover': 'rgba(74,222,128,0.35)',
      '--text-main': '#dcfce7',
      '--text-muted': '#86efac',
      '--text-dim': '#16a34a',
    },
  },
];

const STORAGE_KEY = 'duckverse_theme';

export function loadTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'cyberpunk';
  } catch {
    return 'cyberpunk';
  }
}

export function saveTheme(themeId) {
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {}
}

export function applyTheme(themeId) {
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute('data-theme', themeId);
}
