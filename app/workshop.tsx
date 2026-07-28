import { PlaceholderBody } from '@/components/PlaceholderBody';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { t } from '@/localization/i18n';

export default function WorkshopScreen() {
  return (
    <Screen>
      <ScreenHeader title={t('workshop.title')} />
      <PlaceholderBody stage="Mərhələ 18" />
    </Screen>
  );
}
