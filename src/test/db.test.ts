import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveFileRecord,
  saveFileRecordsBatch,
  getAllFileRecords,
  getFileRecordById,
  updateFileRecord,
  deleteFileRecord,
  deleteFileRecordsBatch,
  clearAllFileRecords,
  getPreference,
  setPreference,
} from '../services/db';
import { StoredFileRecord } from '../types';

describe('IndexedDB Repository (db.ts)', () => {
  beforeEach(async () => {
    await clearAllFileRecords();
  });

  const createDummyRecord = (id: string, name: string): StoredFileRecord => ({
    id,
    name,
    size: 1024,
    type: 'text/plain',
    lastModified: Date.now(),
    dateAdded: Date.now(),
    blob: new Blob(['persisted data in indexeddb'], { type: 'text/plain' }),
    hashStatus: 'unhashed',
    category: 'documents',
  });

  it('persists and retrieves a single file record', async () => {
    const record = createDummyRecord('rec_1', 'contract.pdf');
    await saveFileRecord(record);

    const fetched = await getFileRecordById('rec_1');
    expect(fetched).toBeDefined();
    expect(fetched?.name).toBe('contract.pdf');
    expect(fetched?.size).toBe(1024);
  });

  it('handles batch file saves and retrieves all files', async () => {
    const records = [
      createDummyRecord('batch_1', 'f1.txt'),
      createDummyRecord('batch_2', 'f2.txt'),
      createDummyRecord('batch_3', 'f3.txt'),
    ];

    await saveFileRecordsBatch(records);
    const all = await getAllFileRecords();
    expect(all.length).toBe(3);
    expect(all.map(f => f.id)).toContain('batch_1');
    expect(all.map(f => f.id)).toContain('batch_2');
    expect(all.map(f => f.id)).toContain('batch_3');
  });

  it('updates an existing file record with computed hash', async () => {
    const record = createDummyRecord('up_1', 'invoice.pdf');
    await saveFileRecord(record);

    record.hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    record.hashStatus = 'hashed';
    await updateFileRecord(record);

    const fetched = await getFileRecordById('up_1');
    expect(fetched?.hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(fetched?.hashStatus).toBe('hashed');
  });

  it('deletes a file record by ID', async () => {
    const record = createDummyRecord('del_1', 'temp.txt');
    await saveFileRecord(record);

    await deleteFileRecord('del_1');
    const fetched = await getFileRecordById('del_1');
    expect(fetched).toBeUndefined();
  });

  it('batch deletes multiple files', async () => {
    const records = [
      createDummyRecord('del_m1', 'm1.txt'),
      createDummyRecord('del_m2', 'm2.txt'),
      createDummyRecord('del_keep', 'keep.txt'),
    ];
    await saveFileRecordsBatch(records);

    await deleteFileRecordsBatch(['del_m1', 'del_m2']);
    const remaining = await getAllFileRecords();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('del_keep');
  });

  it('persists and reads user preferences', async () => {
    await setPreference('pref_view_mode', 'list');
    const pref = await getPreference('pref_view_mode', 'grid');
    expect(pref).toBe('list');

    const defaultFallback = await getPreference('non_existent_key', 'fallback_val');
    expect(defaultFallback).toBe('fallback_val');
  });

  it('clears all file records completely', async () => {
    await saveFileRecord(createDummyRecord('c1', 'c1.txt'));
    await saveFileRecord(createDummyRecord('c2', 'c2.txt'));

    await clearAllFileRecords();
    const all = await getAllFileRecords();
    expect(all.length).toBe(0);
  });
});
