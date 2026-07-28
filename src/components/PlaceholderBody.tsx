import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/config/theme';
import { t } from '@/localization/i18n';

/** Hələ hazırlanmamış ekranların gövdəsi — hansı mərhələdə gələcəyini göstərir. */
export function PlaceholderBody({ stage }: { stage: string }) {
  return (
    <View style={styles.body}>
      <Text style={styles.note}>{t('common.comingSoon')}</Text>
      <Text style={styles.stage}>{stage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    ...typography.body,
    color: colors.textSecondary,
  },
  stage: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
