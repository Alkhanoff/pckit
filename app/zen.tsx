import { PlaceholderBody } from '@/components/PlaceholderBody';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { t } from '@/localization/i18n';

export default function ZenScreen() {
  return (
    <Screen>
      <ScreenHeader title={t('zen.title')} subtitle={t('zen.note')} />
      <PlaceholderBody stage="Mərhələ 17" />
    </Screen>
  );
}
