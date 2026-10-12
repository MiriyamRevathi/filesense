/**
 * FileSense Perceptual Hash Engine
 * Implements difference hashing (dHash) and average hashing (aHash) algorithms
 * for detecting near-duplicate and resized images.
 */

export interface PerceptualHashResult {
  hash: string;
  algorithm: 'dHash' | 'aHash';
  bitLength: number;
}

export interface SimilarityComparisonResult {
  hashA: string;
  hashB: string;
  hammingDistance: number;
  similarityPercentage: number;
  isLikelyNearDuplicate: boolean;
}

export class PerceptualHashEngine {
  /**
   * Computes Difference Hash (dHash) from 2D luminance pixel matrix.
   * Expects a 9x8 grayscale brightness matrix (values 0-255).
   */
  public static computeDHashFromMatrix(matrix: number[][]): PerceptualHashResult {
    if (!matrix || matrix.length < 8 || !matrix[0] || matrix[0].length < 9) {
      throw new Error('Matrix must be at least 8 rows by 9 columns');
    }

    let bitString = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        // Compare adjacent horizontal pixels
        const left = matrix[row][col];
        const right = matrix[row][col + 1];
        bitString += left > right ? '1' : '0';
      }
    }

    // Convert 64-bit binary string to 16-character hexadecimal hash
    let hex = '';
    for (let i = 0; i < bitString.length; i += 4) {
      const nibble = bitString.slice(i, i + 4);
      hex += parseInt(nibble, 2).toString(16);
    }

    return {
      hash: hex.padStart(16, '0'),
      algorithm: 'dHash',
      bitLength: 64,
    };
  }

  /**
   * Computes Average Hash (aHash) from 8x8 luminance pixel matrix.
   */
  public static computeAHashFromMatrix(matrix: number[][]): PerceptualHashResult {
    if (!matrix || matrix.length < 8 || !matrix[0] || matrix[0].length < 8) {
      throw new Error('Matrix must be at least 8 rows by 8 columns');
    }

    let sum = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        sum += matrix[r][c];
      }
    }
    const avg = sum / 64;

    let bitString = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        bitString += matrix[r][c] >= avg ? '1' : '0';
      }
    }

    let hex = '';
    for (let i = 0; i < bitString.length; i += 4) {
      const nibble = bitString.slice(i, i + 4);
      hex += parseInt(nibble, 2).toString(16);
    }

    return {
      hash: hex.padStart(16, '0'),
      algorithm: 'aHash',
      bitLength: 64,
    };
  }

  /**
   * Calculates bitwise Hamming distance between two hex hashes of equal length.
   */
  public static calculateHammingDistance(hexA: string, hexB: string): number {
    if (hexA.length !== hexB.length) {
      throw new Error('Hashes must have identical length for Hamming distance comparison');
    }

    let distance = 0;
    for (let i = 0; i < hexA.length; i++) {
      const numA = parseInt(hexA[i], 16);
      const numB = parseInt(hexB[i], 16);
      let xor = numA ^ numB;

      // Count set bits in 4-bit nibble
      while (xor > 0) {
        distance += xor & 1;
        xor >>= 1;
      }
    }

    return distance;
  }

  /**
   * Compares two perceptual hashes and returns similarity metrics.
   * A Hamming distance <= 10 typically indicates an exact or near duplicate image.
   */
  public static compareHashes(hexA: string, hexB: string, thresholdDistance: number = 10): SimilarityComparisonResult {
    const totalBits = hexA.length * 4;
    const hammingDistance = this.calculateHammingDistance(hexA, hexB);
    const similarityPercentage = Math.round(((totalBits - hammingDistance) / totalBits) * 1000) / 10;
    const isLikelyNearDuplicate = hammingDistance <= thresholdDistance;

    return {
      hashA: hexA,
      hashB: hexB,
      hammingDistance,
      similarityPercentage,
      isLikelyNearDuplicate,
    };
  }
}
