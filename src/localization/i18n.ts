import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import en from './en.json';

/**
 * Localization.
 * MVP dili: English. Sonrakılar: az, tr, ru — docs/DECISIONS.md §19.
 * Görünən mətn komponentlərdə hardcode edilmir.
 */

export const i18n = new I18n({ en });

i18n.defaultLocale = 'en';
i18n.enableFallback = true;

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = deviceLocale in i18n.translations ? deviceLocale : 'en';

/** Tərcümə açarını mətnə çevirir. */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

export function setLocale(locale: string): void {
  i18n.locale = locale in i18n.translations ? locale : 'en';
}
