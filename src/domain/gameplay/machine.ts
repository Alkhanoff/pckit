import type { GameplayState } from '@/types/game';

import type { GameplayIntent, GameplayIntentType } from './intents';
import type { PackagingSession } from './session';

/**
 * Gameplay state machine — təmiz reducer, yan təsirsiz.
 * docs/ARCHITECTURE.md §3.
 *
 * Qayda: hər state yalnız öz siyahısındakı intent-i qəbul edir.
 * İcazəsiz intent SƏSSİZCƏ atılır (throw yox) — gameplay heç vaxt istisna ilə dayanmır.
 */

/** Qablaşdırma zamanı istənilən anda qüsur aşkarlana bilər. */
const DEFECT_AWARE_STATES: GameplayState[] = [
  'pulling',
  'wrapping',
  'cutting',
  'sealing',
  'inspecting',
  'repairing',
];

const ALLOWED_INTENTS: Record<GameplayState, GameplayIntentType[]> = {
  // Səhnə hazırlanır — oyunçu hərəkəti gözlənilmir (bax `beginSession`).
  preparing: [],
  selectingMaterial: ['materialGrabbed'],
  grabbingMaterial: ['tensionStateChanged', 'materialReleased'],
  pulling: ['tensionStateChanged', 'materialReleased', 'wrapZoneCompleted', 'defectDetected'],
  wrapping: [
    'tensionStateChanged',
    'materialReleased',
    'wrapZoneCompleted',
    'wrapPassCompleted',
    'defectDetected',
  ],
  cutting: ['cutCompleted', 'defectDetected'],
  sealing: ['sealPlaced', 'defectDetected'],
  inspecting: ['inspectionCompleted', 'defectDetected'],
  // Oyunçu qüsurları düzəltməyə məcbur deyil — `recipeCompleted` istənilən anda mümkündür.
  repairing: ['defectRepaired', 'defectDetected', 'recipeCompleted'],
  completed: [],
  result: [],
};

export function isIntentAllowed(state: GameplayState, type: GameplayIntentType): boolean {
  return ALLOWED_INTENTS[state].includes(type);
}

/** Səhnə hazır olduqda `preparing` → `selectingMaterial`. */
export function beginSession(session: PackagingSession): PackagingSession {
  if (session.state !== 'preparing') return session;
  return { ...session, state: 'selectingMaterial' };
}

/** `completed` → `result` avtomatik keçidi. */
function applyAutoTransitions(session: PackagingSession): PackagingSession {
  if (session.state === 'completed') return { ...session, state: 'result' };
  return session;
}

function nextState(session: PackagingSession, intent: GameplayIntent): GameplayState {
  switch (session.state) {
    case 'selectingMaterial':
      return 'grabbingMaterial';

    case 'grabbingMaterial':
      return intent.type === 'materialReleased' ? 'selectingMaterial' : 'pulling';

    case 'pulling':
      return intent.type === 'wrapZoneCompleted' ? 'wrapping' : 'pulling';

    case 'wrapping':
      if (intent.type === 'wrapPassCompleted') {
        const completed = Math.max(session.completedPasses, intent.pass);
        return completed >= session.totalPasses ? 'cutting' : 'wrapping';
      }
      return 'wrapping';

    case 'cutting':
      return intent.type === 'cutCompleted' ? 'sealing' : 'cutting';

    case 'sealing':
      return intent.type === 'sealPlaced' ? 'inspecting' : 'sealing';

    case 'inspecting':
      return intent.type === 'inspectionCompleted' ? 'repairing' : 'inspecting';

    case 'repairing':
      return intent.type === 'recipeCompleted' ? 'completed' : 'repairing';

    default:
      return session.state;
  }
}

function applyData(session: PackagingSession, intent: GameplayIntent): PackagingSession {
  switch (intent.type) {
    case 'tensionStateChanged':
      return { ...session, tension: intent.tension };

    case 'wrapZoneCompleted': {
      const coverage = Math.max(session.coverage[intent.zone] ?? 0, intent.coverage);
      return {
        ...session,
        coverage: { ...session.coverage, [intent.zone]: coverage },
        layers: { ...session.layers, [intent.zone]: Math.ceil(coverage) },
        materialUnitsUsed: session.materialUnitsUsed + Math.max(0, intent.unitsUsed),
      };
    }

    case 'wrapPassCompleted':
      return { ...session, completedPasses: Math.max(session.completedPasses, intent.pass) };

    case 'sealPlaced':
      return {
        ...session,
        seal: { placement: intent.placement, angleDeg: intent.angleDeg },
      };

    case 'defectDetected': {
      // Eyni qüsur iki dəfə əlavə edilmir.
      if (session.defects.some((d) => d.id === intent.defect.id)) return session;
      return { ...session, defects: [...session.defects, intent.defect] };
    }

    case 'defectRepaired': {
      const index = session.defects.findIndex((d) => d.id === intent.defectId);
      if (index === -1 || session.defects[index].repaired) return session;
      const defects = [...session.defects];
      defects[index] = { ...defects[index], repaired: true };
      return { ...session, defects };
    }

    default:
      return session;
  }
}

/**
 * Sessiyaya bir intent tətbiq edir və yeni sessiya qaytarır.
 * Mövcud sessiya heç vaxt dəyişdirilmir.
 */
export function reduce(session: PackagingSession, intent: GameplayIntent): PackagingSession {
  if (!isIntentAllowed(session.state, intent.type)) {
    if (__DEV__) {
      console.warn(
        `[gameplay] "${intent.type}" intent-i "${session.state}" state-ində qəbul edilmir — atıldı.`,
      );
    }
    return { ...session, rejectedIntents: session.rejectedIntents + 1 };
  }

  const withData = applyData(session, intent);
  const moved = { ...withData, state: nextState(session, intent) };
  return applyAutoTransitions(moved);
}

/** Ardıcıl intent siyahısını tətbiq edir — test və replay üçün. */
export function reduceAll(session: PackagingSession, intents: GameplayIntent[]): PackagingSession {
  return intents.reduce(reduce, session);
}

/** `DEFECT_AWARE_STATES` konfiqurasiyasının ALLOWED_INTENTS ilə uyğunluğu testlə yoxlanılır. */
export const DEFECT_STATES = DEFECT_AWARE_STATES;
