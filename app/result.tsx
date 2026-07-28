import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MenuButton } from '@/components/MenuButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, radius, spacing, typography } from '@/config/theme';
import { t } from '@/localization/i18n';
import { useGameplayStore } from '@/stores/useGameplayStore';
import { useOrderStore } from '@/stores/useOrderStore';

/**
 * Nəticə ekranı.
 * Mərhələ 3-də struktur qurulur; real ballar Mərhələ 11-də hesablanır.
 */
export default function ResultScreen() {
  const score = useGameplayStore((s) => s.score);
  const endSession = useGameplayStore((s) => s.end);
  const clearSelection = useOrderStore((s) => s.clearSelection);

  function finish(destination: '/orders' | '/') {
    endSession();
    clearSelection();
    router.dismissAll();
    router.replace(destination);
  }

  return (
    <Screen
      scroll
      footer={
        <>
          <MenuButton
            label={t('result.nextOrder')}
            variant="primary"
            onPress={() => finish('/orders')}
          />
          <MenuButton label={t('result.backToMenu')} onPress={() => finish('/')} />
        </>
      }
    >
      <ScreenHeader title={t('result.title')} showBack={false} />

      {score ? (
        <View>
          <ScoreRow label={t('scoring.presentation')} value={score.presentation} />
          <ScoreRow label={t('scoring.protection')} value={score.protection} />
          <ScoreRow label={t('scoring.efficiency')} value={score.efficiency} />
          <View style={styles.divider} />
          <ScoreRow label={t('scoring.overall')} value={score.overall} emphasis />
          <Text style={styles.tier}>{t(`scoring.${score.tier}`)}</Text>
        </View>
      ) : (
        <Text style={styles.empty}>{t('result.noResult')}</Text>
      )}
    </Screen>
  );
}

function ScoreRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.row} accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.rowLabel, emphasis && styles.emphasis]}>{label}</Text>
      <Text style={[styles.rowValue, emphasis && styles.emphasis]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  emphasis: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.table,
    marginVertical: spacing.sm,
  },
  tier: {
    ...typography.title,
    color: colors.accentStrong,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
