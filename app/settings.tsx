import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { MenuButton } from '@/components/MenuButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ToggleRow } from '@/components/ToggleRow';
import { colors, spacing, typography } from '@/config/theme';
import { t } from '@/localization/i18n';
import { persistSave } from '@/services/save/saveService';
import { useProgressionStore } from '@/stores/useProgressionStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

export default function SettingsScreen() {
  const music = useSettingsStore((s) => s.music);
  const sound = useSettingsStore((s) => s.sound);
  const haptics = useSettingsStore((s) => s.haptics);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const toggle = useSettingsStore((s) => s.toggle);

  const restartTutorial = useProgressionStore((s) => s.restartTutorial);
  const [tutorialNotice, setTutorialNotice] = useState(false);

  /** Settings dəyişikliyi save yazma nöqtəsidir (docs/DECISIONS.md §15). */
  function change(key: 'music' | 'sound' | 'haptics' | 'reduceMotion') {
    toggle(key);
    void persistSave();
  }

  function handleRestartTutorial() {
    restartTutorial();
    setTutorialNotice(true);
    void persistSave();
  }

  return (
    <Screen scroll>
      <ScreenHeader title={t('settings.title')} />

      <ToggleRow label={t('settings.music')} value={music} onChange={() => change('music')} />
      <ToggleRow label={t('settings.sound')} value={sound} onChange={() => change('sound')} />
      <ToggleRow label={t('settings.haptics')} value={haptics} onChange={() => change('haptics')} />
      <ToggleRow
        label={t('settings.reduceMotion')}
        value={reduceMotion}
        onChange={() => change('reduceMotion')}
      />

      <MenuButton label={t('settings.restartTutorial')} onPress={handleRestartTutorial} />

      {tutorialNotice ? <Text style={styles.notice}>{t('settings.tutorialRestarted')}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
