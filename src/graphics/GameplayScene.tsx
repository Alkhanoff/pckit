import {
  BlurMask,
  Canvas,
  Group,
  LinearGradient,
  Oval,
  Path,
  RadialGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';

import { CAMERA } from '@/config/gameplay';
import { SHADOW, TABLE } from '@/config/visuals';
import type { ShadowLayer } from '@/config/visuals';
import { StretchFilmLayer } from '@/graphics/materials/StretchFilmLayer';
import { PhoneBox } from '@/graphics/products/PhoneBox';
import type { GameplaySceneProps } from '@/graphics/sceneProps';

/**
 * Qablaşdırma səhnəsi — saf renderer.
 *
 * Həndəsəni `useSceneGeometry`, gesture-i isə `useGameplayGestures` verir.
 * Bu komponent heç nə hesablamır, yalnız çəkir (docs/ARCHITECTURE.md §9).
 * Tək `<Canvas>` istifadə edilir.
 *
 * Web-də bu modul YALNIZ CanvasKit yükləndikdən sonra import olunur —
 * bax `SceneHost.web.tsx`.
 */

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
    const step = height / TABLE.grainLines;
    const lines: string[] = [];
    for (let y = step; y < height; y += step) {
      lines.push(`M0,${y.toFixed(2)} L${width.toFixed(2)},${y.toFixed(2)}`);
    }
    return lines.join(' ');
  }, [width, height]);

  /** İki qatlı təmas kölgəsi — tək böyük oval "boz ləkə" təsiri yaradır. */
  const shadows = useMemo(() => {
    const b = geometry.shadow;
    const make = (cfg: ShadowLayer) => ({
      x: b.x + (b.width * (1 - cfg.widthScale)) / 2,
      y: b.y + b.height * cfg.offsetYRatio - (b.height * cfg.heightScale) / 2,
      width: b.width * cfg.widthScale,
      height: b.height * cfg.heightScale,
      opacity: cfg.opacity,
      blur: cfg.blur,
    });
    return [make(SHADOW.ambient), make(SHADOW.contact)];
  }, [geometry.shadow]);

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
              colors={[TABLE.gradientFrom, TABLE.gradientTo]}
            />
          </Rect>
          <Path
            path={grain}
            style="stroke"
            strokeWidth={1}
            color={TABLE.grainColor}
            opacity={TABLE.grainOpacity}
          />

          {/* Vinyet — diqqəti mərkəzə yığır */}
          <Rect x={0} y={0} width={width} height={height} opacity={TABLE.vignetteOpacity}>
            <RadialGradient
              c={vec(width / 2, height / 2)}
              r={Math.max(width, height) * 0.62}
              colors={['#00000000', TABLE.vignetteColor]}
            />
          </Rect>

          {/* Təmas kölgəsi — geniş ambient + dar tünd təmas */}
          {shadows.map((s, i) => (
            <Group key={i} opacity={s.opacity}>
              <Oval x={s.x} y={s.y} width={s.width} height={s.height} color={SHADOW.color}>
                <BlurMask blur={s.blur} style="normal" />
              </Oval>
            </Group>
          ))}

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

// `WithSkiaWeb` lazy import üçün default export tələb edir.
export default GameplayScene;
