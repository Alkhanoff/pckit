import {
  Canvas,
  Group,
  LinearGradient,
  RoundedRect,
  Shadow,
  vec,
} from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/config/theme';

const W = 220;
const H = 150;

/**
 * Mərhələ 1 Skia smoke test.
 *
 * Məqsəd: Skia-nın həm native, həm də web-də (CanvasKit/WASM) render etdiyini
 * erkən təsdiqləmək — docs/BUILDING.md §9 risk siyahısı.
 *
 * Mərhələ 4-də əsl 2.5D telefon qutusu ilə əvəz olunacaq.
 */
export function SkiaSmokeTest() {
  return (
    <View style={styles.wrapper}>
      <Canvas style={styles.canvas}>
        <Group>
          <Shadow dx={0} dy={8} blur={16} color={`${colors.shadow}22`} />
          <RoundedRect x={20} y={20} width={W - 40} height={H - 40} r={14}>
            <LinearGradient
              start={vec(20, 20)}
              end={vec(W - 20, H - 20)}
              colors={[colors.surfaceRaised, colors.accentSoft]}
            />
          </RoundedRect>
        </Group>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    width: W,
    height: H,
  },
});
