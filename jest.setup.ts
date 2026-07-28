/**
 * Jest setup — docs/TESTING.md §2.
 * Bütün platform mock-ları burada qurulur ki, domain testləri təmiz və sürətli qalsın.
 */

// RNTL 14-də jest matcher-ləri (toBeOnTheScreen və s.) default aktivdir —
// ayrıca extend-expect importu tələb olunmur.

// --- Reanimated + Worklets ---
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// --- Gesture Handler ---
require('react-native-gesture-handler/jestSetup');

// --- Skia ---
// Render testi aparılmır (docs/TESTING.md §1) — yalnız mount üçün mock.
jest.mock('@shopify/react-native-skia', () => require('@shopify/react-native-skia/jestSetup'));

// --- Haptics ---
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// --- Audio ---
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    volume: 1,
    loop: false,
  })),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  useAudioPlayer: jest.fn(() => ({ play: jest.fn(), pause: jest.fn() })),
}));

// --- Localization ---
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-US' }],
  getCalendars: () => [],
}));

// --- SQLite ---
// Testlərdə heç vaxt istifadə edilmir; MemoryStorageAdapter ilə əvəzlənir
// (docs/DECISIONS.md §15). Təsadüfi import olarsa dərhal görünsün deyə throw edir.
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => {
    throw new Error('Testlərdə expo-sqlite istifadə edilmir — MemoryStorageAdapter istifadə et.');
  }),
}));

// Test çıxışını təmiz saxlamaq üçün gözlənilən RN warning-ləri susdur.
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const message = String(args[0] ?? '');
  if (message.includes('useNativeDriver')) return;
  originalWarn(...(args as Parameters<typeof console.warn>));
};
