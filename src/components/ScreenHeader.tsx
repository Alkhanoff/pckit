import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MIN_TOUCH_SIZE, colors, spacing, typography } from '@/config/theme';
import { t } from '@/localization/i18n';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Geri düyməsi göstərilsin */
  showBack?: boolean;
};

export function ScreenHeader({ title, subtitle, showBack = true }: ScreenHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Text style={styles.backLabel}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* Başlığın optik mərkəzdə qalması üçün simmetrik boşluq */}
        <View style={styles.back} />
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  back: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
  backLabel: {
    fontSize: 26,
    color: colors.textPrimary,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
