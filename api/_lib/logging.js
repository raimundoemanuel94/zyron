export const createApiLogger = ({
  scope = 'api',
  requestId = null,
} = {}) => {
  const withContext = (payload = {}) => ({
    requestId,
    ...payload,
  });

  return {
    info(message, payload = {}) {
      console.info(`[${scope}] ${message}`, withContext(payload));
    },
    warn(message, payload = {}) {
      console.warn(`[${scope}] ${message}`, withContext(payload));
    },
    error(message, payload = {}) {
      console.error(`[${scope}] ${message}`, withContext(payload));
    },
  };
};

