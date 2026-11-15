/**
 * Validates whether the user entered the anniversary date: 24 de febrero de 2025.
 * Accepts:
 * - 24/02/2025
 * - 24-02-2025
 * - 24 de febrero de 2025 (including case/whitespace variations)
 */
export function isValidAnniversaryDate(input: string): boolean {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  if (!normalized) return false;

  // Exact numeric formats: 24/02/2025 or 24-02-2025 (also allow 24/2/2025 or 24-2-2025)
  if (/^24[/-]0?2[/-]2025$/.test(normalized)) {
    return true;
  }

  // Spanish written format: "24 de febrero de 2025" (or "24 de febrero del 2025")
  if (/^24\s+de\s+febrero\s+(de|del)\s+2025$/.test(normalized)) {
    return true;
  }

  return false;
}
