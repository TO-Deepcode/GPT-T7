const { buildUrl, safeFetch } = require('../http');

const SPOT_HOSTS = [
  'https://data.binance.com',
  'https://api.binance.com',
  'https://api1.binance.com',
  'https://api-gcp.binance.com',
];

const FUTURES_HOSTS = [
  'https://fapi.binance.com',
  'https://fapi.binancefuture.com',
  'https://futures.binance.com',
];

const BINANCE_HEADERS = {
  Origin: 'https://www.binance.com',
  Referer: 'https://www.binance.com',
};

async function fetchFromHosts(hosts, path, params) {
  let lastError;
  for (const host of hosts) {
    const url = buildUrl(host, path, params);
    try {
      return await safeFetch(url, { headers: BINANCE_HEADERS });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Unable to reach Binance hosts');
}

async function fetchBinanceFuturesKlines({ symbol, interval = '1h', limit = 200, startTime, endTime }) {
  return fetchFromHosts(FUTURES_HOSTS, '/fapi/v1/klines', {
    symbol,
    interval,
    limit,
    startTime,
    endTime,
  });
}

async function fetchBinanceFuturesOrderBook({ symbol, limit = 100 }) {
  return fetchFromHosts(FUTURES_HOSTS, '/fapi/v1/depth', {
    symbol,
    limit,
  });
}

async function fetchBinanceFuturesTrades({ symbol, limit = 200 }) {
  return fetchFromHosts(FUTURES_HOSTS, '/fapi/v1/trades', {
    symbol,
    limit,
  });
}

async function fetchBinanceSpotKlines({ symbol, interval = '1h', limit = 200, startTime, endTime }) {
  return fetchFromHosts(SPOT_HOSTS, '/api/v3/klines', {
    symbol,
    interval,
    limit,
    startTime,
    endTime,
  });
}

async function fetchBinanceSpotOrderBook({ symbol, limit = 100 }) {
  return fetchFromHosts(SPOT_HOSTS, '/api/v3/depth', {
    symbol,
    limit,
  });
}

async function fetchBinanceSpotTrades({ symbol, limit = 200 }) {
  return fetchFromHosts(SPOT_HOSTS, '/api/v3/trades', {
    symbol,
    limit,
  });
}

module.exports = {
  fetchBinanceFuturesKlines,
  fetchBinanceFuturesOrderBook,
  fetchBinanceFuturesTrades,
  fetchBinanceSpotKlines,
  fetchBinanceSpotOrderBook,
  fetchBinanceSpotTrades,
};
