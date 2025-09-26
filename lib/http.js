const DEFAULT_TIMEOUT = 8000;

class HttpError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(base, path, params = {}) {
  const url = new URL(path, base);
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

async function safeFetch(url, { headers = {}, timeout = DEFAULT_TIMEOUT } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) {
      const payload = await response.text().catch(() => undefined);
      throw new HttpError(`Request failed with status ${response.status}`, response.status, payload);
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  HttpError,
  buildUrl,
  safeFetch,
};
