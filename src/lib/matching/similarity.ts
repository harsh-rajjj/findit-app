/**
 * Calculate text similarity using word overlap (Jaccard similarity).
 * Returns a value between 0 and 1.
 */
export function calculateSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 0;

  const wordsA = new Set(
    textA
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
  const wordsB = new Set(
    textB
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);

  return intersection.size / union.size;
}
