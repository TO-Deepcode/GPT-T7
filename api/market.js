const {
  fetchBybitKlines,
  fetchBybitOrderBook,
  fetchBybitRecentTrades,
} = require('../lib/clients/bybit');
const {
  fetchBinanceFuturesKlines,
  fetchBinanceFuturesOrderBook,
  fetchBinanceFuturesTrades,
} = require('../lib/clients/binance');
const { fetchCmcQuotes } = require('../lib/clients/coinmarketcap');

const BYBIT_INTERVAL_MAP = {
  '1m': '1',
  '3m': '3',
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '1h': '60',
  '2h': '120',
  '4h': '240',
  '6h': '360',
  '12h': '720',
  '1d': 'D',
  '1D': 'D',
  '1day': 'D'
};

function normalizeBybitInterval(interval) {
  if (!interval) return '60';
  const key = String(interval).trim();
  const lower = key.toLowerCase();
  if (BYBIT_INTERVAL_MAP[key]) return BYBIT_INTERVAL_MAP[key];
  if (BYBIT_INTERVAL_MAP[lower]) return BYBIT_INTERVAL_MAP[lower];
  if (/^\d+$/.test(key)) return key;
  return '60';
}

async function settle(promise) {
  try {
    const data = await promise;
    return { data };
  } catch (error) {
    return { error: error.message || 'Unknown error' };
  }
}

module.exports = async function handler(req, res) {
  const { symbol, interval = '1h', limit = 200, convert = 'USD' } = req.query;

  if (!symbol) {
    res.status(400).json({ error: 'symbol query param is required' });
    return;
  }

  const klinesLimit = Number(limit) > 0 ? Number(limit) : 200;

  const bybitInterval = normalizeBybitInterval(interval);

  const [bybitKlines, bybitOrderBook, bybitTrades, binanceKlines, binanceOrderBook, binanceTrades, cmcQuotes] = await Promise.all([
    settle(fetchBybitKlines({ symbol, interval: bybitInterval, limit: klinesLimit })),
    settle(fetchBybitOrderBook({ symbol, limit: 50 })),
    settle(fetchBybitRecentTrades({ symbol, limit: Math.min(klinesLimit, 200) })),
    settle(fetchBinanceFuturesKlines({ symbol, interval, limit: klinesLimit })),
    settle(fetchBinanceFuturesOrderBook({ symbol, limit: 100 })),
    settle(fetchBinanceFuturesTrades({ symbol, limit: Math.min(klinesLimit, 1000) })),
    settle(fetchCmcQuotes({ symbols: [symbol.replace(/USDT$/i, '')], convert })),
  ]);

  const errors = [];
  const payload = {
    symbol,
    interval,
    convert,
    bybit: {
      klines: bybitKlines.data || null,
      orderbook: bybitOrderBook.data || null,
      trades: bybitTrades.data || null,
    },
    binance: {
      klines: binanceKlines.data || null,
      orderbook: binanceOrderBook.data || null,
      trades: binanceTrades.data || null,
    },
    coinmarketcap: cmcQuotes.data || null,
  };

  for (const [label, result] of [
    ['bybit.klines', bybitKlines],
    ['bybit.orderbook', bybitOrderBook],
    ['bybit.trades', bybitTrades],
    ['binance.klines', binanceKlines],
    ['binance.orderbook', binanceOrderBook],
    ['binance.trades', binanceTrades],
    ['coinmarketcap.quotes', cmcQuotes],
  ]) {
    if (result.error) {
      errors.push({ source: label, message: result.error });
    }
  }

  res.setHeader('cache-control', 's-maxage=2, stale-while-revalidate=8');
  res.status(errors.length ? 207 : 200).json({
    status: errors.length ? 'partial' : 'ok',
    errors,
    data: payload,
  });
};
