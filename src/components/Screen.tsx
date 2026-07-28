import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/config/theme';
import { useResponsive } from '@/hooks/useResponsive';

type ScreenProps = {
  children: ReactNode;
  /** Kontent şaquli olaraq mərkəzləşdirilsin */
  centered?: boolean;
  /** Uzun kontent üçün scroll (kiçik ekranlarda kəsilməsin) */
  scroll?: boolean;
  /** Ekranın altına sabitlənən element (məsələn əsas düymə) */
  footer?: ReactNode;
};

/**
 * Bütün ekranlar üçün Safe Area + fon + responsive konteyner.
 * Kontent geniş ekranlarda mərkəzdə saxlanılır (docs/ARCHITECTURE.md §10).
 */
export function Screen({ children, centered = false, scroll = false, footer }: ScreenProps) {
  const { contentWidth, isWide, verticalScale } = useResponsive();

  const containerStyle = [
    styles.content,
    { maxWidth: contentWidth, paddingVertical: spacing.md * verticalScale },
    isWide && styles.selfCenter,
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[containerStyle, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[containerStyle, styles.flex, centered && styles.centered]}>{children}</View>
      )}

      {footer ? (
        <View style={[styles.footer, { maxWidth: contentWidth }, isWide && styles.selfCenter]}>
          {footer}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  centered: {
    justifyContent: 'center',
  },
  selfCenter: {
    alignSelf: 'center',
  },
  footer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
});
