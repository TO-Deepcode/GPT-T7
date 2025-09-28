const { buildUrl, safeFetch } = require('../http');

const BYBIT_BASE_URL = 'https://api.bybit.com';
const BYBIT_HEADERS = {
  Origin: 'https://www.bybit.com',
  Referer: 'https://www.bybit.com',
};

async function fetchBybitKlines({ symbol, interval = '60', limit = 200, start, end }) {
  const url = buildUrl(BYBIT_BASE_URL, '/v5/market/kline', {
    category: 'linear',
    symbol,
    interval,
    limit,
    start,
    end,
  });
  const response = await safeFetch(url, { headers: BYBIT_HEADERS });
  return response?.result?.list || [];
}

async function fetchBybitOrderBook({ symbol, limit = 50 }) {
  const url = buildUrl(BYBIT_BASE_URL, '/v5/market/orderbook', {
    category: 'linear',
    symbol,
    limit,
  });
  const response = await safeFetch(url, { headers: BYBIT_HEADERS });
  return response?.result || {};
}

async function fetchBybitRecentTrades({ symbol, limit = 200 }) {
  const url = buildUrl(BYBIT_BASE_URL, '/v5/market/recent-trade', {
    category: 'linear',
    symbol,
    limit,
  });
  const response = await safeFetch(url, { headers: BYBIT_HEADERS });
  return response?.result?.list || [];
}

module.exports = {
  fetchBybitKlines,
  fetchBybitOrderBook,
  fetchBybitRecentTrades,
};
