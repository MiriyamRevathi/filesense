import { openDB, IDBPDatabase } from 'idb';
import { StoredFileRecord } from '../types';

const DB_NAME = 'filesense_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export async function getDatabase(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' });
          fileStore.createIndex('by_name', 'name');
          fileStore.createIndex('by_size', 'size');
          fileStore.createIndex('by_category', 'category');
          fileStore.createIndex('by_hash', 'hash');
          fileStore.createIndex('by_dateAdded', 'dateAdded');
        }

        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      },
      blocked() {
        console.warn('Database upgrade blocked. Please close other open tabs.');
      },
      blocking() {
        console.warn('Database connection is blocking a new version upgrade.');
      },
      terminated() {
        dbPromise = null;
      },
    });
  }
  return dbPromise;
}

export async function saveFileRecord(record: StoredFileRecord): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction('files', 'readwrite');
  await tx.store.put(record);
  await tx.done;
}

export async function saveFileRecordsBatch(records: StoredFileRecord[]): Promise<void> {
  if (records.length === 0) return;
  const db = await getDatabase();
  const tx = db.transaction('files', 'readwrite');
  for (const record of records) {
    tx.store.put(record);
  }
  await tx.done;
}

export async function getAllFileRecords(): Promise<StoredFileRecord[]> {
  const db = await getDatabase();
  return db.getAll('files');
}

export async function getFileRecordById(id: string): Promise<StoredFileRecord | undefined> {
  const db = await getDatabase();
  return db.get('files', id);
}

export async function deleteFileRecord(id: string): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction('files', 'readwrite');
  await tx.store.delete(id);
  await tx.done;
}

export async function deleteFileRecordsBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const tx = db.transaction('files', 'readwrite');
  for (const id of ids) {
    tx.store.delete(id);
  }
  await tx.done;
}

export async function updateFileRecord(record: StoredFileRecord): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction('files', 'readwrite');
  await tx.store.put(record);
  await tx.done;
}

export async function clearAllFileRecords(): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction('files', 'readwrite');
  await tx.store.clear();
  await tx.done;
}

export async function getPreference<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDatabase();
    const result = await db.get('preferences', key);
    return result ? (result.value as T) : defaultValue;
  } catch (error) {
    console.warn(`Failed to read preference ${key}:`, error);
    return defaultValue;
  }
}

export async function setPreference<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDatabase();
    const tx = db.transaction('preferences', 'readwrite');
    await tx.store.put({ key, value });
    await tx.done;
  } catch (error) {
    console.warn(`Failed to store preference ${key}:`, error);
  }
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  db.close();
  dbPromise = null;
  const indexedDBObj = window.indexedDB || globalThis.indexedDB;
  if (indexedDBObj) {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDBObj.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
  }
}
