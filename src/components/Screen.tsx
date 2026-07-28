import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/config/theme';

type ScreenProps = {
  children: ReactNode;
  /** Kontent şaquli olaraq mərkəzləşdirilsin */
  centered?: boolean;
};

/** Bütün ekranlar üçün Safe Area + fon konteyner. */
export function Screen({ children, centered = false }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.content, centered && styles.centered]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  centered: {
    justifyContent: 'center',
  },
});
