import { Pressable, StyleSheet, Text } from 'react-native';

import { MIN_TOUCH_SIZE, colors, radius, spacing, typography } from '@/config/theme';

type MenuButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

/** Böyük toxunma sahəli əsas menyu düyməsi (bir əllə istifadə üçün). */
export function MenuButton({
  label,
  onPress,
  variant = 'secondary',
  disabled = false,
}: MenuButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, isPrimary && styles.labelPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_SIZE + spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  primary: {
    backgroundColor: colors.accentStrong,
  },
  secondary: {
    backgroundColor: colors.surfaceRaised,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  labelPrimary: {
    color: colors.textInverse,
  },
});
