import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { colors } from '@/config/theme';
import type { ZoneId } from '@/types/game';
import { applyTransform, faceUVToWorld, polygonToSvgPath, project } from '@/utils/projection';
import type { BoxSize, FitTransform, ProjectedBox } from '@/utils/projection';

/**
 * 2.5D telefon qutusu.
 *
 * Bütün həndəsə `src/utils/projection.ts`-də hesablanır — bu komponent
 * yalnız hazır nöqtələri çəkir (docs/ARCHITECTURE.md §9).
 */

type PhoneBoxProps = {
  size: BoxSize;
  projected: ProjectedBox;
  transform: FitTransform;
  elevationDeg: number;
  azimuthDeg: number;
  /** Vurğulanan üz — toxunuş zonasının doğruluğunu göstərir */
  highlightedZone?: ZoneId;
};

/** İşıq yuxarı-soldan düşür: üst ən parlaq, yan ən tünd. */
const FACE_TINT: Record<string, [string, string]> = {
  top: ['#FFFFFF', '#EFE8DC'],
  front: ['#EAE2D6', '#D4CABA'],
  right: ['#C6BCAB', '#AEA392'],
  back: ['#D6CCBC', '#C4B9A8'],
  left: ['#C6BCAB', '#AEA392'],
  bottom: ['#B3A897', '#A2977F'],
};

export function PhoneBox({
  size,
  projected,
  transform,
  elevationDeg,
  azimuthDeg,
  highlightedZone,
}: PhoneBoxProps) {
  /** Üz səthindəki UV nöqtəsini ekran koordinatına çevirir. */
  const toScreen = useMemo(
    () => (zone: ZoneId, u: number, v: number) =>
      applyTransform(
        [project(faceUVToWorld(zone, size, u, v), elevationDeg, azimuthDeg)],
        transform,
      )[0],
    [size, elevationDeg, azimuthDeg, transform],
  );

  // Path sətirləri hər frame yenidən qurulmur (ARCHITECTURE.md §9).
  const faces = useMemo(
    () =>
      projected.visibleFaces.map((zone) => {
        const screen = applyTransform(projected.faces[zone], transform);
        return { zone, path: polygonToSvgPath(screen), screen };
      }),
    [projected, transform],
  );

  /** Üst səthdəki məhsul etiketi. */
  const label = useMemo(
    () =>
      polygonToSvgPath([
        toScreen('top', 0.18, 0.24),
        toScreen('top', 0.82, 0.24),
        toScreen('top', 0.82, 0.52),
        toScreen('top', 0.18, 0.52),
      ]),
    [toScreen],
  );

  /** Üst səthdə diaqonal işıq əksi. */
  const specular = useMemo(
    () =>
      polygonToSvgPath([
        toScreen('top', 0.06, 0.64),
        toScreen('top', 0.56, 0.64),
        toScreen('top', 0.42, 0.95),
        toScreen('top', 0.06, 0.95),
      ]),
    [toScreen],
  );

  return (
    <Group>
      {faces.map(({ zone, path, screen }) => {
        const [from, to] = FACE_TINT[zone] ?? FACE_TINT.front;
        return (
          <Group key={zone}>
            <Path path={path}>
              <LinearGradient
                start={vec(screen[0].x, screen[0].y)}
                end={vec(screen[2].x, screen[2].y)}
                colors={[from, to]}
              />
            </Path>
            {/* Kənar xətti səthləri ayırır və formanı oxunaqlı edir */}
            <Path path={path} style="stroke" strokeWidth={1} color="#00000020" />
            {highlightedZone === zone ? (
              <Path path={path} color={`${colors.accentStrong}38`} />
            ) : null}
          </Group>
        );
      })}

      <Path path={specular} color="#FFFFFF3D" />
      <Path path={label} color="#FFFFFFCC" />
      <Path path={label} style="stroke" strokeWidth={1} color="#00000016" />
    </Group>
  );
}
