import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';

const xml = readFileSync('data/opml/overcast.opml', 'utf8');
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
const doc = parser.parse(xml);

const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const episodes = [];

const NAMED_ENTITIES = { quot: '"', apos: "'", lt: '<', gt: '>', amp: '&' };
function decodeEntities(s) {
  return String(s ?? '').replace(
    /&(#x[0-9a-fA-F]+|#\d+|quot|apos|lt|gt|amp);/g,
    (_, e) => {
      if (e[0] === '#') {
        const cp =
          e[1] === 'x' || e[1] === 'X'
            ? parseInt(e.slice(2), 16)
            : parseInt(e.slice(1), 10);
        return String.fromCodePoint(cp);
      }
      return NAMED_ENTITIES[e];
    },
  );
}

// opml.body.outline (category) -> outline (podcast feed) -> outline (episode)
for (const group of asArray(doc.opml.body.outline)) {
  for (const feed of asArray(group.outline)) {
    const podcastTitle = decodeEntities(feed.title ?? feed.text ?? '');
    for (const ep of asArray(feed.outline)) {
      if (ep.type === 'podcast-episode' && ep.userRecommendedDate !== undefined) {
        episodes.push({
          name: decodeEntities(ep.title ?? ''),
          podcastTitle,
          publishDate: ep.pubDate ?? '',
          episodeData: ep.enclosureUrl ?? '',
        });
      }
    }
  }
}

episodes.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
mkdirSync('src/data', { recursive: true });
writeFileSync('src/data/podcasts.json', JSON.stringify(episodes, null, 2) + '\n');
console.log(`Wrote ${episodes.length} favourited episodes`);
