/**
 * FileSense Fuzzy Text & Code Similarity Engine
 * Implements n-gram shingling, Jaccard similarity, and normalized token fingerprinting
 * to identify near-duplicate documents, revised drafts, and cloned code modules.
 */

export interface TextFingerprint {
  tokenCount: number;
  uniqueShingleCount: number;
  topTokens: string[];
  signature: string;
}

export interface TextSimilarityResult {
  jaccardSimilarity: number;
  sharedTokensCount: number;
  totalUniqueTokens: number;
  levenshteinNormalized: number;
  isSubstantialDuplicate: boolean;
}

export class FuzzyTextEngine {
  /**
   * Tokenizes text into lowercase normalized alphanumeric words.
   */
  public static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  /**
   * Generates n-gram shingles (e.g. 3-word combinations) from a list of tokens.
   */
  public static generateShingles(tokens: string[], k: number = 3): Set<string> {
    const shingles = new Set<string>();
    if (tokens.length < k) {
      shingles.add(tokens.join('_'));
      return shingles;
    }

    for (let i = 0; i <= tokens.length - k; i++) {
      const shingle = tokens.slice(i, i + k).join('_');
      shingles.add(shingle);
    }

    return shingles;
  }

  /**
   * Computes Jaccard similarity between two sets of shingles:
   * J(A, B) = |A ∩ B| / |A ∪ B|
   */
  public static computeJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 && setB.size === 0) return 1.0;
    if (setA.size === 0 || setB.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const item of setA) {
      if (setB.has(item)) {
        intersectionCount++;
      }
    }

    const unionSize = setA.size + setB.size - intersectionCount;
    return Math.round((intersectionCount / unionSize) * 1000) / 1000;
  }

  /**
   * Computes Levenshtein edit distance between two strings with length normalization.
   */
  public static computeNormalizedLevenshtein(str1: string, str2: string): number {
    const s1 = str1.slice(0, 500); // Truncate sample window for performance
    const s2 = str2.slice(0, 500);
    const m = s1.length;
    const n = s2.length;

    if (m === 0) return n === 0 ? 1.0 : 0.0;
    if (n === 0) return 0.0;

    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1,      // insertion
          dp[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const distance = dp[m][n];
    const maxLength = Math.max(m, n);
    return Math.round((1 - distance / maxLength) * 1000) / 1000;
  }

  /**
   * Holistic document similarity evaluation.
   */
  public static compareDocuments(docA: string, docB: string): TextSimilarityResult {
    const tokensA = this.tokenize(docA);
    const tokensB = this.tokenize(docB);

    const shinglesA = this.generateShingles(tokensA, 3);
    const shinglesB = this.generateShingles(tokensB, 3);

    const jaccard = this.computeJaccardSimilarity(shinglesA, shinglesB);
    const levenshtein = this.computeNormalizedLevenshtein(docA, docB);

    let shared = 0;
    for (const s of shinglesA) {
      if (shinglesB.has(s)) shared++;
    }

    return {
      jaccardSimilarity: jaccard,
      sharedTokensCount: shared,
      totalUniqueTokens: shinglesA.size + shinglesB.size - shared,
      levenshteinNormalized: levenshtein,
      isSubstantialDuplicate: jaccard >= 0.8 || levenshtein >= 0.85,
    };
  }
}
