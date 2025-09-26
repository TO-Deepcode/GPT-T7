const {
  fetchBinanceFuturesKlines,
  fetchBinanceFuturesOrderBook,
  fetchBinanceFuturesTrades,
  fetchBinanceSpotKlines,
  fetchBinanceSpotOrderBook,
  fetchBinanceSpotTrades,
} = require('../lib/clients/binance');

const FUTURES = 'futures';
const SPOT = 'spot';

function resolveMarketClient(market = FUTURES) {
  const normalized = market.toLowerCase();
  if (normalized === SPOT) {
    return {
      klines: fetchBinanceSpotKlines,
      orderbook: fetchBinanceSpotOrderBook,
      trades: fetchBinanceSpotTrades,
    };
  }
  return {
    klines: fetchBinanceFuturesKlines,
    orderbook: fetchBinanceFuturesOrderBook,
    trades: fetchBinanceFuturesTrades,
  };
}

module.exports = async function handler(req, res) {
  try {
    const { symbol, market = FUTURES, metric = 'klines', interval = '1h', limit, startTime, endTime } = req.query;

    if (!symbol) {
      res.status(400).json({ error: 'symbol query param is required' });
      return;
    }

    const client = resolveMarketClient(market);
    const fetcher = client[metric];

    if (!fetcher) {
      res.status(400).json({ error: `Unsupported metric: ${metric}` });
      return;
    }

    const data = await fetcher({ symbol, interval, limit, startTime, endTime });

    res.setHeader('cache-control', 's-maxage=2, stale-while-revalidate=8');
    res.status(200).json({ source: 'binance', market: market.toLowerCase(), metric, symbol, data });
  } catch (error) {
    console.error('[api/binance] error', error);
    res.status(500).json({ error: error.message || 'Unexpected error' });
  }
};
