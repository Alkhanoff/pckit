import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';

import type { Point } from '@/utils/projection';

/**
 * Səhnə üzərində toxunuş — koordinatlar VIEW-a nisbətəndir.
 *
 * `Pressable`-ın `nativeEvent.locationX` dəyəri React Native Web-də
 * etibarlı deyil; Gesture Handler isə bütün platformalarda `e.x` / `e.y`
 * verir. Bu, həm də Mərhələ 5-dəki vahid gesture sisteminin ilk hissəsidir.
 *
 * `runOnJS(true)`: tap diskret hadisədir, hər frame işləmir — buna görə
 * worklet körpüsünə ehtiyac yoxdur (docs/DECISIONS.md §14).
 */
export function useSceneTap(onTap: ((point: Point) => void) | undefined) {
  return useMemo(
    () =>
      Gesture.Tap()
        .enabled(onTap !== undefined)
        .runOnJS(true)
        .onEnd((event, success) => {
          if (success && onTap) onTap({ x: event.x, y: event.y });
        }),
    [onTap],
  );
}
