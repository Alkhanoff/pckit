import { create } from 'zustand';

import { STARTING_COIN, STARTING_REPUTATION } from '@/config/progression';
import type { ProfileData } from '@/database/schema';

/** Coin, reputasiya və ümumi statistika. Persist edilir. */
type ProfileStore = ProfileData & {
  addCoin: (amount: number) => void;
  spendCoin: (amount: number) => boolean;
  addReputation: (amount: number) => void;
  recordOrderCompleted: (wasPerfect: boolean) => void;
  hydrate: (data: ProfileData) => void;
  toData: () => ProfileData;
};

const initial: ProfileData = {
  coin: STARTING_COIN,
  reputation: STARTING_REPUTATION,
  ordersCompleted: 0,
  perfectCount: 0,
};

export const useProfileStore = create<ProfileStore>((set, get) => ({
  ...initial,

  addCoin: (amount) => set((s) => ({ coin: s.coin + Math.max(0, amount) })),

  spendCoin: (amount) => {
    if (amount < 0 || get().coin < amount) return false;
    set((s) => ({ coin: s.coin - amount }));
    return true;
  },

  // Reputasiya xərclənmir — yalnız artır (docs/DECISIONS.md §9).
  addReputation: (amount) => set((s) => ({ reputation: s.reputation + Math.max(0, amount) })),

  recordOrderCompleted: (wasPerfect) =>
    set((s) => ({
      ordersCompleted: s.ordersCompleted + 1,
      perfectCount: s.perfectCount + (wasPerfect ? 1 : 0),
    })),

  hydrate: (data) => set({ ...data }),

  toData: () => {
    const { coin, reputation, ordersCompleted, perfectCount } = get();
    return { coin, reputation, ordersCompleted, perfectCount };
  },
}));

export const resetProfileStore = () => useProfileStore.setState({ ...initial });
