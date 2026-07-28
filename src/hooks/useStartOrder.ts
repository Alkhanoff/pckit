import { useCallback } from 'react';

import { findRecipe } from '@/data/recipes';
import { useGameplayStore } from '@/stores/useGameplayStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { createId } from '@/utils/id';

/**
 * Seçilmiş sifariş və materialdan gameplay sessiyası qurur.
 *
 * Gameplay route-una YALNIZ `sessionId` ötürülür — gameplay state-i route
 * parametrlərində saxlanılmır (docs/ARCHITECTURE.md §5).
 */
export function useStartOrder() {
  const activeOrder = useOrderStore((s) => s.activeOrder);
  const selectedMaterialId = useOrderStore((s) => s.selectedMaterialId);
  const start = useGameplayStore((s) => s.start);

  return useCallback((): string | undefined => {
    if (!activeOrder || !selectedMaterialId) return undefined;

    // Oyunçu tövsiyə olunandan fərqli material seçə bilər — recipe həmin
    // faktiki cütdən tapılır, tapılmazsa sessiya başlamır.
    const recipe = findRecipe(activeOrder.recipeId.split('__')[0], selectedMaterialId);
    if (!recipe) return undefined;

    const sessionId = createId('session');
    start({
      sessionId,
      recipe,
      customerPriority: activeOrder.customerPriority,
      isTutorial: activeOrder.isTutorial ?? false,
    });

    return sessionId;
  }, [activeOrder, selectedMaterialId, start]);
}
