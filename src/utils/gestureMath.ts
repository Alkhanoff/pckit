import { TENSION_BANDS } from '@/config/balance';
import type { TensionState } from '@/types/game';

/**
 * Gesture riyaziyyatı.
 *
 * Hər funksiya `'worklet'` işarəlidir: eyni kod həm Jest-də adi funksiya kimi
 * test edilir, həm də Reanimated tərəfindən UI thread-də icra olunur.
 * Beləliklə gesture məntiqi test edilməmiş qalmır.
 */

export function clamp01(value: number): number {
  'worklet';
  return Math.min(Math.max(value, 0), 1);
}

export function distance(dx: number, dy: number): number {
  'worklet';
  return Math.sqrt(dx * dx + dy * dy);
}

/** Vektorun bucağı: 0° sağa, 90° aşağı (ekran koordinatları). */
export function angleDeg(dx: number, dy: number): number {
  'worklet';
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/** İki bucaq arasındakı ən qısa fərq (0–180). */
export function angleDifference(a: number, b: number): number {
  'worklet';
  const raw = (((a - b + 180) % 360) + 360) % 360;
  return Math.abs(raw - 180);
}

/** Hərəkət istiqaməti hədəf oxa uyğun gəlirmi. */
export function directionMatches(
  dx: number,
  dy: number,
  targetDeg: number,
  toleranceDeg: number,
): boolean {
  'worklet';
  if (dx === 0 && dy === 0) return false;
  return angleDifference(angleDeg(dx, dy), targetDeg) <= toleranceDeg;
}

// ─────────────────────────────────────────────────────────────
// Tension — docs/BALANCE.md §2
// ─────────────────────────────────────────────────────────────

/** Band indeksləri: worklet-lər arasında sətir yerinə ədəd ötürülür. */
export const BAND_LOOSE = 0;
export const BAND_OPTIMAL = 1;
export const BAND_OVERSTRETCHED = 2;

export const BAND_NAMES: TensionState[] = ['loose', 'optimal', 'overstretched'];

/** Dartılma məsafəsindən normallaşdırılmış gərginlik (0–1). */
export function normalizedTension(dragDistance: number, referenceDistance: number): number {
  'worklet';
  if (referenceDistance <= 0) return 0;
  return clamp01(dragDistance / referenceDistance);
}

export function tensionBandIndex(tension: number): number {
  'worklet';
  if (tension < TENSION_BANDS.looseMax) return BAND_LOOSE;
  if (tension <= TENSION_BANDS.optimalMax) return BAND_OPTIMAL;
  return BAND_OVERSTRETCHED;
}

export function bandToTensionState(band: number): TensionState {
  'worklet';
  if (band === BAND_LOOSE) return 'loose';
  if (band === BAND_OPTIMAL) return 'optimal';
  return 'overstretched';
}

/**
 * Band dəyişikliyi JS qatına göndərilməlidirmi.
 *
 * Yalnız band DƏYİŞDİKDƏ və debounce müddəti keçdikdə — beləliklə
 * `runOnJS` hər frame çağırılmır (docs/DECISIONS.md §14).
 */
export function shouldEmitBandChange(
  previousBand: number,
  nextBand: number,
  lastEmitAt: number,
  now: number,
  debounceMs: number,
): boolean {
  'worklet';
  if (previousBand === nextBand) return false;
  return now - lastEmitAt >= debounceMs;
}

/** Xəbərdarlıq spam etməsin deyə cooldown. */
export function shouldWarnOverstretch(
  band: number,
  lastWarnAt: number,
  now: number,
  cooldownMs: number,
): boolean {
  'worklet';
  if (band !== BAND_OVERSTRETCHED) return false;
  return now - lastWarnAt >= cooldownMs;
}

// ─────────────────────────────────────────────────────────────
// Swipe — kəsim və hamarlama
// ─────────────────────────────────────────────────────────────

export type SwipeCheck = {
  valid: boolean;
  distance: number;
  angleDeg: number;
};

/** Swipe həm kifayət qədər uzun, həm də düzgün istiqamətdə olmalıdır. */
export function validateSwipe(
  dx: number,
  dy: number,
  targetDeg: number,
  minDistance: number,
  toleranceDeg: number,
): SwipeCheck {
  'worklet';
  const length = distance(dx, dy);
  const angle = angleDeg(dx, dy);
  const longEnough = length >= minDistance;
  const aimed = directionMatches(dx, dy, targetDeg, toleranceDeg);

  return { valid: longEnough && aimed, distance: length, angleDeg: angle };
}

/**
 * Drag path-ının hədəf oxdan yan sapması — hava qabarcığı triggeri.
 * Nəticə zona eninə nisbətəndir (docs/BALANCE.md §6).
 */
export function lateralDeviation(
  dx: number,
  dy: number,
  targetDeg: number,
  zoneSpan: number,
): number {
  'worklet';
  if (zoneSpan <= 0) return 0;

  const rad = (targetDeg * Math.PI) / 180;
  // Hədəf oxa perpendikulyar komponent
  const perpendicular = Math.abs(-dx * Math.sin(rad) + dy * Math.cos(rad));
  return clamp01(perpendicular / zoneSpan);
}
