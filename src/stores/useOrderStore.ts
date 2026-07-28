import { create } from 'zustand';

import { generateOrderBoard } from '@/domain/orders/generator';
import type { GeneratorState } from '@/domain/orders/generator';
import type { OrderTemplate } from '@/types/definitions';
import type { MaterialId } from '@/types/game';

/** Mövcud sifarişlər və aktiv seçim. Yalnız qismən persist edilir. */
type OrderStore = {
  board: OrderTemplate[];
  activeOrder?: OrderTemplate;
  /** Oyunçunun seçdiyi material — tövsiyə olunandan fərqli ola bilər */
  selectedMaterialId?: MaterialId;

  refreshBoard: (state: GeneratorState, unlockedRecipeIds: string[]) => void;
  selectOrder: (order: OrderTemplate) => void;
  selectMaterial: (id: MaterialId) => void;
  clearSelection: () => void;
};

export const useOrderStore = create<OrderStore>((set) => ({
  board: [],

  refreshBoard: (state, unlockedRecipeIds) =>
    set({ board: generateOrderBoard(state, unlockedRecipeIds) }),

  selectOrder: (order) => set({ activeOrder: order, selectedMaterialId: undefined }),

  // Yanlış material gameplay-i bloklamır — yalnız scoring-ə təsir edir.
  selectMaterial: (id) => set({ selectedMaterialId: id }),

  clearSelection: () => set({ activeOrder: undefined, selectedMaterialId: undefined }),
}));

export const resetOrderStore = () =>
  useOrderStore.setState({ board: [], activeOrder: undefined, selectedMaterialId: undefined });
