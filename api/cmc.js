const { fetchCmcQuotes, fetchCmcGlobalMetrics } = require('../lib/clients/coinmarketcap');

module.exports = async function handler(req, res) {
  try {
    const { metric = 'quotes', symbols = '', convert = 'USD' } = req.query;

    let data;

    switch (metric) {
      case 'quotes': {
        const symbolList = symbols
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        if (symbolList.length === 0) {
          res.status(400).json({ error: 'symbols query param is required for quotes metric' });
          return;
        }
        data = await fetchCmcQuotes({ symbols: symbolList, convert });
        break;
      }
      case 'global-metrics':
        data = await fetchCmcGlobalMetrics({ convert });
        break;
      default:
        res.status(400).json({ error: `Unsupported metric: ${metric}` });
        return;
    }

    res.setHeader('cache-control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json({ source: 'coinmarketcap', metric, convert, data });
  } catch (error) {
    console.error('[api/cmc] error', error);
    res.status(500).json({ error: error.message || 'Unexpected error' });
  }
};
