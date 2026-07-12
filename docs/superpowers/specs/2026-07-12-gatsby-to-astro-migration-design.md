# Gatsby → Astro Migration — Design

**Date:** 2026-07-12
**Status:** Approved (pending spec review)
**Goal:** Convert the blog from Gatsby to Astro, simplify the structure, keep the theme.

## Context

The site is a fork of `gatsby-starter-blog` (Gatsby 4) serving
`https://www.simoncoulter.com`. It carries heavy dependencies (Chakra UI,
emotion, framer-motion) used only for a navbar divider, two dead/static data
pipelines (Pocket, Overcast), and a broken deploy workflow (cron `yarn start`
targeting the defunct Gatsby Cloud).

Content: 9 markdown blog posts + a `projects` page + an unused placeholder
`about` page, all under `content/`. No posts contain colocated images.

## Approach

**In-place conversion on a branch.** Preserves git history, existing post
URLs, content, and CSS while removing the Gatsby/Chakra machinery. Rejected
alternatives: the Astro blog starter (would fight "keep the theme"); a fresh
repo (throws away history for no gain).

## Decisions (from brainstorming)

- **Favourites page:** freeze as static. Pocket article data is unrecoverable
  (API shut down mid-2025, no snapshot in repo), so ship **podcasts-only** now
  with a clean seam to add articles later.
- **Theme:** keep the look, tidy the CSS.
- **Deploy:** host-agnostic static build (`output: 'static'`, no adapter).
- **Extras kept:** RSS, Google Analytics (GA4), XML sitemap. **Dropped:** PWA
  manifest / offline service worker.
- **Route rename:** `/FavouriteArticles` → `/favourites`, with a redirect
  preserving old links.
- **Documentation:** capture the Overcast/Pocket favourites pipeline in
  `docs/favourites-pipeline.md` before deleting the plugins.

## Stack

- **Astro 5**, static output, `site: 'https://www.simoncoulter.com'`.
- **Shiki** (Astro built-in) for code highlighting — replaces Prism, no client JS.
- Fonts: `@fontsource/montserrat` + `@fontsource/merriweather` (self-hosted,
  drop-in for the current `typeface-*` packages).
- Package manager: **yarn** (retained). `.nvmrc` bumped v16.8.0 → **v20**.
- No client-side JavaScript ships (all components render to static HTML).

## Content model

- Astro **content collection** `blog` with a **Zod** frontmatter schema:
  - `title: z.string()`
  - `date: z.coerce.date()`
  - `description: z.string().optional()`
  - `draft: z.boolean().optional().default(false)`
- Drafts are excluded from the index, RSS, and sitemap.
- Posts flatten `content/blog/<slug>/index.md` → `src/content/blog/<slug>.md`
  (safe: no post has colocated assets).
- **URL preservation:** blog posts render from a root-level dynamic route
  `src/pages/[slug].astro` so URLs stay `/<slug>/` (not `/blog/<slug>/`).
  `getStaticPaths` emits only blog slugs to avoid collision with static routes.

## Routes

| URL | Source | Notes |
|-----|--------|-------|
| `/` | `src/pages/index.astro` | Blog list, drafts filtered, date DESC |
| `/<slug>/` | `src/pages/[slug].astro` | Blog post |
| `/projects` | `src/pages/projects.astro` | Renders projects markdown |
| `/favourites` | `src/pages/favourites.astro` | Podcasts-only (10 most recent) |
| `/FavouriteArticles` | Astro `redirects` config | Meta-refresh → `/favourites` |
| `/404` | `src/pages/404.astro` | |
| `/rss.xml` | `src/pages/rss.xml.js` | `@astrojs/rss`, real feed title |

**Dropped:** the `about` page (placeholder "About About about", already
unlinked from the nav) and the sample `using-typescript` page.

## Components (all `.astro`, zero client JS)

- `layouts/BaseLayout.astro` — Navbar + `<main>` + footer.
- `components/Navbar.astro` — plain HTML/CSS (Chakra/emotion/framer-motion removed).
- `components/Bio.astro` — footer bio; profile pic via `astro:assets`.
- `components/BaseHead.astro` — SEO/OG/Twitter meta (replaces react-helmet) +
  GA4 gtag (`G-V2JCRMKRVH`), gated to `import.meta.env.PROD`.
- `src/consts.ts` — centralized site metadata (title, author name/summary,
  description, siteUrl, social.twitter, GA id).

## Theme

Port `normalize.css` + `style.css` into `src/styles/`, tidied: fold the
now-unused navbar/Chakra rules into plain CSS, remove dead selectors, keep all
custom properties and the exact visual result. Update footer text
"Built with Gatsby" → "Built with Astro".

## Favourites data

Extract the 33 episodes with a `userRecommendedDate` from the 2792-line
`data/opml/overcast.opml` into a small committed `src/data/podcasts.json`
(fields: `name`, `podcastTitle`, `publishDate`, `episodeData`/enclosure URL).
The page renders the 10 most recent by publish date, matching prior behaviour.
Then delete the OPML file and both custom plugins.

## Extras

- **RSS:** `@astrojs/rss` → `/rss.xml`, corrected feed title (was "Gatsby
  Starter Blog RSS Feed"), items from the blog collection, drafts excluded.
- **Sitemap:** `@astrojs/sitemap` (requires `site`; new capability, cheap SEO win).
- **Analytics:** GA4 tag in `BaseHead`, production-only.

## Deliverable: `docs/favourites-pipeline.md`

Documents the removed favourites feature so it can be recreated:

- **`gatsby-source-overcastfm`** (Playwright): logs into overcast.fm with
  `OVERCAST_EMAIL`/`OVERCAST_PASSWORD`, reuses the `o` session cookie, downloads
  the extended OPML from `https://overcast.fm/account/export_opml/extended` to
  `data/opml/overcast.opml`. Was run manually (commented out of config), not per build.
- **`gatsby-source-opml-overcastfm`**: parses the OPML with `xml2json`, creates
  `OpmlPodcast` + `OpmlPodcastEpisodes` nodes. Favourite rule:
  `favorited = episode.userRecommendedDate !== undefined`. Episode fields:
  `name` (title), `podcastTitle`, `publishDate` (pubDate), `episodeData`
  (enclosureUrl), `playedCount`, `favorited`.
- **Podcast query:** `allOpmlPodcastEpisodes(filter: {favorited: {eq: true}},
  sort: {fields: publishDate, order: DESC}, limit: 10)`.
- **Pocket** (`gatsby-source-pocket`): consumer key + access token, articles
  tagged `simoncoulter.com` (`tagFilterString`), `weeksOfHistory: 1252`.
  Produced `allPocketArticle` nodes `{id, url, title, favourite}`, rendered
  sorted by `id` DESC as title→url links. **Pocket shut down mid-2025**;
  recreation requires an alternative read-later source.

## Files removed

`gatsby-config.js`, `gatsby-node.js`, `gatsby-browser.js`, `plugins/`,
`data/opml/`, `src/templates/`, old React components/pages
(`src/pages/using-typescript.tsx`, `404.js`, `index.js`, `FavouriteArticles.js`),
the Pocket key lines in `README.md`, and all `gatsby-*` + Chakra/emotion/
framer-motion dependencies. The broken cron `.github/workflows/main.yml` is
replaced with a simple `astro build` CI check.

> Note: the Pocket `consumer_key` / `access_token` remain in git history. The
> service is dead, so rotation is moot; they are removed from the working tree.

## Verification

- `yarn build` (`astro build`) completes with no errors.
- Spot-check rendered HTML for `/`, a blog post, `/projects`, `/favourites`,
  `/rss.xml`, and the `/FavouriteArticles` redirect against the current site
  for visual/structural parity.
- Confirm existing post URLs resolve unchanged.

## Out of scope

Design refresh, new content, hosting/CI provider selection beyond a build
check, recreating live Pocket/Overcast data pipelines.
