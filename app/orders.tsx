import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MenuButton } from '@/components/MenuButton';
import { OrderCard } from '@/components/OrderCard';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StatBar } from '@/components/StatBar';
import { colors, spacing, typography } from '@/config/theme';
import { ALL_RECIPES, getRecipe } from '@/data/recipes';
import { describeOrder } from '@/domain/orders/generator';
import { t } from '@/localization/i18n';
import { useOrderStore } from '@/stores/useOrderStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useProgressionStore } from '@/stores/useProgressionStore';

export default function OrdersScreen() {
  const board = useOrderStore((s) => s.board);
  const activeOrder = useOrderStore((s) => s.activeOrder);
  const refreshBoard = useOrderStore((s) => s.refreshBoard);
  const selectOrder = useOrderStore((s) => s.selectOrder);

  const coin = useProfileStore((s) => s.coin);
  const reputation = useProfileStore((s) => s.reputation);
  const fixedOrderIndex = useProgressionStore((s) => s.fixedOrderIndex);
  const unlockedProducts = useProgressionStore((s) => s.unlockedProducts);

  /** Yalnız açılmış məhsulların recipe-ləri sifariş pool-una düşür. */
  const unlockedRecipeIds = useMemo(
    () => ALL_RECIPES.filter((r) => unlockedProducts.includes(r.productId)).map((r) => r.id),
    [unlockedProducts],
  );

  useEffect(() => {
    refreshBoard({ completedCount: fixedOrderIndex }, unlockedRecipeIds);
  }, [refreshBoard, fixedOrderIndex, unlockedRecipeIds]);

  return (
    <Screen
      scroll
      footer={
        <MenuButton
          label={t('common.continue')}
          variant="primary"
          disabled={activeOrder === undefined}
          onPress={() => router.push('/material-select')}
        />
      }
    >
      <ScreenHeader title={t('orders.title')} subtitle={t('orders.subtitle')} />

      <StatBar coin={coin} reputation={reputation} />

      {board.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('orders.empty')}</Text>
        </View>
      ) : (
        board.map((order) => {
          const details = describeOrder(order);
          return (
            <OrderCard
              key={order.id}
              productId={details.productId}
              recommendedMaterialId={details.recommendedMaterialId}
              customerPriority={details.customerPriority}
              baseReward={getRecipe(order.recipeId).baseReward}
              orderLocalizationKey={details.localizationKey}
              isTutorial={details.isTutorial}
              selected={activeOrder?.id === order.id}
              onPress={() => selectOrder(order)}
            />
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
