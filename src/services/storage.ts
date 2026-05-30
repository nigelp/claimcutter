import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Claim } from '../types';

interface claimcutterDB extends DBSchema {
  claims: {
    key: string;
    value: Claim;
    indexes: { 'by-status': string; 'by-updated': string };
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
}

const DB_NAME = 'claimcutter-db';
const DB_VERSION = 1;

let db: IDBPDatabase<claimcutterDB> | null = null;

async function getDB(): Promise<IDBPDatabase<claimcutterDB>> {
  if (!db) {
    db = await openDB<claimcutterDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('claims')) {
          const claimsStore = database.createObjectStore('claims', { keyPath: 'id' });
          claimsStore.createIndex('by-status', 'status');
          claimsStore.createIndex('by-updated', 'updatedAt');
        }
        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return db;
}

export async function saveClaim(claim: Claim): Promise<void> {
  const database = await getDB();
  await database.put('claims', claim);
  
  if (window.electronAPI) {
    await window.electronAPI.saveData(`claim-${claim.id}`, claim);
  }
}

export async function getClaim(id: string): Promise<Claim | undefined> {
  const database = await getDB();
  return database.get('claims', id);
}

export async function getAllClaims(): Promise<Claim[]> {
  const database = await getDB();
  return database.getAllFromIndex('claims', 'by-updated');
}

export async function deleteClaim(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('claims', id);
  
  if (window.electronAPI) {
    await window.electronAPI.deleteData(`claim-${id}`);
  }
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  const database = await getDB();
  await database.put('settings', { key, value });
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const database = await getDB();
  const result = await database.get('settings', key);
  return result?.value as T;
}

export async function exportAllData(): Promise<Claim[]> {
  return getAllClaims();
}

export async function importClaims(claims: Claim[]): Promise<void> {
  const database = await getDB();
  const tx = database.transaction('claims', 'readwrite');
  for (const claim of claims) {
    await tx.store.put(claim);
  }
  await tx.done;
}