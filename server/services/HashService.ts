import crypto from 'crypto';
import fs from 'fs';

export class HashService {
  /**
   * Computes SHA-256 hash from a Buffer or string.
   */
  public static hashBuffer(buffer: Buffer | Uint8Array | string, algorithm: string = 'sha256'): string {
    const hash = crypto.createHash(algorithm);
    hash.update(buffer);
    return hash.digest('hex');
  }

  /**
   * Computes streaming cryptographic hash of a file on disk.
   */
  public static async hashFileStream(filePath: string, algorithm: string = 'sha256'): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`File not found: ${filePath}`));
      }

      const hash = crypto.createHash(algorithm);
      const stream = fs.createReadStream(filePath);

      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', err => reject(err));
    });
  }

  /**
   * Two-phase fast hash for large files:
   * First computes a quick 128KB hash (head + tail) to rapidly exclude non-matches,
   * then computes full SHA-256 if potential duplicate candidates exist.
   */
  public static async quickPartialHash(filePath: string): Promise<string> {
    const stats = fs.statSync(filePath);
    const size = stats.size;
    const CHUNK_SIZE = 64 * 1024; // 64KB

    if (size <= CHUNK_SIZE * 2) {
      return this.hashFileStream(filePath);
    }

    const fd = fs.openSync(filePath, 'r');
    try {
      const headBuffer = Buffer.alloc(CHUNK_SIZE);
      const tailBuffer = Buffer.alloc(CHUNK_SIZE);

      fs.readSync(fd, headBuffer, 0, CHUNK_SIZE, 0);
      fs.readSync(fd, tailBuffer, 0, CHUNK_SIZE, Math.max(0, size - CHUNK_SIZE));

      const hash = crypto.createHash('sha256');
      hash.update(headBuffer);
      hash.update(tailBuffer);
      hash.update(Buffer.from(size.toString()));
      return hash.digest('hex');
    } finally {
      fs.closeSync(fd);
    }
  }

  /**
   * Validates if a hex string is a valid SHA-256 digest.
   */
  public static isValidSha256(hash: string): boolean {
    return typeof hash === 'string' && /^[a-f0-9]{64}$/i.test(hash);
  }
}
