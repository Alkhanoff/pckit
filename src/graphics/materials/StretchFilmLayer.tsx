import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { FILM, ROLL } from '@/config/visuals';
import { computeFilmSheet, filmOpacity, filmTipHalfWidth, wrinklePaths } from '@/utils/film';
import { polygonToSvgPath } from '@/utils/projection';
import type { Point } from '@/utils/projection';

/**
 * Streç film və rulon.
 *
 * Film həndəsəsi `useDerivedValue` daxilində UI thread-də hesablanır —
 * barmaq hərəkət edərkən React yenidən render OLUNMUR.
 */

type StretchFilmLayerProps = {
  anchor: Point;
  anchorHalfWidth: number;
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

  /** Film boyunca parlaq zolaq — plastik hissini verən əsas detal. */
  const sheenPath = useDerivedValue(() => {
    if (!active.value) return '';
    const tip = { x: anchor.x + dragX.value, y: anchor.y + dragY.value };
    const half = filmTipHalfWidth(anchorHalfWidth, tension.value);
    const sheet = computeFilmSheet(anchor, tip, anchorHalfWidth * 0.34, half * 0.34);
    return polygonToSvgPath(sheet.quad);
  });

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

  const warningOpacity = useDerivedValue(() =>
    active.value ? Math.max(0, (tension.value - 0.75) / 0.25) * 0.6 : 0,
  );

  // Rulon silindr kimi qurulur: gövdə + ön başlıq + rim işığı.
  const bodyX = anchor.x - rollWidth;
  const capRx = rollWidth * 0.42;

  const top = anchor.y - rollHeight / 2;
  const bot = anchor.y + rollHeight / 2;
  const coreRy = (rollHeight / 2) * ROLL.coreRatio;

  const bodyPath = `M${bodyX},${top} L${anchor.x},${top} L${anchor.x},${bot} L${bodyX},${bot} Z`;
  const capPath = `M${anchor.x},${top} A${capRx},${rollHeight / 2} 0 1 1 ${anchor.x},${bot} A${capRx},${rollHeight / 2} 0 1 1 ${anchor.x},${top} Z`;
  const corePath = `M${anchor.x},${anchor.y - coreRy} A${capRx * ROLL.coreRatio},${coreRy} 0 1 1 ${anchor.x},${anchor.y + coreRy} A${capRx * ROLL.coreRatio},${coreRy} 0 1 1 ${anchor.x},${anchor.y - coreRy} Z`;

  /** Sarım qatları — rulonun sarılmış material olduğunu göstərir. */
  const windings = Array.from({ length: ROLL.windingCount }, (_, i) => {
    const t = (i + 1) / (ROLL.windingCount + 1);
    const ry = coreRy + (rollHeight / 2 - coreRy) * t;
    const rx = capRx * ROLL.coreRatio + (capRx - capRx * ROLL.coreRatio) * t;
    return `M${anchor.x},${anchor.y - ry} A${rx},${ry} 0 1 1 ${anchor.x},${anchor.y + ry} A${rx},${ry} 0 1 1 ${anchor.x},${anchor.y - ry} Z`;
  });

  return (
    <Group>
      {/* Rulon gövdəsi — üfüqi silindr kölgələnməsi */}
      <Path path={bodyPath}>
        <LinearGradient
          start={vec(bodyX, anchor.y)}
          end={vec(anchor.x, anchor.y)}
          colors={[...ROLL.body]}
        />
      </Path>

      {/* Silindr başlığı və karton nüvə */}
      <Path path={capPath}>
        <LinearGradient
          start={vec(anchor.x, top)}
          end={vec(anchor.x, bot)}
          colors={[...ROLL.cap]}
        />
      </Path>
      {windings.map((d, i) => (
        <Path
          key={i}
          path={d}
          style="stroke"
          strokeWidth={1}
          color={ROLL.windingColor}
          opacity={ROLL.windingOpacity}
        />
      ))}
      <Path path={corePath} color={ROLL.coreColor} opacity={ROLL.coreOpacity} />
      <Path
        path={capPath}
        style="stroke"
        strokeWidth={1}
        color={ROLL.stroke}
        opacity={ROLL.strokeOpacity}
      />

      {/* Film vərəqi */}
      <Group opacity={opacity}>
        <Path path={sheetPath}>
          <LinearGradient
            start={vec(anchor.x, anchor.y - anchorHalfWidth)}
            end={vec(anchor.x, anchor.y + anchorHalfWidth)}
            colors={[...FILM.gradient]}
          />
        </Path>
        <Path
          path={sheetPath}
          style="stroke"
          strokeWidth={FILM.edgeStrokeWidth}
          color={FILM.edgeStroke}
          opacity={FILM.edgeStrokeOpacity}
        />
        <Path path={sheenPath} color={FILM.sheenColor} opacity={FILM.sheenOpacity} />
        <Path
          path={wrinklePath}
          style="stroke"
          strokeWidth={FILM.wrinkleWidth}
          color={FILM.wrinkleColor}
          opacity={FILM.wrinkleOpacity}
        />
      </Group>

      {/* Həddindən artıq dartılma */}
      <Group opacity={warningOpacity}>
        <Path
          path={sheetPath}
          style="stroke"
          strokeWidth={FILM.warningWidth}
          color={FILM.warningColor}
        />
      </Group>
    </Group>
  );
}
