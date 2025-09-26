const { buildUrl, safeFetch } = require('../http');

const BINANCE_FUTURES_BASE_URL = 'https://fapi.binance.com';
const BINANCE_SPOT_BASE_URL = 'https://api.binance.com';

async function fetchBinanceFuturesKlines({ symbol, interval = '1h', limit = 200, startTime, endTime }) {
  const url = buildUrl(BINANCE_FUTURES_BASE_URL, '/fapi/v1/klines', {
    symbol,
    interval,
    limit,
    startTime,
    endTime,
  });
  return safeFetch(url);
}

async function fetchBinanceFuturesOrderBook({ symbol, limit = 100 }) {
  const url = buildUrl(BINANCE_FUTURES_BASE_URL, '/fapi/v1/depth', {
    symbol,
    limit,
  });
  return safeFetch(url);
}

async function fetchBinanceFuturesTrades({ symbol, limit = 200 }) {
  const url = buildUrl(BINANCE_FUTURES_BASE_URL, '/fapi/v1/trades', {
    symbol,
    limit,
  });
  return safeFetch(url);
}

async function fetchBinanceSpotKlines({ symbol, interval = '1h', limit = 200, startTime, endTime }) {
  const url = buildUrl(BINANCE_SPOT_BASE_URL, '/api/v3/klines', {
    symbol,
    interval,
    limit,
    startTime,
    endTime,
  });
  return safeFetch(url);
}

async function fetchBinanceSpotOrderBook({ symbol, limit = 100 }) {
  const url = buildUrl(BINANCE_SPOT_BASE_URL, '/api/v3/depth', {
    symbol,
    limit,
  });
  return safeFetch(url);
}

async function fetchBinanceSpotTrades({ symbol, limit = 200 }) {
  const url = buildUrl(BINANCE_SPOT_BASE_URL, '/api/v3/trades', {
    symbol,
    limit,
  });
  return safeFetch(url);
}

module.exports = {
  fetchBinanceFuturesKlines,
  fetchBinanceFuturesOrderBook,
  fetchBinanceFuturesTrades,
  fetchBinanceSpotKlines,
  fetchBinanceSpotOrderBook,
  fetchBinanceSpotTrades,
};
