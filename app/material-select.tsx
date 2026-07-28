import { router } from 'expo-router';
import { useEffect } from 'react';

import { MaterialCard } from '@/components/MaterialCard';
import type { MaterialAvailability } from '@/components/MaterialCard';
import { MenuButton } from '@/components/MenuButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ALL_MATERIALS } from '@/data/materials';
import { findRecipe, getRecipe } from '@/data/recipes';
import { useStartOrder } from '@/hooks/useStartOrder';
import { t } from '@/localization/i18n';
import { useOrderStore } from '@/stores/useOrderStore';
import { useProgressionStore } from '@/stores/useProgressionStore';

export default function MaterialSelectScreen() {
  const activeOrder = useOrderStore((s) => s.activeOrder);
  const selectedMaterialId = useOrderStore((s) => s.selectedMaterialId);
  const selectMaterial = useOrderStore((s) => s.selectMaterial);
  const ownedMaterials = useProgressionStore((s) => s.ownedMaterials);
  const startOrder = useStartOrder();

  // Sifariş seçilmədən bu ekrana birbaşa gəlmək mümkün olmamalıdır.
  useEffect(() => {
    if (!activeOrder) router.replace('/orders');
  }, [activeOrder]);

  if (!activeOrder) return null;

  const recipe = getRecipe(activeOrder.recipeId);
  const productId = recipe.productId;

  function availabilityFor(materialId: (typeof ALL_MATERIALS)[number]['id']): MaterialAvailability {
    if (!ownedMaterials.includes(materialId)) return 'locked';
    // Recipe hələ hazırlanmayıbsa seçim mümkün deyil — bu, "yanlış material"
    // deyil, sadəcə həmin kombinasiyanın gameplay-i sonrakı mərhələdədir.
    if (!findRecipe(productId, materialId)) return 'no-recipe';
    return 'available';
  }

  function handleStart() {
    const sessionId = startOrder();
    if (!sessionId) return;
    router.push({ pathname: '/gameplay', params: { session: sessionId } });
  }

  return (
    <Screen
      scroll
      footer={
        <MenuButton
          label={t('common.start')}
          variant="primary"
          disabled={selectedMaterialId === undefined}
          onPress={handleStart}
        />
      }
    >
      <ScreenHeader title={t('materialSelect.title')} subtitle={t('materialSelect.subtitle')} />

      {ALL_MATERIALS.map((material) => (
        <MaterialCard
          key={material.id}
          materialId={material.id}
          isRecommended={material.id === recipe.materialId}
          availability={availabilityFor(material.id)}
          selected={selectedMaterialId === material.id}
          onPress={() => selectMaterial(material.id)}
        />
      ))}
    </Screen>
  );
}
