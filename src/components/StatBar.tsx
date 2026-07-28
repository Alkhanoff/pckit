import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/config/theme';
import { t } from '@/localization/i18n';

type StatBarProps = {
  coin: number;
  reputation: number;
};

/** Coin və reputasiya göstəricisi — Main Menu və Orders ekranlarında. */
export function StatBar({ coin, reputation }: StatBarProps) {
  return (
    <View style={styles.row}>
      <Stat label={t('common.coins')} value={coin} />
      <Stat label={t('common.reputation')} value={reputation} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat} accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  value: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
