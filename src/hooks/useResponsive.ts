import { useWindowDimensions } from 'react-native';

/**
 * Portrait telefon ekranları üçün ölçü uyğunlaşdırması.
 *
 * Hədəf aralıq: iPhone SE (375×667) → iPhone Pro Max (430×932).
 * Planşetdə UI pozulmamalıdır, amma ayrıca tablet dizaynı tələb olunmur.
 */

/** Referans ekran eni — bütün ölçülər buna nisbətən hesablanır. */
const BASE_WIDTH = 390;

/** Kiçik ekran həddi (iPhone SE və oxşarları) */
const COMPACT_HEIGHT = 700;

/** Kontentin maksimum eni — planşetdə UI həddindən artıq dartılmasın */
const MAX_CONTENT_WIDTH = 520;

export type Responsive = {
  width: number;
  height: number;
  /** Alçaq ekran — şaquli boşluqlar sıxılmalıdır */
  isCompact: boolean;
  /** Planşet və ya çox geniş ekran */
  isWide: boolean;
  contentWidth: number;
  /** Ölçü əmsalı (0.9–1.15 aralığında kəsilir) */
  scale: number;
  /** Şaquli boşluq əmsalı — alçaq ekranda azalır */
  verticalScale: number;
  /** Ölçünü ekrana uyğunlaşdırır */
  size: (value: number) => number;
};

/**
 * Təmiz hesablama — React-dən kənar test edilir.
 * `useResponsive` yalnız bunu cari ekran ölçüsü ilə çağırır.
 */
export function computeResponsive(width: number, height: number): Responsive {
  const isCompact = height < COMPACT_HEIGHT;
  const isWide = width > MAX_CONTENT_WIDTH;
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);

  // Çox kiçik və çox böyük ekranlarda tipoqrafiya oxunaqlı qalsın deyə kəsilir.
  const scale = Math.min(Math.max(contentWidth / BASE_WIDTH, 0.9), 1.15);
  const verticalScale = isCompact ? 0.75 : 1;

  return {
    width,
    height,
    isCompact,
    isWide,
    contentWidth,
    scale,
    verticalScale,
    size: (value: number) => Math.round(value * scale),
  };
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  return computeResponsive(width, height);
}
