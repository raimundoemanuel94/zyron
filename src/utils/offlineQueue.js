/**
 * ZYRON Offline Queue — IndexedDB
 *
 * Quando uma escrita no Supabase falha por falta de conexão (registrar carga,
 * fechar treino, salvar água/proteína), a ação é guardada aqui. Assim que a
 * internet volta, o app tenta reenviar tudo sozinho — sem o usuário perder
 * o que fez no treino.
 *
 * Padrão recomendado para PWAs: enfileirar primeiro em storage local
 * persistente, e tratar o reenvio como otimização (não como requisito).
 */

const DB_NAME = 'zyron-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'pending-actions';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB não suportado neste navegador'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('createdAt', 'createdAt');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/**
 * Adiciona uma ação à fila offline.
 * @param {string} type - identificador da ação, ex: 'save_exercise_load', 'finish_workout'
 * @param {object} payload - dados necessários para repetir a ação depois
 */
export async function enqueueOfflineAction(type, payload) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const entry = { type, payload, createdAt: Date.now(), attempts: 0 };
      const request = store.add(entry);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[OfflineQueue] Falha ao enfileirar ação:', err);
    return null;
  }
}

/** Retorna todas as ações pendentes na fila. */
export async function getPendingActions() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[OfflineQueue] Falha ao ler fila:', err);
    return [];
  }
}

/** Remove uma ação da fila depois de ser processada com sucesso. */
export async function removeOfflineAction(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[OfflineQueue] Falha ao remover ação:', err);
    return false;
  }
}

/** Conta quantas ações estão pendentes — útil para mostrar badge na UI. */
export async function countPendingActions() {
  const actions = await getPendingActions();
  return actions.length;
}

/**
 * Processa a fila inteira, chamando `handler` para cada ação.
 * `handler` deve ser uma função async que recebe { type, payload } e
 * lança erro se a ação ainda não puder ser concluída (sem internet, etc).
 * Ações com mais de 5 tentativas falhas são descartadas para não acumular lixo.
 */
export async function processOfflineQueue(handler) {
  const actions = await getPendingActions();
  if (actions.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      await handler(action);
      await removeOfflineAction(action.id);
      processed += 1;
    } catch (err) {
      failed += 1;
      if (action.attempts >= 5) {
        console.warn('[OfflineQueue] Descartando ação após 5 tentativas:', action);
        await removeOfflineAction(action.id);
      }
    }
  }

  return { processed, failed };
}
