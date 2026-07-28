import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/config/theme';
import { t } from '@/localization/i18n';
import type { MaterialId } from '@/types/game';

export type MaterialAvailability = 'available' | 'no-recipe' | 'locked';

type MaterialCardProps = {
  materialId: MaterialId;
  isRecommended: boolean;
  availability: MaterialAvailability;
  selected: boolean;
  onPress: () => void;
};

const MATERIAL_KEY: Record<MaterialId, string> = {
  'stretch-film': 'materials.stretchFilm',
  'bubble-wrap': 'materials.bubbleWrap',
  'premium-paper': 'materials.premiumPaper',
  foil: 'materials.foil',
};

const SWATCH: Record<MaterialId, string> = {
  'stretch-film': '#DCE8EF',
  'bubble-wrap': '#E4EEF2',
  'premium-paper': '#D8C3B0',
  foil: '#C9CDD2',
};

export function MaterialCard({
  materialId,
  isRecommended,
  availability,
  selected,
  onPress,
}: MaterialCardProps) {
  const disabled = availability !== 'available';
  const name = t(MATERIAL_KEY[materialId]);

  // Yanlış material gameplay-i bloklamır — yalnız yumşaq qeyd göstərilir
  // (docs/DECISIONS.md §5). Bloklama yalnız recipe hazır olmadıqda baş verir.
  const note =
    availability === 'locked'
      ? t('materialSelect.lockedNote')
      : availability === 'no-recipe'
        ? t('materialSelect.noRecipeNote')
        : !isRecommended
          ? t('materialSelect.notRecommendedNote')
          : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.swatch, { backgroundColor: SWATCH[materialId] }]} />

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            {isRecommended ? (
              <View style={styles.badge}>
                <Text style={styles.badgeLabel}>{t('common.recommended')}</Text>
              </View>
            ) : null}
          </View>

          {note ? <Text style={styles.note}>{note}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: colors.accentStrong,
    backgroundColor: colors.accentSoft,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.table,
  },
  body: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  name: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.resultPerfect,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  badgeLabel: {
    ...typography.caption,
    color: colors.textInverse,
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
