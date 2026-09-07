/**
 * Persistent Audio File Storage using IndexedDB
 * Allows uploaded/scanned local audio files to persist and play across app restarts
 */

const DB_NAME = 'MuAPlayAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'audio_blobs';
const blobUrlCache = new Map<string, string>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudioBlob(trackId: string, fileOrBlob: Blob): Promise<void> {
  try {
    const existing = blobUrlCache.get(trackId);
    if (existing) {
      URL.revokeObjectURL(existing);
      blobUrlCache.delete(trackId);
    }
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(fileOrBlob, trackId);
      req.onsuccess = () => {
        const url = URL.createObjectURL(fileOrBlob);
        blobUrlCache.set(trackId, url);
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save audio blob to IndexedDB:', err);
  }
}

export async function getAudioBlobUrl(trackId: string): Promise<string | null> {
  const cached = blobUrlCache.get(trackId);
  if (cached) return cached;

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);
      req.onsuccess = () => {
        if (req.result && req.result instanceof Blob) {
          const url = URL.createObjectURL(req.result);
          blobUrlCache.set(trackId, url);
          resolve(url);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to retrieve audio blob from IndexedDB:', err);
    return null;
  }
}

export async function deleteAudioBlob(trackId: string): Promise<void> {
  const cached = blobUrlCache.get(trackId);
  if (cached) {
    URL.revokeObjectURL(cached);
    blobUrlCache.delete(trackId);
  }
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete audio blob from IndexedDB:', err);
  }
}
