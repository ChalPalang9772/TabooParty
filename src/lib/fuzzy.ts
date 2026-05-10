// Levenshtein distance for fuzzy guess matching
export function levenshtein(a: string, b: string): number {
  const la = a.length, lb = b.length;
  const dp: number[][] = Array.from({ length: la + 1 }, () => Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[la][lb];
}

export type MatchResult = 'exact' | 'close' | 'wrong';

export function matchGuess(
  guess: string,
  target: string
): { result: MatchResult; pointMultiplier: number } {
  const g = guess.trim().toLowerCase();
  const t = target.trim().toLowerCase();

  if (g === t) return { result: 'exact', pointMultiplier: 1.0 };

  const len = t.length;
  let threshold: number;
  if (len <= 4) return { result: 'wrong', pointMultiplier: 0 }; // exact only for short words
  else if (len <= 7) threshold = 1;
  else if (len <= 12) threshold = 2;
  else threshold = 3;

  const dist = levenshtein(g, t);
  if (dist <= threshold) return { result: 'close', pointMultiplier: 0.5 };
  return { result: 'wrong', pointMultiplier: 0 };
}
