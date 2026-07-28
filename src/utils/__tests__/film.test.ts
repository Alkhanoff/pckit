import {
  computeFilmSheet,
  filmOpacity,
  filmTipHalfWidth,
  rollRemaining,
  wrinkleAmplitude,
  wrinkleCount,
  wrinklePaths,
} from '@/utils/film';
import type { Point } from '@/utils/projection';

const ANCHOR: Point = { x: 40, y: 200 };
const HALF_WIDTH = 30;

function sheetAt(tip: Point, tension = 0.5) {
  return computeFilmSheet(ANCHOR, tip, HALF_WIDTH, filmTipHalfWidth(HALF_WIDTH, tension));
}

describe('film vərəqinin həndəsəsi', () => {
  it('dörd künc nöqtəsi qaytarır', () => {
    expect(sheetAt({ x: 240, y: 200 }).quad).toHaveLength(4);
  });

  it('drag məsafəsi filmin uzunluğunu artırır', () => {
    const short = sheetAt({ x: 100, y: 200 });
    const long = sheetAt({ x: 300, y: 200 });
    expect(long.length).toBeGreaterThan(short.length);
  });

  it('uzunluq həqiqi məsafəyə bərabərdir', () => {
    expect(sheetAt({ x: ANCHOR.x + 120, y: ANCHOR.y }).length).toBeCloseTo(120, 6);
    expect(sheetAt({ x: ANCHOR.x + 30, y: ANCHOR.y + 40 }).length).toBeCloseTo(50, 6);
  });

  it('barmaq tərpənməyibsə film hələ rulondadır', () => {
    const sheet = computeFilmSheet(ANCHOR, ANCHOR, HALF_WIDTH, HALF_WIDTH);
    expect(sheet.length).toBe(0);
    expect(sheet.quad).toHaveLength(4);
  });

  it('vərəq çəkilmə oxuna perpendikulyar genişlikdədir', () => {
    // Sağa çəkilmə → en şaquli ölçüdədir
    const sheet = sheetAt({ x: 240, y: 200 }, 0);
    const [topAnchor, , , bottomAnchor] = sheet.quad;
    expect(Math.abs(topAnchor.x - bottomAnchor.x)).toBeCloseTo(0, 6);
    expect(Math.abs(topAnchor.y - bottomAnchor.y)).toBeCloseTo(HALF_WIDTH * 2, 6);
  });

  it('aşağı çəkiləndə en üfüqi olur', () => {
    const sheet = sheetAt({ x: 40, y: 400 }, 0);
    const [topAnchor, , , bottomAnchor] = sheet.quad;
    expect(Math.abs(topAnchor.y - bottomAnchor.y)).toBeCloseTo(0, 6);
    expect(Math.abs(topAnchor.x - bottomAnchor.x)).toBeCloseTo(HALF_WIDTH * 2, 6);
  });

  it('ox bucağı hesablanır', () => {
    expect(sheetAt({ x: 240, y: 200 }).axisDeg).toBeCloseTo(0, 6);
    expect(sheetAt({ x: 40, y: 400 }).axisDeg).toBeCloseTo(90, 6);
  });

  it('nəticə deterministikdir', () => {
    expect(sheetAt({ x: 173, y: 260 })).toEqual(sheetAt({ x: 173, y: 260 }));
  });
});

describe('dartılma vizualı', () => {
  it('film dartıldıqca nazilir', () => {
    expect(filmTipHalfWidth(HALF_WIDTH, 1)).toBeLessThan(filmTipHalfWidth(HALF_WIDTH, 0));
  });

  it('nazilmə tam yox olmur — film görünən qalır', () => {
    expect(filmTipHalfWidth(HALF_WIDTH, 1)).toBeGreaterThan(HALF_WIDTH * 0.5);
  });

  it('dartıldıqca daha şəffaf olur', () => {
    expect(filmOpacity(1)).toBeLessThan(filmOpacity(0));
  });

  it('şəffaflıq görünən aralıqda qalır', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      expect(filmOpacity(t)).toBeGreaterThan(0.2);
      expect(filmOpacity(t)).toBeLessThanOrEqual(0.6);
    }
  });
});

describe('qırışlar — üç band aydın fərqlənir', () => {
  it('boş film ən çox qırışlıdır', () => {
    expect(wrinkleCount(0, 7)).toBe(7);
  });

  it('optimal dartılmada qırış yox olur', () => {
    // 0.35–0.75 optimal bandının ortası
    expect(wrinkleCount(0.55, 7)).toBe(0);
    expect(wrinkleCount(0.65, 7)).toBe(0);
  });

  it('overstretch-də bir neçə gərgin xətt qayıdır', () => {
    expect(wrinkleCount(1, 7)).toBeGreaterThan(0);
    expect(wrinkleCount(1, 7)).toBeLessThan(wrinkleCount(0, 7));
  });

  it('qırış sayı heç vaxt limiti keçmir', () => {
    for (let t = 0; t <= 1.01; t += 0.05) {
      const count = wrinkleCount(t, 7);
      expect(count).toBeGreaterThanOrEqual(0);
      expect(count).toBeLessThanOrEqual(7);
    }
  });

  it('boş filmdə qırış daha dərindir', () => {
    expect(wrinkleAmplitude(0, 9)).toBeGreaterThan(wrinkleAmplitude(0.4, 9));
    expect(wrinkleAmplitude(0.6, 9)).toBe(0);
  });
});

describe('qırış path-ləri', () => {
  const sheet = sheetAt({ x: 340, y: 200 }, 0);

  it('boş filmdə path qaytarır', () => {
    const path = wrinklePaths(sheet, 0, 7, 9);
    expect(path).toContain('M');
    expect(path).toContain('Q');
    expect(path).not.toContain('NaN');
  });

  it('optimal dartılmada path boşdur', () => {
    expect(wrinklePaths(sheet, 0.55, 7, 9)).toBe('');
  });

  it('film çəkilməyibsə path boşdur', () => {
    const idle = computeFilmSheet(ANCHOR, ANCHOR, HALF_WIDTH, HALF_WIDTH);
    expect(wrinklePaths(idle, 0, 7, 9)).toBe('');
  });

  it('path sayı qırış sayına uyğundur', () => {
    const path = wrinklePaths(sheet, 0, 7, 9);
    expect(path.split('M').length - 1).toBe(wrinkleCount(0, 7));
  });

  it('TƏSADÜFİLİK YOXDUR — eyni giriş eyni qırışı verir', () => {
    expect(wrinklePaths(sheet, 0.2, 7, 9)).toBe(wrinklePaths(sheet, 0.2, 7, 9));
  });
});

describe('rulon ehtiyatı', () => {
  it('çəkildikcə azalır', () => {
    expect(rollRemaining(0, 500)).toBe(1);
    expect(rollRemaining(250, 500)).toBe(0.5);
    expect(rollRemaining(500, 500)).toBe(0);
  });

  it('mənfiyə düşmür', () => {
    expect(rollRemaining(9999, 500)).toBe(0);
  });

  it('tutum sıfırdırsa sıfır qaytarır', () => {
    expect(rollRemaining(10, 0)).toBe(0);
  });
});
