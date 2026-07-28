import { DEFECT_TRIGGERS, REPAIR_CRITERIA } from '@/config/balance';
import {
  createDefect,
  detectFinalDefects,
  detectOpenCorners,
  detectSealDefects,
  detectZoneDefects,
  isRepairSuccessful,
  resetDefectIds,
  shouldCreateThinFilm,
} from '@/domain/defects/rules';
import type { ZoneId } from '@/types/game';

/**
 * Qüsur triggerləri — docs/BALANCE.md §6 cədvəlindəki HƏR sətir üçün test
 * (docs/TESTING.md §3.3 tələbi).
 */

beforeEach(resetDefectIds);

describe('qüsur identifikatorları', () => {
  it('hər qüsur unikal id alır', () => {
    const a = createDefect('wrinkle', 'minor');
    const b = createDefect('wrinkle', 'minor');
    expect(a.id).not.toBe(b.id);
  });

  it('yeni qüsur düzəldilməmiş vəziyyətdə yaranır', () => {
    expect(createDefect('wrinkle', 'minor').repaired).toBe(false);
  });

  it('zona və magnitude ötürülür', () => {
    const d = createDefect('asymmetry', 'minor', { zone: 'front', magnitude: 6 });
    expect(d.zone).toBe('front');
    expect(d.magnitude).toBe(6);
  });
});

describe('zona sarımı — qırış və hava qabarcığı', () => {
  const base = { zone: 'front' as ZoneId, coverage: 1, lateralDeviation: 0 };

  it('zəif dartılma qırış yaradır', () => {
    const defects = detectZoneDefects({ ...base, meanTension: 'loose' });
    expect(defects.map((d) => d.type)).toEqual(['wrinkle']);
    expect(defects[0].zone).toBe('front');
  });

  it('optimal dartılma qırış yaratmır', () => {
    expect(detectZoneDefects({ ...base, meanTension: 'optimal' })).toEqual([]);
  });

  it('overstretch tək başına qırış yaratmır', () => {
    expect(detectZoneDefects({ ...base, meanTension: 'overstretched' })).toEqual([]);
  });

  it('yan sapma həddi keçildikdə hava qabarcığı yaranır', () => {
    const over = DEFECT_TRIGGERS.airBubbleLateralDeviation + 0.01;
    const defects = detectZoneDefects({ ...base, meanTension: 'optimal', lateralDeviation: over });
    expect(defects.map((d) => d.type)).toEqual(['airBubble']);
  });

  it('sapma tam həddə bərabərdirsə qüsur yaranmır', () => {
    const exact = DEFECT_TRIGGERS.airBubbleLateralDeviation;
    expect(detectZoneDefects({ ...base, meanTension: 'optimal', lateralDeviation: exact })).toEqual(
      [],
    );
  });

  it('iki səbəb eyni anda iki qüsur yaradır', () => {
    const defects = detectZoneDefects({
      ...base,
      meanTension: 'loose',
      lateralDeviation: 0.5,
    });
    expect(defects.map((d) => d.type).sort()).toEqual(['airBubble', 'wrinkle']);
  });

  it('açıq künc BURADA yoxlanılmır — zona sonra tamamlana bilər', () => {
    const defects = detectZoneDefects({
      ...base,
      coverage: 0.3,
      meanTension: 'optimal',
    });
    expect(defects.map((d) => d.type)).not.toContain('openCorner');
  });
});

describe('pass irəliləməsi — açıq künc', () => {
  const zones: ZoneId[] = ['front', 'back', 'left', 'right'];

  it('tam örtülmüş zonalar qüsur yaratmır', () => {
    expect(detectOpenCorners({ front: 1, back: 1, left: 1, right: 1 }, zones)).toEqual([]);
  });

  it('90% həddi kifayətdir', () => {
    const at = DEFECT_TRIGGERS.openCornerBelow;
    expect(detectOpenCorners({ front: at, back: 1, left: 1, right: 1 }, zones)).toEqual([]);
  });

  it('90%-dən aşağı minor açıq künc yaradır', () => {
    const defects = detectOpenCorners({ front: 0.6, back: 1, left: 1, right: 1 }, zones);
    expect(defects).toHaveLength(1);
    expect(defects[0].type).toBe('openCorner');
    expect(defects[0].severity).toBe('minor');
    expect(defects[0].zone).toBe('front');
  });

  it('25%-dən aşağı CRITICAL sayılır', () => {
    const defects = detectOpenCorners({ front: 0.1, back: 1, left: 1, right: 1 }, zones);
    expect(defects[0].severity).toBe('critical');
  });

  it('25% həddi minor sayılır (sərhəd dəqiq)', () => {
    const at = DEFECT_TRIGGERS.openCornerCriticalBelow;
    const defects = detectOpenCorners({ front: at, back: 1, left: 1, right: 1 }, zones);
    expect(defects[0].severity).toBe('minor');
  });

  it('heç toxunulmamış zona critical sayılır', () => {
    const defects = detectOpenCorners({}, zones);
    expect(defects).toHaveLength(4);
    expect(defects.every((d) => d.severity === 'critical')).toBe(true);
  });

  it('yalnız həmin pass-ın zonaları yoxlanılır', () => {
    // top/bottom Pass 2-dədir — Pass 1 yoxlanışına düşməməlidir
    const defects = detectOpenCorners({ front: 1, back: 1, left: 1, right: 1 }, zones);
    expect(defects).toEqual([]);
  });
});

describe('overstretch — nazilmiş film', () => {
  it('həddən qısa overstretch qüsur yaratmır', () => {
    expect(shouldCreateThinFilm(DEFECT_TRIGGERS.thinFilmHoldSeconds - 0.1)).toBe(false);
  });

  it('həddə çatanda qüsur yaranır', () => {
    expect(shouldCreateThinFilm(DEFECT_TRIGGERS.thinFilmHoldSeconds)).toBe(true);
  });

  it('uzun overstretch qüsur yaradır', () => {
    expect(shouldCreateThinFilm(5)).toBe(true);
  });
});

describe('seal qüsurları', () => {
  it('seal yoxdursa CRITICAL boş uc yaranır', () => {
    const defects = detectSealDefects('missing', 0);
    expect(defects).toHaveLength(1);
    expect(defects[0].type).toBe('looseEnd');
    expect(defects[0].severity).toBe('critical');
  });

  it('yanlış zona minor boş uc yaradır', () => {
    const defects = detectSealDefects('wrong-zone', 0);
    expect(defects[0].type).toBe('looseEnd');
    expect(defects[0].severity).toBe('minor');
  });

  it('düzgün seal qüsur yaratmır', () => {
    expect(detectSealDefects('correct', 0)).toEqual([]);
  });

  it('bucaq sapması əyri seal yaradır', () => {
    const over = DEFECT_TRIGGERS.crookedSealAngleDeg + 1;
    expect(detectSealDefects('correct', over).map((d) => d.type)).toEqual(['crookedSeal']);
  });

  it('mənfi bucaq da yoxlanılır', () => {
    const over = -(DEFECT_TRIGGERS.crookedSealAngleDeg + 1);
    expect(detectSealDefects('correct', over).map((d) => d.type)).toEqual(['crookedSeal']);
  });

  it('bucaq tam həddə bərabərdirsə qüsur yoxdur', () => {
    expect(detectSealDefects('correct', DEFECT_TRIGGERS.crookedSealAngleDeg)).toEqual([]);
  });

  it('seal yoxdursa bucaq yoxlanmır (artıq cəza verilmir)', () => {
    expect(detectSealDefects('missing', 90)).toHaveLength(1);
  });
});

describe('sessiya sonu qüsurları', () => {
  it('artıq material qüsuru 125%-dən sonra yaranır', () => {
    const over = DEFECT_TRIGGERS.excessMaterialRatio + 0.01;
    const defects = detectFinalDefects({ materialRatio: over, weightedCoverage: 1 });
    expect(defects.map((d) => d.type)).toEqual(['excessMaterial']);
  });

  it('125% tam həddində qüsur yoxdur', () => {
    const defects = detectFinalDefects({
      materialRatio: DEFECT_TRIGGERS.excessMaterialRatio,
      weightedCoverage: 1,
    });
    expect(defects).toEqual([]);
  });

  it('ümumi coverage 80%-dən aşağıdırsa CRITICAL', () => {
    const below = DEFECT_TRIGGERS.criticalCoverageBelow - 0.01;
    const defects = detectFinalDefects({ materialRatio: 1, weightedCoverage: below });
    expect(defects).toHaveLength(1);
    expect(defects[0].type).toBe('coverageCritical');
    expect(defects[0].severity).toBe('critical');
  });

  it('80% tam həddində qüsur yoxdur', () => {
    expect(
      detectFinalDefects({
        materialRatio: 1,
        weightedCoverage: DEFECT_TRIGGERS.criticalCoverageBelow,
      }),
    ).toEqual([]);
  });

  it('hər iki problem eyni anda ola bilər', () => {
    const defects = detectFinalDefects({ materialRatio: 2, weightedCoverage: 0.5 });
    expect(defects.map((d) => d.type).sort()).toEqual(['coverageCritical', 'excessMaterial']);
  });
});

describe('MVP invarianti — təsadüfi qüsur yoxdur', () => {
  it('eyni giriş həmişə eyni qüsurları verir', () => {
    const signal = {
      zone: 'front' as ZoneId,
      coverage: 0.5,
      meanTension: 'loose' as const,
      lateralDeviation: 0.5,
    };

    resetDefectIds();
    const first = detectZoneDefects(signal).map((d) => `${d.type}:${d.severity}`);
    resetDefectIds();
    const second = detectZoneDefects(signal).map((d) => `${d.type}:${d.severity}`);

    expect(first).toEqual(second);
  });

  it('randomDefectChance sıfırdır', () => {
    expect(DEFECT_TRIGGERS.randomDefectChance).toBe(0);
  });
});

describe('düzəltmə uğur şərtləri', () => {
  it('qırış: swipe path-ın 70%-i qırışa düşməlidir', () => {
    expect(isRepairSuccessful('wrinkle', { overlap: REPAIR_CRITERIA.wrinkleSwipeOverlap })).toBe(
      true,
    );
    expect(isRepairSuccessful('wrinkle', { overlap: 0.69 })).toBe(false);
    expect(isRepairSuccessful('wrinkle', {})).toBe(false);
  });

  it('hava qabarcığı: minimum drag məsafəsi', () => {
    expect(
      isRepairSuccessful('airBubble', { distance: REPAIR_CRITERIA.airBubbleDragDistance }),
    ).toBe(true);
    expect(isRepairSuccessful('airBubble', { distance: 10 })).toBe(false);
  });

  it('açıq künc: zona 90%-ə çatmalıdır', () => {
    expect(
      isRepairSuccessful('openCorner', { coverage: REPAIR_CRITERIA.openCornerTargetCoverage }),
    ).toBe(true);
    expect(isRepairSuccessful('openCorner', { coverage: 0.5 })).toBe(false);
  });

  it('əyri seal / etiket / möhür: bucaq ≤ 5°', () => {
    for (const type of ['crookedSeal', 'crookedLabel', 'crookedStamp'] as const) {
      expect(isRepairSuccessful(type, { angleDeg: REPAIR_CRITERIA.crookedSealMaxAngleDeg })).toBe(
        true,
      );
      expect(isRepairSuccessful(type, { angleDeg: -3 })).toBe(true);
      expect(isRepairSuccessful(type, { angleDeg: 20 })).toBe(false);
      expect(isRepairSuccessful(type, {})).toBe(false);
    }
  });

  it('boş uc və artıq material gesture-in özü ilə düzəlir', () => {
    expect(isRepairSuccessful('looseEnd', {})).toBe(true);
    expect(isRepairSuccessful('excessMaterial', {})).toBe(true);
  });

  it('düzəldilə bilməyən qüsur növü false qaytarır', () => {
    expect(isRepairSuccessful('coverageCritical', {})).toBe(false);
    expect(isRepairSuccessful('thinFilm', {})).toBe(false);
  });
});
