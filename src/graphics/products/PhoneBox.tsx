import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { colors } from '@/config/theme';
import { FACE_TINT, PRODUCT } from '@/config/visuals';
import type { ZoneId } from '@/types/game';
import {
  applyTransform,
  faceUVToWorld,
  litEdgesPath,
  polygonToSvgPath,
  project,
  roundedPolygonPath,
} from '@/utils/projection';
import type { BoxSize, FitTransform, ProjectedBox } from '@/utils/projection';

/**
 * 2.5D telefon qutusu.
 *
 * Həcm illüziyası dörd qatdan yaranır:
 *   1. üzlərin ton fərqi (üst ən açıq, yan ən tünd)
 *   2. yumşaldılmış künclər — kəskin künc kağız kimi görünür
 *   3. ambient occlusion — şaquli üzlərin masaya yaxın hissəsi tündləşir
 *   4. rim light — işığa baxan yuxarı kənarlarda nazik parlaq xətt
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
        return {
          zone,
          screen,
          path: roundedPolygonPath(screen, PRODUCT.cornerRadius),
          /** Şaquli üzlərdə masaya yaxın hissə tündləşir */
          isVertical: zone !== 'top' && zone !== 'bottom',
        };
      }),
    [projected, transform],
  );

  const topFace = useMemo(
    () => applyTransform(projected.faces.top, transform),
    [projected, transform],
  );

  const quad = useMemo(
    () =>
      (zone: ZoneId, [u0, v0, u1, v1]: readonly [number, number, number, number]) => [
        toScreen(zone, u0, v0),
        toScreen(zone, u1, v0),
        toScreen(zone, u1, v1),
        toScreen(zone, u0, v1),
      ],
    [toScreen],
  );

  const label = useMemo(() => roundedPolygonPath(quad('top', PRODUCT.labelUV), 4), [quad]);
  const specular = useMemo(() => roundedPolygonPath(quad('top', PRODUCT.specularUV), 10), [quad]);

  const labelAccent = useMemo(() => {
    const [u0, v0, u1] = PRODUCT.labelUV;
    return roundedPolygonPath(
      [
        toScreen('top', u0 + 0.05, v0 + 0.055),
        toScreen('top', u1 - 0.3, v0 + 0.055),
        toScreen('top', u1 - 0.3, v0 + 0.085),
        toScreen('top', u0 + 0.05, v0 + 0.085),
      ],
      2,
    );
  }, [toScreen]);

  /** Qapaq tikişi — şaquli üzlərdə qapağın altındakı nazik xətt. */
  const seams = useMemo(
    () =>
      faces
        .filter((f) => f.isVertical)
        .map((f) => {
          const [bl, br, tr, tl] = f.screen;
          const r = PRODUCT.seamRatio;
          return polygonToSvgPath([
            { x: tl.x + (bl.x - tl.x) * r, y: tl.y + (bl.y - tl.y) * r },
            { x: tr.x + (br.x - tr.x) * r, y: tr.y + (br.y - tr.y) * r },
          ]);
        }),
    [faces],
  );

  return (
    <Group>
      {faces.map(({ zone, path, screen, isVertical }) => {
        const [from, to] = FACE_TINT[zone];
        return (
          <Group key={zone}>
            <Path path={path}>
              <LinearGradient
                start={vec(screen[3].x, screen[3].y)}
                end={vec(screen[1].x, screen[1].y)}
                colors={[from, to]}
              />
            </Path>

            {/* Ambient occlusion — masaya yaxınlaşdıqca tündləşmə */}
            {isVertical ? (
              <Path path={path} opacity={PRODUCT.aoOpacity}>
                <LinearGradient
                  start={vec(screen[3].x, screen[3].y)}
                  end={vec(screen[0].x, screen[0].y)}
                  colors={['#00000000', PRODUCT.aoColor]}
                />
              </Path>
            ) : null}

            <Path
              path={path}
              style="stroke"
              strokeWidth={PRODUCT.edgeStrokeWidth}
              color={PRODUCT.edgeStroke}
              opacity={PRODUCT.edgeStrokeOpacity}
            />

            {highlightedZone === zone ? (
              <Path path={path} color={colors.accentStrong} opacity={0.2} />
            ) : null}
          </Group>
        );
      })}

      {/* Qapaq tikişi */}
      {seams.map((d, i) => (
        <Path
          key={i}
          path={d}
          style="stroke"
          strokeWidth={1}
          color={PRODUCT.seamColor}
          opacity={PRODUCT.seamOpacity}
        />
      ))}

      {/* Üst səthdə işıq əksi */}
      <Path path={specular} color={PRODUCT.specularColor} opacity={PRODUCT.specularOpacity} />

      {/* Məhsul etiketi */}
      <Path path={label} color={PRODUCT.labelFill} opacity={PRODUCT.labelFillOpacity} />
      <Path
        path={label}
        style="stroke"
        strokeWidth={1}
        color={PRODUCT.labelStroke}
        opacity={PRODUCT.labelStrokeOpacity}
      />
      <Path path={labelAccent} color={PRODUCT.labelAccent} opacity={PRODUCT.labelAccentOpacity} />

      {/* Rim light — ən sonda, hər şeyin üstündə */}
      <Path
        path={litEdgesPath(topFace)}
        style="stroke"
        strokeWidth={PRODUCT.rimWidth}
        color={PRODUCT.rimColor}
        opacity={PRODUCT.rimOpacity}
      />
    </Group>
  );
}
