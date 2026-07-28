let counter = 0;

/**
 * Sessiya və qüsur identifikatorları üçün proses daxilində unikal id.
 * Kriptoqrafik təhlükəsizlik tələb olunmur — yalnız eyni sessiyada toqquşma olmasın.
 */
export function createId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}-${Date.now().toString(36)}`;
}

/** Testlər üçün sayğacı sıfırlayır. */
export function resetIdCounter(): void {
  counter = 0;
}
