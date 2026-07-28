import type { GameplayIntent } from '@/domain/gameplay/intents';
import { INTENT_TYPES } from '@/domain/gameplay/intents';
import { hapticForIntent } from '@/services/haptics/intentHaptics';

/**
 * Haptic uyğunluğu — docs/DECISIONS.md §17.
 * Haptic gesture-ə deyil, INTENT-ə bağlıdır: band debounce-u miras alınır,
 * beləliklə vibrasiya hər frame təkrarlanmır.
 */

describe('intent → haptic', () => {
  it('materialı tutmaq yüngül haptic verir', () => {
    expect(hapticForIntent({ type: 'materialGrabbed' })).toBe('light');
  });

  it('optimal dartılma selection, overstretch warning verir', () => {
    expect(hapticForIntent({ type: 'tensionStateChanged', tension: 'optimal' })).toBe('selection');
    expect(hapticForIntent({ type: 'tensionStateChanged', tension: 'overstretched' })).toBe(
      'warning',
    );
  });

  it('boş dartılma haptic vermir — hər sürüşmədə vibrasiya olmaz', () => {
    expect(hapticForIntent({ type: 'tensionStateChanged', tension: 'loose' })).toBeUndefined();
  });

  it('kəsim medium, sealing light verir', () => {
    expect(hapticForIntent({ type: 'cutCompleted' })).toBe('medium');
    expect(hapticForIntent({ type: 'sealPlaced', placement: 'correct', angleDeg: 0 })).toBe(
      'light',
    );
  });

  it('qüsur düzəltmək selection verir', () => {
    expect(hapticForIntent({ type: 'defectRepaired', defectId: 'x' })).toBe('selection');
  });

  it('zona sarımı SƏSSİZDİR — fasiləsiz vibrasiya olmaz', () => {
    const intent: GameplayIntent = {
      type: 'wrapZoneCompleted',
      zone: 'front',
      coverage: 1,
      meanTension: 'optimal',
      lateralDeviation: 0,
      unitsUsed: 10,
    };
    expect(hapticForIntent(intent)).toBeUndefined();
  });

  it('materialı buraxmaq haptic vermir', () => {
    expect(hapticForIntent({ type: 'materialReleased' })).toBeUndefined();
  });

  it('hər intent növü üçün qərar mövcuddur — crash yoxdur', () => {
    const samples: Record<string, GameplayIntent> = {
      materialGrabbed: { type: 'materialGrabbed' },
      materialReleased: { type: 'materialReleased' },
      tensionStateChanged: { type: 'tensionStateChanged', tension: 'optimal' },
      wrapZoneCompleted: {
        type: 'wrapZoneCompleted',
        zone: 'front',
        coverage: 1,
        meanTension: 'optimal',
        lateralDeviation: 0,
        unitsUsed: 1,
      },
      wrapPassCompleted: { type: 'wrapPassCompleted', pass: 1 },
      cutCompleted: { type: 'cutCompleted' },
      sealPlaced: { type: 'sealPlaced', placement: 'correct', angleDeg: 0 },
      inspectionCompleted: { type: 'inspectionCompleted' },
      defectDetected: {
        type: 'defectDetected',
        defect: { id: 'd', type: 'wrinkle', severity: 'minor', repaired: false },
      },
      defectRepaired: { type: 'defectRepaired', defectId: 'd' },
      recipeCompleted: { type: 'recipeCompleted' },
    };

    for (const type of INTENT_TYPES) {
      expect(() => hapticForIntent(samples[type])).not.toThrow();
    }
  });
});
