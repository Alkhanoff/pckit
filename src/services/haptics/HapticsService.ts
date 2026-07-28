import * as Haptics from 'expo-haptics';

import type { HapticType } from './intentHaptics';

/**
 * Haptic servisi.
 *
 * Komponentlər `expo-haptics`-i BİRBAŞA import etmir (docs/ARCHITECTURE.md §8).
 * Dəstəklənməyən cihazda və web-də təhlükəsiz no-op — gameplay pozulmur.
 */

let enabled = true;

export function setHapticsEnabled(next: boolean): void {
  enabled = next;
}

export function isHapticsEnabled(): boolean {
  return enabled;
}

export function trigger(type: HapticType): void {
  if (!enabled) return;

  try {
    switch (type) {
      case 'light':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      case 'medium':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      case 'heavy':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        return;
      case 'selection':
        void Haptics.selectionAsync();
        return;
      case 'success':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      case 'warning':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      case 'error':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
    }
  } catch {
    // Web və köhnə cihazlar — haptic yoxdursa oyun davam edir.
  }
}
