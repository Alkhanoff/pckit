import {
  BASE_REPUTATION,
  PRIORITY_BONUS_MULTIPLIER,
  PRIORITY_BONUS_THRESHOLD,
  RESULT_MULTIPLIER,
} from '@/config/progression';
import type { CustomerPriority } from '@/types/game';

import type { ScoreResult } from '../scoring/types';

/**
 * Mükafat hesablaması — docs/BALANCE.md §7.
 *
 *   coin       = round(baseReward × resultMultiplier × priorityBonus)
 *   reputation = round(10 × resultMultiplier)
 */

export type Rewards = {
  coin: number;
  reputation: number;
  priorityBonusApplied: boolean;
};

/** Müştərinin prioritet oxu ≥ 90 baldırsa coin bonusu verilir. */
export function hasPriorityBonus(score: ScoreResult, priority: CustomerPriority): boolean {
  const threshold = PRIORITY_BONUS_THRESHOLD;

  switch (priority) {
    case 'presentation':
      return score.presentation >= threshold;
    case 'protection':
      return score.protection >= threshold;
    case 'efficiency':
      return score.efficiency >= threshold;
    case 'balanced':
      // Balanslı müştəri yalnız hər üç ox yüksək olduqda bonus verir.
      return (
        score.presentation >= threshold &&
        score.protection >= threshold &&
        score.efficiency >= threshold
      );
  }
}

export function calculateRewards(
  score: ScoreResult,
  baseReward: number,
  priority: CustomerPriority,
): Rewards {
  const multiplier = RESULT_MULTIPLIER[score.tier];
  const bonusApplied = hasPriorityBonus(score, priority);
  const bonus = bonusApplied ? PRIORITY_BONUS_MULTIPLIER : 1;

  return {
    coin: Math.round(baseReward * multiplier * bonus),
    reputation: Math.round(BASE_REPUTATION * multiplier),
    priorityBonusApplied: bonusApplied,
  };
}

/** Zen Mode heç bir mükafat vermir — docs/DECISIONS.md §10. */
export const ZEN_REWARDS: Rewards = {
  coin: 0,
  reputation: 0,
  priorityBonusApplied: false,
};
