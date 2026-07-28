import {
  DEFECT_GROUP_CAPS,
  DEFECT_PENALTIES,
  DEFECT_TRIGGERS,
  EFFICIENCY_CURVE,
  REPAIR_RESIDUAL,
  RESULT_THRESHOLDS,
  SCORE_WEIGHTS,
  SUITABILITY_MULTIPLIER,
  TENSION_BANDS,
  TENSION_MATERIAL_FACTOR,
} from '@/config/balance';
import { BASE_REPUTATION, MATERIAL_PRICE, RESULT_MULTIPLIER } from '@/config/progression';
import { ALL_MATERIALS, MATERIALS } from '@/data/materials';
import { ALL_PRODUCTS, PRODUCTS } from '@/data/products';
import { ALL_RECIPES } from '@/data/recipes';
import { ALL_ZONES } from '@/types/game';
import type { CustomerPriority } from '@/types/game';

/**
 * Config invariantları — docs/TESTING.md §4.
 * Bu testlər `BALANCE.md` ilə `src/config/` arasındakı sürüşməni tutur.
 */

const PRIORITIES: CustomerPriority[] = ['balanced', 'protection', 'presentation', 'efficiency'];

describe('scoring çəkiləri', () => {
  it.each(PRIORITIES)('%s dəstinin cəmi 1.00-dir', (priority) => {
    const w = SCORE_WEIGHTS[priority];
    expect(w.presentation + w.protection + w.efficiency).toBeCloseTo(1, 10);
  });

  it('bütün çəkilər müsbətdir', () => {
    for (const priority of PRIORITIES) {
      for (const value of Object.values(SCORE_WEIGHTS[priority])) {
        expect(value).toBeGreaterThan(0);
      }
    }
  });

  it('hər prioritet öz oxuna balanced-dan çox çəki verir', () => {
    expect(SCORE_WEIGHTS.protection.protection).toBeGreaterThan(SCORE_WEIGHTS.balanced.protection);
    expect(SCORE_WEIGHTS.presentation.presentation).toBeGreaterThan(
      SCORE_WEIGHTS.balanced.presentation,
    );
    expect(SCORE_WEIGHTS.efficiency.efficiency).toBeGreaterThan(SCORE_WEIGHTS.balanced.efficiency);
  });
});

describe('nəticə hədləri', () => {
  it('Perfect hədləri normativ dəyərlərdədir', () => {
    expect(RESULT_THRESHOLDS.perfect.overall).toBe(90);
    expect(RESULT_THRESHOLDS.perfect.presentation).toBe(90);
    expect(RESULT_THRESHOLDS.perfect.protection).toBe(90);
    expect(RESULT_THRESHOLDS.perfect.efficiency).toBe(85);
  });

  it('Good həddi Perfect-dən aşağıdır', () => {
    expect(RESULT_THRESHOLDS.good.overall).toBeLessThan(RESULT_THRESHOLDS.perfect.overall);
  });
});

describe('tension', () => {
  it('bandlar ardıcıldır və 0–1 aralığındadır', () => {
    expect(TENSION_BANDS.looseMax).toBeGreaterThan(0);
    expect(TENSION_BANDS.looseMax).toBeLessThan(TENSION_BANDS.optimalMax);
    expect(TENSION_BANDS.optimalMax).toBeLessThan(1);
  });

  it('optimal band ən azı 30% enindədir (stresssiz dizayn)', () => {
    expect(TENSION_BANDS.optimalMax - TENSION_BANDS.looseMax).toBeGreaterThanOrEqual(0.3);
  });

  it('boş dartmaq daha çox, overstretch daha az material yeyir', () => {
    expect(TENSION_MATERIAL_FACTOR.loose).toBeGreaterThan(TENSION_MATERIAL_FACTOR.optimal);
    expect(TENSION_MATERIAL_FACTOR.overstretched).toBeLessThan(TENSION_MATERIAL_FACTOR.optimal);
    expect(TENSION_MATERIAL_FACTOR.optimal).toBe(1);
  });
});

describe('qüsur konfiqurasiyası', () => {
  it('hər qüsur növünün cəzası və qrupu var', () => {
    for (const [type, config] of Object.entries(DEFECT_PENALTIES)) {
      expect(config.penalty).toBeGreaterThanOrEqual(0);
      expect(config.group).toBeTruthy();
      expect(DEFECT_GROUP_CAPS[config.group]).toBeDefined();
      expect(type).toBeTruthy();
    }
  });

  it('əyri seal / etiket / möhür eyni limiti paylaşır', () => {
    expect(DEFECT_PENALTIES.crookedSeal.group).toBe(DEFECT_PENALTIES.crookedLabel.group);
    expect(DEFECT_PENALTIES.crookedStamp.group).toBe(DEFECT_PENALTIES.crookedSeal.group);
  });

  it('düzəliş cəzanın çox hissəsini geri qaytarır, amma hamısını yox', () => {
    expect(REPAIR_RESIDUAL).toBeGreaterThan(0);
    expect(REPAIR_RESIDUAL).toBeLessThan(0.5);
  });

  it('MVP-də təsadüfi qüsur YOXDUR', () => {
    expect(DEFECT_TRIGGERS.randomDefectChance).toBe(0);
  });

  it('critical coverage həddi open corner həddindən yuxarıdır', () => {
    expect(DEFECT_TRIGGERS.criticalCoverageBelow).toBeGreaterThan(
      DEFECT_TRIGGERS.openCornerCriticalBelow,
    );
  });
});

describe('efficiency əyrisi', () => {
  it('optimal aralıq 1.0-ı əhatə edir', () => {
    expect(EFFICIENCY_CURVE.optimalMin).toBeLessThan(1);
    expect(EFFICIENCY_CURVE.optimalMax).toBeGreaterThan(1);
  });

  it('knee optimal aralıqdan sonradır', () => {
    expect(EFFICIENCY_CURVE.kneeRatio).toBeGreaterThan(EFFICIENCY_CURVE.optimalMax);
  });

  it('artıq material az materialdan sərt cəzalanır', () => {
    expect(EFFICIENCY_CURVE.kneeDrop).toBeGreaterThan(EFFICIENCY_CURVE.underDrop);
  });
});

describe('progression', () => {
  it('nəticə multiplikatorları azalan sıradadır', () => {
    expect(RESULT_MULTIPLIER.perfect).toBeGreaterThan(RESULT_MULTIPLIER.good);
    expect(RESULT_MULTIPLIER.good).toBeGreaterThan(RESULT_MULTIPLIER.acceptable);
  });

  it('baza reputasiya müsbətdir', () => {
    expect(BASE_REPUTATION).toBeGreaterThan(0);
  });

  it('streç film pulsuzdur, qalanları deyil', () => {
    expect(MATERIAL_PRICE['stretch-film']).toBe(0);
    expect(MATERIAL_PRICE['bubble-wrap']).toBeGreaterThan(0);
    expect(MATERIAL_PRICE['premium-paper']).toBeGreaterThan(0);
    expect(MATERIAL_PRICE.foil).toBeGreaterThan(0);
  });

  it('uyğunluq multiplikatorları azalan sıradadır', () => {
    expect(SUITABILITY_MULTIPLIER.ideal).toBe(1);
    expect(SUITABILITY_MULTIPLIER.alternative).toBeLessThan(SUITABILITY_MULTIPLIER.ideal);
    expect(SUITABILITY_MULTIPLIER.poor).toBeLessThan(SUITABILITY_MULTIPLIER.alternative);
  });
});

describe('data bütövlüyü', () => {
  it('hər recipe mövcud məhsul və materiala işarə edir', () => {
    for (const recipe of ALL_RECIPES) {
      expect(PRODUCTS[recipe.productId]).toBeDefined();
      expect(MATERIALS[recipe.materialId]).toBeDefined();
    }
  });

  it('zona çəkilərinin cəmi 100-dür', () => {
    for (const recipe of ALL_RECIPES) {
      const sum = ALL_ZONES.reduce((acc, z) => acc + (recipe.zoneWeights[z] ?? 0), 0);
      expect(sum).toBe(100);
    }
  });

  it('telefon qutusunda Pass 1 zonalarının çəkisi 70-dir', () => {
    const recipe = ALL_RECIPES.find((r) => r.id === 'phone-box__stretch-film');
    const pass1 = recipe?.wrapPasses.find((p) => p.index === 1);
    const weight = pass1?.zones.reduce((acc, z) => acc + (recipe?.zoneWeights[z] ?? 0), 0);
    // Yalnız Pass 1 ilə Perfect (protection ≥ 90) mümkün olmamalıdır
    expect(weight).toBe(70);
    expect(weight).toBeLessThan(RESULT_THRESHOLDS.perfect.protection);
  });

  it('requiredZones və zoneWeights açarları uyğundur', () => {
    for (const recipe of ALL_RECIPES) {
      for (const zone of recipe.requiredZones) {
        expect(recipe.zoneWeights[zone]).toBeGreaterThan(0);
      }
    }
  });

  it('wrap pass-ları bütün tələb olunan zonaları əhatə edir', () => {
    for (const recipe of ALL_RECIPES) {
      const covered = new Set(recipe.wrapPasses.flatMap((p) => p.zones));
      for (const zone of recipe.requiredZones) {
        expect(covered.has(zone)).toBe(true);
      }
    }
  });

  it('hər recipe-in müsbət material hədəfi və mükafatı var', () => {
    for (const recipe of ALL_RECIPES) {
      expect(recipe.targetMaterialUnits).toBeGreaterThan(0);
      expect(recipe.baseReward).toBeGreaterThan(0);
    }
  });

  it('məhsulların ideal materialları icazəli siyahıdadır', () => {
    for (const product of ALL_PRODUCTS) {
      for (const material of product.idealMaterials) {
        expect(product.allowedMaterials).toContain(material);
      }
    }
  });

  it('hər material və məhsulun localization açarı var', () => {
    for (const item of [...ALL_PRODUCTS, ...ALL_MATERIALS]) {
      expect(item.localizationKey).toMatch(/^[a-z]+\.[a-zA-Z]+$/);
    }
  });
});
