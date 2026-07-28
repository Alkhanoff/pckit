import type { ExpoConfig } from 'expo/config';

/**
 * Pack & Relax — Expo konfiqurasiyası.
 * Bax: docs/BUILDING.md §5
 */

const APP_NAME = 'Pack & Relax';
const SLUG = 'pack-and-relax';
const BUNDLE_ID = 'com.alkha.packandrelax';
const VERSION = '0.1.0';

const config: ExpoConfig = {
  name: APP_NAME,
  slug: SLUG,
  version: VERSION,
  scheme: 'packandrelax',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  icon: './assets/images/icon.png',
  // SDK 57-də New Architecture defaultdur — ayrıca newArchEnabled bayrağı tələb olunmur.

  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
    requireFullScreen: false,
  },

  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: '#F3EDE3',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // MVP-də heç bir həssas permission tələb olunmur (docs/BUILDING.md §5)
    permissions: [],
  },

  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F3EDE3',
        image: './assets/images/splash-icon.png',
        imageWidth: 160,
      },
    ],
    'expo-audio',
    'expo-sqlite',
    'expo-localization',
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    router: {},
    eas: {
      // `eas init` bunu dolduracaq
    },
  },
};

export default config;
