import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MenuButton } from '@/components/MenuButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, spacing, typography } from '@/config/theme';
import { getProduct } from '@/data/products';
import { GameplayScene } from '@/graphics/GameplayScene';
import { useResponsive } from '@/hooks/useResponsive';
import { t } from '@/localization/i18n';
import { useGameplayStore } from '@/stores/useGameplayStore';
import type { ZoneId } from '@/types/game';

/**
 * Qablaşdırma ekranı.
 *
 * Mərhələ 4: 2.5D məhsul və masa + toxunma zonaları.
 * Material interaction-ı Mərhələ 5–8-də əlavə olunur.
 */
export default function GameplayScreen() {
  const { session: sessionParam } = useLocalSearchParams<{ session?: string }>();
  const session = useGameplayStore((s) => s.session);
  const ready = useGameplayStore((s) => s.ready);
  const { contentWidth, isCompact } = useResponsive();

  const [touchedZone, setTouchedZone] = useState<ZoneId>();

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

  const product = getProduct(session.productId);
  const sceneWidth = contentWidth - spacing.lg * 2;
  const sceneHeight = Math.round(sceneWidth * (isCompact ? 0.85 : 1.05));

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
        <GameplayScene
          product={product}
          width={sceneWidth}
          height={sceneHeight}
          highlightedZone={touchedZone}
          onZonePress={setTouchedZone}
        />

        <Text style={styles.state}>{t(`gameplay.state.${session.state}`)}</Text>
        <Text style={styles.hint}>
          {touchedZone ? `zone: ${touchedZone}` : t('gameplay.tapHint')}
        </Text>
      </View>
    </Screen>
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
    marginTop: spacing.lg,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
