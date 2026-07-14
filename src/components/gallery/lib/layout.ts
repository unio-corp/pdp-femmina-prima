/**
 * L'ultima immagine di una raccolta dispari occupa entrambe le colonne
 * della griglia tablet/desktop (spec §4.3).
 */
export function isFullSpan(index: number, total: number): boolean {
  return total % 2 === 1 && index === total - 1;
}
