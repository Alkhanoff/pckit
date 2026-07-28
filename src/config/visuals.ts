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
  gradientFrom: '#FBF6EE',
  gradientTo: '#E6DACA',
  /** Kənarlara doğru yumşaq tündləşmə — diqqəti mərkəzə yığır */
  vignetteColor: '#7E6B52',
  vignetteOpacity: 0.26,
  /**
   * Məhsulun ətrafındakı işıq hovuzu — səhnəyə studiya işığı hissi verir.
   * Damar xətləri silindi: onlar dəftər sətri təsiri yaradırdı.
   */
  lightPoolColor: '#FFFFFF',
  lightPoolOpacity: 0.55,
  lightPoolRadius: 0.62,
  /** Hovuzun mərkəzi — məhsuldan bir qədər yuxarıda */
  lightPoolCenterY: 0.42,
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
  /** Künc yumşaltması — kəskin künclər kağızdan kəsilmiş təsiri verir */
  cornerRadius: 7,

  edgeStroke: '#4A3E2E',
  edgeStrokeOpacity: 0.16,
  edgeStrokeWidth: 1,

  /**
   * Rim işığı — işığa baxan yuxarı kənarlarda nazik parlaq xətt.
   * 2.5D obyekti "premium" edən ƏSAS detal budur.
   */
  rimColor: '#FFFFFF',
  rimOpacity: 0.9,
  rimWidth: 2.6,

  /** Ambient occlusion — şaquli üzlərin masaya yaxın hissəsi tündləşir */
  aoColor: '#4A3B28',
  aoOpacity: 0.3,

  /** Qapaq tikişi — qutunun qapağı ilə gövdəsi arasındakı xətt */
  seamColor: '#4A3E2E',
  seamOpacity: 0.18,
  seamRatio: 0.42,

  /** Üst səthdə diaqonal işıq əksi */
  /** İşıq əksi dar və maili olmalıdır — geniş ağ ləkə stiker kimi görünür */
  specularColor: '#FFFFFF',
  specularOpacity: 0.26,
  specularUV: [0.08, 0.6, 0.46, 0.96] as const,

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
  ambient: { widthScale: 1.3, heightScale: 0.8, offsetYRatio: 0.34, opacity: 0.11, blur: 46 },
  contact: { widthScale: 0.78, heightScale: 0.26, offsetYRatio: 0.46, opacity: 0.16, blur: 12 },
  color: '#4A3B28',
};

// ─────────────────────────────────────────────────────────────
// Streç film
// ─────────────────────────────────────────────────────────────

export const FILM = {
  /**
   * Şəffaf plastik. Alfa kənarlarda yüksək, ortada aşağı — real streç film
   * qatlandığı yerdə tündləşir, ortada demək olar görünmür.
   */
  gradient: ['#C7DEEAE6', '#EAF4F980', '#FFFFFF33', '#D5E7F0CC'] as const,
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
  strokeOpacity: 0.26,
  /** Başlığın mərkəzindəki karton nüvə */
  coreColor: '#A08A6E',
  coreOpacity: 0.7,
  coreRatio: 0.26,
  /** Sarım qatları — rulonun material olduğunu göstərir */
  windingColor: '#6E8A99',
  windingOpacity: 0.22,
  windingCount: 3,
} as const;
