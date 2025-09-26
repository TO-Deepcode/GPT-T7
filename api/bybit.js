const {
  fetchBybitKlines,
  fetchBybitOrderBook,
  fetchBybitRecentTrades,
} = require('../lib/clients/bybit');

module.exports = async function handler(req, res) {
  try {
    const { metric = 'klines', symbol, interval = '60', limit, start, end } = req.query;

    if (!symbol) {
      res.status(400).json({ error: 'symbol query param is required' });
      return;
    }

    let data;

    switch (metric) {
      case 'klines':
        data = await fetchBybitKlines({ symbol, interval, limit, start, end });
        break;
      case 'orderbook':
        data = await fetchBybitOrderBook({ symbol, limit });
        break;
      case 'trades':
        data = await fetchBybitRecentTrades({ symbol, limit });
        break;
      default:
        res.status(400).json({ error: `Unsupported metric: ${metric}` });
        return;
    }

    res.setHeader('cache-control', 's-maxage=2, stale-while-revalidate=8');
    res.status(200).json({ source: 'bybit', metric, symbol, data });
  } catch (error) {
    console.error('[api/bybit] error', error);
    res.status(500).json({ error: error.message || 'Unexpected error' });
  }
};
