import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MenuButton } from '@/components/MenuButton';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/config/theme';
import { SkiaSmokeTest } from '@/graphics/SkiaSmokeTest';
import { t } from '@/localization/i18n';

export default function GameplayScreen() {
  return (
    <Screen centered>
      <View style={styles.body}>
        <Text style={styles.title}>Packaging</Text>
        <SkiaSmokeTest />
        <Text style={styles.stage}>Mərhələ 4-12</Text>
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
    marginBottom: spacing.md,
  },
  stage: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
