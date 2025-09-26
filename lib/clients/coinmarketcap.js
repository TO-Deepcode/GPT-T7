const { buildUrl, safeFetch } = require('../http');

const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com';

function getHeaders() {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) {
    throw new Error('CMC_API_KEY is not configured.');
  }
  return {
    'X-CMC_PRO_API_KEY': apiKey,
    Accept: 'application/json',
  };
}

async function fetchCmcQuotes({ symbols = [], convert = 'USD' }) {
  const url = buildUrl(CMC_BASE_URL, '/v1/cryptocurrency/quotes/latest', {
    symbol: symbols.join(','),
    convert,
  });
  return safeFetch(url, { headers: getHeaders() });
}

async function fetchCmcGlobalMetrics({ convert = 'USD' } = {}) {
  const url = buildUrl(CMC_BASE_URL, '/v1/global-metrics/quotes/latest', {
    convert,
  });
  return safeFetch(url, { headers: getHeaders() });
}

module.exports = {
  fetchCmcQuotes,
  fetchCmcGlobalMetrics,
};
