import { RECIPE_PHONE_BOX_STRETCH_FILM } from '@/data/recipes';
import type { GameplayIntent } from '@/domain/gameplay/intents';
import { INTENT_TYPES } from '@/domain/gameplay/intents';
import { beginSession, isIntentAllowed, reduce, reduceAll } from '@/domain/gameplay/machine';
import { createSession, openCriticalDefects } from '@/domain/gameplay/session';
import type { PackagingSession } from '@/domain/gameplay/session';

const recipe = RECIPE_PHONE_BOX_STRETCH_FILM;

function newSession(): PackagingSession {
  return beginSession(
    createSession({
      sessionId: 'test-1',
      recipe,
      customerPriority: 'balanced',
      isTutorial: true,
    }),
  );
}

const grab: GameplayIntent = { type: 'materialGrabbed' };
const pull: GameplayIntent = { type: 'tensionStateChanged', tension: 'optimal' };

function wrapZone(zone: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'): GameplayIntent {
  return {
    type: 'wrapZoneCompleted',
    zone,
    coverage: 1,
    meanTension: 'optimal',
    lateralDeviation: 0,
    unitsUsed: 100 / 6,
  };
}

/** Başlanğıcdan `inspecting` mərhələsinə qədər tam axın. */
function fullWrapIntents(): GameplayIntent[] {
  return [
    grab,
    pull,
    wrapZone('front'),
    wrapZone('back'),
    wrapZone('left'),
    wrapZone('right'),
    { type: 'wrapPassCompleted', pass: 1 },
    wrapZone('top'),
    wrapZone('bottom'),
    { type: 'wrapPassCompleted', pass: 2 },
    { type: 'cutCompleted' },
    { type: 'sealPlaced', placement: 'correct', angleDeg: 0 },
  ];
}

describe('state machine — icazə qaydaları', () => {
  it('`preparing` state-i heç bir intent qəbul etmir', () => {
    for (const type of INTENT_TYPES) {
      expect(isIntentAllowed('preparing', type)).toBe(false);
    }
  });

  it('`beginSession` preparing → selectingMaterial keçidini edir', () => {
    const raw = createSession({ sessionId: 's', recipe, customerPriority: 'balanced' });
    expect(raw.state).toBe('preparing');
    expect(beginSession(raw).state).toBe('selectingMaterial');
  });

  it('icazəsiz intent state-i dəyişmir və XƏTA ATMIR', () => {
    const session = newSession();
    const result = reduce(session, { type: 'cutCompleted' });

    expect(result.state).toBe('selectingMaterial');
    expect(result.rejectedIntents).toBe(1);
  });

  it('`pulling` mərhələsində kəsim mümkün deyil', () => {
    const session = reduceAll(newSession(), [grab, pull]);
    expect(session.state).toBe('pulling');

    const result = reduce(session, { type: 'cutCompleted' });
    expect(result.state).toBe('pulling');
    expect(result.rejectedIntents).toBe(1);
  });

  it('bütün passlar bitmədən `cutting`-ə keçilmir', () => {
    let session = reduceAll(newSession(), [grab, pull, wrapZone('front')]);
    expect(session.state).toBe('wrapping');

    session = reduce(session, { type: 'wrapPassCompleted', pass: 1 });
    expect(session.state).toBe('wrapping');
    expect(session.completedPasses).toBe(1);

    session = reduce(session, { type: 'wrapPassCompleted', pass: 2 });
    expect(session.state).toBe('cutting');
  });

  it('`inspecting` tamamlanmadan `repairing`-ə keçilmir', () => {
    const session = reduceAll(newSession(), fullWrapIntents());
    expect(session.state).toBe('inspecting');

    const rejected = reduce(session, { type: 'defectRepaired', defectId: 'x' });
    expect(rejected.state).toBe('inspecting');
    expect(rejected.rejectedIntents).toBe(1);
  });

  it('mövcud sessiya obyekti heç vaxt dəyişdirilmir', () => {
    const session = newSession();
    const snapshot = JSON.stringify(session);
    reduce(session, grab);
    expect(JSON.stringify(session)).toBe(snapshot);
  });
});

describe('state machine — tam axın', () => {
  it('preparing-dən result-a qədər gedir', () => {
    let session = reduceAll(newSession(), fullWrapIntents());
    expect(session.state).toBe('inspecting');

    session = reduce(session, { type: 'inspectionCompleted' });
    expect(session.state).toBe('repairing');

    session = reduce(session, { type: 'recipeCompleted' });
    // `completed` → `result` avtomatik keçiddir
    expect(session.state).toBe('result');
    expect(session.rejectedIntents).toBe(0);
  });

  it('oyunçu qüsurları düzəltməyə MƏCBUR DEYİL', () => {
    let session = reduceAll(newSession(), fullWrapIntents());
    session = reduce(session, {
      type: 'defectDetected',
      defect: { id: 'w1', type: 'wrinkle', severity: 'minor', repaired: false },
    });
    session = reduce(session, { type: 'inspectionCompleted' });

    // Düzəltmədən birbaşa tamamlamaq mümkündür
    session = reduce(session, { type: 'recipeCompleted' });
    expect(session.state).toBe('result');
    expect(session.defects[0].repaired).toBe(false);
  });

  it('coverage, qat və material sərfi toplanır', () => {
    const session = reduceAll(newSession(), fullWrapIntents());

    expect(session.coverage.front).toBe(1);
    expect(session.coverage.bottom).toBe(1);
    expect(session.layers.front).toBe(1);
    expect(session.materialUnitsUsed).toBeCloseTo(100, 5);
    expect(session.seal).toEqual({ placement: 'correct', angleDeg: 0 });
  });

  it('təkrar zona sarımı coverage-i azaltmır', () => {
    let session = reduceAll(newSession(), [grab, pull, wrapZone('front')]);
    session = reduce(session, {
      type: 'wrapZoneCompleted',
      zone: 'front',
      coverage: 0.4,
      meanTension: 'optimal',
      lateralDeviation: 0,
      unitsUsed: 5,
    });
    expect(session.coverage.front).toBe(1);
  });
});

describe('state machine — qüsurlar', () => {
  it('eyni qüsur iki dəfə əlavə edilmir', () => {
    let session = reduceAll(newSession(), [grab, pull, wrapZone('front')]);
    const defect = {
      id: 'w1',
      type: 'wrinkle' as const,
      severity: 'minor' as const,
      repaired: false,
    };

    session = reduce(session, { type: 'defectDetected', defect });
    session = reduce(session, { type: 'defectDetected', defect });

    expect(session.defects).toHaveLength(1);
  });

  it('düzəliş yalnız bir dəfə tətbiq olunur', () => {
    let session = reduceAll(newSession(), fullWrapIntents());
    session = reduce(session, {
      type: 'defectDetected',
      defect: { id: 'c1', type: 'looseEnd', severity: 'critical', repaired: false },
    });
    expect(openCriticalDefects(session)).toBe(1);

    session = reduce(session, { type: 'inspectionCompleted' });
    session = reduce(session, { type: 'defectRepaired', defectId: 'c1' });
    expect(openCriticalDefects(session)).toBe(0);

    const before = session.defects;
    session = reduce(session, { type: 'defectRepaired', defectId: 'c1' });
    expect(session.defects).toBe(before);
  });

  it('mövcud olmayan qüsurun düzəldilməsi state-i pozmur', () => {
    let session = reduceAll(newSession(), fullWrapIntents());
    session = reduce(session, { type: 'inspectionCompleted' });
    const result = reduce(session, { type: 'defectRepaired', defectId: 'yoxdur' });
    expect(result.state).toBe('repairing');
    expect(result.defects).toHaveLength(0);
  });
});

describe('tutorial sifarişi', () => {
  it('material uyğunsuzluğu cəzası tətbiq edilmir', () => {
    const tutorial = createSession({
      sessionId: 't',
      recipe: { ...recipe, suitability: 'poor' },
      customerPriority: 'balanced',
      isTutorial: true,
    });
    expect(tutorial.suitability).toBe('ideal');
  });

  it('adi sifarişdə recipe-in uyğunluğu saxlanılır', () => {
    const normal = createSession({
      sessionId: 'n',
      recipe: { ...recipe, suitability: 'poor' },
      customerPriority: 'balanced',
    });
    expect(normal.suitability).toBe('poor');
  });
});
