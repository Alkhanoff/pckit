import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';

import type { GameplayIntent } from '@/domain/gameplay/intents';
import { emitIntent } from '@/gestures/intentBridge';
import { validateSwipe } from '@/utils/gestureMath';

/**
 * İstiqamətli swipe — kəsim və qırış hamarlama üçün.
 *
 * Swipe həm minimum məsafəni keçməli, həm də hədəf oxa uyğun olmalıdır.
 * Uğursuz swipe CƏZALANDIRILMIR — sadəcə heç nə baş vermir.
 */
export type SwipeConfig = {
  /** Hədəf istiqamət: 0° sağa, 90° aşağı */
  targetDirectionDeg: number;
  minDistance: number;
  toleranceDeg: number;
  /** Uğurlu swipe-da göndərilən intent */
  intent: GameplayIntent;
  enabled?: boolean;
};

export function useSwipeGesture({
  targetDirectionDeg,
  minDistance,
  toleranceDeg,
  intent,
  enabled = true,
}: SwipeConfig): GestureType {
  return useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .onEnd((event) => {
          'worklet';
          const check = validateSwipe(
            event.translationX,
            event.translationY,
            targetDirectionDeg,
            minDistance,
            toleranceDeg,
          );
          if (check.valid) emitIntent(intent);
        }),
    [enabled, targetDirectionDeg, minDistance, toleranceDeg, intent],
  );
}
