import { runOnJS } from 'react-native-reanimated';

import type { GameplayIntent } from '@/domain/gameplay/intents';

/**
 * UI thread ↔ domain qatı arasındakı YEGANƏ körpü.
 *
 * `runOnJS` bütün layihədə yalnız bu faylda çağırılır — bu, ESLint qaydası
 * ilə məcbur edilir (docs/ARCHITECTURE.md §4).
 *
 * Buradan yalnız DİSKRET intent-lər keçir. Davamlı koordinatlar və animasiya
 * dəyərləri UI thread-də shared value kimi qalır və heç vaxt körpünü keçmir.
 */

export type IntentDispatcher = (intent: GameplayIntent) => void;

let dispatcher: IntentDispatcher | undefined;

/** Gameplay ekranı mount olduqda öz dispatcher-ini qeydiyyatdan keçirir. */
export function setIntentDispatcher(next: IntentDispatcher | undefined): void {
  dispatcher = next;
}

export function hasIntentDispatcher(): boolean {
  return dispatcher !== undefined;
}

/**
 * JS thread-də icra olunur.
 *
 * Dispatcher qeydiyyatdan keçməyibsə intent SƏSSİZCƏ atılır — gesture
 * sistemi gameplay ekranından kənarda da mount ola bilər və bu, xəta
 * sayılmamalıdır.
 */
function deliver(intent: GameplayIntent): void {
  if (!dispatcher) {
    if (__DEV__) {
      console.warn(`[intentBridge] dispatcher yoxdur — "${intent.type}" atıldı.`);
    }
    return;
  }
  dispatcher(intent);
}

/** UI thread-dən (worklet daxilindən) çağırılır. */
export function emitIntent(intent: GameplayIntent): void {
  'worklet';
  runOnJS(deliver)(intent);
}

/**
 * JS thread-dən birbaşa çağırılır — tap kimi worklet tələb etməyən
 * diskret hadisələr üçün.
 */
export function dispatchIntent(intent: GameplayIntent): void {
  deliver(intent);
}
