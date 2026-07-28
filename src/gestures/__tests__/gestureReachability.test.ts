import { RECIPE_PHONE_BOX_STRETCH_FILM } from '@/data/recipes';
import type { GameplayIntent } from '@/domain/gameplay/intents';
import { beginSession, isIntentAllowed, reduce } from '@/domain/gameplay/machine';
import { createSession } from '@/domain/gameplay/session';
import type { GameplayState } from '@/types/game';

/**
 * Gesture qatının açdığı yolun tam olması.
 *
 * Real bug: `canDrag` yalnız `tensionStateChanged` icazəsinə baxırdı, amma
 * materialı tutan intent (`materialGrabbed`) də məhz drag-dan gəlir.
 * Nəticədə `selectingMaterial` state-ində drag deaktiv olurdu və sessiya
 * heç vaxt irəli gedə bilmirdi — testlər bunu tutmurdu, çünki testlər
 * intent-ləri birbaşa göndərirdi.
 */

/** `useGameplayGestures`-dəki aktivləşmə qaydası — mənbə ilə eyni məntiq. */
function dragEnabled(state: GameplayState): boolean {
  return isIntentAllowed(state, 'materialGrabbed') || isIntentAllowed(state, 'tensionStateChanged');
}

function cutEnabled(state: GameplayState): boolean {
  return isIntentAllowed(state, 'cutCompleted');
}

const recipe = RECIPE_PHONE_BOX_STRETCH_FILM;

function freshSession() {
  return beginSession(
    createSession({ sessionId: 'reach', recipe, customerPriority: 'balanced', isTutorial: true }),
  );
}

describe('gesture qatı state machine-i kilidləmir', () => {
  it('başlanğıc state-də drag AKTİVDİR — material tutula bilir', () => {
    expect(dragEnabled('selectingMaterial')).toBe(true);
  });

  it('dartma mərhələlərində drag aktiv qalır', () => {
    for (const state of ['grabbingMaterial', 'pulling', 'wrapping'] as GameplayState[]) {
      expect(dragEnabled(state)).toBe(true);
    }
  });

  it('kəsim yalnız `cutting` state-ində mümkündür', () => {
    expect(cutEnabled('cutting')).toBe(true);
    for (const state of ['pulling', 'wrapping', 'sealing'] as GameplayState[]) {
      expect(cutEnabled(state)).toBe(false);
    }
  });

  it('drag və kəsim eyni anda aktiv olmur — konflikt yoxdur', () => {
    const states: GameplayState[] = [
      'preparing',
      'selectingMaterial',
      'grabbingMaterial',
      'pulling',
      'wrapping',
      'cutting',
      'sealing',
      'inspecting',
      'repairing',
      'completed',
      'result',
    ];

    for (const state of states) {
      expect(dragEnabled(state) && cutEnabled(state)).toBe(false);
    }
  });

  it('yalnız gesture-dən gələn intent-lərlə kəsim mərhələsinə çatmaq mümkündür', () => {
    let session = freshSession();

    // Drag başlayır → material tutulur
    expect(dragEnabled(session.state)).toBe(true);
    session = reduce(session, { type: 'materialGrabbed' });
    expect(session.state).toBe('grabbingMaterial');

    // Drag davam edir → dartılma
    expect(dragEnabled(session.state)).toBe(true);
    session = reduce(session, { type: 'tensionStateChanged', tension: 'optimal' });
    expect(session.state).toBe('pulling');

    // Zonalar sarınır
    const wrapZone = (zone: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom') =>
      ({
        type: 'wrapZoneCompleted',
        zone,
        coverage: 1,
        meanTension: 'optimal',
        lateralDeviation: 0,
        unitsUsed: 100 / 6,
      }) satisfies GameplayIntent;

    for (const zone of ['front', 'back', 'left', 'right'] as const) {
      expect(dragEnabled(session.state)).toBe(true);
      session = reduce(session, wrapZone(zone));
    }
    session = reduce(session, { type: 'wrapPassCompleted', pass: 1 });

    for (const zone of ['top', 'bottom'] as const) {
      session = reduce(session, wrapZone(zone));
    }
    session = reduce(session, { type: 'wrapPassCompleted', pass: 2 });

    // Kəsim mərhələsi açılır və məhz burada swipe aktivləşir
    expect(session.state).toBe('cutting');
    expect(cutEnabled(session.state)).toBe(true);
    expect(dragEnabled(session.state)).toBe(false);

    session = reduce(session, { type: 'cutCompleted' });
    expect(session.state).toBe('sealing');
    expect(session.rejectedIntents).toBe(0);
  });
});
