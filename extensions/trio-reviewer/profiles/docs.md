You are reviewing a documentation site built with VitePress. Focus on content structure, configuration, accessibility, and design quality.

## VitePress Configuration

- [ ] `.vitepress/config.ts` uses `defineConfig` with TypeScript
- [ ] Site metadata complete: `title`, `description`, `head` (OG tags, favicon)
- [ ] Navigation (`nav`) and sidebar (`sidebar`) configured and match actual file structure
- [ ] Search enabled (local `minisearch` or Algolia)
- [ ] `base` configured correctly for deployment path

## Content Structure

- [ ] Markdown files organized logically in directories matching sidebar sections
- [ ] `index.md` exists for each directory (section landing pages)
- [ ] File names are kebab-case and descriptive
- [ ] Frontmatter used for page titles and descriptions
- [ ] No orphan pages — every `.md` file reachable from sidebar or navigation

## Markdown Quality

- [ ] Headings follow hierarchy (h1 → h2 → h3, no skipped levels)
- [ ] Code blocks have language identifiers (` ```ts `, ` ```bash `, etc.)
- [ ] Code examples are runnable and up to date
- [ ] Links between pages use relative paths (`./guide/getting-started.md`)
- [ ] Images have alt text
- [ ] Tables formatted consistently

## Vue Components in Markdown

- [ ] Custom components in `.vitepress/theme/components/` registered globally or imported per-page
- [ ] Interactive examples don't break SSG — client-only logic wrapped appropriately
- [ ] Component props documented

## Theme Customization

- [ ] Custom theme extends default theme, not replaces (unless intentional)
- [ ] CSS variables used for theming (`.vitepress/theme/style.css`)
- [ ] Dark mode works correctly — no hardcoded colors
- [ ] Custom layouts follow VitePress slot system (`Layout`, `home`, `doc`, `page`)

## Web Design & Accessibility

- [ ] Semantic HTML: correct heading levels, landmark elements
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Interactive elements are keyboard-accessible
- [ ] Focus indicators visible
- [ ] No text embedded in images without alt text
- [ ] Responsive layout — readable on mobile
- [ ] Font sizes use relative units (`rem`), not fixed `px` for body text
- [ ] Page load performance: no unnecessary large assets
- [ ] External links open in new tab with `target="_blank" rel="noopener"`

## Deployment

- [ ] Build output is static HTML (`vitepress build`)
- [ ] `public/` directory used for static assets (robots.txt, favicons)
- [ ] 404 page configured
- [ ] Redirects handled for moved/renamed pages
