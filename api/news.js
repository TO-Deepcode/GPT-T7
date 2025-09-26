const {
  SOURCES,
  fetchSourceNews,
  fetchNewsAggregate,
} = require('../lib/news');

function parseSources(sourceParam) {
  if (!sourceParam) return undefined;
  return sourceParam
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item);
}

function parseNumber(value, fallback) {
  if (!value) return fallback;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

module.exports = async function handler(req, res) {
  try {
    const { source, mode = 'aggregate', limitPerSource, maxItems } = req.query;
    const sources = parseSources(source);

    const limit = parseNumber(limitPerSource, 20);
    const max = parseNumber(maxItems, 100);

    if (mode === 'single') {
      if (!sources || sources.length !== 1) {
        res
          .status(400)
          .json({ error: 'mode=single için tek bir source parametresi gereklidir (örn. source=coindesk)' });
        return;
      }
      const sourceId = sources[0];
      if (!SOURCES[sourceId]) {
        res.status(404).json({ error: `Desteklenmeyen kaynak: ${sourceId}` });
        return;
      }
      const { items } = await fetchSourceNews(sourceId, { limit });
      res.setHeader('cache-control', 's-maxage=60, stale-while-revalidate=180');
      res.status(200).json({
        status: 'ok',
        source: SOURCES[sourceId],
        total: items.length,
        items,
      });
      return;
    }

    const { items, errors } = await fetchNewsAggregate({
      sources,
      limitPerSource: limit,
      maxItems: max,
    });

    res.setHeader('cache-control', 's-maxage=60, stale-while-revalidate=180');
    res.status(errors.length ? 207 : 200).json({
      status: errors.length ? 'partial' : 'ok',
      requestedSources: sources || Object.keys(SOURCES),
      availableSources: SOURCES,
      total: items.length,
      items,
      errors,
    });
  } catch (error) {
    console.error('[api/news] error', error);
    res.status(500).json({ error: error.message || 'Unexpected error' });
  }
};
