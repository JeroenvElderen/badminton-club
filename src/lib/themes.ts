export const THEMES = {
  emerald: { id: 'emerald', name: 'Riverside Emerald', isDark: true, background: '#031B16', surface: '#05251E', tile: '#092D26', border: '#12483D', text: '#F6FBF8', muted: '#A6B8B1', accent: '#00D995', accentSoft: '#78DCC0' },
  sapphire: { id: 'sapphire', name: 'Midnight Sapphire', isDark: true, background: '#091426', surface: '#101F36', tile: '#152742', border: '#294363', text: '#F6FBF8', muted: '#B4C5DA', accent: '#579BFF', accentSoft: '#B4D1FF' },
  amethyst: { id: 'amethyst', name: 'Royal Amethyst', isDark: true, background: '#170E25', surface: '#211532', tile: '#2B1B40', border: '#503566', text: '#F6FBF8', muted: '#C6B4DA', accent: '#BB8AFF', accentSoft: '#DDC1FF' },
  crimson: { id: 'crimson', name: 'Crimson Court', isDark: true, background: '#210F16', surface: '#2B1520', tile: '#381B27', border: '#633245', text: '#F6FBF8', muted: '#D7B4BF', accent: '#FF637C', accentSoft: '#FFC0CB' },
  golden: { id: 'golden', name: 'Golden Rally', isDark: true, background: '#201A0D', surface: '#2A2112', tile: '#342A17', border: '#5C4B29', text: '#F6FBF8', muted: '#D7C9A6', accent: '#EFC66C', accentSoft: '#FFE5A9' },
  arctic: { id: 'arctic', name: 'Arctic Light', isDark: false, background: '#F2F6FA', surface: '#FFFFFF', tile: '#E7EFF6', border: '#D3E0EB', text: '#142A3C', muted: '#61768A', accent: '#2579C7', accentSoft: '#52677C' },
} as const;

export type ThemeId = keyof typeof THEMES;
export type AppTheme = (typeof THEMES)[ThemeId];
export const DEFAULT_THEME: ThemeId = 'emerald';
export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(THEMES, value);
