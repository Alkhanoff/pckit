import type { GameplayIntent } from '@/domain/gameplay/intents';

/**
 * Intent → haptic uyğunluğu (docs/DECISIONS.md §17, BALANCE.md §2).
 *
 * Haptic gesture-ə deyil, INTENT-ə bağlanır. Bunun iki üstünlüyü var:
 *  1. Band debounce-u avtomatik miras alınır — vibrasiya spam etmir;
 *  2. Uyğunluq təmiz funksiyadır və test edilir.
 */

export type HapticType =
  'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export function hapticForIntent(intent: GameplayIntent): HapticType | undefined {
  switch (intent.type) {
    case 'materialGrabbed':
      return 'light';

    case 'tensionStateChanged':
      // Optimal aralığa çatmaq mükafatlandırılır, overstretch xəbərdarlıq verir
      if (intent.tension === 'optimal') return 'selection';
      if (intent.tension === 'overstretched') return 'warning';
      return undefined;

    case 'cutCompleted':
      return 'medium';

    case 'sealPlaced':
      return 'light';

    case 'defectRepaired':
      return 'selection';

    case 'wrapPassCompleted':
      return 'light';

    // Buraxma, zona tamamlanması və qüsur aşkarlanması səssizdir —
    // əks halda sarım zamanı fasiləsiz vibrasiya olardı.
    default:
      return undefined;
  }
}
