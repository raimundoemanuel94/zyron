/**
 * animationConfig.js
 *
 * Para performance e estabilidade mobile:
 * - mídia remota de exercícios fica DESLIGADA por padrão.
 * - para reativar, definir VITE_USE_REMOTE_EXERCISE_MEDIA=true.
 */

const USE_REMOTE_EXERCISE_MEDIA = import.meta.env.VITE_USE_REMOTE_EXERCISE_MEDIA === 'true';
const RAW_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
const PAGES_BASE = 'https://yuhonas.github.io/free-exercise-db/exercises';
const JSDELIVR_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db/exercises';

/**
 * Retorna a URL de um frame de exercício pelo ID do repositório.
 * @param {string} exerciseDbId  ex: 'Barbell_Bench_Press'
 * @param {number} frameNumber   0 ou 1
 */
export const getAnimationUrl = (exerciseDbId, frameNumber = 0) =>
  USE_REMOTE_EXERCISE_MEDIA ? `${RAW_BASE}/${exerciseDbId}/${frameNumber}.jpg` : null;

export const getAnimationFallbackUrl = (exerciseDbId, frameNumber = 0) =>
  USE_REMOTE_EXERCISE_MEDIA ? `${PAGES_BASE}/${exerciseDbId}/${frameNumber}.jpg` : null;

export const getAnimationBackupUrl = (exerciseDbId, frameNumber = 0) =>
  USE_REMOTE_EXERCISE_MEDIA ? `${JSDELIVR_BASE}/${exerciseDbId}/images/${frameNumber}.jpg` : null;

export const BASE_URL = RAW_BASE;
export const REMOTE_EXERCISE_MEDIA_ENABLED = USE_REMOTE_EXERCISE_MEDIA;

// Mantido para compatibilidade com código que importe IMAGE_LOAD_TIMEOUT
export const IMAGE_LOAD_TIMEOUT  = 8000;
export const TOTAL_LOAD_TIMEOUT  = 15000;

export default {
  BASE_URL,
  REMOTE_EXERCISE_MEDIA_ENABLED,
  getAnimationUrl,
  getAnimationFallbackUrl,
  getAnimationBackupUrl,
  IMAGE_LOAD_TIMEOUT,
  TOTAL_LOAD_TIMEOUT,
};
