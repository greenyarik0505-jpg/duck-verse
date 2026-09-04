/**
 * Duck Verse — Skin & Customization Registry (SCRUM-12)
 * Колекція скінів, візорів та трейлів для кубика Geometry Dash.
 */

export const CUBE_SKINS = [
  {
    id: 'neon_green',
    name: 'Classic Neon Green',
    price: 0,
    unlocked: true,
    primaryColor: '#00ff99',
    secondaryColor: '#00e5ff',
    icon: '🟩',
    glowColor: 'rgba(0, 255, 153, 0.8)'
  },
  {
    id: 'cyber_cyan',
    name: 'Cyberpunk Cyan',
    price: 30,
    unlocked: false,
    primaryColor: '#00f3ff',
    secondaryColor: '#0066ff',
    icon: '🟦',
    glowColor: 'rgba(0, 243, 255, 0.8)'
  },
  {
    id: 'magenta_fury',
    name: 'Neon Magenta Fury',
    price: 60,
    unlocked: false,
    primaryColor: '#ff007f',
    secondaryColor: '#99004d',
    icon: '🟪',
    glowColor: 'rgba(255, 0, 127, 0.8)'
  },
  {
    id: 'golden_god',
    name: 'Golden Multiverse God',
    price: 150,
    unlocked: false,
    primaryColor: '#ffe600',
    secondaryColor: '#ff9900',
    icon: '🟨',
    glowColor: 'rgba(255, 230, 0, 0.9)'
  },
  {
    id: 'stealth_void',
    name: 'Stealth Void Matrix',
    price: 250,
    unlocked: false,
    primaryColor: '#222222',
    secondaryColor: '#ff0055',
    icon: '⬛',
    glowColor: 'rgba(255, 0, 85, 0.8)'
  }
];

export function getPlayerSkins() {
  if (typeof window === 'undefined') return CUBE_SKINS;
  const saved = localStorage.getItem('duckverse_skins_unlocked');
  if (!saved) return CUBE_SKINS;
  try {
    const unlockedIds = JSON.parse(saved);
    return CUBE_SKINS.map(s => ({
      ...s,
      unlocked: s.price === 0 || unlockedIds.includes(s.id)
    }));
  } catch {
    return CUBE_SKINS;
  }
}

export function saveUnlockedSkin(skinId) {
  if (typeof window === 'undefined') return;
  const saved = localStorage.getItem('duckverse_skins_unlocked');
  let list = saved ? JSON.parse(saved) : [];
  if (!list.includes(skinId)) {
    list.push(skinId);
    localStorage.setItem('duckverse_skins_unlocked', JSON.stringify(list));
  }
}

export function getActiveSkin() {
  if (typeof window === 'undefined') return CUBE_SKINS[0];
  const activeId = localStorage.getItem('duckverse_active_skin') || 'neon_green';
  return CUBE_SKINS.find(s => s.id === activeId) || CUBE_SKINS[0];
}

export function setActiveSkin(skinId) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('duckverse_active_skin', skinId);
}
