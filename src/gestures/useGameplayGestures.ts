import { useEffect, useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

import { isIntentAllowed } from '@/domain/gameplay/machine';
import type { IntentDispatcher } from '@/gestures/intentBridge';
import { setIntentDispatcher } from '@/gestures/intentBridge';
import type { AnyGesture } from '@/gestures/types';
import { useSceneTap } from '@/gestures/useSceneTap';
import { useSwipeGesture } from '@/gestures/useSwipeGesture';
import { useTensionDrag } from '@/gestures/useTensionDrag';
import type { GameplayState } from '@/types/game';
import type { Point } from '@/utils/projection';

/**
 * Vahid gesture sistemi.
 *
 * Hansı gesture-in aktiv olduğunu STATE MACHINE müəyyən edir — komponentlər
 * bunu özləri qərar vermir (docs/ARCHITECTURE.md §3). Beləliklə "pulling
 * mərhələsində kəsim mümkün deyil" qaydası bir yerdə saxlanılır.
 */

/** Kəsim swipe-ının parametrləri — Mərhələ 8-də kəsim xəttinə bağlanacaq. */
const CUT_DIRECTION_DEG = 0;
const CUT_MIN_DISTANCE = 60;
const CUT_TOLERANCE_DEG = 30;

export type GameplayGesturesConfig = {
  state: GameplayState;
  /** Optimal dartılma üçün lazım olan drag məsafəsi (px) */
  referenceDistance: number;
  onScenePress?: (point: Point) => void;
};

export type GameplayGestures = {
  gesture: AnyGesture;
  tension: SharedValue<number>;
  band: SharedValue<number>;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  active: SharedValue<boolean>;
};

/** Gameplay ekranı öz dispatcher-ini körpüyə bağlayır. */
export function useRegisterIntentDispatcher(dispatch: IntentDispatcher | undefined): void {
  useEffect(() => {
    setIntentDispatcher(dispatch);
    return () => setIntentDispatcher(undefined);
  }, [dispatch]);
}

export function useGameplayGestures({
  state,
  referenceDistance,
  onScenePress,
}: GameplayGesturesConfig): GameplayGestures {
  /**
   * Drag həm materialı TUTUR (`materialGrabbed`), həm də DARTIR
   * (`tensionStateChanged`) — buna görə hər iki icazə yoxlanılır.
   *
   * Yalnız `tensionStateChanged`-ə baxsaydıq, `selectingMaterial` state-ində
   * drag deaktiv olardı və materialı tutmaq mümkün olmazdı: sessiya heç vaxt
   * başlaya bilməzdi.
   */
  const canDrag =
    isIntentAllowed(state, 'materialGrabbed') || isIntentAllowed(state, 'tensionStateChanged');
  const canCut = isIntentAllowed(state, 'cutCompleted');

  const drag = useTensionDrag({ referenceDistance, enabled: canDrag });

  const cut = useSwipeGesture({
    targetDirectionDeg: CUT_DIRECTION_DEG,
    minDistance: CUT_MIN_DISTANCE,
    toleranceDeg: CUT_TOLERANCE_DEG,
    intent: { type: 'cutCompleted' },
    enabled: canCut,
  });

  const tap = useSceneTap(onScenePress);

  /**
   * `Exclusive`: eyni anda yalnız bir gesture aktivləşə bilər və prioritet
   * sırası sabitdir. Drag və cut hər halda bir-birini istisna edən state-lərdə
   * aktiv olur, amma açıq prioritet gələcəkdə əlavə olunan gesture-lərin
   * səssiz konflikt yaratmasının qarşısını alır.
   */
  const gesture = useMemo(
    () => Gesture.Exclusive(cut, drag.gesture, tap),
    [cut, drag.gesture, tap],
  );

  return {
    gesture,
    tension: drag.tension,
    band: drag.band,
    dragX: drag.dragX,
    dragY: drag.dragY,
    active: drag.active,
  };
}
