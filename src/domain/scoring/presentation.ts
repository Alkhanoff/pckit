import { DEFECT_GROUP_CAPS, DEFECT_PENALTIES, REPAIR_RESIDUAL } from '@/config/balance';
import type { DefectInstance } from '@/types/game';

import { roundScore } from './types';

/**
 * Presentation balı — docs/BALANCE.md §3.
 *
 * 100-dən başlayır, qüsur cəzaları çıxılır.
 * Düzəldilmiş qüsur cəzanın 80%-ini geri qaytarır (`REPAIR_RESIDUAL = 0.20`).
 *
 * Cəza limiti (`group cap`) daxilində qüsurlar EFFEKTİV CƏZAYA GÖRƏ AZALAN
 * sırada sayılır. Yəni limit "ən pis N qüsur" deməkdir.
 *
 * Səbəb: əks halda düzəldilmiş qüsurlar limiti "doldurub" düzəldilməmiş
 * qüsurları cəzadan qoruyardı və oyunçu qəsdən çox qüsur yaratmaqda
 * maraqlı olardı.
 */

function effectivePenalty(defect: DefectInstance): number {
  const config = DEFECT_PENALTIES[defect.type];
  // `asymmetry` davamlıdır — faktiki dəyər `magnitude`-dən gəlir.
  const base = defect.magnitude ?? config.penalty;
  const capped = Math.min(base, config.penalty);
  return defect.repaired ? capped * REPAIR_RESIDUAL : capped;
}

export function calculatePresentation(defects: DefectInstance[]): number {
  const byGroup = new Map<string, number[]>();

  for (const defect of defects) {
    const group = DEFECT_PENALTIES[defect.type].group;
    const list = byGroup.get(group) ?? [];
    list.push(effectivePenalty(defect));
    byGroup.set(group, list);
  }

  let totalPenalty = 0;
  for (const [group, penalties] of byGroup) {
    const cap = DEFECT_GROUP_CAPS[group] ?? 0;
    const counted = penalties.sort((a, b) => b - a).slice(0, cap);
    totalPenalty += counted.reduce((sum, p) => sum + p, 0);
  }

  return roundScore(100 - totalPenalty);
}
