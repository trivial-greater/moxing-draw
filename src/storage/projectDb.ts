import type { ProviderConfigMap, SavedProject } from '../types/studio';
import { getDefaultProviderConfigs } from '../engines/aiProviders';

const DB_NAME = 'moxing_studio_v3_db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const LS_PROVIDERS_KEY = 'moxing_v3_provider_configs';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const store = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

export async function saveProjectToDb(project: SavedProject): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    tx.objectStore(STORE_PROJECTS).put(project);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Save project failed'));
  });
}

export async function listProjectsFromDb(limit = 24): Promise<SavedProject[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const req = tx.objectStore(STORE_PROJECTS).getAll();
    req.onsuccess = () => {
      const rows = (req.result as SavedProject[]) || [];
      rows.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(rows.slice(0, limit));
    };
    req.onerror = () => reject(req.error ?? new Error('List projects failed'));
  });
}

export async function deleteProjectFromDb(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    tx.objectStore(STORE_PROJECTS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Delete project failed'));
  });
}

export async function clearAllProjectsFromDb(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    tx.objectStore(STORE_PROJECTS).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Clear projects failed'));
  });
}

export function loadProviderConfigs(): ProviderConfigMap {
  const defaults = getDefaultProviderConfigs();
  try {
    const raw = localStorage.getItem(LS_PROVIDERS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<ProviderConfigMap>;
    return {
      siliconflow: { ...defaults.siliconflow, ...parsed.siliconflow },
      pollinations: { ...defaults.pollinations, ...parsed.pollinations },
      gemini: { ...defaults.gemini, ...parsed.gemini },
      huggingface: { ...defaults.huggingface, ...parsed.huggingface },
      openai: { ...defaults.openai, ...parsed.openai },
    };
  } catch {
    return defaults;
  }
}

export function saveProviderConfigs(configs: ProviderConfigMap): void {
  try {
    localStorage.setItem(LS_PROVIDERS_KEY, JSON.stringify(configs));
  } catch {
    // Ignore quota errors
  }
}
