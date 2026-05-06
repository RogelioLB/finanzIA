export const THEME_DARK = {
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceAlt: '#1C1C1E',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.13)',
  text: '#FAFAFA',
  textSec: 'rgba(250,250,250,0.62)',
  textTer: 'rgba(250,250,250,0.38)',
  divider: 'rgba(255,255,255,0.06)',
  good: '#3DDC84',
  bad: '#FF6B6B',
  fabShadow: '0 10px 28px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.4)',
  navBg: 'rgba(20,20,20,0.92)',
  isDark: true,
};

export const THEME_LIGHT = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F4F5',
  border: 'rgba(0,0,0,0.07)',
  borderStrong: 'rgba(0,0,0,0.12)',
  text: '#0A0A0A',
  textSec: 'rgba(10,10,10,0.62)',
  textTer: 'rgba(10,10,10,0.40)',
  divider: 'rgba(0,0,0,0.06)',
  good: '#0F8A3F',
  bad: '#D14343',
  fabShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
  navBg: 'rgba(255,255,255,0.92)',
  isDark: false,
};

export type Theme = typeof THEME_DARK;

export const ACCENT_PALETTE = [
  '#FF6B35',
  '#0A84FF',
  '#34C759',
  '#AF52DE',
  '#FF375F',
  '#FFCC00',
  '#5AC8FA',
  '#A78BFA',
  '#F472B6',
  '#10B981',
  '#F59E0B',
  '#FAFAFA',
];

export function getFabContrast(hex: string): string {
  if (!hex) return '#fff';
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.65 ? '#0A0A0A' : '#FFFFFF';
}

export function getTheme(mode: 'dark' | 'light'): Theme {
  return mode === 'light' ? THEME_LIGHT : THEME_DARK;
}