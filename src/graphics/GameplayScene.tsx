import { Canvas, Group, LinearGradient, Oval, Path, Rect, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

import { CAMERA } from '@/config/gameplay';
import { colors } from '@/config/theme';
import type { AnyGesture } from '@/gestures/types';
import { StretchFilmLayer } from '@/graphics/materials/StretchFilmLayer';
import { PhoneBox } from '@/graphics/products/PhoneBox';
import type { SceneGeometry } from '@/hooks/useSceneGeometry';
import type { ZoneId } from '@/types/game';

/**
 * Qablaşdırma səhnəsi — saf renderer.
 *
 * Həndəsəni `useSceneGeometry`, gesture-i isə `useGameplayGestures` verir.
 * Bu komponent heç nə hesablamır, yalnız çəkir (docs/ARCHITECTURE.md §9).
 * Tək `<Canvas>` istifadə edilir.
 */

type GameplaySceneProps = {
  geometry: SceneGeometry;
  width: number;
  height: number;
  gesture: AnyGesture;
  highlightedZone?: ZoneId;
  /** Gesture qatından gələn real-time dəyərlər */
  film: {
    dragX: SharedValue<number>;
    dragY: SharedValue<number>;
    tension: SharedValue<number>;
    active: SharedValue<boolean>;
  };
};

export function GameplayScene({
  geometry,
  width,
  height,
  gesture,
  highlightedZone,
  film,
}: GameplaySceneProps) {
  /**
   * Masanın damar xətləri — SVG sətri kimi qurulur: imperativ
   * `Skia.Path.Make()` web-də CanvasKit yüklənməmiş çökür (docs/BUILDING.md §2).
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
    <GestureDetector gesture={gesture}>
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

          {/* Təmas kölgəsi */}
          <Group opacity={0.18}>
            <Oval
              x={geometry.shadow.x}
              y={geometry.shadow.y}
              width={geometry.shadow.width}
              height={geometry.shadow.height}
              color={colors.shadow}
            />
          </Group>

          <PhoneBox
            size={geometry.size}
            projected={geometry.projected}
            transform={geometry.transform}
            elevationDeg={CAMERA.angleDeg}
            azimuthDeg={CAMERA.azimuthDeg}
            highlightedZone={highlightedZone}
          />

          {/* Film məhsulun ÜZƏRİNDƏ çəkilir — sarım illüziyası üçün */}
          <StretchFilmLayer
            anchor={geometry.roll.anchor}
            anchorHalfWidth={geometry.roll.anchorHalfWidth}
            rollWidth={geometry.roll.width}
            rollHeight={geometry.roll.height}
            dragX={film.dragX}
            dragY={film.dragY}
            tension={film.tension}
            active={film.active}
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
