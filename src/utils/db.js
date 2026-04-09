const DB_NAME = 'ZYRON_OFFLINE_DB';
const DB_VERSION = 3; // Bumped for richer sync queue metadata
const STORE_NAME = 'PENDING_PHOTOS';
const SYNC_STORE_NAME = 'PENDING_SYNC';
/**
 * ZYRON IndexedDB Utility
 * Handles large payloads (like base64 images) that exceed LocalStorage limits.
 */
class ZyronDB {
  constructor() {
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
          db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject('IndexedDB Error: ' + event.target.error);
      };
    });
  }

  async savePhoto(id, base64Data) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ id, data: base64Data, timestamp: Date.now() });

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getPhoto(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePhoto(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // --- NEW: Sync Queue Methods ---

  async addToSyncQueue(item) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      
      const payload = {
        ...item,
        id: item.id || crypto.randomUUID(),
        timestamp: item.timestamp || Date.now(),
        retryCount: item.retryCount || 0,
        status: item.status || 'pending'
      };

      const request = store.put(payload);

      request.onsuccess = () => resolve(payload);
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue() {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_STORE_NAME, 'readonly');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result || [];
        // Sort by timestamp asc (oldest first)
        items.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncRetry(id, retryCount, status = 'pending') {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result;
        if (item) {
          item.retryCount = retryCount;
          item.status = status;
          item.lastAttemptAt = Date.now();
          item.nextRetryAt = Date.now() + Math.min(15 * 60 * 1000, Math.max(30 * 1000, (2 ** retryCount) * 1000));
          const putReq = store.put(item);
          putReq.onsuccess = () => resolve(true);
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve(false);
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async updateSyncItem(id, updates = {}) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SYNC_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(SYNC_STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result;
        if (!item) {
          resolve(false);
          return;
        }

        const nextItem = {
          ...item,
          ...updates,
          updatedAt: Date.now(),
        };

        const putReq = store.put(nextItem);
        putReq.onsuccess = () => resolve(nextItem);
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }
}

export const db = new ZyronDB();
