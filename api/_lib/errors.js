export class ApiError extends Error {
  constructor({
    code = 'INTERNAL_ERROR',
    message = 'Unexpected server error',
    status = 500,
    details = {},
  } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const isApiError = (error) => error instanceof ApiError;

export const toApiError = (error, fallback = {}) => {
  if (isApiError(error)) return error;

  const fallbackCode = fallback.code || 'INTERNAL_ERROR';
  const fallbackMessage = fallback.message || 'Unexpected server error';
  const fallbackStatus = Number.isInteger(fallback.status) ? fallback.status : 500;
  const fallbackDetails = fallback.details || {};

  return new ApiError({
    code: fallbackCode,
    message: error?.message || fallbackMessage,
    status: fallbackStatus,
    details: {
      ...fallbackDetails,
      cause: error?.message || String(error),
    },
  });
};

