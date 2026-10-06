export interface Track {
  id: string;
  name: string;
  blob: Blob;
  size: number;
  addedAt: number;
}

const DB_NAME = 'PowerDanceDB';
const DB_VERSION = 2; // Versionamento incrementado para corrigir a falta do store
const STORE_NAME = 'tracks';

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'name' });
        store.createIndex('addedAt', 'addedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveTrackToDB = async (track: Track): Promise<void> => {
  const db = await openDB();
  await cleanOldAndExcessTracks(db);
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(track);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const saveTracksToDB = async (tracks: Track[]): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    tracks.forEach((track) => store.put(track));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getTracksFromDB = async (): Promise<Track[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erro ao buscar faixas do IndexedDB:', error);
    return [];
  }
};

const cleanOldAndExcessTracks = async (db: IDBDatabase): Promise<void> => {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      let tracks: Track[] = request.result || [];
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;

      tracks.forEach((track) => {
        if (track.addedAt && track.addedAt < twoDaysAgo) {
          store.delete(track.name);
        }
      });

      tracks = tracks.filter((t) => t.addedAt && t.addedAt >= twoDaysAgo);
      if (tracks.length >= 600) {
        tracks.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
        const toRemoveCount = tracks.length - 599;
        for (let i = 0; i < toRemoveCount; i++) {
          store.delete(tracks[i].name);
        }
      }
      resolve();
    };

    request.onerror = () => resolve();
  });
};

// FUNÇÃO PARA LIMPAR TODA A PLAYLIST NO INDEXEDDB
export const clearTracksFromDB = async (): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};