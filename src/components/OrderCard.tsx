import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/config/theme';
import { t } from '@/localization/i18n';
import type { CustomerPriority, MaterialId, ProductId } from '@/types/game';

type OrderCardProps = {
  productId: ProductId;
  recommendedMaterialId: MaterialId;
  customerPriority: CustomerPriority;
  baseReward: number;
  orderLocalizationKey: string;
  isTutorial: boolean;
  selected: boolean;
  onPress: () => void;
};

const PRODUCT_KEY: Record<ProductId, string> = {
  'phone-box': 'products.phoneBox',
  perfume: 'products.perfume',
  'gift-box': 'products.giftBox',
  'food-tray': 'products.foodTray',
};

const MATERIAL_KEY: Record<MaterialId, string> = {
  'stretch-film': 'materials.stretchFilm',
  'bubble-wrap': 'materials.bubbleWrap',
  'premium-paper': 'materials.premiumPaper',
  foil: 'materials.foil',
};

export function OrderCard({
  productId,
  recommendedMaterialId,
  customerPriority,
  baseReward,
  orderLocalizationKey,
  isTutorial,
  selected,
  onPress,
}: OrderCardProps) {
  const productName = t(PRODUCT_KEY[productId]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${productName}, ${t(orderLocalizationKey)}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <Text style={styles.product}>{productName}</Text>
        {isTutorial ? (
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>{t('common.tutorial')}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.customer}>{t(orderLocalizationKey)}</Text>

      <View style={styles.divider} />

      <Row label={t('orders.recommendedMaterial')} value={t(MATERIAL_KEY[recommendedMaterialId])} />
      <Row label={t('orders.priority')} value={t(`priority.${customerPriority}`)} />
      <Row label={t('orders.reward')} value={`${baseReward} ${t('common.coins')}`} />
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: colors.accentStrong,
    backgroundColor: colors.accentSoft,
  },
  pressed: {
    opacity: 0.9,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  product: {
    ...typography.heading,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  badgeLabel: {
    ...typography.caption,
    color: colors.textInverse,
  },
  customer: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.table,
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textMuted,
    flexShrink: 1,
  },
  rowValue: {
    ...typography.caption,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    textAlign: 'right',
    flexShrink: 1,
  },
});
