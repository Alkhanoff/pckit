import { Canvas, Group, LinearGradient, Oval, Path, Rect, vec } from '@shopify/react-native-skia';
import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { CAMERA } from '@/config/gameplay';
import { colors } from '@/config/theme';
import { useSceneTap } from '@/gestures/useSceneTap';
import { PhoneBox } from '@/graphics/products/PhoneBox';
import type { ProductDefinition } from '@/types/definitions';
import type { ZoneId } from '@/types/game';
import type { Point, Polygon } from '@/utils/projection';
import { applyTransform, fitToRect, hitTestFace, projectBox } from '@/utils/projection';

/**
 * Qablaşdırma səhnəsi: masa + məhsul.
 *
 * Tək `<Canvas>` istifadə edilir (docs/ARCHITECTURE.md §9).
 * Ölçülər xaricdən verilir ki, səhnə istənilən ekrana uyğunlaşsın.
 */

type GameplaySceneProps = {
  product: ProductDefinition;
  width: number;
  height: number;
  highlightedZone?: ZoneId;
  onZonePress?: (zone: ZoneId) => void;
};

/** Məhsulun səhnədə tutduğu sahə — qalanı masa üçün boşluqdur. */
const PRODUCT_AREA_RATIO = 0.62;

export function GameplayScene({
  product,
  width,
  height,
  highlightedZone,
  onZonePress,
}: GameplaySceneProps) {
  const size = useMemo(
    () => ({
      width: product.shape.width,
      depth: product.shape.depth,
      height: product.shape.height,
    }),
    [product.shape.width, product.shape.depth, product.shape.height],
  );

  const projected = useMemo(() => projectBox(size, CAMERA.angleDeg, CAMERA.azimuthDeg), [size]);

  const transform = useMemo(
    () =>
      fitToRect(
        projected.visibleFaces.map((z) => projected.faces[z]),
        {
          x: 0,
          y: height * (1 - PRODUCT_AREA_RATIO) * 0.5,
          width,
          height: height * PRODUCT_AREA_RATIO,
        },
        24,
      ),
    [projected, width, height],
  );

  /** Ekran koordinatlarındakı üzlər — həm kölgə, həm hit-test üçün. */
  const screenFaces = useMemo(() => {
    const entries = (Object.keys(projected.faces) as ZoneId[]).map((zone) => [
      zone,
      applyTransform(projected.faces[zone], transform),
    ]);
    return Object.fromEntries(entries) as Record<ZoneId, Polygon>;
  }, [projected, transform]);

  /** Qutunun altındakı yumşaq kölgə — alt üzün ekran sərhədlərindən alınır. */
  const shadow = useMemo(() => {
    const base = screenFaces.bottom;
    const xs = base.map((p) => p.x);
    const ys = base.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: minX - (maxX - minX) * 0.06,
      y: minY + (maxY - minY) * 0.25,
      width: (maxX - minX) * 1.12,
      height: (maxY - minY) * 0.9,
    };
  }, [screenFaces]);

  const handleTouch = useCallback(
    (point: Point) => {
      if (!onZonePress) return;
      const zone = hitTestFace(point, screenFaces, projected.visibleFaces);
      if (zone) onZonePress(zone);
    },
    [onZonePress, screenFaces, projected.visibleFaces],
  );

  const tap = useSceneTap(handleTouch);

  /**
   * Masanın damar xətləri — səthə toxunma hissi verir.
   * SVG sətir kimi qurulur: imperativ `Skia.Path.Make()` web-də CanvasKit
   * yüklənməmiş çökür (docs/BUILDING.md §2).
   */
  const grain = useMemo(() => {
    const step = height / 7;
    const lines: string[] = [];
    for (let y = step; y < height; y += step) {
      lines.push(`M0,${y.toFixed(2)} L${width.toFixed(2)},${y.toFixed(2)}`);
    }
    return lines.join(' ');
  }, [width, height]);

  return (
    <GestureDetector gesture={tap}>
      <View
        style={[styles.wrapper, { width, height }]}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Packaging scene"
      >
        <Canvas style={{ width, height }}>
          {/* Masa */}
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, height)}
              colors={[colors.surface, colors.table]}
            />
          </Rect>
          <Path path={grain} style="stroke" strokeWidth={1} color="#00000008" />

          {/* Kölgə */}
          <Group opacity={0.18}>
            <Oval
              x={shadow.x}
              y={shadow.y}
              width={shadow.width}
              height={shadow.height}
              color={colors.shadow}
            />
          </Group>

          <PhoneBox
            size={size}
            projected={projected}
            transform={transform}
            elevationDeg={CAMERA.angleDeg}
            azimuthDeg={CAMERA.azimuthDeg}
            highlightedZone={highlightedZone}
          />
        </Canvas>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderRadius: 20,
  },
});
