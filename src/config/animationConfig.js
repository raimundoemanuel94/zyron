/**
 * animationConfig.js
 *
 * Fonte única de imagens: jsDelivr CDN (yuhonas/free-exercise-db)
 *
 * ✅ Gratuito, sem rate limit, sem autenticação
 * ✅ Path correto: /exercises/{id}/images/{frame}.jpg
 *
 * REMOVIDO:
 *   - raw.githubusercontent.com  → estrutura mudou, gerava 404
 *   - corsproxy.io               → desnecessário, jsDelivr não tem CORS
 *   - tryLoadImage com fetch      → desnecessário, <img> carrega direto
 */

// jsDelivr CDN — gratuito, sem rate limit, sem CORS, path correto com /images/
const BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db/exercises';

/**
 * Retorna a URL de um frame de exercício pelo ID do repositório.
 * @param {string} exerciseDbId  ex: 'Barbell_Bench_Press'
 * @param {number} frameNumber   0 ou 1
 */
export const getAnimationUrl = (exerciseDbId, frameNumber = 0) =>
  `${BASE}/${exerciseDbId}/images/${frameNumber}.jpg`;

export const BASE_URL = BASE;

// Mantido para compatibilidade com código que importe IMAGE_LOAD_TIMEOUT
export const IMAGE_LOAD_TIMEOUT  = 8000;
export const TOTAL_LOAD_TIMEOUT  = 15000;

export default {
  BASE_URL,
  getAnimationUrl,
  IMAGE_LOAD_TIMEOUT,
  TOTAL_LOAD_TIMEOUT,
};