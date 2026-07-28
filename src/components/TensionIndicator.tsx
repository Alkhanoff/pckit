import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { TENSION_BANDS } from '@/config/balance';
import { colors, radius, spacing } from '@/config/theme';
import { BAND_LOOSE, BAND_OPTIMAL } from '@/utils/gestureMath';

/**
 * Dartılma göstəricisi.
 *
 * Tamamilə shared value-lardan idarə olunur — dartma zamanı React HEÇ VAXT
 * yenidən render olunmur (docs/ARCHITECTURE.md §10).
 *
 * Vəziyyət həm RƏNG, həm də FORMA ilə göstərilir: yalnız rəngə əsaslanmaq
 * accessibility qaydası ilə qadağandır (docs/BALANCE.md §2).
 */

type TensionIndicatorProps = {
  tension: SharedValue<number>;
  band: SharedValue<number>;
  active: SharedValue<boolean>;
};

const BAND_COLOR = [colors.tensionLoose, colors.tensionOptimal, colors.tensionOverstretched];

/** Forma: dairə (loose) → kvadrat (optimal) → üçbucaq təəssüratı (overstretch) */
const BAND_RADIUS = [radius.pill, radius.sm, 2];

export function TensionIndicator({ tension, band, active }: TensionIndicatorProps) {
  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.round(tension.value * 100)}%`,
    backgroundColor: BAND_COLOR[band.value] ?? BAND_COLOR[BAND_OPTIMAL],
  }));

  const markerStyle = useAnimatedStyle(() => ({
    borderRadius: BAND_RADIUS[band.value] ?? BAND_RADIUS[BAND_LOOSE],
    backgroundColor: BAND_COLOR[band.value] ?? BAND_COLOR[BAND_OPTIMAL],
    opacity: active.value ? 1 : 0.35,
    transform: [{ rotate: band.value === 2 ? '45deg' : '0deg' }],
  }));

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.marker, markerStyle]} />

      <View style={styles.track}>
        {/* Optimal zolaq — oyunçu hara çatmalı olduğunu görür */}
        <View
          style={[
            styles.optimalBand,
            {
              left: `${TENSION_BANDS.looseMax * 100}%`,
              width: `${(TENSION_BANDS.optimalMax - TENSION_BANDS.looseMax) * 100}%`,
            },
          ]}
        />
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.md,
  },
  marker: {
    width: 18,
    height: 18,
    marginRight: spacing.sm,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.table,
    overflow: 'hidden',
  },
  optimalBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: `${colors.tensionOptimal}44`,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
