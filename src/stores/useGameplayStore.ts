import { create } from 'zustand';

import type { GameplayIntent } from '@/domain/gameplay/intents';
import { beginSession, reduce } from '@/domain/gameplay/machine';
import type { CreateSessionInput, PackagingSession } from '@/domain/gameplay/session';
import { createSession } from '@/domain/gameplay/session';
import type { ScoreResult } from '@/domain/scoring';

/**
 * Aktiv qablaşdırma sessiyası.
 *
 * PERSIST EDİLMİR — sessiya müvəqqətidir.
 * Real-time gesture koordinatları BURAYA YAZILMIR (docs/DECISIONS.md §14) —
 * yalnız diskret intent-lər state machine vasitəsilə tətbiq olunur.
 */
type GameplayStore = {
  session?: PackagingSession;
  score?: ScoreResult;

  start: (input: CreateSessionInput) => void;
  ready: () => void;
  dispatch: (intent: GameplayIntent) => void;
  setScore: (score: ScoreResult) => void;
  end: () => void;
};

export const useGameplayStore = create<GameplayStore>((set, get) => ({
  start: (input) => set({ session: createSession(input), score: undefined }),

  /** Səhnə hazır olduqda `preparing` → `selectingMaterial`. */
  ready: () => {
    const session = get().session;
    if (!session) return;
    set({ session: beginSession(session) });
  },

  dispatch: (intent) => {
    const session = get().session;
    if (!session) return;
    set({ session: reduce(session, intent) });
  },

  setScore: (score) => set({ score }),

  end: () => set({ session: undefined, score: undefined }),
}));

export const resetGameplayStore = () =>
  useGameplayStore.setState({ session: undefined, score: undefined });
