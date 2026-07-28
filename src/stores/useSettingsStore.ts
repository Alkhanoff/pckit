import { create } from 'zustand';

import type { SettingsData } from '@/database/schema';

/** Audio, haptic və accessibility seçimləri. Persist edilir. */
type SettingsStore = SettingsData & {
  toggle: (key: 'music' | 'sound' | 'haptics' | 'reduceMotion') => void;
  setLocale: (locale: string) => void;
  hydrate: (data: SettingsData) => void;
  toData: () => SettingsData;
};

const initial: SettingsData = {
  music: true,
  sound: true,
  haptics: true,
  reduceMotion: false,
  locale: 'en',
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...initial,

  toggle: (key) => set((s) => ({ [key]: !s[key] }) as Partial<SettingsData>),

  setLocale: (locale) => set({ locale }),

  hydrate: (data) => set({ ...data }),

  toData: () => {
    const { music, sound, haptics, reduceMotion, locale } = get();
    return { music, sound, haptics, reduceMotion, locale };
  },
}));

export const resetSettingsStore = () => useSettingsStore.setState({ ...initial });
