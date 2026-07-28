import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { colors } from '@/config/theme';
import { FACE_TINT, PRODUCT } from '@/config/visuals';
import type { ZoneId } from '@/types/game';
import { applyTransform, faceUVToWorld, polygonToSvgPath, project } from '@/utils/projection';
import type { BoxSize, FitTransform, ProjectedBox } from '@/utils/projection';

/**
 * 2.5D telefon qutusu.
 *
 * Həndəsə `src/utils/projection.ts`-də, rənglər `src/config/visuals.ts`-də.
 * Bu komponent yalnız çəkir (docs/ARCHITECTURE.md §9).
 */

type PhoneBoxProps = {
  size: BoxSize;
  projected: ProjectedBox;
  transform: FitTransform;
  elevationDeg: number;
  azimuthDeg: number;
  highlightedZone?: ZoneId;
};

export function PhoneBox({
  size,
  projected,
  transform,
  elevationDeg,
  azimuthDeg,
  highlightedZone,
}: PhoneBoxProps) {
  const toScreen = useMemo(
    () => (zone: ZoneId, u: number, v: number) =>
      applyTransform(
        [project(faceUVToWorld(zone, size, u, v), elevationDeg, azimuthDeg)],
        transform,
      )[0],
    [size, elevationDeg, azimuthDeg, transform],
  );

  const faces = useMemo(
    () =>
      projected.visibleFaces.map((zone) => {
        const screen = applyTransform(projected.faces[zone], transform);
        return { zone, path: polygonToSvgPath(screen), screen };
      }),
    [projected, transform],
  );

  const quad = useMemo(
    () =>
      (zone: ZoneId, [u0, v0, u1, v1]: readonly [number, number, number, number]) =>
        polygonToSvgPath([
          toScreen(zone, u0, v0),
          toScreen(zone, u1, v0),
          toScreen(zone, u1, v1),
          toScreen(zone, u0, v1),
        ]),
    [toScreen],
  );

  const label = useMemo(() => quad('top', PRODUCT.labelUV), [quad]);
  const specular = useMemo(() => quad('top', PRODUCT.specularUV), [quad]);

  /** Etiket üzərindəki nazik vurğu zolağı — məhsul hissi verir. */
  const labelAccent = useMemo(() => {
    const [u0, v0, u1] = PRODUCT.labelUV;
    return polygonToSvgPath([
      toScreen('top', u0 + 0.04, v0 + 0.05),
      toScreen('top', u1 - 0.28, v0 + 0.05),
      toScreen('top', u1 - 0.28, v0 + 0.08),
      toScreen('top', u0 + 0.04, v0 + 0.08),
    ]);
  }, [toScreen]);

  return (
    <Group>
      {faces.map(({ zone, path, screen }) => {
        const [from, to] = FACE_TINT[zone];
        return (
          <Group key={zone}>
            <Path path={path}>
              <LinearGradient
                start={vec(screen[0].x, screen[0].y)}
                end={vec(screen[2].x, screen[2].y)}
                colors={[from, to]}
              />
            </Path>
            <Path
              path={path}
              style="stroke"
              strokeWidth={PRODUCT.edgeStrokeWidth}
              color={PRODUCT.edgeStroke}
              opacity={PRODUCT.edgeStrokeOpacity}
            />
            {highlightedZone === zone ? (
              <Path path={path} color={colors.accentStrong} opacity={0.22} />
            ) : null}
          </Group>
        );
      })}

      <Path path={specular} color={PRODUCT.specularColor} opacity={PRODUCT.specularOpacity} />

      <Path path={label} color={PRODUCT.labelFill} opacity={PRODUCT.labelFillOpacity} />
      <Path
        path={label}
        style="stroke"
        strokeWidth={1}
        color={PRODUCT.labelStroke}
        opacity={PRODUCT.labelStrokeOpacity}
      />
      <Path path={labelAccent} color={PRODUCT.labelAccent} opacity={PRODUCT.labelAccentOpacity} />
    </Group>
  );
}
