/**
 * Design token-lər.
 * Bax: docs/DECISIONS.md, Gameplay reference §1 — yumşaq bej, ağ, mavi-boz, pastel.
 * Komponentlərdə rəng və ölçü hardcode edilmir.
 */

export const colors = {
  // Fon və səthlər
  background: '#F3EDE3',
  surface: '#FBF7F1',
  surfaceRaised: '#FFFFFF',
  table: '#E8DFD1',

  // Mətn
  textPrimary: '#2E2A24',
  textSecondary: '#6B6259',
  textMuted: '#9A9086',
  textInverse: '#FFFFFF',

  // Vurğu
  accent: '#7C97A8',
  accentStrong: '#5A7A8D',
  accentSoft: '#D6E2E9',

  // Tension vəziyyətləri (docs/BALANCE.md §2)
  tensionLoose: '#C9B896',
  tensionOptimal: '#7FA88C',
  tensionOverstretched: '#C98A80',

  // Nəticə səviyyələri
  resultPerfect: '#7FA88C',
  resultGood: '#7C97A8',
  resultAcceptable: '#C9B896',

  // Kölgə
  shadow: '#2E2A24',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '500' },
} as const;

/** Minimum toxunma sahəsi — docs/reference UI prinsipləri: böyük touch zonaları */
export const MIN_TOUCH_SIZE = 48;

export const theme = { colors, spacing, radius, typography, MIN_TOUCH_SIZE } as const;
