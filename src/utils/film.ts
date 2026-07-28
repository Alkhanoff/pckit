import { clamp01 } from '@/utils/gestureMath';
import type { Point, Polygon } from '@/utils/projection';

/**
 * Streç filmin həndəsəsi.
 *
 * Real cloth simulation İSTİFADƏ EDİLMİR (docs/DECISIONS.md §24) — film
 * rulondan barmağa uzanan dördbucaqlı və üzərindəki qırış xətləri ilə
 * təsvir olunur.
 *
 * Hər funksiya `'worklet'` işarəlidir: film hər frame yenidən hesablanır və
 * bu hesablama UI thread-də baş verməlidir.
 */

export type FilmSheet = {
  /** Filmin dördbucaqlısı: rulon kənarından barmağa */
  quad: Polygon;
  /** Çəkilmə oxunun bucağı (dərəcə) */
  axisDeg: number;
  length: number;
};

/** Filmin ucu dartıldıqca nazilir — overstretch vizual olaraq görünür. */
export function filmTipHalfWidth(baseHalfWidth: number, tension: number): number {
  'worklet';
  // Optimal aralığa qədər demək olar sabit, sonra nəzərəçarpan nazilmə
  const thinning = 1 - 0.28 * clamp01(tension);
  return baseHalfWidth * thinning;
}

/** Filmin şəffaflığı — dartıldıqca daha nazik və şəffaf görünür. */
export function filmOpacity(tension: number): number {
  'worklet';
  return 0.52 - 0.18 * clamp01(tension);
}

/**
 * Rulon kənarından barmağa uzanan film vərəqi.
 * Uc hissə çəkilmə oxuna perpendikulyar genişlikdə qurulur.
 */
export function computeFilmSheet(
  anchor: Point,
  tip: Point,
  anchorHalfWidth: number,
  tipHalfWidth: number,
): FilmSheet {
  'worklet';
  const dx = tip.x - anchor.x;
  const dy = tip.y - anchor.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Barmaq tərpənməyibsə film hələ rulondadır
  if (length < 0.001) {
    return {
      quad: [
        { x: anchor.x, y: anchor.y - anchorHalfWidth },
        { x: anchor.x, y: anchor.y + anchorHalfWidth },
        { x: anchor.x, y: anchor.y + anchorHalfWidth },
        { x: anchor.x, y: anchor.y - anchorHalfWidth },
      ],
      axisDeg: 0,
      length: 0,
    };
  }

  const ux = dx / length;
  const uy = dy / length;
  // Oxa perpendikulyar vahid vektor
  const px = -uy;
  const py = ux;

  return {
    quad: [
      { x: anchor.x + px * anchorHalfWidth, y: anchor.y + py * anchorHalfWidth },
      { x: tip.x + px * tipHalfWidth, y: tip.y + py * tipHalfWidth },
      { x: tip.x - px * tipHalfWidth, y: tip.y - py * tipHalfWidth },
      { x: anchor.x - px * anchorHalfWidth, y: anchor.y - py * anchorHalfWidth },
    ],
    axisDeg: (Math.atan2(dy, dx) * 180) / Math.PI,
    length,
  };
}

/**
 * Qırış xətlərinin sayı.
 *
 * Boş film qırışlıdır, optimal dartılmada hamarlanır, overstretch-də
 * yenidən bir neçə gərgin xətt görünür.
 */
export function wrinkleCount(tension: number, maxCount: number): number {
  'worklet';
  const t = clamp01(tension);
  // 0 → maksimum qırış · 0.55 → sıfır · 1 → az sayda gərgin xətt
  const slack = Math.max(0, 1 - t / 0.55);
  const strain = Math.max(0, (t - 0.8) / 0.2);
  return Math.round(maxCount * Math.max(slack, strain * 0.4));
}

/** Qırışın dalğa amplitudası — boş filmdə daha dərin. */
export function wrinkleAmplitude(tension: number, baseAmplitude: number): number {
  'worklet';
  const slack = Math.max(0, 1 - clamp01(tension) / 0.55);
  return baseAmplitude * slack;
}

/**
 * Film üzərindəki qırış xətləri — SVG path sətri.
 *
 * Xətlər çəkilmə oxuna perpendikulyardır və deterministik yerləşir
 * (təsadüfilik yoxdur: eyni giriş həmişə eyni qırışı verir).
 */
export function wrinklePaths(
  sheet: FilmSheet,
  tension: number,
  maxCount: number,
  baseAmplitude: number,
): string {
  'worklet';
  const count = wrinkleCount(tension, maxCount);
  if (count === 0 || sheet.length < 1) return '';

  const amplitude = wrinkleAmplitude(tension, baseAmplitude);

  const [a0, a1, a2, a3] = sheet.quad;
  const commands: string[] = [];

  for (let i = 1; i <= count; i += 1) {
    // Rulon və uc arasında bərabər paylanır
    const t = i / (count + 1);

    // Hər tərəfdə uyğun nöqtə (a0→a1 üst kənar, a3→a2 alt kənar)
    const topX = a0.x + (a1.x - a0.x) * t;
    const topY = a0.y + (a1.y - a0.y) * t;
    const bottomX = a3.x + (a2.x - a3.x) * t;
    const bottomY = a3.y + (a2.y - a3.y) * t;

    // Növbələşən əyrilik — qırışlar bir-birinə paralel yatmasın
    const bend = (i % 2 === 0 ? 1 : -1) * amplitude;
    const midX = (topX + bottomX) / 2 + bend;
    const midY = (topY + bottomY) / 2;

    commands.push(
      `M${topX.toFixed(2)},${topY.toFixed(2)} Q${midX.toFixed(2)},${midY.toFixed(2)} ${bottomX.toFixed(2)},${bottomY.toFixed(2)}`,
    );
  }

  return commands.join(' ');
}

/** Rulonun üzərində qalan filmin görünən qalınlığı. */
export function rollRemaining(pulledLength: number, rollCapacity: number): number {
  'worklet';
  if (rollCapacity <= 0) return 0;
  return clamp01(1 - pulledLength / rollCapacity);
}
