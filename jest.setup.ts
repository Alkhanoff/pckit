/**
 * Jest setup — docs/TESTING.md §2.
 * Bütün platform mock-ları burada qurulur ki, domain testləri təmiz və sürətli qalsın.
 */

// RNTL 14-də jest matcher-ləri (toBeOnTheScreen və s.) default aktivdir —
// ayrıca extend-expect importu tələb olunmur.

// --- Worklets ---
// `react-native-worklets` Jest-də native modulu yükləməyə çalışır və
// `loadUnpackers` xətası verir. Yalnız lazım olan funksiyalar mock edilir.
jest.mock('react-native-worklets', () => ({
  runOnJS: (fn: unknown) => fn,
  runOnUI: (fn: unknown) => fn,
  scheduleOnRN: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn(...args),
  createWorkletRuntime: () => ({}),
}));

// --- Reanimated ---
// Paketin öz `react-native-reanimated/mock` faylı Reanimated 4 ilə işləmir
// (o da worklets native modulunu çəkir). Buna görə minimal öz mock-umuz.
jest.mock('react-native-reanimated', () => {
  const { View, Text, ScrollView } = require('react-native');

  const shared = <T>(initial: T) => ({ value: initial });

  return {
    __esModule: true,
    default: { View, Text, ScrollView, createAnimatedComponent: (c: unknown) => c },
    View,
    Text,
    ScrollView,
    createAnimatedComponent: (c: unknown) => c,

    useSharedValue: shared,
    useDerivedValue: (fn: () => unknown) => shared(fn()),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    useAnimatedProps: (fn: () => unknown) => fn(),

    withTiming: (value: unknown) => value,
    withSpring: (value: unknown) => value,
    withDelay: (_delay: number, value: unknown) => value,
    interpolate: (value: number) => value,

    runOnJS: (fn: unknown) => fn,
    runOnUI: (fn: unknown) => fn,

    Easing: {
      linear: (t: number) => t,
      cubic: (t: number) => t,
      out: (fn: unknown) => fn,
      inOut: (fn: unknown) => fn,
    },
    Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  };
});

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
