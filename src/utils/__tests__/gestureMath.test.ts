import {
  OVERSTRETCH_WARNING_COOLDOWN_MS,
  TENSION_BANDS,
  TENSION_DEBOUNCE_MS,
} from '@/config/balance';
import {
  BAND_LOOSE,
  BAND_OPTIMAL,
  BAND_OVERSTRETCHED,
  angleDeg,
  angleDifference,
  bandToTensionState,
  clamp01,
  directionMatches,
  distance,
  lateralDeviation,
  normalizedTension,
  shouldEmitBandChange,
  shouldWarnOverstretch,
  tensionBandIndex,
  validateSwipe,
} from '@/utils/gestureMath';

describe('əsas vektor riyaziyyatı', () => {
  it('məsafə Pifaqor teoremidir', () => {
    expect(distance(3, 4)).toBe(5);
    expect(distance(0, 0)).toBe(0);
  });

  it('bucaq ekran konvensiyasındadır: 0° sağa, 90° aşağı', () => {
    expect(angleDeg(1, 0)).toBeCloseTo(0, 6);
    expect(angleDeg(0, 1)).toBeCloseTo(90, 6);
    expect(angleDeg(-1, 0)).toBeCloseTo(180, 6);
    expect(angleDeg(0, -1)).toBeCloseTo(-90, 6);
  });

  it('bucaq fərqi 360° sərhədini düzgün keçir', () => {
    expect(angleDifference(10, 350)).toBeCloseTo(20, 6);
    expect(angleDifference(-170, 170)).toBeCloseTo(20, 6);
    expect(angleDifference(0, 180)).toBeCloseTo(180, 6);
    expect(angleDifference(45, 45)).toBeCloseTo(0, 6);
  });

  it('clamp01 aralığı saxlayır', () => {
    expect(clamp01(-5)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(9)).toBe(1);
  });
});

describe('istiqamət uyğunluğu', () => {
  it('tolerans daxilindəki hərəkət qəbul edilir', () => {
    expect(directionMatches(10, 0, 0, 35)).toBe(true);
    expect(directionMatches(10, 5, 0, 35)).toBe(true);
  });

  it('tolerансdan kənar hərəkət rədd edilir', () => {
    expect(directionMatches(0, 10, 0, 35)).toBe(false);
    expect(directionMatches(-10, 0, 0, 35)).toBe(false);
  });

  it('tərpənməmiş barmaq istiqamət saymır', () => {
    expect(directionMatches(0, 0, 0, 180)).toBe(false);
  });
});

describe('tension bandları (docs/BALANCE.md §2)', () => {
  it('normallaşdırma 0–1 aralığındadır', () => {
    expect(normalizedTension(0, 100)).toBe(0);
    expect(normalizedTension(50, 100)).toBe(0.5);
    expect(normalizedTension(500, 100)).toBe(1);
  });

  it('istinad məsafəsi sıfırdırsa sıfır qaytarır', () => {
    expect(normalizedTension(50, 0)).toBe(0);
  });

  it('bandlar konfiqurasiya ilə uyğundur', () => {
    expect(tensionBandIndex(0)).toBe(BAND_LOOSE);
    expect(tensionBandIndex(TENSION_BANDS.looseMax - 0.001)).toBe(BAND_LOOSE);
    expect(tensionBandIndex(TENSION_BANDS.looseMax)).toBe(BAND_OPTIMAL);
    expect(tensionBandIndex(TENSION_BANDS.optimalMax)).toBe(BAND_OPTIMAL);
    expect(tensionBandIndex(TENSION_BANDS.optimalMax + 0.001)).toBe(BAND_OVERSTRETCHED);
    expect(tensionBandIndex(1)).toBe(BAND_OVERSTRETCHED);
  });

  it('band indeksi domain tipinə çevrilir', () => {
    expect(bandToTensionState(BAND_LOOSE)).toBe('loose');
    expect(bandToTensionState(BAND_OPTIMAL)).toBe('optimal');
    expect(bandToTensionState(BAND_OVERSTRETCHED)).toBe('overstretched');
  });
});

describe('körpü debounce-u — runOnJS hər frame çağırılmır', () => {
  it('band dəyişmirsə hadisə göndərilmir', () => {
    expect(shouldEmitBandChange(BAND_OPTIMAL, BAND_OPTIMAL, 0, 99999, TENSION_DEBOUNCE_MS)).toBe(
      false,
    );
  });

  it('band dəyişib və debounce keçibsə göndərilir', () => {
    expect(
      shouldEmitBandChange(
        BAND_LOOSE,
        BAND_OPTIMAL,
        1000,
        1000 + TENSION_DEBOUNCE_MS,
        TENSION_DEBOUNCE_MS,
      ),
    ).toBe(true);
  });

  it('debounce keçməyibsə göndərilmir', () => {
    expect(
      shouldEmitBandChange(
        BAND_LOOSE,
        BAND_OPTIMAL,
        1000,
        1000 + TENSION_DEBOUNCE_MS - 1,
        TENSION_DEBOUNCE_MS,
      ),
    ).toBe(false);
  });

  it('sürətli band tərəddüdü körpünü doldurmur', () => {
    // 60 fps-də 10 frame ərzində band 5 dəfə dəyişsə belə yalnız biri keçir
    let lastEmit = 0;
    let emitted = 0;
    let previous = BAND_LOOSE;

    for (let frame = 0; frame < 10; frame += 1) {
      const now = frame * 16;
      const next = frame % 2 === 0 ? BAND_LOOSE : BAND_OPTIMAL;
      if (shouldEmitBandChange(previous, next, lastEmit, now, TENSION_DEBOUNCE_MS)) {
        lastEmit = now;
        previous = next;
        emitted += 1;
      }
    }

    expect(emitted).toBeLessThanOrEqual(2);
  });
});

describe('overstretch xəbərdarlığı', () => {
  it('yalnız overstretch bandında verilir', () => {
    expect(shouldWarnOverstretch(BAND_OPTIMAL, 0, 99999, OVERSTRETCH_WARNING_COOLDOWN_MS)).toBe(
      false,
    );
    expect(
      shouldWarnOverstretch(BAND_OVERSTRETCHED, 0, 99999, OVERSTRETCH_WARNING_COOLDOWN_MS),
    ).toBe(true);
  });

  it('cooldown daxilində təkrarlanmır — spam olmur', () => {
    const now = 5000;
    expect(
      shouldWarnOverstretch(BAND_OVERSTRETCHED, now - 100, now, OVERSTRETCH_WARNING_COOLDOWN_MS),
    ).toBe(false);
    expect(
      shouldWarnOverstretch(
        BAND_OVERSTRETCHED,
        now - OVERSTRETCH_WARNING_COOLDOWN_MS,
        now,
        OVERSTRETCH_WARNING_COOLDOWN_MS,
      ),
    ).toBe(true);
  });
});

describe('swipe validasiyası', () => {
  it('kifayət qədər uzun və düzgün istiqamətli swipe qəbul edilir', () => {
    const result = validateSwipe(100, 0, 0, 60, 30);
    expect(result.valid).toBe(true);
    expect(result.distance).toBe(100);
  });

  it('qısa swipe rədd edilir', () => {
    expect(validateSwipe(30, 0, 0, 60, 30).valid).toBe(false);
  });

  it('yanlış istiqamətli swipe rədd edilir', () => {
    expect(validateSwipe(0, 100, 0, 60, 30).valid).toBe(false);
  });

  it('tolerans sərhədində qəbul edilir', () => {
    // 30° tolerans, tam 30° bucaq
    const dx = Math.cos((30 * Math.PI) / 180) * 100;
    const dy = Math.sin((30 * Math.PI) / 180) * 100;
    expect(validateSwipe(dx, dy, 0, 60, 30).valid).toBe(true);
  });

  it('nəticə ölçüləri də qaytarır', () => {
    const result = validateSwipe(0, 100, 90, 60, 30);
    expect(result.angleDeg).toBeCloseTo(90, 6);
    expect(result.valid).toBe(true);
  });
});

describe('yan sapma — hava qabarcığı triggeri', () => {
  it('ox boyunca düz hərəkətdə sapma sıfırdır', () => {
    expect(lateralDeviation(100, 0, 0, 200)).toBeCloseTo(0, 6);
  });

  it('perpendikulyar hərəkət maksimum sapma verir', () => {
    expect(lateralDeviation(0, 100, 0, 100)).toBeCloseTo(1, 6);
  });

  it('sapma zona eninə nisbətəndir', () => {
    expect(lateralDeviation(0, 20, 0, 200)).toBeCloseTo(0.1, 6);
  });

  it('zona eni sıfırdırsa sıfır qaytarır', () => {
    expect(lateralDeviation(0, 50, 0, 0)).toBe(0);
  });

  it('nəticə 0–1 aralığındadır', () => {
    expect(lateralDeviation(0, 9999, 0, 10)).toBe(1);
  });
});
