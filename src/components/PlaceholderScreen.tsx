import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MenuButton } from '@/components/MenuButton';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/config/theme';
import { t } from '@/localization/i18n';

type PlaceholderScreenProps = {
  /** Ekran başlığı — localization key ilə həll edilmiş mətn */
  title: string;
  /** Bu ekranın hansı mərhələdə hazırlanacağı (yalnız development göstəricisi) */
  stage: string;
};

/**
 * Mərhələ 1 placeholder-i.
 * Naviqasiya axınının erkən yoxlanması üçün — hər ekran öz mərhələsində əvəz olunacaq.
 */
export function PlaceholderScreen({ title, stage }: PlaceholderScreenProps) {
  return (
    <Screen centered>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.note}>{t('common.comingSoon')}</Text>
        <Text style={styles.stage}>{stage}</Text>
      </View>
      <MenuButton label={t('common.back')} onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  note: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  stage: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
