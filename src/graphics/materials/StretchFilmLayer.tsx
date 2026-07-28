import { Group, LinearGradient, Path, RoundedRect, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { colors } from '@/config/theme';
import { computeFilmSheet, filmOpacity, filmTipHalfWidth, wrinklePaths } from '@/utils/film';
import { polygonToSvgPath } from '@/utils/projection';
import type { Point } from '@/utils/projection';

/**
 * Streç film qatı.
 *
 * Bütün həndəsə `useDerivedValue` daxilində UI thread-də hesablanır —
 * barmaq hərəkət edərkən React HEÇ VAXT yenidən render olunmur
 * (docs/ARCHITECTURE.md §4).
 */

type StretchFilmLayerProps = {
  /** Rulonun film çıxan kənarı */
  anchor: Point;
  anchorHalfWidth: number;
  /** Rulonun vizual ölçüsü */
  rollWidth: number;
  rollHeight: number;

  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  tension: SharedValue<number>;
  active: SharedValue<boolean>;
};

const MAX_WRINKLES = 7;
const WRINKLE_AMPLITUDE = 9;

export function StretchFilmLayer({
  anchor,
  anchorHalfWidth,
  rollWidth,
  rollHeight,
  dragX,
  dragY,
  tension,
  active,
}: StretchFilmLayerProps) {
  /** Filmin dördbucaqlısı — barmaq mövqeyindən. */
  const sheetPath = useDerivedValue(() => {
    if (!active.value) return '';

    const tip = { x: anchor.x + dragX.value, y: anchor.y + dragY.value };
    const sheet = computeFilmSheet(
      anchor,
      tip,
      anchorHalfWidth,
      filmTipHalfWidth(anchorHalfWidth, tension.value),
    );

    return polygonToSvgPath(sheet.quad);
  });

  /** Qırış xətləri — boş filmdə çox, optimal dartılmada yox olur. */
  const wrinklePath = useDerivedValue(() => {
    if (!active.value) return '';

    const tip = { x: anchor.x + dragX.value, y: anchor.y + dragY.value };
    const sheet = computeFilmSheet(
      anchor,
      tip,
      anchorHalfWidth,
      filmTipHalfWidth(anchorHalfWidth, tension.value),
    );

    return wrinklePaths(sheet, tension.value, MAX_WRINKLES, WRINKLE_AMPLITUDE);
  });

  const opacity = useDerivedValue(() => (active.value ? filmOpacity(tension.value) : 0));

  /** Overstretch xəbərdarlığı — yumşaq qırmızı halo. */
  const warningOpacity = useDerivedValue(() =>
    active.value ? Math.max(0, (tension.value - 0.75) / 0.25) * 0.55 : 0,
  );

  return (
    <Group>
      {/* Rulon */}
      <RoundedRect
        x={anchor.x - rollWidth}
        y={anchor.y - rollHeight / 2}
        width={rollWidth}
        height={rollHeight}
        r={rollWidth / 2}
      >
        <LinearGradient
          start={vec(anchor.x - rollWidth, anchor.y - rollHeight / 2)}
          end={vec(anchor.x, anchor.y + rollHeight / 2)}
          colors={['#F3F7F9', '#C9D6DD']}
        />
      </RoundedRect>
      <RoundedRect
        x={anchor.x - rollWidth}
        y={anchor.y - rollHeight / 2}
        width={rollWidth}
        height={rollHeight}
        r={rollWidth / 2}
        style="stroke"
        strokeWidth={1}
        color="#00000018"
      />

      {/* Film vərəqi */}
      <Group opacity={opacity}>
        <Path path={sheetPath}>
          <LinearGradient
            start={vec(anchor.x, anchor.y - anchorHalfWidth)}
            end={vec(anchor.x, anchor.y + anchorHalfWidth)}
            colors={['#FFFFFF', '#D3E3EC', '#FFFFFF']}
          />
        </Path>
        <Path path={sheetPath} style="stroke" strokeWidth={1} color="#7C97A833" />
      </Group>

      {/* Qırışlar */}
      <Group opacity={opacity}>
        <Path path={wrinklePath} style="stroke" strokeWidth={1.5} color="#7C97A855" />
      </Group>

      {/* Həddindən artıq dartılma xəbərdarlığı */}
      <Group opacity={warningOpacity}>
        <Path path={sheetPath} style="stroke" strokeWidth={3} color={colors.tensionOverstretched} />
      </Group>
    </Group>
  );
}
