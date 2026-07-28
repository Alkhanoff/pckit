import { create } from 'zustand';

import type { InventoryData } from '@/database/schema';
import type { MaterialId } from '@/types/game';

/**
 * Material ehtiyatı.
 *
 * MVP-də YALNIZ vizual göstəricidir — gameplay-i bloklamır və enerji sistemi
 * kimi işləmir (docs/DECISIONS.md §12). Jumbo səhnəsi post-MVP-dir.
 */
type InventoryStore = {
  stock: InventoryData;
  consume: (id: MaterialId, amount: number) => void;
  refill: (id: MaterialId, amount: number) => void;
  hydrate: (data: InventoryData) => void;
  toData: () => InventoryData;
};

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  stock: {},

  // Ehtiyat sıfıra düşsə belə sifariş davam edir.
  consume: (id, amount) =>
    set((s) => ({ stock: { ...s.stock, [id]: Math.max(0, (s.stock[id] ?? 0) - amount) } })),

  refill: (id, amount) =>
    set((s) => ({ stock: { ...s.stock, [id]: (s.stock[id] ?? 0) + amount } })),

  hydrate: (data) => set({ stock: { ...data } }),

  toData: () => ({ ...get().stock }),
}));

export const resetInventoryStore = () => useInventoryStore.setState({ stock: {} });
