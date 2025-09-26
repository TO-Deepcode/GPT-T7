const { XMLParser } = require('fast-xml-parser');
const { safeFetch } = require('../http');
const { SOURCES } = require('./sources');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: 'text',
  trimValues: true,
  ignoreDeclaration: true,
});

function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toIsoString(dateLike) {
  if (!dateLike) return null;
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function resolveLink(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') {
    return entry;
  }
  if (Array.isArray(entry)) {
    const href = entry.find((item) => item.href)?.href;
    if (href) return href;
    const first = entry[0];
    if (first?.href) return first.href;
    if (first?.text) return first.text;
  }
  if (entry.href) return entry.href;
  if (entry.url) return entry.url;
  if (entry.text) return entry.text;
  return null;
}

function normalizeRssItems(sourceMeta, parsed) {
  if (!parsed) return [];

  // RSS 2.0
  const channel = parsed?.rss?.channel;
  if (channel) {
    const items = ensureArray(channel.item);
    return items.map((item) => ({
      source: sourceMeta.id,
      label: sourceMeta.label,
      weight: sourceMeta.weight,
      focus: sourceMeta.focus,
      title: item.title || null,
      link: resolveLink(item.link) || null,
      author: item['dc:creator'] || item.creator || item.author || null,
      summary: item.summary || item.description || null,
      publishedAt: toIsoString(item.pubDate || item.pubdate || item.date),
      raw: item,
    }));
  }

  // Atom 1.0
  const feed = parsed?.feed;
  if (feed) {
    const entries = ensureArray(feed.entry);
    return entries.map((entry) => ({
      source: sourceMeta.id,
      label: sourceMeta.label,
      weight: sourceMeta.weight,
      focus: sourceMeta.focus,
      title: entry.title?.text || entry.title || null,
      link: resolveLink(entry.link),
      author:
        entry.author?.name ||
        (Array.isArray(entry.author) ? entry.author[0]?.name : undefined) ||
        null,
      summary: entry.summary?.text || entry.summary || entry.content?.text || null,
      publishedAt: toIsoString(entry.updated || entry.published || entry.created),
      raw: entry,
    }));
  }

  return [];
}

async function fetchRssFeed(feedUrl) {
  const response = await safeFetch(feedUrl, {
    headers: {
      Accept: 'application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7',
      'User-Agent': 'Atlas-T7-NewsFetcher/0.1 (+https://vercel.com)',
    },
  });
  if (typeof response !== 'string') {
    throw new Error('Unexpected RSS response payload');
  }
  return parser.parse(response);
}

async function fetchSourceNews(sourceId, { limit = 25 } = {}) {
  const sourceMeta = SOURCES[sourceId];
  if (!sourceMeta) {
    throw new Error(`Unsupported news source: ${sourceId}`);
  }
  const parsed = await fetchRssFeed(sourceMeta.feed);
  const items = normalizeRssItems(sourceMeta, parsed)
    .filter((item) => item.link)
    .slice(0, limit);
  return { source: sourceMeta, items };
}

function sortByPublished(items) {
  return items.sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });
}

async function fetchNewsAggregate({
  sources,
  limitPerSource = 20,
  maxItems = 100,
} = {}) {
  const sourceList = sources && sources.length ? sources : Object.keys(SOURCES);

  const results = await Promise.all(
    sourceList.map(async (sourceId) => {
      try {
        const { items } = await fetchSourceNews(sourceId, { limit: limitPerSource });
        return { source: sourceId, success: true, items };
      } catch (error) {
        return { source: sourceId, success: false, error: error.message };
      }
    })
  );

  const items = sortByPublished(
    results
      .filter((result) => result.success)
      .flatMap((result) => result.items)
  ).slice(0, maxItems);

  const errors = results
    .filter((result) => !result.success)
    .map(({ source, error }) => ({ source, message: error }));

  return { items, errors };
}

module.exports = {
  SOURCES,
  fetchSourceNews,
  fetchNewsAggregate,
};
