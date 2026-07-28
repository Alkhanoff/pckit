import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MenuButton } from '@/components/MenuButton';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/config/theme';
import { t } from '@/localization/i18n';

export default function MainMenuScreen() {
  return (
    <Screen centered>
      <View style={styles.header}>
        <Text style={styles.title}>{t('app.title')}</Text>
        <Text style={styles.tagline}>{t('app.tagline')}</Text>
      </View>

      <View style={styles.menu}>
        <MenuButton
          label={t('menu.orders')}
          variant="primary"
          onPress={() => router.push('/orders')}
        />
        <MenuButton label={t('menu.zen')} onPress={() => router.push('/zen')} />
        <MenuButton label={t('menu.workshop')} onPress={() => router.push('/workshop')} />
        <MenuButton label={t('menu.settings')} onPress={() => router.push('/settings')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.display,
    color: colors.textPrimary,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  menu: {
    width: '100%',
  },
});
