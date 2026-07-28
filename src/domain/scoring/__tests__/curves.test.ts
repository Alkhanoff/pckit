import { RESULT_THRESHOLDS, SCORE_WEIGHTS } from '@/config/balance';
import { RECIPE_PHONE_BOX_STRETCH_FILM } from '@/data/recipes';
import type { CustomerPriority, DefectInstance, ZoneId } from '@/types/game';
import { ALL_ZONES } from '@/types/game';

import { calculateEfficiency } from '../efficiency';
import { calculateOverall, calculateScore, determineTier } from '../overall';
import { calculatePresentation } from '../presentation';
import { calculateProtection } from '../protection';
import type { ScoringInput } from '../types';

const recipe = RECIPE_PHONE_BOX_STRETCH_FILM;
const PRIORITIES: CustomerPriority[] = ['balanced', 'protection', 'presentation', 'efficiency'];

function zones(value: number): Record<ZoneId, number> {
  return ALL_ZONES.reduce(
    (acc, z) => {
      acc[z] = value;
      return acc;
    },
    {} as Record<ZoneId, number>,
  );
}

function input(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    zoneCoverage: zones(1),
    zoneWeights: recipe.zoneWeights,
    sensitiveZones: [],
    seal: 'correct',
    suitability: 'ideal',
    materialUnitsUsed: 100,
    targetMaterialUnits: 100,
    defects: [],
    customerPriority: 'balanced',
    ...overrides,
  };
}

describe('efficiency əyrisi — sərhəd nöqtələri (docs/BALANCE.md §5)', () => {
  it.each([
    [0.5, 50],
    [0.7, 75],
    [0.9, 100],
    [1.0, 100],
    [1.1, 100],
    [1.25, 70],
    [1.5, 30],
    [1.75, 0],
    [2.0, 0],
  ])('u = %p → %p', (ratio, expected) => {
    expect(calculateEfficiency(ratio * 100, 100)).toBe(expected);
  });

  it('həddindən artıq az material da 40-dan aşağı düşmür', () => {
    expect(calculateEfficiency(1, 100)).toBe(40);
  });

  it('hədəf sıfır və ya mənfi olarsa xəta atır', () => {
    expect(() => calculateEfficiency(50, 0)).toThrow();
  });
});

describe('protection modifikatorları (docs/BALANCE.md §4)', () => {
  it('yalnız Pass 1 zonaları → 70', () => {
    expect(
      calculateProtection(
        input({ zoneCoverage: { front: 1, back: 1, left: 1, right: 1, top: 0, bottom: 0 } }),
      ),
    ).toBe(70);
  });

  it('seal yoxdursa 25 bal azalır', () => {
    expect(calculateProtection(input({ seal: 'missing' }))).toBe(75);
  });

  it('seal yanlış zonadadırsa 10 bal azalır', () => {
    expect(calculateProtection(input({ seal: 'wrong-zone' }))).toBe(90);
  });

  it('uyğunsuz material 0.75 ilə çarpılır', () => {
    expect(calculateProtection(input({ suitability: 'poor' }))).toBe(75);
  });

  it('alternativ material 0.90 ilə çarpılır', () => {
    expect(calculateProtection(input({ suitability: 'alternative' }))).toBe(90);
  });

  it('qorunmamış həssas zona 15 bal azaldır', () => {
    const result = calculateProtection(
      input({
        zoneCoverage: { ...zones(1), top: 0.2 },
        sensitiveZones: ['top'],
      }),
    );
    // 85 (top 0.2 → 3 əvəzinə 15) − 15 = ...
    expect(result).toBeLessThan(90);
  });

  it('coverage 1-dən yuxarı olsa belə 100-ü keçmir', () => {
    expect(calculateProtection(input({ zoneCoverage: zones(3) }))).toBe(100);
  });
});

describe('presentation — cəza limitləri və düzəliş (docs/BALANCE.md §3)', () => {
  const wrinkles = (count: number, repaired: boolean): DefectInstance[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `w${i}`,
      type: 'wrinkle' as const,
      severity: 'minor' as const,
      repaired,
    }));

  it('5 düzəldilməmiş qırış → 80', () => {
    expect(calculatePresentation(wrinkles(5, false))).toBe(80);
  });

  it('5 düzəldilmiş qırış → 96', () => {
    expect(calculatePresentation(wrinkles(5, true))).toBe(96);
  });

  it('limit qüsurları məhdudlaşdırır — 20 qırış da 5 qədər cəzalandırılır', () => {
    expect(calculatePresentation(wrinkles(20, false))).toBe(80);
  });

  it('limit "ən pis N qüsur" deməkdir — düzəldilmişlər limiti doldurmur', () => {
    // 5 düzəldilməmiş + 5 düzəldilmiş: yalnız düzəldilməmişlər sayılmalıdır
    const mixed = [...wrinkles(5, false), ...wrinkles(5, true)];
    expect(calculatePresentation(mixed)).toBe(80);
  });

  it('qüsur yoxdursa 100', () => {
    expect(calculatePresentation([])).toBe(100);
  });

  const repeat = (
    type: DefectInstance['type'],
    count: number,
    severity: DefectInstance['severity'] = 'minor',
  ): DefectInstance[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `${type}${i}`,
      type,
      severity,
      repaired: false,
    }));

  it('streç film qüsurlarının hamısı limitdə → 8', () => {
    // 5×4 + 4×5 + 3×6 + 2×8 + 3×6 = 92 cəza
    const all = [
      ...wrinkles(5, false),
      ...repeat('airBubble', 4),
      ...repeat('openCorner', 3),
      ...repeat('looseEnd', 2, 'critical'),
      ...repeat('crookedSeal', 3),
    ];
    expect(calculatePresentation(all)).toBe(8);
  });

  it('bütün qüsur növləri limitdə olduqda bal 0-da dayanır (mənfiyə düşmür)', () => {
    const worstCase = [
      ...wrinkles(5, false),
      ...repeat('airBubble', 4),
      ...repeat('openCorner', 3),
      ...repeat('looseEnd', 2, 'critical'),
      ...repeat('crookedSeal', 3),
      ...repeat('thinFilm', 2),
      ...repeat('excessMaterial', 1),
      ...repeat('asymmetry', 1),
    ];
    // Cəmi cəza 117 > 100 → 0-da kəsilir
    expect(calculatePresentation(worstCase)).toBe(0);
  });
});

describe('overall və Perfect qapısı (docs/BALANCE.md §1)', () => {
  it('hər prioritet çəki dəstinin cəmi 1.00-dir', () => {
    for (const priority of PRIORITIES) {
      const w = SCORE_WEIGHTS[priority];
      expect(w.presentation + w.protection + w.efficiency).toBeCloseTo(1, 10);
    }
  });

  it('prioritet çəkiləri overall-ı dəyişir', () => {
    const results = PRIORITIES.map((p) => calculateOverall(100, 60, 60, p));
    expect(new Set(results).size).toBeGreaterThan(1);
  });

  it('Perfect qapısı prioritetdən ASILI DEYİL', () => {
    // Eyni bal dəsti bütün prioritetlərdə eyni Perfect qərarını verməlidir
    for (const priority of PRIORITIES) {
      const score = calculateScore(input({ customerPriority: priority }));
      expect(score.tier).toBe('perfect');
    }

    // Protection 89 → heç bir prioritetdə Perfect ola bilməz
    for (const priority of PRIORITIES) {
      const tier = determineTier(95, 95, 89, 95, 0);
      expect(tier).not.toBe('perfect');
      expect(priority).toBeTruthy();
    }
  });

  it('açıq critical qüsur Perfect-i bloklayır', () => {
    expect(determineTier(100, 100, 100, 100, 1)).toBe('good');
    expect(determineTier(100, 100, 100, 100, 0)).toBe('perfect');
  });

  it('düzəldilmiş critical qüsur Perfect-i bloklamır', () => {
    const score = calculateScore(
      input({
        defects: [{ id: 'x', type: 'looseEnd', severity: 'critical', repaired: true }],
      }),
    );
    expect(score.openCriticalDefects).toBe(0);
    expect(score.tier).toBe('perfect');
  });

  it('hədd dəyərləri normativ sənədlə uyğundur', () => {
    expect(RESULT_THRESHOLDS.perfect).toEqual({
      overall: 90,
      presentation: 90,
      protection: 90,
      efficiency: 85,
    });
    expect(RESULT_THRESHOLDS.good.overall).toBe(70);
  });

  it('Good və Acceptable sərhədi 70-dir', () => {
    expect(determineTier(70, 0, 0, 0, 0)).toBe('good');
    expect(determineTier(69, 0, 0, 0, 0)).toBe('acceptable');
  });
});

describe('fuzz — ballar həmişə 0–100 aralığındadır', () => {
  it('500 təsadüfi girişdə heç bir bal aralıqdan çıxmır', () => {
    for (let i = 0; i < 500; i += 1) {
      const score = calculateScore(
        input({
          zoneCoverage: zones(Math.random() * 3),
          seal: (['correct', 'wrong-zone', 'missing'] as const)[Math.floor(Math.random() * 3)],
          suitability: (['ideal', 'alternative', 'poor'] as const)[Math.floor(Math.random() * 3)],
          materialUnitsUsed: Math.random() * 400,
          customerPriority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
        }),
      );

      for (const value of [score.presentation, score.protection, score.efficiency, score.overall]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
        expect(Number.isInteger(value)).toBe(true);
      }
    }
  });
});
