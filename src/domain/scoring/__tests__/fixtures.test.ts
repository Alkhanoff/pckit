import { RECIPE_PHONE_BOX_STRETCH_FILM } from '@/data/recipes';
import { calculateRewards } from '@/domain/orders/rewards';
import type { DefectInstance, ZoneId } from '@/types/game';
import { ALL_ZONES } from '@/types/game';

import { calculateScore } from '../overall';
import type { ScoringInput } from '../types';

/**
 * NORMATİV FIXTURE-LƏR — docs/BALANCE.md §13.
 *
 * Bu üç ssenari scoring sisteminin müqaviləsidir. Nəticələr dəyişirsə,
 * ya balans qəsdən dəyişdirilib (əvvəlcə BALANCE.md yenilənməlidir),
 * ya da bir yerdə reqressiya var.
 */

const recipe = RECIPE_PHONE_BOX_STRETCH_FILM;

function zones(value: number): Record<ZoneId, number> {
  return ALL_ZONES.reduce(
    (acc, z) => {
      acc[z] = value;
      return acc;
    },
    {} as Record<ZoneId, number>,
  );
}

function defects(
  type: DefectInstance['type'],
  count: number,
  repaired: boolean,
  severity: DefectInstance['severity'] = 'minor',
): DefectInstance[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${type}-${i}`,
    type,
    severity,
    repaired,
  }));
}

function baseInput(overrides: Partial<ScoringInput>): ScoringInput {
  return {
    zoneCoverage: zones(1),
    zoneWeights: recipe.zoneWeights,
    sensitiveZones: [],
    seal: 'correct',
    suitability: 'ideal',
    materialUnitsUsed: 100,
    targetMaterialUnits: recipe.targetMaterialUnits,
    defects: [],
    customerPriority: 'balanced',
    ...overrides,
  };
}

describe('F1 — Perfect', () => {
  const input = baseInput({
    // 5 qırış yaradılıb, hamısı düzəldilib
    defects: defects('wrinkle', 5, true),
  });
  const score = calculateScore(input);

  it('presentation 96 (düzəliş cəzanın 80%-ini geri qaytarır)', () => {
    expect(score.presentation).toBe(96);
  });

  it('protection 100 (hər iki pass tamamlanıb, seal düzgündür)', () => {
    expect(score.protection).toBe(100);
  });

  it('efficiency 100 (u = 1.00)', () => {
    expect(score.efficiency).toBe(100);
  });

  it('overall 99', () => {
    expect(score.overall).toBe(99);
  });

  it('nəticə Perfect-dir', () => {
    expect(score.tier).toBe('perfect');
    expect(score.openCriticalDefects).toBe(0);
  });

  it('165 coin və 15 reputasiya verir (priority bonusu ilə)', () => {
    const rewards = calculateRewards(score, recipe.baseReward, 'balanced');
    expect(rewards).toEqual({ coin: 165, reputation: 15, priorityBonusApplied: true });
  });
});

describe('F2 — Good (yalnız Pass 1)', () => {
  const input = baseInput({
    zoneCoverage: { front: 1, back: 1, left: 1, right: 1, top: 0, bottom: 0 },
    materialUnitsUsed: 70,
    defects: [],
  });
  const score = calculateScore(input);

  it('presentation 100 (qüsur yoxdur)', () => {
    expect(score.presentation).toBe(100);
  });

  it('protection 70 — Pass 2 olmadan Perfect mümkün deyil', () => {
    expect(score.protection).toBe(70);
  });

  it('efficiency 75 (u = 0.70)', () => {
    expect(score.efficiency).toBe(75);
  });

  it('overall 82', () => {
    expect(score.overall).toBe(82);
  });

  it('nəticə Good-dur (protection < 90)', () => {
    expect(score.tier).toBe('good');
  });

  it('100 coin və 10 reputasiya verir (bonus yoxdur)', () => {
    const rewards = calculateRewards(score, recipe.baseReward, 'balanced');
    expect(rewards).toEqual({ coin: 100, reputation: 10, priorityBonusApplied: false });
  });
});

describe('F3 — Acceptable (loose + seal yoxdur)', () => {
  const input = baseInput({
    zoneCoverage: zones(0.85),
    seal: 'missing',
    materialUnitsUsed: 140,
    defects: [
      ...defects('wrinkle', 6, false),
      { id: 'loose-1', type: 'looseEnd', severity: 'critical', repaired: false },
    ],
  });
  const score = calculateScore(input);

  it('presentation 72 (5 qırış sayılır + boş uc)', () => {
    expect(score.presentation).toBe(72);
  });

  it('protection 60 (85 coverage − 25 seal cəzası)', () => {
    expect(score.protection).toBe(60);
  });

  it('efficiency 46 (u = 1.40)', () => {
    expect(score.efficiency).toBe(46);
  });

  it('overall 61', () => {
    expect(score.overall).toBe(61);
  });

  it('nəticə Acceptable-dır və açıq critical qüsur var', () => {
    expect(score.tier).toBe('acceptable');
    expect(score.openCriticalDefects).toBe(1);
  });

  it('70 coin və 7 reputasiya verir', () => {
    const rewards = calculateRewards(score, recipe.baseReward, 'balanced');
    expect(rewards).toEqual({ coin: 70, reputation: 7, priorityBonusApplied: false });
  });
});
