# Gatsby → Astro Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Gatsby blog with an Astro 5 static site that looks identical, preserves post URLs, and drops the dead Pocket/Chakra/PWA machinery.

**Architecture:** In-place conversion on the `astro-migration` branch. Astro 5 static output, zero client JS. Blog posts become a Zod-schemed content collection rendered from a root-level `[slug].astro` route to keep `/<slug>/` URLs. The theme CSS is moved and tidied, not rewritten. The favourites page ships podcasts-only from a frozen JSON snapshot extracted from the OPML before the plugins are deleted.

**Tech Stack:** Astro 5, `@astrojs/rss`, `@astrojs/sitemap`, `@fontsource/montserrat`, `@fontsource/merriweather`, `fast-xml-parser` (build-time extraction only), yarn, Node 20.

## Global Constraints

- **Node:** ≥ 20 (`.nvmrc` = `v20`). Package manager: **yarn**.
- **Site URL:** `https://www.simoncoulter.com` (set as Astro `site`).
- **Zero client JS** — all components are `.astro`, render to static HTML. Only exception: the GA4 gtag snippet, production-only.
- **URL preservation:** blog posts MUST resolve at `/<slug>/` (root-level, no `/blog/` prefix). `/FavouriteArticles` MUST redirect to `/favourites`.
- **GA4 id:** `G-V2JCRMKRVH` (production only).
- **Verification model:** no unit-test framework. Each task's gate is `yarn build` succeeding plus assertions on `dist/` output. Run assertions **before** implementing to confirm they fail (red), then after (green).
- **Drafts** (`draft: true`) are excluded from the index, RSS, and sitemap.
- **Secrets:** the Pocket key/token must not appear in any new file. They stay in git history (dead service); do not attempt to scrub history.

---

## File Structure (target)

```
astro.config.mjs            # site, sitemap, redirects
package.json                # astro deps, yarn scripts
tsconfig.json
.nvmrc                      # v20
scripts/extract-podcasts.mjs  # one-shot OPML → podcasts.json
src/
  consts.ts                 # site metadata + GA id
  content.config.ts         # blog collection + Zod schema
  content/blog/<slug>.md    # 9 migrated posts
  data/podcasts.json        # 33 frozen favourite episodes
  data/projects.md          # projects page content
  layouts/BaseLayout.astro
  components/BaseHead.astro  # SEO/OG/Twitter meta + GA
  components/Navbar.astro
  components/Bio.astro
  pages/index.astro         # /
  pages/[slug].astro        # /<slug>/
  pages/projects.astro      # /projects
  pages/favourites.astro    # /favourites
  pages/404.astro
  pages/rss.xml.js          # /rss.xml
  styles/normalize.css
  styles/global.css         # tidied former style.css
  assets/profile-pic.png
public/
  favicon.ico
  robots.txt
docs/favourites-pipeline.md
.github/workflows/ci.yml
```

---

## Task 1: Astro skeleton, config, and a green build

Stand up Astro and remove the Gatsby files that would collide with Astro routing (old `src/pages/*` and config). This is one task because Astro cannot build until the conflicting Gatsby pages are gone.

**Files:**
- Create: `package.json` (replace), `astro.config.mjs`, `tsconfig.json`, `.nvmrc` (replace), `src/consts.ts`, `src/pages/index.astro` (temporary placeholder)
- Move: `static/favicon.ico` → `public/favicon.ico`, `static/robots.txt` → `public/robots.txt`
- Delete: `gatsby-config.js`, `gatsby-node.js`, `gatsby-browser.js`, `src/pages/index.js`, `src/pages/404.js`, `src/pages/FavouriteArticles.js`, `src/pages/using-typescript.tsx`, `src/templates/blog-post.js`, old `yarn.lock`

**Interfaces:**
- Produces: `src/consts.ts` exporting `SITE_TITLE`, `SITE_DESCRIPTION`, `SITE_URL`, `AUTHOR` (`{name, summary}`), `SOCIAL` (`{twitter}`), `GA_ID` — consumed by every later task.

- [ ] **Step 1: Replace `package.json`**

```json
{
  "name": "simon-coulter-blog",
  "type": "module",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "extract-podcasts": "node scripts/extract-podcasts.mjs",
    "format": "prettier --write \"**/*.{js,mjs,ts,astro,json,md,css}\""
  },
  "dependencies": {
    "@astrojs/rss": "^4.0.11",
    "@astrojs/sitemap": "^3.2.1",
    "@fontsource/merriweather": "^5.1.0",
    "@fontsource/montserrat": "^5.1.1",
    "astro": "^5.1.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.4",
    "fast-xml-parser": "^4.5.1",
    "prettier": "^3.4.2",
    "prettier-plugin-astro": "^0.14.1",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 2: Create `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.simoncoulter.com',
  integrations: [sitemap()],
  redirects: {
    '/FavouriteArticles': '/favourites',
  },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 4: Replace `.nvmrc`** with a single line:

```
v20
```

- [ ] **Step 5: Create `src/consts.ts`**

```ts
export const SITE_TITLE = 'Simon Coulter Blog';
export const SITE_DESCRIPTION =
  'Blogging on Engineering Management & building things';
export const SITE_URL = 'https://www.simoncoulter.com';
export const AUTHOR = {
  name: 'Simon Coulter',
  summary:
    ", an engineering manager in Dublin. I've spent most of my life in Ireland but was born in Papua New Guinea. I like building things in my spare time.",
};
export const SOCIAL = { twitter: 'simcoulter' };
export const GA_ID = 'G-V2JCRMKRVH';
```

- [ ] **Step 6: Create temporary `src/pages/index.astro`**

```astro
---
---
<html lang="en">
  <head><meta charset="utf-8" /><title>Placeholder</title></head>
  <body><p>Astro skeleton online.</p></body>
</html>
```

- [ ] **Step 7: Move static assets and delete Gatsby files**

```bash
mkdir -p public
git mv static/favicon.ico public/favicon.ico
git mv static/robots.txt public/robots.txt
rmdir static 2>/dev/null || true
git rm -q gatsby-config.js gatsby-node.js gatsby-browser.js \
  src/pages/index.js src/pages/404.js src/pages/FavouriteArticles.js \
  src/pages/using-typescript.tsx src/templates/blog-post.js yarn.lock
```

- [ ] **Step 8: Install and build — verify green**

Run:
```bash
yarn install && yarn build && test -f dist/index.html && echo BUILD_OK
```
Expected: ends with `BUILD_OK`. (A fresh `yarn.lock` is generated.)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Scaffold Astro project and remove Gatsby config/pages"
```

---

## Task 2: Theme styles, base layout, head, navbar, bio

Port the CSS (tidied) and build the shared shell. After this task every page can use `BaseLayout`.

**Files:**
- Move: `src/style.css` → `src/styles/global.css`, `src/normalize.css` → `src/styles/normalize.css`, `src/images/profile-pic.png` → `src/assets/profile-pic.png`
- Create: `src/components/BaseHead.astro`, `src/components/Navbar.astro`, `src/components/Bio.astro`, `src/layouts/BaseLayout.astro`
- Modify: `src/pages/index.astro` (use the layout), `src/styles/global.css` (tidy)

**Interfaces:**
- Produces: `BaseLayout` with props `{ title?: string; description?: string }`, rendering `<slot />` inside `.global-wrapper > main`. Consumed by every page task.

- [ ] **Step 1: Move CSS and image**

```bash
mkdir -p src/styles src/assets
git mv src/style.css src/styles/global.css
git mv src/normalize.css src/styles/normalize.css
git mv src/images/profile-pic.png src/assets/profile-pic.png
```

- [ ] **Step 2: Tidy `src/styles/global.css`**

Apply these edits (the file is otherwise kept verbatim):

1. **Delete** the dead Chakra/Bulma navbar rules — the whole blocks for `.navbar-start`, `.navbar-start a`, and `.navbar-start a:last-child`.
2. **Replace** the `.gatsby-highlight` block with Shiki-compatible code styling:
   ```css
   pre.astro-code {
     margin-bottom: var(--spacing-8);
     padding: var(--spacing-4);
     border-radius: 4px;
     overflow-x: auto;
   }
   ```
3. **Add** a navbar flex container rule (Chakra's `<Flex>` is gone) directly after the `.navbar-item` block:
   ```css
   .navbar-menu {
     display: flex;
     align-items: center;
     flex-wrap: wrap;
   }
   .navbar hr {
     background: var(--color-accent);
     height: 1px;
     border: 0;
     margin: var(--spacing-2) var(--spacing-0);
   }
   ```
Leave all custom properties, prose, `.bio`, `.post-list-item`, `.blog-post`, `.title-header`, `.horz-container`, and media-query rules unchanged.

- [ ] **Step 3: Create `src/components/BaseHead.astro`**

```astro
---
import { SITE_TITLE, SITE_DESCRIPTION, SOCIAL, GA_ID } from '../consts';
interface Props {
  title?: string;
  description?: string;
}
const { title, description } = Astro.props;
const pageTitle = title ? `${title} | ${SITE_TITLE}` : SITE_TITLE;
const metaDescription = description || SITE_DESCRIPTION;
const canonical = new URL(Astro.url.pathname, Astro.site);
---
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" href="/favicon.ico" />
<link rel="canonical" href={canonical} />
<title>{pageTitle}</title>
<meta name="description" content={metaDescription} />
<meta property="og:title" content={title || SITE_TITLE} />
<meta property="og:description" content={metaDescription} />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:creator" content={`@${SOCIAL.twitter}`} />
<meta name="twitter:title" content={title || SITE_TITLE} />
<meta name="twitter:description" content={metaDescription} />
<link rel="alternate" type="application/rss+xml" title={SITE_TITLE} href="/rss.xml" />
{
  import.meta.env.PROD && (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
      <script is:inline define:vars={{ GA_ID }}>
        window.dataLayer = window.dataLayer || [];
        function gtag() {
          dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', GA_ID);
      </script>
    </>
  )
}
```

- [ ] **Step 4: Create `src/components/Navbar.astro`**

```astro
---
---
<nav class="navbar" aria-label="main-navigation">
  <hr />
  <div class="navbar-menu">
    <div class="navbar-header title-header"><a href="/">Simon Coulter Blog</a></div>
    <div class="horz-container">
      <a class="navbar-item" href="/">Home</a>
      <a class="navbar-item" href="/favourites">Favourites</a>
      <a class="navbar-item" href="/projects">Projects</a>
    </div>
  </div>
  <hr />
</nav>
```

- [ ] **Step 5: Create `src/components/Bio.astro`**

```astro
---
import { Image } from 'astro:assets';
import profilePic from '../assets/profile-pic.png';
import { AUTHOR, SOCIAL } from '../consts';
---
<div class="bio">
  <Image class="bio-avatar" src={profilePic} width={50} height={50} alt="Profile picture" />
  <p>
    Written by <strong>{AUTHOR.name}</strong>{AUTHOR.summary}{' '}
    <a href={`https://twitter.com/${SOCIAL.twitter}`}>You should follow them on Twitter</a>
  </p>
</div>
```

- [ ] **Step 6: Create `src/layouts/BaseLayout.astro`**

```astro
---
import BaseHead from '../components/BaseHead.astro';
import Navbar from '../components/Navbar.astro';
import Bio from '../components/Bio.astro';
import '@fontsource/montserrat';
import '@fontsource/merriweather';
import '../styles/normalize.css';
import '../styles/global.css';

interface Props {
  title?: string;
  description?: string;
}
const { title, description } = Astro.props;
const isRoot = Astro.url.pathname === '/';
---
<html lang="en">
  <head>
    <BaseHead title={title} description={description} />
  </head>
  <body>
    <Navbar />
    <div class="global-wrapper" data-is-root-path={isRoot}>
      <main><slot /></main>
      <footer>
        <Bio />
        © {new Date().getFullYear()}, Built with <a href="https://astro.build">Astro</a>
      </footer>
    </div>
  </body>
</html>
```

- [ ] **Step 7: Rewrite `src/pages/index.astro` to use the layout (still a stub)**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="All posts">
  <p>Posts coming in the next task.</p>
</BaseLayout>
```

- [ ] **Step 8: Build and verify the shell renders**

Run:
```bash
yarn build && grep -q 'Simon Coulter Blog' dist/index.html \
  && grep -q 'Built with' dist/index.html \
  && grep -q 'href="/favourites"' dist/index.html && echo SHELL_OK
```
Expected: `SHELL_OK`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Add Astro base layout, head, navbar, bio, and tidied theme CSS"
```

---

## Task 3: Blog content collection and post pages

**Files:**
- Create: `src/content.config.ts`, `src/pages/[slug].astro`
- Move: each `content/blog/<slug>/index.md` → `src/content/blog/<slug>.md` (9 posts)

**Interfaces:**
- Consumes: `BaseLayout` from Task 2.
- Produces: a `blog` collection whose entry `id` is the filename slug (e.g. `research-time`); post pages at `/<id>/`. Consumed by Tasks 4 (index) and 7 (RSS).

- [ ] **Step 1: Create `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog };
```

- [ ] **Step 2: Move the 9 posts into the collection (flatten folder → file)**

```bash
mkdir -p src/content/blog
for d in content/blog/*/; do
  slug=$(basename "$d")
  git mv "${d}index.md" "src/content/blog/${slug}.md"
done
rm -rf content/blog
```
Verify 9 files:
```bash
ls src/content/blog | wc -l   # expected: 9
```

- [ ] **Step 3: Create `src/pages/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content } = await render(post);
const dateStr = post.data.date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: '2-digit',
});
---
<BaseLayout title={post.data.title} description={post.data.description}>
  <article class="blog-post" itemscope itemtype="http://schema.org/Article">
    <header>
      <h1 itemprop="headline">{post.data.title}</h1>
      <p>{dateStr}</p>
    </header>
    <section itemprop="articleBody"><Content /></section>
    <hr />
  </article>
</BaseLayout>
```

- [ ] **Step 4: Build and verify a known post URL is preserved**

Run:
```bash
yarn build \
  && test -f dist/research-time/index.html \
  && grep -q 'Investing in your success' dist/research-time/index.html \
  && echo POST_OK
```
Expected: `POST_OK`. (Confirms `/research-time/` URL and rendered body.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add blog content collection and root-level post route"
```

---

## Task 4: Blog index

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `blog` collection (Task 3), `BaseLayout` (Task 2).

- [ ] **Step 1: Replace `src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';

const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
  (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
);

function excerpt(body: string | undefined, description?: string): string {
  if (description) return description;
  const text = (body ?? '')
    .replace(/[#>*_`[\]]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  return text.length > 160 ? text.slice(0, 160) + '…' : text;
}

const fmt = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
---
<BaseLayout title="All posts">
  <ol style="list-style: none">
    {
      posts.map((post) => (
        <li>
          <article class="post-list-item" itemscope itemtype="http://schema.org/Article">
            <header>
              <h2>
                <a href={`/${post.id}/`} itemprop="url">
                  <span itemprop="headline">{post.data.title}</span>
                </a>
              </h2>
              <small>{fmt(post.data.date)}</small>
            </header>
            <section>
              <p itemprop="description">{excerpt(post.body, post.data.description)}</p>
            </section>
          </article>
        </li>
      ))
    }
  </ol>
</BaseLayout>
```

- [ ] **Step 2: Build and verify newest-first ordering + links**

Run:
```bash
yarn build \
  && grep -q 'href="/research-time/"' dist/index.html \
  && grep -q 'post-list-item' dist/index.html \
  && echo INDEX_OK
```
Expected: `INDEX_OK`. Also open `dist/index.html` and confirm the most recent post (by date) appears first and no draft/`test-blog` content shows if it is marked draft.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Build blog index list, newest first, drafts excluded"
```

---

## Task 5: Projects page

**Files:**
- Move: `content/projects/projects/index.md` → `src/data/projects.md`
- Create: `src/pages/projects.astro`
- Delete: `content/projects`, `content/about` (unused placeholder), remaining `content/`

**Interfaces:**
- Consumes: `BaseLayout` (Task 2).

- [ ] **Step 1: Move projects content and drop unused content dirs**

```bash
mkdir -p src/data
git mv content/projects/projects/index.md src/data/projects.md
rm -rf content
```

- [ ] **Step 2: Create `src/pages/projects.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { Content } from '../data/projects.md';
---
<BaseLayout title="Projects">
  <Content />
</BaseLayout>
```

- [ ] **Step 3: Build and verify**

Run:
```bash
yarn build \
  && test -f dist/projects/index.html \
  && grep -q 'Stoic Today' dist/projects/index.html \
  && echo PROJECTS_OK
```
Expected: `PROJECTS_OK`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add projects page from markdown, drop unused content dirs"
```

---

## Task 6: Favourites — extract podcasts snapshot and build the page

Extract the favourited episodes from the OPML **before** the plugins/OPML are deleted (Task 8).

**Files:**
- Create: `scripts/extract-podcasts.mjs`, `src/data/podcasts.json` (generated), `src/pages/favourites.astro`

**Interfaces:**
- Produces `src/data/podcasts.json`: array of `{ name, podcastTitle, publishDate, episodeData }`.
- Consumes: `BaseLayout` (Task 2), `redirects` config (Task 1) for `/FavouriteArticles`.

- [ ] **Step 1: Create `scripts/extract-podcasts.mjs`**

```js
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
```

- [ ] **Step 2: Run extraction and verify the count**

Run:
```bash
yarn extract-podcasts
```
Expected output: `Wrote 33 favourited episodes`. Confirm each object in `src/data/podcasts.json` has non-empty `name`, `podcastTitle`, and `episodeData`. (If the count differs from 33, cross-check against `grep -c userRecommendedDate data/opml/overcast.opml` and inspect nesting — the parser walk must match the actual depth.)

- [ ] **Step 3: Create `src/pages/favourites.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import episodes from '../data/podcasts.json';

const recent = [...episodes]
  .sort((a, b) => new Date(b.publishDate).valueOf() - new Date(a.publishDate).valueOf())
  .slice(0, 10);
---
<BaseLayout title="Favourites">
  <header>
    <h1>Favourite Podcast Episodes</h1>
    <p>A collection of podcast episodes that have stood out to me in terms of quality and value.</p>
  </header>
  <ol style="list-style: none">
    {
      recent.map((ep) => (
        <li>
          <article class="post-list-item">
            <header>
              <h2>
                <a href={ep.episodeData}>{ep.podcastTitle}: {ep.name}</a>
              </h2>
            </header>
          </article>
        </li>
      ))
    }
  </ol>
</BaseLayout>
```

- [ ] **Step 4: Build and verify the page plus the redirect**

Run:
```bash
yarn build \
  && test -f dist/favourites/index.html \
  && grep -q 'Favourite Podcast Episodes' dist/favourites/index.html \
  && grep -rq '/favourites' dist/FavouriteArticles/index.html \
  && echo FAV_OK
```
Expected: `FAV_OK`. (Confirms the podcasts page and the meta-refresh redirect stub at `/FavouriteArticles`.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Add frozen podcasts snapshot and favourites page with redirect"
```

---

## Task 7: RSS feed and 404

**Files:**
- Create: `src/pages/rss.xml.js`, `src/pages/404.astro`

**Interfaces:**
- Consumes: `blog` collection (Task 3), `consts.ts` (Task 1).

- [ ] **Step 1: Create `src/pages/rss.xml.js`**

```js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description ?? '',
      link: `/${post.id}/`,
    })),
  });
}
```

- [ ] **Step 2: Create `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="404: Not Found">
  <h1>404: Not Found</h1>
  <p>You just hit a route that doesn't exist... the sadness.</p>
</BaseLayout>
```

- [ ] **Step 3: Build and verify feed, sitemap, and 404**

Run:
```bash
yarn build \
  && grep -q '<rss' dist/rss.xml \
  && grep -q 'Simon Coulter Blog' dist/rss.xml \
  && test -f dist/sitemap-index.xml \
  && test -f dist/404.html \
  && echo FEED_OK
```
Expected: `FEED_OK`. (Sitemap is produced by the `@astrojs/sitemap` integration wired in Task 1.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Add RSS feed and 404 page"
```

---

## Task 8: Pipeline docs, cleanup, README, and CI

Capture the removed favourites pipeline, then delete the Gatsby remnants and wire a real CI check.

**Files:**
- Create: `docs/favourites-pipeline.md`, `.github/workflows/ci.yml`
- Modify: `README.md`
- Delete: `plugins/`, `data/`, `src/images/`, `src/components/*.js`, any empty `src/templates`, `src/pages` leftovers, `.github/workflows/main.yml`

- [ ] **Step 1: Create `docs/favourites-pipeline.md`**

```markdown
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
```

- [ ] **Step 2: Create `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: yarn
      - run: yarn install --frozen-lockfile
      - run: yarn build
```

- [ ] **Step 3: Delete Gatsby remnants**

```bash
git rm -q -r plugins data src/images src/components .github/workflows/main.yml
# remove any now-empty leftover dirs
rmdir src/templates src/pages 2>/dev/null || true
```
Note: `src/pages` must NOT be removed if it still holds Astro pages — the `rmdir` only succeeds on empty dirs, so this is safe. Confirm Astro pages remain:
```bash
ls src/pages   # expected: 404.astro [slug].astro favourites.astro index.astro projects.astro rss.xml.js
```

- [ ] **Step 4: Rewrite `README.md`**

Replace the entire file with:

```markdown
# Simon Coulter Blog

Personal blog built with [Astro](https://astro.build). Deployed as a static
site to https://www.simoncoulter.com.

## Develop

```bash
yarn install
yarn dev      # local dev server
yarn build    # static build to dist/
yarn preview  # preview the build
```

## Content

Blog posts are markdown files in `src/content/blog/` with frontmatter
`title`, `date`, optional `description`, optional `draft`. Post URLs are
`/<filename>/`.

The `/favourites` page renders a frozen podcast snapshot in
`src/data/podcasts.json`. See `docs/favourites-pipeline.md` for how that data
was produced and how the retired Pocket/Overcast pipeline worked.
```

- [ ] **Step 5: Verify no Gatsby or secret references remain**

Run:
```bash
grep -rniE 'gatsby|consumer_key|access_token|100834-' \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist \
  --exclude-dir=docs . ; echo "exit: $?"
```
Expected: no matches (grep `exit: 1`). The `docs/` dir is excluded because the spec/pipeline docs legitimately mention Gatsby by name.

- [ ] **Step 6: Full build and final check**

Run:
```bash
yarn build && yarn check && echo FINAL_OK
```
Expected: `FINAL_OK` (build clean and `astro check` reports no errors).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Document retired favourites pipeline, remove Gatsby remnants, add CI"
```

---

## Self-Review

**Spec coverage:**
- Stack (Astro 5, Shiki, fontsource, yarn, Node 20) → Task 1, 2. ✓
- Zod content collection + preserved `/<slug>/` URLs → Task 3. ✓
- Blog index, drafts excluded → Task 4. ✓
- Projects page, about dropped → Task 5. ✓
- Favourites podcasts-only frozen + `/favourites` rename + `/FavouriteArticles` redirect → Task 1 (redirect config) + Task 6. ✓
- RSS, sitemap, GA4, PWA dropped → Task 1 (sitemap), 2 (GA), 7 (RSS). ✓
- Tidied theme CSS → Task 2. ✓
- `docs/favourites-pipeline.md` → Task 8. ✓
- Secrets removed from working tree → Task 1 (gatsby-config), Task 8 (README + grep gate). ✓
- Files-removed list → Task 1 + Task 8. ✓
- Verification (build + output parity) → every task + Task 8 final. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"; all code steps show full code. ✓

**Type consistency:** `consts.ts` exports (`SITE_TITLE`, `AUTHOR.summary`, `SOCIAL.twitter`, `GA_ID`) are used consistently in Tasks 2 and 7. Collection entry `post.id` used identically in `[slug].astro`, `index.astro`, and `rss.xml.js`. `podcasts.json` shape `{name, podcastTitle, publishDate, episodeData}` produced in Task 6 Step 1 and consumed in Task 6 Step 3. ✓
