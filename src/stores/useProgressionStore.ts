import { create } from 'zustand';

import {
  STARTING_MATERIALS,
  STARTING_PRODUCTS,
  STARTING_WORKSHOP_LEVEL,
} from '@/config/progression';
import type { ProgressionData } from '@/database/schema';
import { unlockedProducts } from '@/domain/progression/unlocks';
import type { MaterialId, ProductId } from '@/types/game';

/** Açılmış kontent, workshop səviyyəsi və tutorial statusu. Persist edilir. */
type ProgressionStore = ProgressionData & {
  syncProductsWithReputation: (reputation: number) => void;
  addMaterial: (id: MaterialId) => void;
  setWorkshopLevel: (level: number) => void;
  completeTutorial: () => void;
  restartTutorial: () => void;
  advanceFixedOrder: () => void;
  hydrate: (data: ProgressionData) => void;
  toData: () => ProgressionData;
};

const initial: ProgressionData = {
  unlockedProducts: [...STARTING_PRODUCTS],
  ownedMaterials: [...STARTING_MATERIALS],
  workshopLevel: STARTING_WORKSHOP_LEVEL,
  tutorialCompleted: false,
  fixedOrderIndex: 0,
};

export const useProgressionStore = create<ProgressionStore>((set, get) => ({
  ...initial,

  // Məhsullar yalnız reputasiya ilə açılır — coin tələb etmir.
  syncProductsWithReputation: (reputation) =>
    set({ unlockedProducts: unlockedProducts(reputation) as ProductId[] }),

  addMaterial: (id) =>
    set((s) => (s.ownedMaterials.includes(id) ? s : { ownedMaterials: [...s.ownedMaterials, id] })),

  setWorkshopLevel: (level) => set({ workshopLevel: level }),

  completeTutorial: () => set({ tutorialCompleted: true }),
  restartTutorial: () => set({ tutorialCompleted: false, fixedOrderIndex: 0 }),

  advanceFixedOrder: () => set((s) => ({ fixedOrderIndex: s.fixedOrderIndex + 1 })),

  hydrate: (data) => set({ ...data }),

  toData: () => {
    const {
      unlockedProducts: p,
      ownedMaterials,
      workshopLevel,
      tutorialCompleted,
      fixedOrderIndex,
    } = get();
    return {
      unlockedProducts: p,
      ownedMaterials,
      workshopLevel,
      tutorialCompleted,
      fixedOrderIndex,
    };
  },
}));

export const resetProgressionStore = () =>
  useProgressionStore.setState({
    ...initial,
    unlockedProducts: [...STARTING_PRODUCTS],
    ownedMaterials: [...STARTING_MATERIALS],
  });
