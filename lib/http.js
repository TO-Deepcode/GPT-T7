const DEFAULT_TIMEOUT = 8000;

const DEFAULT_HEADERS = {
  'User-Agent': 'Atlas-T7-Service/1.0 (+https://gpt-t7.vercel.app)',
  Accept: 'application/json,text/plain,*/*',
};

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
    const response = await fetch(url, {
      headers: { ...DEFAULT_HEADERS, ...headers },
      signal: controller.signal,
    });
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
