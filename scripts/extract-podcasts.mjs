import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';

const xml = readFileSync('data/opml/overcast.opml', 'utf8');
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
const doc = parser.parse(xml);

const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const episodes = [];

// opml.body.outline (category) -> outline (podcast feed) -> outline (episode)
for (const group of asArray(doc.opml.body.outline)) {
  for (const feed of asArray(group.outline)) {
    const podcastTitle = feed.title ?? feed.text ?? '';
    for (const ep of asArray(feed.outline)) {
      if (ep.type === 'podcast-episode' && ep.userRecommendedDate !== undefined) {
        episodes.push({
          name: ep.title ?? '',
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
