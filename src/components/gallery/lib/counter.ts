/**
 * Formatta il contatore del carousel: zeri iniziali sulla posizione solo
 * quando il totale ha più di una cifra (`3 / 7`, `03 / 12`).
 */
export function formatCounter(activeIndex: number, total: number): string {
  const position = String(activeIndex + 1).padStart(String(total).length, '0');
  return `${position} / ${total}`;
}
