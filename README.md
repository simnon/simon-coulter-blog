# Simon Coulter Blog

Personal blog built with [Astro](https://astro.build). Deployed as a static
site to https://www.simoncoulter.com.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # static build to dist/
npm run preview  # preview the build
```

## Content

Blog posts are markdown files in `src/content/blog/` with frontmatter
`title`, `date`, optional `description`, optional `draft`. Post URLs are
`/<filename>/`.

The `/favourites` page renders a frozen podcast snapshot in
`src/data/podcasts.json`. See `docs/favourites-pipeline.md` for how that data
was produced and how the retired Pocket/Overcast pipeline worked.
