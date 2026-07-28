import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MenuButton } from '@/components/MenuButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { TensionIndicator } from '@/components/TensionIndicator';
import { colors, spacing, typography } from '@/config/theme';
import { getProduct } from '@/data/products';
import { useGameplayGestures, useRegisterIntentDispatcher } from '@/gestures/useGameplayGestures';
import { GameplayScene } from '@/graphics/GameplayScene';
import { useResponsive } from '@/hooks/useResponsive';
import { useSceneGeometry } from '@/hooks/useSceneGeometry';
import { t } from '@/localization/i18n';
import { useGameplayStore } from '@/stores/useGameplayStore';
import type { ZoneId } from '@/types/game';
import type { Point } from '@/utils/projection';

/**
 * Qablaşdırma ekranı.
 *
 * Mərhələ 5: vahid gesture sistemi bağlanıb — dartma zamanı yalnız shared
 * value-lar dəyişir, React state toxunulmur.
 * Film vizualı və coverage Mərhələ 6–7-dədir.
 */
export default function GameplayScreen() {
  const { session: sessionParam } = useLocalSearchParams<{ session?: string }>();
  const session = useGameplayStore((s) => s.session);
  const ready = useGameplayStore((s) => s.ready);
  const dispatch = useGameplayStore((s) => s.dispatch);

  const { contentWidth, isCompact } = useResponsive();
  const [touchedZone, setTouchedZone] = useState<ZoneId>();

  // Gesture qatı intent-ləri bu sessiyaya göndərsin.
  useRegisterIntentDispatcher(dispatch);

  useEffect(() => {
    if (session?.state === 'preparing') ready();
  }, [session?.state, ready]);

  const sceneWidth = contentWidth - spacing.lg * 2;
  const sceneHeight = Math.round(sceneWidth * (isCompact ? 0.85 : 1.05));

  // Sessiya olmasa belə hook sırası dəyişməməlidir — buna görə həndəsə
  // həmişə hesablanır və məhsul tapılmayanda default istifadə olunur.
  const product = getProduct(session?.productId ?? 'phone-box');
  const geometry = useSceneGeometry(product, sceneWidth, sceneHeight);

  const handleScenePress = useCallback(
    (point: Point) => setTouchedZone(geometry.hitTest(point)),
    [geometry],
  );

  const gestures = useGameplayGestures({
    state: session?.state ?? 'preparing',
    referenceDistance: geometry.referenceDragDistance,
    onScenePress: handleScenePress,
  });

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
        <GameplayScene
          geometry={geometry}
          width={sceneWidth}
          height={sceneHeight}
          gesture={gestures.gesture}
          highlightedZone={touchedZone}
        />

        <TensionIndicator
          tension={gestures.tension}
          band={gestures.band}
          active={gestures.active}
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
    marginTop: spacing.md,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
