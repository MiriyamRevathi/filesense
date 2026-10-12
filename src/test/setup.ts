import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// Ensure crypto.subtle is present in jsdom if missing
if (!globalThis.crypto?.subtle) {
  const { webcrypto } = await import('node:crypto');
  // @ts-expect-error polyfill crypto in test environment
  globalThis.crypto = webcrypto;
}
