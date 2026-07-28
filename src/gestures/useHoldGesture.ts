import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';

import type { GameplayIntent } from '@/domain/gameplay/intents';
import { emitIntent } from '@/gestures/intentBridge';

/**
 * Basıb saxlamaq — təzyiq tələb edən əməliyyatlar (folqa sıxma, möhür).
 */
export type HoldConfig = {
  /** Aktivləşmə üçün lazım olan müddət (ms) */
  durationMs: number;
  /** Barmağın icazəli sürüşmə məsafəsi (px) */
  maxDistance?: number;
  intent: GameplayIntent;
  enabled?: boolean;
};

export function useHoldGesture({
  durationMs,
  maxDistance = 12,
  intent,
  enabled = true,
}: HoldConfig): GestureType {
  return useMemo(
    () =>
      Gesture.LongPress()
        .enabled(enabled)
        .minDuration(durationMs)
        .maxDistance(maxDistance)
        .onStart(() => {
          'worklet';
          emitIntent(intent);
        }),
    [enabled, durationMs, maxDistance, intent],
  );
}
