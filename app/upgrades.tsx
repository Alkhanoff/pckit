import { PlaceholderBody } from '@/components/PlaceholderBody';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { t } from '@/localization/i18n';

export default function UpgradesScreen() {
  return (
    <Screen>
      <ScreenHeader title={t('upgrades.title')} />
      <PlaceholderBody stage="Mərhələ 18" />
    </Screen>
  );
}
