import type { ZoneId } from '@/types/game';

/**
 * VİZUAL SABİTLƏR — tək mənbə.
 *
 * Həm Skia komponentləri, həm də `scripts/render-scene.mts` buradan oxuyur.
 * Beləliklə render aləti ilə tətbiqin görünüşü heç vaxt ayrılmır.
 *
 * İstiqamət (docs/reference Gameplay §1): yumşaq bej, ağ, mavi-boz,
 * premium və həcm hissi verən. Ucuz və yastı görünməməlidir.
 */

// ─────────────────────────────────────────────────────────────
// Masa
// ─────────────────────────────────────────────────────────────

export const TABLE = {
  gradientFrom: '#FCF8F2',
  gradientTo: '#E4DACA',
  /** Kənarlara doğru yumşaq tündləşmə — diqqəti mərkəzə yığır */
  vignetteColor: '#8B7B63',
  vignetteOpacity: 0.2,
  /** Damar xətləri: çox zəif olmalıdır — əks halda dəftər sətri kimi görünür */
  grainColor: '#8A7860',
  grainOpacity: 0.014,
  grainLines: 6,
} as const;

// ─────────────────────────────────────────────────────────────
// Məhsul kölgələmə
// ─────────────────────────────────────────────────────────────

/**
 * İşıq yuxarı-soldan düşür.
 * Üzlər arasında AYDIN ton fərqi olmalıdır — əks halda qutu yastı görünür.
 */
export const FACE_TINT: Record<ZoneId, readonly [string, string]> = {
  top: ['#FFFFFF', '#F0E9DC'],
  front: ['#DFD4C2', '#C6B9A3'],
  right: ['#AFA189', '#8F8168'],
  back: ['#C6B9A3', '#B2A48C'],
  left: ['#AFA189', '#8F8168'],
  bottom: ['#8F8168', '#7A6D56'],
};

export const PRODUCT = {
  edgeStroke: '#4A3E2E',
  edgeStrokeOpacity: 0.22,
  edgeStrokeWidth: 1,

  /** Üst səthdə diaqonal işıq əksi */
  /** İşıq əksi dar və maili olmalıdır — geniş ağ ləkə stiker kimi görünür */
  specularColor: '#FFFFFF',
  specularOpacity: 0.2,
  specularUV: [0.08, 0.62, 0.42, 0.95] as const,

  /** Məhsul etiketi */
  labelFill: '#FFFFFF',
  labelFillOpacity: 0.82,
  labelStroke: '#4A3E2E',
  labelStrokeOpacity: 0.14,
  labelUV: [0.2, 0.26, 0.8, 0.5] as const,
  /** Etiket üzərindəki vurğu zolağı */
  labelAccent: '#7C97A8',
  labelAccentOpacity: 0.5,
} as const;

/**
 * Təmas kölgəsi.
 *
 * İki qatdan ibarətdir: geniş yumşaq ambient və qutunun altındakı dar tünd
 * təmas xətti. Tək böyük oval "boz ləkə" təsiri yaradır.
 */
export type ShadowLayer = {
  widthScale: number;
  heightScale: number;
  offsetYRatio: number;
  opacity: number;
  blur: number;
};

export const SHADOW: { ambient: ShadowLayer; contact: ShadowLayer; color: string } = {
  ambient: { widthScale: 1.18, heightScale: 0.72, offsetYRatio: 0.36, opacity: 0.09, blur: 38 },
  contact: { widthScale: 0.72, heightScale: 0.24, offsetYRatio: 0.46, opacity: 0.13, blur: 14 },
  color: '#4A3B28',
};

// ─────────────────────────────────────────────────────────────
// Streç film
// ─────────────────────────────────────────────────────────────

export const FILM = {
  /** Şəffaf plastik: kənarları daha sıx, ortası açıq */
  gradient: ['#EAF3F8', '#B9D4E2', '#F5FAFC'] as const,
  edgeStroke: '#5E7F92',
  edgeStrokeOpacity: 0.5,
  edgeStrokeWidth: 1.2,

  /** Səth boyu parlaq zolaq — plastik hissini verən əsas detal */
  sheenColor: '#FFFFFF',
  sheenOpacity: 0.45,

  wrinkleColor: '#4E6E80',
  wrinkleOpacity: 0.42,
  wrinkleWidth: 1.4,

  warningColor: '#C9705F',
  warningWidth: 3,
} as const;

export const ROLL = {
  /**
   * Silindr kölgələnməsi: tünd → işıq → tünd.
   * Tək istiqamətli gradient rulonu yastı lövhə kimi göstərir.
   */
  body: ['#93A9B5', '#FBFDFE', '#A3B7C2'] as const,
  /** Ön üz (silindr başlığı) — gövdədən bir qədər tünd */
  cap: ['#DCE8EE', '#93AAB7'] as const,
  stroke: '#3E5561',
  strokeOpacity: 0.3,
  /** Başlığın mərkəzindəki karton nüvə */
  coreColor: '#8A7660',
  coreOpacity: 0.55,
  coreRatio: 0.3,
} as const;
