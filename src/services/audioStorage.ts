/**
 * Persistent Audio File Storage using IndexedDB
 * Allows uploaded/scanned local audio files to persist and play across app restarts
 */

const DB_NAME = 'MuAPlayAudioDB';
const DB_VERSION = 3;
const STORE_NAME = 'audio_blobs';
const WAVEFORM_STORE = 'waveform_cache';
const COVER_STORE = 'cover_cache';
const blobUrlCache = new Map<string, string>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(WAVEFORM_STORE)) {
        db.createObjectStore(WAVEFORM_STORE);
      }
      if (!db.objectStoreNames.contains(COVER_STORE)) {
        db.createObjectStore(COVER_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCoverCache(trackId: string, coverDataUrl: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(COVER_STORE, 'readwrite');
      const store = tx.objectStore(COVER_STORE);
      const req = store.put(coverDataUrl, trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save cover cache:', err);
  }
}

export async function getCoverCache(trackId: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(COVER_STORE, 'readonly');
      const store = tx.objectStore(COVER_STORE);
      const req = store.get(trackId);
      req.onsuccess = () => resolve(typeof req.result === 'string' ? req.result : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
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

export async function getAudioBlob(trackId: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);
      req.onsuccess = () => {
        if (req.result && req.result instanceof Blob) {
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to retrieve raw audio blob:', err);
    return null;
  }
}

export async function saveWaveformCache(trackId: string, peaks: number[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(WAVEFORM_STORE, 'readwrite');
      const store = tx.objectStore(WAVEFORM_STORE);
      const req = store.put(peaks, trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save waveform cache:', err);
  }
}

export async function getWaveformCache(trackId: string): Promise<number[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(WAVEFORM_STORE, 'readonly');
      const store = tx.objectStore(WAVEFORM_STORE);
      const req = store.get(trackId);
      req.onsuccess = () => {
        if (Array.isArray(req.result)) {
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to get waveform cache:', err);
    return null;
  }
}

export async function deleteWaveformCache(trackId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(WAVEFORM_STORE, 'readwrite');
      const store = tx.objectStore(WAVEFORM_STORE);
      const req = store.delete(trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete waveform cache:', err);
  }
}

export async function deleteAudioBlob(trackId: string): Promise<void> {
  const cached = blobUrlCache.get(trackId);
  if (cached) {
    URL.revokeObjectURL(cached);
    blobUrlCache.delete(trackId);
  }
  await deleteWaveformCache(trackId);
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

export async function getPlayableTrackUrl(track: { id: string; url?: string; filePath?: string }): Promise<string | null> {
  const storedUrl = await getAudioBlobUrl(track.id);
  if (storedUrl) return storedUrl;
  if (track.url) return track.url;
  return null;
}


