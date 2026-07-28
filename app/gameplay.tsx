import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MenuButton } from '@/components/MenuButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, spacing, typography } from '@/config/theme';
import { SkiaSmokeTest } from '@/graphics/SkiaSmokeTest';
import { t } from '@/localization/i18n';
import { useGameplayStore } from '@/stores/useGameplayStore';

/**
 * Qablaşdırma ekranı.
 *
 * Mərhələ 3-də yalnız sessiyanın düzgün ötürüldüyünü göstərir.
 * Əsl gameplay Mərhələ 4–12-də bu ekranda qurulur.
 */
export default function GameplayScreen() {
  const { session: sessionParam } = useLocalSearchParams<{ session?: string }>();
  const session = useGameplayStore((s) => s.session);
  const ready = useGameplayStore((s) => s.ready);

  // Səhnə hazır olduqda `preparing` → `selectingMaterial`.
  useEffect(() => {
    if (session?.state === 'preparing') ready();
  }, [session?.state, ready]);

  if (!session || session.sessionId !== sessionParam) {
    return (
      <Screen centered>
        <Text style={styles.missing}>{t('gameplay.noSession')}</Text>
        <MenuButton label={t('common.back')} onPress={() => router.replace('/orders')} />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <MenuButton
          label={t('common.continue')}
          variant="primary"
          onPress={() => router.push('/result')}
        />
      }
    >
      <ScreenHeader title={t('gameplay.title')} />

      <View style={styles.body}>
        <SkiaSmokeTest />

        <Text style={styles.state}>{t(`gameplay.state.${session.state}`)}</Text>

        <View style={styles.meta}>
          <MetaRow label="Recipe" value={session.recipeId} />
          <MetaRow label="Priority" value={session.customerPriority} />
          <MetaRow label="Suitability" value={session.suitability} />
          <MetaRow label="Passes" value={`0 / ${session.totalPasses}`} />
        </View>

        <Text style={styles.stage}>Mərhələ 4–12</Text>
      </View>
    </Screen>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missing: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  state: {
    ...typography.heading,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  meta: {
    width: '100%',
    marginTop: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaValue: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  stage: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
});
