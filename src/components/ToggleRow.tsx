import { StyleSheet, Switch, Text, View } from 'react-native';

import { MIN_TOUCH_SIZE, colors, radius, spacing, typography } from '@/config/theme';

type ToggleRowProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        accessibilityRole="switch"
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.accentStrong, false: colors.table }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
    marginRight: spacing.md,
  },
});
