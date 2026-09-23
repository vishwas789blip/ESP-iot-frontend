const trimTrailingSlashes = (value: string) =>
  value.replace(/\/+$/, '');

const apiUrl = trimTrailingSlashes(
  import.meta.env.VITE_API_URL ||
    'http://localhost:5000/api'
);

// Use VITE_REALTIME_SERVICE from .env
const explicitWsUrl =
  import.meta.env.VITE_REALTIME_SERVICE?.trim();

const wsUrl = trimTrailingSlashes(
  explicitWsUrl ||
    apiUrl
      .replace(/^https:/i, 'wss:')
      .replace(/^http:/i, 'ws:')
      .replace(/\/api$/, '')
);

export const env = Object.freeze({
  apiUrl,
  wsUrl,
  isProduction: import.meta.env.PROD,
  appVersion: import.meta.env.VITE_APP_VERSION || 'dev',
});