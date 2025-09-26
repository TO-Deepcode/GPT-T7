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

  const [bybitKlines, bybitOrderBook, bybitTrades, binanceKlines, binanceOrderBook, binanceTrades, cmcQuotes] = await Promise.all([
    settle(fetchBybitKlines({ symbol, interval, limit: klinesLimit })),
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
