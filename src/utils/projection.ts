import type { ZoneId } from '@/types/game';

/**
 * 2.5D aksonometrik proyeksiya — təmiz riyaziyyat, Skia asılılığı YOXDUR.
 *
 * Oyun tam 3D engine istifadə etmir; həcm illüziyası sabit kameradan
 * proyeksiya edilmiş çoxbucaqlılarla yaradılır (docs/DECISIONS.md §24).
 *
 * Koordinat sistemi (masa mərkəzi = başlanğıc):
 *   x → sağa
 *   y → uzağa (ekranın dərinliyi)
 *   z → yuxarı
 *
 * Ekran koordinatları: `x` sağa, `y` AŞAĞI (Skia konvensiyası).
 */

export type Point = { x: number; y: number };
export type Vec3 = { x: number; y: number; z: number };
export type Polygon = Point[];

/** Masa üzərindəki ölçülər. */
export type BoxSize = {
  /** sola-sağa */
  width: number;
  /** uzağa */
  depth: number;
  /** masadan yuxarı */
  height: number;
};

export type ProjectedBox = {
  faces: Record<ZoneId, Polygon>;
  /** Kameradan görünən üzlər — arxa üzlər çəkilmir */
  visibleFaces: ZoneId[];
};

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Bir 3D nöqtəni ekran müstəvisinə köçürür. */
export function project(p: Vec3, elevationDeg: number, azimuthDeg: number): Point {
  const a = toRad(azimuthDeg);
  const e = toRad(elevationDeg);

  // Şaquli ox ətrafında dönüş
  const sx = p.x * Math.cos(a) + p.y * Math.sin(a);
  const depth = -p.x * Math.sin(a) + p.y * Math.cos(a);

  // Kamera meyli. Mənfi işarə: uzaq və hündür nöqtələr ekranda YUXARI qalxır.
  const sy = -depth * Math.sin(e) - p.z * Math.cos(e);

  // `+ 0` mənfi sıfırı adi sıfıra çevirir — əks halda `-0` render və
  // müqayisə qatlarına sızır.
  return { x: sx + 0, y: sy + 0 };
}

/** Üzün künc nöqtələri — çöldən baxanda saat əqrəbinin əksinə. */
function faceCorners(zone: ZoneId, size: BoxSize): Vec3[] {
  const x = size.width / 2;
  const y = size.depth / 2;
  const z = size.height;

  switch (zone) {
    case 'front':
      return [
        { x: -x, y: -y, z: 0 },
        { x: x, y: -y, z: 0 },
        { x: x, y: -y, z },
        { x: -x, y: -y, z },
      ];
    case 'back':
      return [
        { x: x, y, z: 0 },
        { x: -x, y, z: 0 },
        { x: -x, y, z },
        { x: x, y, z },
      ];
    case 'left':
      return [
        { x: -x, y, z: 0 },
        { x: -x, y: -y, z: 0 },
        { x: -x, y: -y, z },
        { x: -x, y, z },
      ];
    case 'right':
      return [
        { x, y: -y, z: 0 },
        { x, y, z: 0 },
        { x, y, z },
        { x, y: -y, z },
      ];
    case 'top':
      return [
        { x: -x, y: -y, z },
        { x, y: -y, z },
        { x, y, z },
        { x: -x, y, z },
      ];
    case 'bottom':
      return [
        { x: -x, y, z: 0 },
        { x, y, z: 0 },
        { x, y: -y, z: 0 },
        { x: -x, y: -y, z: 0 },
      ];
  }
}

/**
 * Çoxbucaqlının işarəli sahəsi.
 *
 * Ekranda `y` aşağı yönəldiyi üçün, çöldən saat əqrəbinin əksinə yazılmış
 * üz proyeksiyadan sonra MƏNFİ sahə verir. Yəni: `< 0` → üz kameraya baxır.
 */
export function signedArea(polygon: Polygon): number {
  let total = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    total += a.x * b.y - b.x * a.y;
  }
  return total / 2;
}

/**
 * Bütün altı üzü proyeksiya edir və görünənləri müəyyən edir.
 * Görünürlük backface culling ilə hesablanır — beləliklə inspection
 * dönüşü zamanı (Mərhələ 9) istənilən bucaqda düzgün işləyir.
 */
export function projectBox(size: BoxSize, elevationDeg: number, azimuthDeg: number): ProjectedBox {
  const zones: ZoneId[] = ['front', 'back', 'left', 'right', 'top', 'bottom'];
  const faces = {} as Record<ZoneId, Polygon>;
  const visibleFaces: ZoneId[] = [];

  for (const zone of zones) {
    const polygon = faceCorners(zone, size).map((c) => project(c, elevationDeg, azimuthDeg));
    faces[zone] = polygon;
    if (signedArea(polygon) < 0) visibleFaces.push(zone);
  }

  return { faces, visibleFaces };
}

export type Rect = { x: number; y: number; width: number; height: number };

export type FitTransform = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

/** Çoxbucaqlı dəstini verilmiş sahəyə sığdıran miqyas və sürüşmə. */
export function fitToRect(polygons: Polygon[], target: Rect, padding = 0): FitTransform {
  const points = polygons.flat();
  if (points.length === 0) return { scale: 1, offsetX: target.x, offsetY: target.y };

  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  const availableWidth = Math.max(target.width - padding * 2, 1);
  const availableHeight = Math.max(target.height - padding * 2, 1);

  const scale =
    contentWidth === 0 || contentHeight === 0
      ? 1
      : Math.min(availableWidth / contentWidth, availableHeight / contentHeight);

  // Miqyaslandıqdan sonra kontenti hədəf sahənin mərkəzinə gətirir.
  const offsetX = target.x + target.width / 2 - ((minX + maxX) / 2) * scale;
  const offsetY = target.y + target.height / 2 - ((minY + maxY) / 2) * scale;

  return { scale, offsetX, offsetY };
}

export function applyTransform(polygon: Polygon, transform: FitTransform): Polygon {
  return polygon.map((p) => ({
    x: p.x * transform.scale + transform.offsetX,
    y: p.y * transform.scale + transform.offsetY,
  }));
}

/**
 * Üz səthindəki normallaşdırılmış (u, v) nöqtəsini 3D-yə çevirir.
 * `u` və `v` 0–1 aralığındadır.
 *
 * Etiket, coverage maskası və qüsur yerləşdirməsi bunun üzərində qurulur.
 */
export function faceUVToWorld(zone: ZoneId, size: BoxSize, u: number, v: number): Vec3 {
  const corners = faceCorners(zone, size);
  const [a, b, , d] = corners;

  return {
    x: a.x + (b.x - a.x) * u + (d.x - a.x) * v,
    y: a.y + (b.y - a.y) * u + (d.y - a.y) * v,
    z: a.z + (b.z - a.z) * u + (d.z - a.z) * v,
  };
}

/**
 * Çoxbucaqlını SVG path sətrinə çevirir.
 *
 * Skia-nın imperativ `Skia.Path.Make()` API-si web-də CanvasKit WASM
 * yüklənməmiş çağırılsa render zamanı çökür. Deklarativ `<Path path="..." />`
 * isə sətri canvas hazır olandan sonra emal edir — buna görə bütün path-lər
 * sətir kimi qurulur (docs/ARCHITECTURE.md §9).
 */
export function polygonToSvgPath(polygon: Polygon): string {
  if (polygon.length === 0) return '';

  const commands = polygon.map(
    (p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(3)},${p.y.toFixed(3)}`,
  );

  return `${commands.join(' ')} Z`;
}

/** Ray casting — nöqtə çoxbucaqlının içindədirmi. */
export function pointInPolygon(point: Point, polygon: Polygon): boolean {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];

    const intersects =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;

    if (intersects) inside = !inside;
  }

  return inside;
}

/**
 * Toxunuş nöqtəsinin hansı üzə düşdüyünü tapır.
 * Yalnız görünən üzlər yoxlanılır — arxa üzə toxunmaq mümkün deyil.
 */
export function hitTestFace(
  point: Point,
  faces: Record<ZoneId, Polygon>,
  visibleFaces: ZoneId[],
): ZoneId | undefined {
  return visibleFaces.find((zone) => pointInPolygon(point, faces[zone]));
}
