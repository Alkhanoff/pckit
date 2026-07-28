import { CAMERA } from '@/config/gameplay';
import type { ZoneId } from '@/types/game';
import {
  applyTransform,
  faceUVToWorld,
  fitToRect,
  hitTestFace,
  pointInPolygon,
  polygonToSvgPath,
  project,
  projectBox,
  signedArea,
} from '@/utils/projection';
import type { BoxSize, Polygon } from '@/utils/projection';

const ELEV = CAMERA.angleDeg;
const AZI = CAMERA.azimuthDeg;

/** Telefon qutusu: masada uzanır, uzun oxu uzağa gedir. */
const PHONE_BOX: BoxSize = { width: 1.0, depth: 1.7, height: 0.35 };
const CUBE: BoxSize = { width: 1, depth: 1, height: 1 };

function bounds(polygon: Polygon) {
  return {
    minX: Math.min(...polygon.map((p) => p.x)),
    maxX: Math.max(...polygon.map((p) => p.x)),
    minY: Math.min(...polygon.map((p) => p.y)),
    maxY: Math.max(...polygon.map((p) => p.y)),
  };
}

describe('project — tək nöqtə', () => {
  it('başlanğıc nöqtəsi ekranın başlanğıcına düşür', () => {
    expect(project({ x: 0, y: 0, z: 0 }, ELEV, AZI)).toEqual({ x: 0, y: 0 });
  });

  it('hündür nöqtə ekranda YUXARI qalxır', () => {
    const top = project({ x: 0, y: 0, z: 1 }, ELEV, AZI);
    expect(top.y).toBeLessThan(0);
  });

  it('uzaq nöqtə ekranda YUXARI qalxır', () => {
    const far = project({ x: 0, y: 1, z: 0 }, ELEV, AZI);
    const near = project({ x: 0, y: -1, z: 0 }, ELEV, AZI);
    expect(far.y).toBeLessThan(near.y);
  });

  it('sağ nöqtə ekranda SAĞA gedir', () => {
    expect(project({ x: 1, y: 0, z: 0 }, ELEV, AZI).x).toBeGreaterThan(0);
  });

  it('90° kamerada dərinlik tam sıxılır (quşbaxışı)', () => {
    // Yuxarıdan düz baxanda hündürlük ekranda yer tutmur
    const top = project({ x: 0, y: 0, z: 1 }, 90, 0);
    expect(top.y).toBeCloseTo(0, 10);
  });

  it('0° kamerada dərinlik görünmür (yan baxış)', () => {
    const far = project({ x: 0, y: 5, z: 0 }, 0, 0);
    expect(far.y).toBeCloseTo(0, 10);
  });

  it('deterministikdir', () => {
    const p = { x: 0.3, y: -0.7, z: 0.2 };
    expect(project(p, ELEV, AZI)).toEqual(project(p, ELEV, AZI));
  });
});

describe('projectBox — görünürlük', () => {
  const box = projectBox(PHONE_BOX, ELEV, AZI);

  it('ön, sağ və üst üzlər görünür', () => {
    expect([...box.visibleFaces].sort()).toEqual(['front', 'right', 'top']);
  });

  it('arxa, sol və alt üzlər görünmür', () => {
    for (const hidden of ['back', 'left', 'bottom'] as ZoneId[]) {
      expect(box.visibleFaces).not.toContain(hidden);
    }
  });

  it('görünən üzlərin işarəli sahəsi mənfidir', () => {
    for (const zone of box.visibleFaces) {
      expect(signedArea(box.faces[zone])).toBeLessThan(0);
    }
  });

  it('altı üzün hamısı hesablanır (inspection dönüşü üçün)', () => {
    expect(Object.keys(box.faces)).toHaveLength(6);
    for (const polygon of Object.values(box.faces)) {
      expect(polygon).toHaveLength(4);
    }
  });

  it('azimut mənfi olanda SOL üz görünür', () => {
    const mirrored = projectBox(PHONE_BOX, ELEV, -AZI);
    expect(mirrored.visibleFaces).toContain('left');
    expect(mirrored.visibleFaces).not.toContain('right');
  });

  it('kamera arxaya dönəndə arxa üz görünür', () => {
    const behind = projectBox(CUBE, ELEV, 180);
    expect(behind.visibleFaces).toContain('back');
    expect(behind.visibleFaces).not.toContain('front');
  });

  it('istənilən bucaqda eyni anda üç üz görünür', () => {
    for (const azimuth of [10, 25, 45, 70, 115, 200, 340]) {
      const projected = projectBox(CUBE, ELEV, azimuth);
      expect(projected.visibleFaces.length).toBeGreaterThanOrEqual(2);
      expect(projected.visibleFaces.length).toBeLessThanOrEqual(3);
    }
  });
});

describe('projectBox — həcm illüziyası', () => {
  const box = projectBox(PHONE_BOX, ELEV, AZI);

  it('üst üz ön üzdən YUXARIDA yerləşir', () => {
    expect(bounds(box.faces.top).maxY).toBeLessThanOrEqual(bounds(box.faces.front).maxY);
  });

  it('qutu düz düzbucaqlı DEYİL — üst üz paraleloqramdır', () => {
    const top = box.faces.top;
    // Düzbucaqlı olsaydı yalnız iki fərqli y dəyəri olardı
    const uniqueY = new Set(top.map((p) => p.y.toFixed(4)));
    expect(uniqueY.size).toBeGreaterThan(2);
  });

  it('üç görünən üzün hər birinin sahəsi sıfırdan böyükdür', () => {
    for (const zone of box.visibleFaces) {
      expect(Math.abs(signedArea(box.faces[zone]))).toBeGreaterThan(0.001);
    }
  });

  it('hündürlük artdıqca ön üz böyüyür', () => {
    const flat = projectBox({ ...PHONE_BOX, height: 0.1 }, ELEV, AZI);
    const tall = projectBox({ ...PHONE_BOX, height: 1.0 }, ELEV, AZI);
    expect(Math.abs(signedArea(tall.faces.front))).toBeGreaterThan(
      Math.abs(signedArea(flat.faces.front)),
    );
  });
});

describe('fitToRect — ekrana sığdırma', () => {
  const box = projectBox(PHONE_BOX, ELEV, AZI);
  const visible = box.visibleFaces.map((z) => box.faces[z]);

  it.each([
    ['iPhone SE', 375, 667],
    ['iPhone 15', 393, 852],
    ['iPhone Pro Max', 430, 932],
    ['iPad mini', 744, 1133],
  ])('%s — qutu sahədən kənara çıxmır', (_name, width, height) => {
    const target = { x: 0, y: 0, width, height: height * 0.5 };
    const transform = fitToRect(visible, target, 24);

    for (const polygon of visible) {
      for (const p of applyTransform(polygon, transform)) {
        expect(p.x).toBeGreaterThanOrEqual(target.x - 0.01);
        expect(p.x).toBeLessThanOrEqual(target.x + target.width + 0.01);
        expect(p.y).toBeGreaterThanOrEqual(target.y - 0.01);
        expect(p.y).toBeLessThanOrEqual(target.y + target.height + 0.01);
      }
    }
  });

  it('qutu hədəf sahənin mərkəzində yerləşir', () => {
    const target = { x: 0, y: 0, width: 300, height: 300 };
    const transform = fitToRect(visible, target, 0);
    const all = visible.flatMap((p) => applyTransform(p, transform));

    const centerX = (Math.min(...all.map((p) => p.x)) + Math.max(...all.map((p) => p.x))) / 2;
    const centerY = (Math.min(...all.map((p) => p.y)) + Math.max(...all.map((p) => p.y))) / 2;

    expect(centerX).toBeCloseTo(150, 5);
    expect(centerY).toBeCloseTo(150, 5);
  });

  it('kiçik ekranda miqyas kiçilir', () => {
    const small = fitToRect(visible, { x: 0, y: 0, width: 200, height: 200 });
    const large = fitToRect(visible, { x: 0, y: 0, width: 400, height: 400 });
    expect(small.scale).toBeLessThan(large.scale);
  });

  it('boş giriş crash etmir', () => {
    expect(() => fitToRect([], { x: 0, y: 0, width: 100, height: 100 })).not.toThrow();
  });
});

describe('faceUVToWorld', () => {
  it('üst üzün küncləri qutunun küncləridir', () => {
    const corner = faceUVToWorld('top', CUBE, 0, 0);
    expect(corner).toEqual({ x: -0.5, y: -0.5, z: 1 });
  });

  it('mərkəz nöqtəsi üzün ortasındadır', () => {
    const center = faceUVToWorld('top', CUBE, 0.5, 0.5);
    expect(center.x).toBeCloseTo(0, 10);
    expect(center.y).toBeCloseTo(0, 10);
    expect(center.z).toBeCloseTo(1, 10);
  });

  it('ön üzdə v oxu yuxarı qalxır', () => {
    const low = faceUVToWorld('front', CUBE, 0.5, 0);
    const high = faceUVToWorld('front', CUBE, 0.5, 1);
    expect(high.z).toBeGreaterThan(low.z);
  });

  it('hər üz üçün nəticə qutunun sərhədləri daxilindədir', () => {
    const zones: ZoneId[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    for (const zone of zones) {
      for (const [u, v] of [
        [0, 0],
        [1, 0],
        [0.5, 0.5],
        [1, 1],
      ]) {
        const p = faceUVToWorld(zone, PHONE_BOX, u, v);
        expect(Math.abs(p.x)).toBeLessThanOrEqual(PHONE_BOX.width / 2 + 1e-9);
        expect(Math.abs(p.y)).toBeLessThanOrEqual(PHONE_BOX.depth / 2 + 1e-9);
        expect(p.z).toBeGreaterThanOrEqual(-1e-9);
        expect(p.z).toBeLessThanOrEqual(PHONE_BOX.height + 1e-9);
      }
    }
  });
});

describe('pointInPolygon', () => {
  const square: Polygon = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  it('daxildəki nöqtəni tapır', () => {
    expect(pointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
  });

  it('xaricdəki nöqtəni rədd edir', () => {
    expect(pointInPolygon({ x: 15, y: 5 }, square)).toBe(false);
    expect(pointInPolygon({ x: -1, y: 5 }, square)).toBe(false);
    expect(pointInPolygon({ x: 5, y: 20 }, square)).toBe(false);
  });

  it('paraleloqramda işləyir', () => {
    const parallelogram: Polygon = [
      { x: 0, y: 0 },
      { x: 10, y: -5 },
      { x: 14, y: 0 },
      { x: 4, y: 5 },
    ];
    expect(pointInPolygon({ x: 7, y: 0 }, parallelogram)).toBe(true);
    expect(pointInPolygon({ x: 0, y: 5 }, parallelogram)).toBe(false);
  });
});

describe('hitTestFace — toxunma zonaları', () => {
  const box = projectBox(PHONE_BOX, ELEV, AZI);
  const target = { x: 0, y: 0, width: 300, height: 300 };
  const transform = fitToRect(
    box.visibleFaces.map((z) => box.faces[z]),
    target,
    10,
  );

  const screenFaces = Object.fromEntries(
    (Object.keys(box.faces) as ZoneId[]).map((z) => [z, applyTransform(box.faces[z], transform)]),
  ) as Record<ZoneId, Polygon>;

  function centroid(polygon: Polygon) {
    return {
      x: polygon.reduce((s, p) => s + p.x, 0) / polygon.length,
      y: polygon.reduce((s, p) => s + p.y, 0) / polygon.length,
    };
  }

  it('hər görünən üzün mərkəzinə toxunmaq həmin üzü qaytarır', () => {
    for (const zone of box.visibleFaces) {
      expect(hitTestFace(centroid(screenFaces[zone]), screenFaces, box.visibleFaces)).toBe(zone);
    }
  });

  it('qutudan kənar toxunuş heç nə qaytarmır', () => {
    expect(hitTestFace({ x: -500, y: -500 }, screenFaces, box.visibleFaces)).toBeUndefined();
  });

  it('görünməyən üzə toxunmaq mümkün deyil', () => {
    const hidden = centroid(screenFaces.back);
    const result = hitTestFace(hidden, screenFaces, box.visibleFaces);
    expect(result).not.toBe('back');
  });
});

describe('polygonToSvgPath', () => {
  it('bağlı SVG path sətri qurur', () => {
    const path = polygonToSvgPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]);
    expect(path).toBe('M0.000,0.000 L10.000,0.000 L10.000,10.000 Z');
  });

  it('boş çoxbucaqlı boş sətir verir', () => {
    expect(polygonToSvgPath([])).toBe('');
  });

  it('qutunun üzləri etibarlı path verir', () => {
    const box = projectBox(PHONE_BOX, ELEV, AZI);
    for (const zone of box.visibleFaces) {
      const path = polygonToSvgPath(box.faces[zone]);
      expect(path).toMatch(/^M[-\d.]+,[-\d.]+( L[-\d.]+,[-\d.]+){3} Z$/);
      expect(path).not.toContain('NaN');
    }
  });

  it('nəticə deterministikdir', () => {
    const box = projectBox(PHONE_BOX, ELEV, AZI);
    expect(polygonToSvgPath(box.faces.top)).toBe(polygonToSvgPath(box.faces.top));
  });
});
