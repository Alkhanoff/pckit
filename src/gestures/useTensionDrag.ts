import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { OVERSTRETCH_WARNING_COOLDOWN_MS, TENSION_DEBOUNCE_MS } from '@/config/balance';
import { emitIntent } from '@/gestures/intentBridge';
import {
  BAND_OPTIMAL,
  bandToTensionState,
  distance,
  normalizedTension,
  shouldEmitBandChange,
  shouldWarnOverstretch,
  tensionBandIndex,
} from '@/utils/gestureMath';

/**
 * Materialı tutub dartmaq.
 *
 * Bütün real-time dəyərlər shared value-larda qalır — React state HEÇ VAXT
 * yenilənmir. JS qatına yalnız band dəyişikliyi göndərilir və o da
 * debounce ilə (docs/DECISIONS.md §14).
 */

export type TensionDragConfig = {
  /** Optimal dartılmaya çatmaq üçün lazım olan drag məsafəsi (px) */
  referenceDistance: number;
  enabled?: boolean;
};

export type TensionDragState = {
  gesture: GestureType;
  /** 0–1 normallaşdırılmış gərginlik */
  tension: SharedValue<number>;
  /** 0 loose · 1 optimal · 2 overstretched */
  band: SharedValue<number>;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  active: SharedValue<boolean>;
};

export function useTensionDrag({
  referenceDistance,
  enabled = true,
}: TensionDragConfig): TensionDragState {
  const tension = useSharedValue(0);
  const band = useSharedValue(BAND_OPTIMAL);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const active = useSharedValue(false);

  // Debounce vəziyyəti də UI thread-də saxlanılır ki, körpü keçilməsin.
  const lastEmitAt = useSharedValue(0);
  const lastWarnAt = useSharedValue(0);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .onBegin(() => {
          'worklet';
          active.value = true;
          emitIntent({ type: 'materialGrabbed' });
        })
        .onUpdate((event) => {
          'worklet';
          dragX.value = event.translationX;
          dragY.value = event.translationY;

          const pulled = distance(event.translationX, event.translationY);
          const next = normalizedTension(pulled, referenceDistance);
          tension.value = next;

          const nextBand = tensionBandIndex(next);
          const now = Date.now();

          if (
            shouldEmitBandChange(band.value, nextBand, lastEmitAt.value, now, TENSION_DEBOUNCE_MS)
          ) {
            lastEmitAt.value = now;
            band.value = nextBand;
            emitIntent({ type: 'tensionStateChanged', tension: bandToTensionState(nextBand) });
          }

          if (
            shouldWarnOverstretch(nextBand, lastWarnAt.value, now, OVERSTRETCH_WARNING_COOLDOWN_MS)
          ) {
            lastWarnAt.value = now;
            // Xəbərdarlıq audio/haptic Mərhələ 10-da bura bağlanacaq.
          }
        })
        .onFinalize(() => {
          'worklet';
          active.value = false;
          emitIntent({ type: 'materialReleased' });
        }),
    [enabled, referenceDistance, active, band, dragX, dragY, tension, lastEmitAt, lastWarnAt],
  );

  return { gesture, tension, band, dragX, dragY, active };
}
