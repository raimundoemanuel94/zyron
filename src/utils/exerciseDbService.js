/**
 * ExerciseDB Service
 *
 * Arquitetura de cache em 3 camadas:
 *   1. Memória (Map)       — instantâneo, dura enquanto a aba está aberta
 *   2. localStorage        — persiste entre sessões, TTL de 7 dias
 *   3. API ExerciseDB      — só chamada quando as camadas 1 e 2 falharem
 *
 * Proteções extras:
 *   - pendingRequests: evita requests duplicadas para o mesmo exercício
 *   - Fallback 429 / erro de rede: retorna dado expirado do localStorage se existir
 */

// ─── Constantes ─────────────────────────────────────────────────────────────

const CACHE_KEY = 'exercise_db_cache_v2';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms
const API_BASE  = 'https://exercisedb.p.rapidapi.com';
// Suporte a Vite (VITE_) e CRA (REACT_APP_) side-by-side
const API_KEY   = import.meta.env?.VITE_EXERCISEDB_KEY
               || import.meta.env?.REACT_APP_EXERCISEDB_KEY
               || 'demo';
const API_HOST  = 'exercisedb.p.rapidapi.com';

// ─── Camada 1: Cache em memória ──────────────────────────────────────────────

/** Map<cacheKey, ExerciseData> — resetado quando a aba fecha */
const memoryCache = new Map();

/** Map<cacheKey, Promise> — bloqueia requests duplicadas em voo */
const pendingRequests = new Map();

// ─── Camada 2: localStorage (com TTL) ────────────────────────────────────────

/**
 * Carrega todo o cache do localStorage.
 * Estrutura interna: { [key]: { data: ExerciseData, timestamp: number } }
 */
const loadLocalCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveLocalCache = (cache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('[ExerciseDB] localStorage cheio ou indisponível:', e.message);
  }
};

/**
 * Lê uma entrada do localStorage respeitando TTL.
 * Retorna `{ data, expired }`:
 *   - data    → o dado salvo (ou null se não existe)
 *   - expired → true se passou do TTL (dado existe mas está velho)
 */
const readLocalEntry = (key) => {
  const store = loadLocalCache();
  const entry = store[key];
  if (!entry) return { data: null, expired: false };

  const expired = Date.now() - entry.timestamp > CACHE_TTL;
  return { data: entry.data, expired };
};

/** Grava/atualiza uma entrada no localStorage com timestamp atual */
const writeLocalEntry = (key, data) => {
  const store = loadLocalCache();
  store[key] = { data, timestamp: Date.now() };
  saveLocalCache(store);
};

// ─── Tradutor PT → EN ────────────────────────────────────────────────────────

const TRANSLATIONS = {
  // Peito + Tríceps
  'supino reto com barra':        'barbell bench press',
  'supino inclinado com haltere': 'dumbbell incline bench press',
  'crucifixo máquina':            'pec deck',
  'crossover na polia':           'cable crossover',
  'tríceps na corda':             'triceps rope pushdown',
  'tríceps francês':              'barbell lying triceps extension',
  'mergulho no banco':            'bench dips',
  // Costas + Bíceps
  'puxada frontal na máquina':    'lat pulldown',
  'remada curvada com barra':     'bent over barbell row',
  'remada máquina':               'seated cable row',
  'puxada alta na polia':         'close grip lat pulldown',
  'rosca direta com barra':       'barbell curl',
  'rosca alternada com haltere':  'hammer curl',
  'rosca concentrada':            'concentration curl',
  // Pernas
  'agachamento livre':            'barbell squat',
  'leg press 45°':                'leg press',
  'cadeira extensora':            'leg extension',
  'cadeira flexora':              'leg curl',
  'stiff':                        'romanian deadlift',
  'elevação de quadril (hip thrust)': 'hip thrust',
  'panturrilha em pé':            'standing calf raise',
  'panturrilha sentado':          'seated calf raise',
  // Ombro
  'desenvolvimento com haltere':  'dumbbell shoulder press',
  'elevação lateral com haltere': 'lateral raise',
  'elevação frontal com haltere': 'front raise',
  'crucifixo inverso na máquina': 'reverse fly',
  'encolhimento de ombro (shrug)':'shrug',
  // Bíceps + Tríceps
  'rosca barra w':                'ez bar curl',
  'rosca martelo com haltere':    'hammer curl',
  'rosca banco inclinado':        'incline dumbbell curl',
};

const translateName = (ptName) => {
  const lower = ptName.trim().toLowerCase();
  return TRANSLATIONS[lower] || lower;
};

/** Normaliza qualquer nome para chave de cache consistente */
const toCacheKey = (name) => name.trim().toLowerCase().replace(/\s+/g, '_');

// ─── Função principal ────────────────────────────────────────────────────────

/**
 * Busca dados de um exercício respeitando a hierarquia de cache:
 *   memória → localStorage (com TTL) → API → fallback expirado
 *
 * Garante que nunca haja duas requests simultâneas para o mesmo exercício.
 *
 * @param {string} exerciseName  Nome em português (ou inglês)
 * @returns {Promise<ExerciseData | null>}
 */
export const getExerciseImage = async (exerciseName) => {
  if (!exerciseName?.trim()) return null;

  const key = toCacheKey(exerciseName);

  // ── Camada 1: memória ────────────────────────────────────────────────────
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  // ── Camada 2: localStorage (TTL válido) ──────────────────────────────────
  const { data: localData, expired } = readLocalEntry(key);
  if (localData && !expired) {
    memoryCache.set(key, localData); // promove para memória
    return localData;
  }

  // ── Deduplica requests em voo ────────────────────────────────────────────
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // ── Camada 3: API ────────────────────────────────────────────────────────
  const request = (async () => {
    const searchName = translateName(exerciseName);
    console.log(`[ExerciseDB] fetch "${exerciseName}" → "${searchName}"`);

    try {
      const response = await fetch(
        `${API_BASE}/exercises/name/${encodeURIComponent(searchName)}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key':  API_KEY,
            'x-rapidapi-host': API_HOST,
          },
        }
      );

      // 429 ou qualquer erro HTTP: usa fallback expirado se disponível
      if (!response.ok) {
        console.warn(`[ExerciseDB] HTTP ${response.status} para "${searchName}"`);
        if (localData) {
          console.info(`[ExerciseDB] usando fallback expirado para "${exerciseName}"`);
          memoryCache.set(key, localData);
          return localData;
        }
        return null;
      }

      const list = await response.json();

      if (!Array.isArray(list) || list.length === 0) {
        console.warn(`[ExerciseDB] sem resultados para "${searchName}"`);
        return localData ?? null; // retorna expirado se tiver
      }

      const ex = list[0];
      const data = {
        frame0:    ex.gifUrl   || null,
        frame1:    ex.image    || null,
        name:      ex.name,
        target:    ex.target,
        equipment: ex.equipment,
        muscles:   [ex.target, ...(ex.secondaryMuscles || [])].filter(Boolean),
      };

      // Persiste nas duas camadas
      memoryCache.set(key, data);
      writeLocalEntry(key, data);
      console.log(`[ExerciseDB] cached "${exerciseName}"`);

      return data;
    } catch (err) {
      console.error(`[ExerciseDB] erro de rede para "${exerciseName}":`, err.message);
      // Fallback: retorna dado expirado se existir, para não deixar a UI vazia
      if (localData) {
        memoryCache.set(key, localData);
        return localData;
      }
      return null;
    } finally {
      pendingRequests.delete(key);
    }
  })();

  pendingRequests.set(key, request);
  return request;
};

// ─── Batch ───────────────────────────────────────────────────────────────────

/**
 * Busca vários exercícios de forma sequencial com delay entre requests
 * para não estourar o rate-limit da API.
 *
 * @param {string[]} names
 * @param {number}   delayMs  Intervalo entre requests (default 200 ms)
 */
export const getExercisesBatch = async (names, delayMs = 200) => {
  const results = {};
  for (const name of names) {
    results[name] = await getExerciseImage(name);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return results;
};

// ─── Utilitários de cache ─────────────────────────────────────────────────────

/** Remove entradas expiradas do localStorage (manutenção opcional) */
export const pruneExpiredCache = () => {
  const store  = loadLocalCache();
  const now    = Date.now();
  let removed  = 0;

  for (const key of Object.keys(store)) {
    if (now - store[key].timestamp > CACHE_TTL) {
      delete store[key];
      memoryCache.delete(key);
      removed++;
    }
  }

  saveLocalCache(store);
  if (removed > 0) console.info(`[ExerciseDB] ${removed} entradas expiradas removidas`);
  return removed;
};

/** Limpa todo o cache (memória + localStorage) */
export const clearCache = () => {
  memoryCache.clear();
  pendingRequests.clear();
  try {
    localStorage.removeItem(CACHE_KEY);
    console.info('[ExerciseDB] cache limpo');
  } catch (e) {
    console.warn('[ExerciseDB] erro ao limpar cache:', e.message);
  }
};

/** Retorna estatísticas do cache atual */
export const getCacheStats = () => {
  const store   = loadLocalCache();
  const keys    = Object.keys(store);
  const now     = Date.now();
  const valid   = keys.filter((k) => now - store[k].timestamp <= CACHE_TTL).length;
  const expired = keys.length - valid;
  const bytes   = JSON.stringify(store).length;

  return {
    total:        keys.length,
    valid,
    expired,
    memory:       memoryCache.size,
    pending:      pendingRequests.size,
    sizeKb:       (bytes / 1024).toFixed(2),
  };
};

export default {
  getExerciseImage,
  getExercisesBatch,
  pruneExpiredCache,
  clearCache,
  getCacheStats,
};