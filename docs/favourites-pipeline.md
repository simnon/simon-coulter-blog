# Favourites pipeline (retired)

The `/favourites` page originally aggregated two live data sources at build
time. Both were removed in the Astro migration; the podcast half was frozen to
`src/data/podcasts.json`. This documents how to recreate the feature.

## Podcasts — Overcast

Two custom Gatsby plugins (formerly in `plugins/`):

**`gatsby-source-overcastfm` (fetcher).** Headless Playwright Chromium logged
into overcast.fm with env vars `OVERCAST_EMAIL` / `OVERCAST_PASSWORD`, reused
the `o` session cookie, and downloaded the extended OPML from
`https://overcast.fm/account/export_opml/extended` to `data/opml/overcast.opml`.
It was run manually (commented out of `gatsby-config.js`), not on every build.

**`gatsby-source-opml-overcastfm` (reader).** Parsed the OPML with `xml2json`
and created `OpmlPodcast` + `OpmlPodcastEpisodes` nodes. Structure:
`opml.body.outline` (category) → `outline` (podcast feed) → `outline` (episode).

Favourite rule: `favorited = episode.userRecommendedDate !== undefined`.
Episode fields: `name` (title), `podcastTitle` (parent feed title),
`publishDate` (pubDate), `episodeData` (enclosureUrl), `playedCount`, `favorited`.

Page query: `allOpmlPodcastEpisodes(filter: {favorited: {eq: true}}, sort:
{fields: publishDate, order: DESC}, limit: 10)`.

To refresh today: re-export the OPML from Overcast and re-run
`scripts/extract-podcasts.mjs` (points at `data/opml/overcast.opml`).

## Articles — Pocket

`gatsby-source-pocket` pulled articles tagged `simoncoulter.com`
(`tagFilterString`), with `weeksOfHistory: 1252`. It produced `allPocketArticle`
nodes `{ id, url, title, favourite }`, rendered sorted by `id` DESC as
title→url links.

**Pocket shut down mid-2025** and no snapshot survives in this repo, so the
article list cannot be recovered. Rebuilding requires a different read-later
source (e.g. an export from a replacement service) mapped to `{ title, url }`.
