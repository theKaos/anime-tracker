# Anime Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js/React anime tracker (search, filter, watchlist with progress, detail pages) styled with the Tenji design tokens, tested with Vitest.

**Architecture:** Next.js App Router with Server Components fetching from the AniList GraphQL API for the initial page load (home + detail), client components for interactivity (filters, infinite scroll, watchlist state in `localStorage` via `useReducer` + Context). `lib/` holds framework-free, directly-testable logic; `components/` are presentational and receive data via props; `app/` only wires routing.

**Tech Stack:** Next.js 15 (App Router, TypeScript), React 19, Tailwind CSS v4, Vitest + React Testing Library + MSW, AniList GraphQL API (`https://graphql.anilist.co`), `localStorage` watchlist.

## Global Constraints

- Package manager: npm.
- Tailwind v4 — theme via `@theme` in `src/app/globals.css`, no `tailwind.config.js`.
- No server-side API proxy — all AniList calls (SSR and client-side infinite scroll) go through `src/lib/anilist/client.ts` directly, no key required.
- No pagination UI — infinite scroll only (`PAGE_SIZE = 20` per page).
- No state-management package (Redux/Zustand) — `useReducer` + Context only.
- No React Query — fetching goes through `lib/anilist/` directly, server and client.
- Dark/Light theme toggle uses only Orange `#F0531C` and Turquoise `#12B5A6` from Tenji as primary/secondary; all other neutrals (backgrounds, surfaces, text, borders) are defined fresh for both themes, not taken from Tenji.
- Typography: Space Grotesk (headings/UI/body), JetBrains Mono (meta: episode counts, score, format, genre tags).
- Radii: 4px cover images, 7px cards/buttons/chips, 11px large panels.
- Card shadow (`--shadow-lift`): `0 2px 4px #17161a12, 0 24px 44px -26px #17161a80`.
- `app/` contains only routing artifacts — no fetch logic, no reusable components.
- `components/` never calls `fetch` — receives data via props.
- `lib/` is framework-independent and directly unit-testable (no DOM required for pure logic).
- Tests live next to the code they test (`Foo.test.tsx` beside `Foo.tsx`); only fixtures/setup live under `src/test/`.
- Full spec: `docs/superpowers/specs/2026-08-08-anime-tracker-design.md`. Full file tree reference: `PROJEKTSTRUKTUR.md` (project root).

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `.prettierrc`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `next-env.d.ts`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `start`, `lint`, `test`, `test:watch`. Path alias `@/*` → `./src/*`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "anime-tracker",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "vitest": "^2.1.8",
    "@vitejs/plugin-react": "^4.3.4",
    "vite-tsconfig-paths": "^5.1.4",
    "jsdom": "^25.0.1",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/jest-dom": "^6.6.3",
    "msw": "^2.7.0",
    "eslint": "^9.17.0",
    "eslint-config-next": "^15.1.0",
    "prettier": "^3.4.2"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.ts`**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 's4.anilist.co' }],
  },
}

export default nextConfig
```

- [ ] **Step 4: Create `postcss.config.mjs`**

```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
```

- [ ] **Step 5: Create `eslint.config.mjs`**

```js
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

const eslintConfig = [...compat.extends('next/core-web-vitals', 'next/typescript')]

export default eslintConfig
```

- [ ] **Step 6: Create `.prettierrc`**

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100
}
```

- [ ] **Step 7: Create `.gitignore`**

```
node_modules/
.next/
out/
.env*.local
*.log
coverage/
.DS_Store
```

- [ ] **Step 8: Create `.env.example`**

```
NEXT_PUBLIC_ANILIST_URL=https://graphql.anilist.co
```

- [ ] **Step 9: Create `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 10: Install dependencies**

Run: `npm install`
Expected: installs without error, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs .prettierrc .gitignore .env.example next-env.d.ts
git commit -m "chore: scaffold Next.js project"
```

---

## Task 2: Tailwind v4 Theme (Tenji Tokens)

**Files:**
- Create: `src/app/globals.css`

**Interfaces:**
- Produces: Tailwind utilities `bg-primary`, `bg-secondary`, `text-secondary-ink`, `bg-bg`, `bg-surface`, `text-text`, `text-text-muted`, `border-border`, `rounded-image`, `rounded-card`, `rounded-panel`, `shadow-lift`, `text-meta`, `text-label`, `text-ui`, `text-body`, `text-lead`, `text-h2`, `text-display`, `font-sans`, `font-mono`. `.dark` class on `<html>` swaps `--color-bg`/`--color-surface`/`--color-text`/`--color-text-muted`/`--color-border`.

- [ ] **Step 1: Write `src/app/globals.css`**

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;

  --text-meta: 12px;
  --text-label: 13px;
  --text-ui: 15px;
  --text-body: 17px;
  --text-lead: 20px;
  --text-h2: 30px;
  --text-display: 56px;

  --color-primary: #F0531C;
  --color-secondary: #12B5A6;
  --color-secondary-ink: #0E7C72;
  --color-bg: #F7F7F5;
  --color-surface: #FFFFFF;
  --color-text: #17161A;
  --color-text-muted: #17161A99;
  --color-border: #17161A14;

  --radius-image: 4px;
  --radius-card: 7px;
  --radius-panel: 11px;

  --shadow-lift: 0 2px 4px #17161a12, 0 24px 44px -26px #17161a80;
}

.dark {
  --color-bg: #17161A;
  --color-surface: #1F1E22;
  --color-text: #ECEEEF;
  --color-text-muted: #ECEEEF99;
  --color-border: #FFFFFF1f;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add Tailwind v4 theme with Tenji tokens"
```

---

## Task 3: Test Infrastructure (Vitest + MSW)

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/test/mocks/fixtures/trending.json`
- Create: `src/test/mocks/fixtures/searchResult.json`
- Create: `src/test/mocks/fixtures/animeDetail.json`
- Create: `src/test/mocks/handlers.ts`
- Create: `src/test/mocks/server.ts`

**Interfaces:**
- Produces: `server` (MSW `SetupServer`) from `src/test/mocks/server.ts`, used by `vitest.setup.ts` and directly in tests that need per-test handler overrides (`server.use(...)`).
- Produces: raw AniList media fixtures shaped like `AniListMedia` (defined in Task 4): `{ id, title:{romaji,english,native}, coverImage:{large}, bannerImage, format, episodes, duration, seasonYear, season, genres, averageScore, popularity, status, studios:{nodes:[{name}]} }`, plus `description` and `relations.edges[].node` on `animeDetail.json`.

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    passWithNoTests: true,
  },
})
```

- [ ] **Step 2: Write fixture `src/test/mocks/fixtures/trending.json`**

```json
[
  {
    "id": 1,
    "title": { "romaji": "Shingeki no Kyojin", "english": "Attack on Titan", "native": "進撃の巨人" },
    "coverImage": { "large": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/1.jpg" },
    "bannerImage": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/1.jpg",
    "format": "TV",
    "episodes": 25,
    "duration": 24,
    "seasonYear": 2013,
    "season": "SPRING",
    "genres": ["Action", "Drama"],
    "averageScore": 85,
    "popularity": 500000,
    "status": "FINISHED",
    "studios": { "nodes": [{ "name": "Wit Studio" }] }
  },
  {
    "id": 2,
    "title": { "romaji": "Kimetsu no Yaiba", "english": "Demon Slayer", "native": "鬼滅の刃" },
    "coverImage": { "large": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/2.jpg" },
    "bannerImage": null,
    "format": "TV",
    "episodes": 26,
    "duration": 23,
    "seasonYear": 2019,
    "season": "SPRING",
    "genres": ["Action", "Fantasy"],
    "averageScore": 83,
    "popularity": 400000,
    "status": "FINISHED",
    "studios": { "nodes": [{ "name": "ufotable" }] }
  }
]
```

- [ ] **Step 3: Write fixture `src/test/mocks/fixtures/searchResult.json`**

```json
[
  {
    "id": 3,
    "title": { "romaji": "Bocchi the Rock!", "english": "Bocchi the Rock!", "native": "ぼっち・ざ・ろっく！" },
    "coverImage": { "large": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/3.jpg" },
    "bannerImage": null,
    "format": "TV",
    "episodes": 12,
    "duration": 24,
    "seasonYear": 2022,
    "season": "FALL",
    "genres": ["Comedy", "Music", "Slice of Life"],
    "averageScore": 88,
    "popularity": 200000,
    "status": "FINISHED",
    "studios": { "nodes": [{ "name": "CloverWorks" }] }
  }
]
```

- [ ] **Step 4: Write fixture `src/test/mocks/fixtures/animeDetail.json`**

```json
{
  "id": 1,
  "title": { "romaji": "Shingeki no Kyojin", "english": "Attack on Titan", "native": "進撃の巨人" },
  "coverImage": { "large": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/1.jpg" },
  "bannerImage": "https://s4.anilist.co/file/anilistcdn/media/anime/banner/1.jpg",
  "format": "TV",
  "episodes": 25,
  "duration": 24,
  "seasonYear": 2013,
  "season": "SPRING",
  "genres": ["Action", "Drama"],
  "averageScore": 85,
  "popularity": 500000,
  "status": "FINISHED",
  "studios": { "nodes": [{ "name": "Wit Studio" }] },
  "description": "<p>Humanity fights back.</p><script>alert(1)</script>",
  "relations": {
    "edges": [
      {
        "relationType": "SEQUEL",
        "node": {
          "id": 4,
          "title": { "romaji": "Shingeki no Kyojin Season 2", "english": "Attack on Titan Season 2", "native": "進撃の巨人2" },
          "coverImage": { "large": "https://s4.anilist.co/file/anilistcdn/media/anime/cover/4.jpg" },
          "bannerImage": null,
          "format": "TV",
          "episodes": 12,
          "duration": 24,
          "seasonYear": 2017,
          "season": "SPRING",
          "genres": ["Action", "Drama"],
          "averageScore": 87,
          "popularity": 300000,
          "status": "FINISHED",
          "studios": { "nodes": [{ "name": "Wit Studio" }] }
        }
      }
    ]
  }
}
```

- [ ] **Step 5: Write `src/test/mocks/handlers.ts`**

```ts
import { http, HttpResponse } from 'msw'
import { ANILIST_API_URL } from '@/constants/config'
import trending from './fixtures/trending.json'
import searchResult from './fixtures/searchResult.json'
import animeDetail from './fixtures/animeDetail.json'

export const handlers = [
  http.post(ANILIST_API_URL, async ({ request }) => {
    const body = (await request.json()) as { query: string; variables: Record<string, unknown> }

    if (body.query.includes('Media(id:')) {
      return HttpResponse.json({ data: { Media: animeDetail } })
    }

    if (body.variables.search) {
      return HttpResponse.json({
        data: { Page: { pageInfo: { hasNextPage: false }, media: searchResult } },
      })
    }

    return HttpResponse.json({
      data: { Page: { pageInfo: { hasNextPage: true }, media: trending } },
    })
  }),
]
```

- [ ] **Step 6: Write `src/test/mocks/server.ts`**

```ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

- [ ] **Step 7: Write `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './src/test/mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  window.localStorage.clear()
})
afterAll(() => server.close())
```

Note: `src/constants/config.ts` (with `ANILIST_API_URL`) is created in Task 4. Since `handlers.ts` imports it, this task's tests cannot run standalone until Task 4 lands — that's expected; verify with `npm run test` after Task 4 instead. For now, verify the project still type-checks structurally.

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts vitest.setup.ts src/test/mocks
git commit -m "test: add Vitest and MSW test infrastructure"
```

---

## Task 4: Core Types and Constants

**Files:**
- Create: `src/types/anime.ts`
- Create: `src/types/watchlist.ts`
- Create: `src/types/filters.ts`
- Create: `src/types/anilist.ts`
- Create: `src/constants/genres.ts`
- Create: `src/constants/formats.ts`
- Create: `src/constants/seasons.ts`
- Create: `src/constants/config.ts`

**Interfaces:**
- Produces: `Anime`, `AnimeDetail`, `AnimeTitle`, `MediaFormat`, `MediaSeason` (`src/types/anime.ts`); `WatchStatus`, `WatchlistEntry` (`src/types/watchlist.ts`); `SortOption`, `SearchFilters` (`src/types/filters.ts`); `AniListMedia`, `AniListPageResponse`, `AniListMediaResponse` (`src/types/anilist.ts`); `GENRES` (`src/constants/genres.ts`); `FORMATS` (`src/constants/formats.ts`); `SEASONS` (`src/constants/seasons.ts`); `PAGE_SIZE`, `STORAGE_KEY`, `ANILIST_API_URL`, `DEBOUNCE_MS` (`src/constants/config.ts`).

- [ ] **Step 1: Write `src/types/anime.ts`**

```ts
export type MediaFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC'
export type MediaSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'

export interface AnimeTitle {
  romaji: string
  english: string | null
  native: string
}

export interface Anime {
  id: number
  title: AnimeTitle
  coverImage: string
  bannerImage: string | null
  format: MediaFormat | null
  episodes: number | null
  duration: number | null
  seasonYear: number | null
  season: MediaSeason | null
  genres: string[]
  averageScore: number | null
  popularity: number | null
  status: string | null
  studios: string[]
  description: string | null
}

export interface AnimeDetail extends Anime {
  relations: Anime[]
}
```

- [ ] **Step 2: Write `src/types/watchlist.ts`**

```ts
import type { Anime } from './anime'

export type WatchStatus = 'PLANNING' | 'WATCHING' | 'COMPLETED' | 'PAUSED' | 'DROPPED'

export interface WatchlistEntry {
  animeId: number
  status: WatchStatus
  progress: number
  totalEpisodes: number | null
  addedAt: string
  updatedAt: string
  snapshot: Pick<Anime, 'title' | 'coverImage' | 'format'>
}
```

- [ ] **Step 3: Write `src/types/filters.ts`**

```ts
import type { MediaFormat, MediaSeason } from './anime'

export type SortOption = 'TRENDING_DESC' | 'POPULARITY_DESC' | 'SCORE_DESC' | 'START_DATE_DESC'

export interface SearchFilters {
  search: string
  year: number | null
  season: MediaSeason | null
  format: MediaFormat | null
  genres: string[]
  sort: SortOption
  page: number
}
```

- [ ] **Step 4: Write `src/types/anilist.ts`**

```ts
export interface AniListTitle {
  romaji: string
  english: string | null
  native: string
}

export interface AniListStudioNode {
  name: string
}

export interface AniListMedia {
  id: number
  title: AniListTitle
  coverImage: { large: string | null }
  bannerImage: string | null
  format: string | null
  episodes: number | null
  duration: number | null
  seasonYear: number | null
  season: string | null
  genres: string[]
  averageScore: number | null
  popularity: number | null
  status: string | null
  studios: { nodes: AniListStudioNode[] }
  description?: string | null
  relations?: { edges: { relationType: string; node: AniListMedia }[] }
}

export interface AniListPageResponse {
  Page: {
    pageInfo: { hasNextPage: boolean }
    media: AniListMedia[]
  }
}

export interface AniListMediaResponse {
  Media: AniListMedia
}
```

- [ ] **Step 5: Write `src/constants/genres.ts`**

```ts
export const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
  'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
  'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
] as const
```

- [ ] **Step 6: Write `src/constants/formats.ts`**

```ts
import type { MediaFormat } from '@/types/anime'

export const FORMATS: { value: MediaFormat; label: string }[] = [
  { value: 'TV', label: 'TV' },
  { value: 'TV_SHORT', label: 'TV Short' },
  { value: 'MOVIE', label: 'Movie' },
  { value: 'SPECIAL', label: 'Special' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'MUSIC', label: 'Music' },
]
```

- [ ] **Step 7: Write `src/constants/seasons.ts`**

```ts
import type { MediaSeason } from '@/types/anime'

export const SEASONS: { value: MediaSeason; label: string }[] = [
  { value: 'WINTER', label: 'Winter' },
  { value: 'SPRING', label: 'Spring' },
  { value: 'SUMMER', label: 'Summer' },
  { value: 'FALL', label: 'Fall' },
]
```

- [ ] **Step 8: Write `src/constants/config.ts`**

```ts
export const PAGE_SIZE = 20
export const STORAGE_KEY = 'anime-tracker:watchlist:v1'
export const ANILIST_API_URL = 'https://graphql.anilist.co'
export const DEBOUNCE_MS = 400
```

- [ ] **Step 9: Verify test infra now runs**

Run: `npm run test`
Expected: passes (no test files yet, `passWithNoTests: true`).

- [ ] **Step 10: Commit**

```bash
git add src/types src/constants
git commit -m "feat: add core types and constants"
```

---

## Task 5: `lib/utils` — Pure Helpers

**Files:**
- Create: `src/lib/utils/cn.ts`
- Create: `src/lib/utils/cn.test.ts`
- Create: `src/lib/utils/format.ts`
- Create: `src/lib/utils/format.test.ts`
- Create: `src/lib/utils/sanitize.ts`
- Create: `src/lib/utils/sanitize.test.ts`
- Create: `src/lib/utils/searchParams.ts`
- Create: `src/lib/utils/searchParams.test.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string`; `formatSeasonYear(year: number|null, season: MediaSeason|null): string`, `formatDuration(minutes: number|null): string`, `formatScore(score: number|null): string`; `sanitizeHtml(html: string): string`; `DEFAULT_FILTERS: SearchFilters`, `parseSearchParams(params: URLSearchParams): SearchFilters`, `filtersToSearchParams(filters: SearchFilters): URLSearchParams`.

- [ ] **Step 1: Write failing tests**

`src/lib/utils/cn.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, 'b')).toBe('a b')
  })
})
```

`src/lib/utils/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { formatDuration, formatScore, formatSeasonYear } from './format'

describe('formatSeasonYear', () => {
  it('formats season and year', () => {
    expect(formatSeasonYear(2013, 'SPRING')).toBe('Spring 2013')
  })

  it('falls back to year only when season missing', () => {
    expect(formatSeasonYear(2013, null)).toBe('2013')
  })

  it('falls back to Unbekannt when both missing', () => {
    expect(formatSeasonYear(null, null)).toBe('Unbekannt')
  })
})

describe('formatDuration', () => {
  it('appends min', () => {
    expect(formatDuration(24)).toBe('24 min')
  })

  it('returns dash for null', () => {
    expect(formatDuration(null)).toBe('—')
  })
})

describe('formatScore', () => {
  it('converts 0-100 to 0-10 scale', () => {
    expect(formatScore(85)).toBe('8.5')
  })

  it('returns dash for null', () => {
    expect(formatScore(null)).toBe('—')
  })
})
```

`src/lib/utils/sanitize.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from './sanitize'

describe('sanitizeHtml', () => {
  it('strips script tags and their content', () => {
    expect(sanitizeHtml('<p>Hi</p><script>alert(1)</script>')).toBe('<p>Hi</p>')
  })

  it('strips attributes from allowed tags', () => {
    expect(sanitizeHtml('<b onclick="evil()">Hi</b>')).toBe('<b>Hi</b>')
  })

  it('removes disallowed tags but keeps their text', () => {
    expect(sanitizeHtml('<div>Hello</div>')).toBe('Hello')
  })

  it('keeps allowed tags without attributes', () => {
    expect(sanitizeHtml('Line1<br>Line2')).toBe('Line1<br>Line2')
  })
})
```

`src/lib/utils/searchParams.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_FILTERS, filtersToSearchParams, parseSearchParams } from './searchParams'

describe('parseSearchParams', () => {
  it('returns defaults for empty params', () => {
    expect(parseSearchParams(new URLSearchParams())).toEqual(DEFAULT_FILTERS)
  })

  it('parses all filter fields', () => {
    const params = new URLSearchParams(
      'search=bocchi&year=2022&season=FALL&format=TV&genres=Comedy,Music&sort=SCORE_DESC'
    )
    expect(parseSearchParams(params)).toEqual({
      search: 'bocchi',
      year: 2022,
      season: 'FALL',
      format: 'TV',
      genres: ['Comedy', 'Music'],
      sort: 'SCORE_DESC',
      page: 1,
    })
  })
})

describe('filtersToSearchParams', () => {
  it('omits default values', () => {
    expect(filtersToSearchParams(DEFAULT_FILTERS).toString()).toBe('')
  })

  it('includes set values', () => {
    const params = filtersToSearchParams({
      ...DEFAULT_FILTERS,
      search: 'bocchi',
      year: 2022,
      genres: ['Comedy'],
    })
    expect(params.get('search')).toBe('bocchi')
    expect(params.get('year')).toBe('2022')
    expect(params.get('genres')).toBe('Comedy')
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm run test`
Expected: FAIL — `cn`, `format*`, `sanitizeHtml`, `parseSearchParams`, `filtersToSearchParams` not defined (modules don't exist yet).

- [ ] **Step 3: Write `src/lib/utils/cn.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4: Write `src/lib/utils/format.ts`**

```ts
import type { MediaSeason } from '@/types/anime'

const SEASON_LABELS: Record<MediaSeason, string> = {
  WINTER: 'Winter',
  SPRING: 'Spring',
  SUMMER: 'Summer',
  FALL: 'Fall',
}

export function formatSeasonYear(year: number | null, season: MediaSeason | null): string {
  if (!year && !season) return 'Unbekannt'
  if (!season) return String(year)
  return `${SEASON_LABELS[season]} ${year ?? ''}`.trim()
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return '—'
  return `${minutes} min`
}

export function formatScore(score: number | null): string {
  if (score === null) return '—'
  return (score / 10).toFixed(1)
}
```

- [ ] **Step 5: Write `src/lib/utils/sanitize.ts`**

```ts
const ALLOWED_TAGS = new Set(['br', 'b', 'i', 'strong', 'em', 'p'])

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tagName: string) => {
      const tag = tagName.toLowerCase()
      if (!ALLOWED_TAGS.has(tag)) return ''
      const isClosing = match.startsWith('</')
      return isClosing ? `</${tag}>` : `<${tag}>`
    })
}
```

- [ ] **Step 6: Write `src/lib/utils/searchParams.ts`**

```ts
import type { SearchFilters } from '@/types/filters'
import type { MediaFormat, MediaSeason } from '@/types/anime'

export const DEFAULT_FILTERS: SearchFilters = {
  search: '',
  year: null,
  season: null,
  format: null,
  genres: [],
  sort: 'TRENDING_DESC',
  page: 1,
}

export function parseSearchParams(params: URLSearchParams): SearchFilters {
  const year = params.get('year')
  const genres = params.get('genres')
  return {
    search: params.get('search') ?? DEFAULT_FILTERS.search,
    year: year ? Number(year) : null,
    season: (params.get('season') as MediaSeason | null) ?? null,
    format: (params.get('format') as MediaFormat | null) ?? null,
    genres: genres ? genres.split(',').filter(Boolean) : [],
    sort: (params.get('sort') as SearchFilters['sort']) ?? DEFAULT_FILTERS.sort,
    page: 1,
  }
}

export function filtersToSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.year) params.set('year', String(filters.year))
  if (filters.season) params.set('season', filters.season)
  if (filters.format) params.set('format', filters.format)
  if (filters.genres.length) params.set('genres', filters.genres.join(','))
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set('sort', filters.sort)
  return params
}
```

- [ ] **Step 7: Run tests, verify they pass**

Run: `npm run test`
Expected: PASS — all `lib/utils` tests green.

- [ ] **Step 8: Commit**

```bash
git add src/lib/utils
git commit -m "feat: add lib/utils pure helpers"
```

---

## Task 6: `lib/anilist` — API Client

**Files:**
- Create: `src/lib/anilist/errors.ts`
- Create: `src/lib/anilist/queries.ts`
- Create: `src/lib/anilist/mappers.ts`
- Create: `src/lib/anilist/mappers.test.ts`
- Create: `src/lib/anilist/client.ts`
- Create: `src/lib/anilist/client.test.ts`

**Interfaces:**
- Consumes: `Anime`, `AnimeDetail`, `MediaFormat`, `MediaSeason` (Task 4 `src/types/anime.ts`); `AniListMedia` (Task 4 `src/types/anilist.ts`); `SearchFilters` (Task 4 `src/types/filters.ts`); `PAGE_SIZE`, `ANILIST_API_URL` (Task 4 `src/constants/config.ts`); MSW `server` (Task 3 `src/test/mocks/server.ts`).
- Produces: `AniListError` (class, `status: number`); `mapMediaToAnime(media: AniListMedia): Anime`, `mapMediaToAnimeDetail(media: AniListMedia): AnimeDetail`; `fetchAnimeList(filters: SearchFilters): Promise<{ anime: Anime[]; hasNextPage: boolean }>`, `fetchAnimeById(id: number): Promise<AnimeDetail>`.

- [ ] **Step 1: Write `src/lib/anilist/errors.ts`**

```ts
export class AniListError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AniListError'
    this.status = status
  }
}
```

- [ ] **Step 2: Write `src/lib/anilist/queries.ts`**

```ts
export const MEDIA_FIELDS = `
  id
  title { romaji english native }
  coverImage { large }
  bannerImage
  format
  episodes
  duration
  seasonYear
  season
  genres
  averageScore
  popularity
  status
  studios(isMain: true) { nodes { name } }
`

export const SEARCH_ANIME_QUERY = `
  query (
    $page: Int
    $perPage: Int
    $search: String
    $seasonYear: Int
    $season: MediaSeason
    $format: MediaFormat
    $genres: [String]
    $sort: [MediaSort]
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(
        type: ANIME
        search: $search
        seasonYear: $seasonYear
        season: $season
        format: $format
        genre_in: $genres
        sort: $sort
      ) {
        ${MEDIA_FIELDS}
      }
    }
  }
`

export const ANIME_BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      ${MEDIA_FIELDS}
      description(asHtml: true)
      relations {
        edges {
          relationType
          node { ${MEDIA_FIELDS} }
        }
      }
    }
  }
`
```

- [ ] **Step 3: Write failing test `src/lib/anilist/mappers.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { mapMediaToAnime, mapMediaToAnimeDetail } from './mappers'
import type { AniListMedia } from '@/types/anilist'

const baseMedia: AniListMedia = {
  id: 1,
  title: { romaji: 'Test Romaji', english: 'Test English', native: 'テスト' },
  coverImage: { large: 'https://example.com/cover.jpg' },
  bannerImage: null,
  format: 'TV',
  episodes: 12,
  duration: 24,
  seasonYear: 2020,
  season: 'FALL',
  genres: ['Action'],
  averageScore: 80,
  popularity: 1000,
  status: 'FINISHED',
  studios: { nodes: [{ name: 'Test Studio' }] },
}

describe('mapMediaToAnime', () => {
  it('maps AniList media to the internal Anime model', () => {
    expect(mapMediaToAnime(baseMedia)).toEqual({
      id: 1,
      title: { romaji: 'Test Romaji', english: 'Test English', native: 'テスト' },
      coverImage: 'https://example.com/cover.jpg',
      bannerImage: null,
      format: 'TV',
      episodes: 12,
      duration: 24,
      seasonYear: 2020,
      season: 'FALL',
      genres: ['Action'],
      averageScore: 80,
      popularity: 1000,
      status: 'FINISHED',
      studios: ['Test Studio'],
      description: null,
    })
  })

  it('falls back to placeholder cover when missing', () => {
    const media = { ...baseMedia, coverImage: { large: null } }
    expect(mapMediaToAnime(media).coverImage).toBe('/placeholder-cover.svg')
  })
})

describe('mapMediaToAnimeDetail', () => {
  it('maps relations edges to Anime[]', () => {
    const media: AniListMedia = {
      ...baseMedia,
      description: '<p>Desc</p>',
      relations: { edges: [{ relationType: 'SEQUEL', node: { ...baseMedia, id: 2 } }] },
    }
    const detail = mapMediaToAnimeDetail(media)
    expect(detail.description).toBe('<p>Desc</p>')
    expect(detail.relations).toHaveLength(1)
    expect(detail.relations[0].id).toBe(2)
  })

  it('returns empty relations array when none present', () => {
    expect(mapMediaToAnimeDetail(baseMedia).relations).toEqual([])
  })
})
```

- [ ] **Step 4: Run test, verify it fails**

Run: `npm run test -- mappers`
Expected: FAIL — `./mappers` module not found.

- [ ] **Step 5: Write `src/lib/anilist/mappers.ts`**

```ts
import type { Anime, AnimeDetail, MediaFormat, MediaSeason } from '@/types/anime'
import type { AniListMedia } from '@/types/anilist'

export function mapMediaToAnime(media: AniListMedia): Anime {
  return {
    id: media.id,
    title: {
      romaji: media.title.romaji,
      english: media.title.english,
      native: media.title.native,
    },
    coverImage: media.coverImage.large ?? '/placeholder-cover.svg',
    bannerImage: media.bannerImage,
    format: (media.format as MediaFormat) ?? null,
    episodes: media.episodes,
    duration: media.duration,
    seasonYear: media.seasonYear,
    season: (media.season as MediaSeason) ?? null,
    genres: media.genres,
    averageScore: media.averageScore,
    popularity: media.popularity,
    status: media.status,
    studios: media.studios.nodes.map((studio) => studio.name),
    description: media.description ?? null,
  }
}

export function mapMediaToAnimeDetail(media: AniListMedia): AnimeDetail {
  return {
    ...mapMediaToAnime(media),
    relations: (media.relations?.edges ?? []).map((edge) => mapMediaToAnime(edge.node)),
  }
}
```

- [ ] **Step 6: Run test, verify it passes**

Run: `npm run test -- mappers`
Expected: PASS.

- [ ] **Step 7: Write failing test `src/lib/anilist/client.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { HttpResponse, http } from 'msw'
import { server } from '@/test/mocks/server'
import { ANILIST_API_URL } from '@/constants/config'
import { DEFAULT_FILTERS } from '@/lib/utils/searchParams'
import { fetchAnimeById, fetchAnimeList } from './client'
import { AniListError } from './errors'

describe('fetchAnimeList', () => {
  it('returns trending anime by default', async () => {
    const result = await fetchAnimeList({ ...DEFAULT_FILTERS, page: 1 })
    expect(result.anime.length).toBeGreaterThan(0)
    expect(result.hasNextPage).toBe(true)
    expect(result.anime[0].title.english).toBe('Attack on Titan')
  })

  it('returns search results when search is set', async () => {
    const result = await fetchAnimeList({ ...DEFAULT_FILTERS, search: 'bocchi', page: 1 })
    expect(result.anime[0].title.romaji).toBe('Bocchi the Rock!')
  })

  it('throws AniListError on non-OK response', async () => {
    server.use(
      http.post(ANILIST_API_URL, () =>
        HttpResponse.json({ errors: [{ message: 'Rate limited' }] }, { status: 429 })
      )
    )
    await expect(fetchAnimeList(DEFAULT_FILTERS)).rejects.toBeInstanceOf(AniListError)
  })
})

describe('fetchAnimeById', () => {
  it('returns anime detail with relations', async () => {
    const detail = await fetchAnimeById(1)
    expect(detail.title.english).toBe('Attack on Titan')
    expect(detail.relations).toHaveLength(1)
  })
})
```

- [ ] **Step 8: Run test, verify it fails**

Run: `npm run test -- client`
Expected: FAIL — `./client` module not found.

- [ ] **Step 9: Write `src/lib/anilist/client.ts`**

```ts
import type { Anime, AnimeDetail } from '@/types/anime'
import type { SearchFilters } from '@/types/filters'
import type { AniListMediaResponse, AniListPageResponse } from '@/types/anilist'
import { ANILIST_API_URL, PAGE_SIZE } from '@/constants/config'
import { mapMediaToAnime, mapMediaToAnimeDetail } from './mappers'
import { ANIME_BY_ID_QUERY, SEARCH_ANIME_QUERY } from './queries'
import { AniListError } from './errors'

async function graphqlRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  })

  const json = await response.json()

  if (!response.ok || json.errors) {
    const message = json.errors?.[0]?.message ?? 'AniList request failed'
    throw new AniListError(message, response.status)
  }

  return json.data as T
}

export async function fetchAnimeList(
  filters: SearchFilters
): Promise<{ anime: Anime[]; hasNextPage: boolean }> {
  const data = await graphqlRequest<AniListPageResponse>(SEARCH_ANIME_QUERY, {
    page: filters.page,
    perPage: PAGE_SIZE,
    search: filters.search || undefined,
    seasonYear: filters.year ?? undefined,
    season: filters.season ?? undefined,
    format: filters.format ?? undefined,
    genres: filters.genres.length ? filters.genres : undefined,
    sort: [filters.sort],
  })

  return {
    anime: data.Page.media.map(mapMediaToAnime),
    hasNextPage: data.Page.pageInfo.hasNextPage,
  }
}

export async function fetchAnimeById(id: number): Promise<AnimeDetail> {
  const data = await graphqlRequest<AniListMediaResponse>(ANIME_BY_ID_QUERY, { id })
  return mapMediaToAnimeDetail(data.Media)
}
```

- [ ] **Step 10: Run test, verify it passes**

Run: `npm run test -- client`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add src/lib/anilist
git commit -m "feat: add AniList GraphQL client, queries, mappers"
```

---

## Task 7: `lib/watchlist` — Reducer and Storage

**Files:**
- Create: `src/lib/watchlist/reducer.ts`
- Create: `src/lib/watchlist/reducer.test.ts`
- Create: `src/lib/watchlist/storage.ts`
- Create: `src/lib/watchlist/storage.test.ts`

**Interfaces:**
- Consumes: `WatchlistEntry`, `WatchStatus` (Task 4 `src/types/watchlist.ts`); `STORAGE_KEY` (Task 4 `src/constants/config.ts`).
- Produces: `WatchlistAction` (union type), `watchlistReducer(state: WatchlistEntry[], action: WatchlistAction): WatchlistEntry[]`; `loadWatchlist(): WatchlistEntry[]`, `saveWatchlist(entries: WatchlistEntry[]): void`.

- [ ] **Step 1: Write failing test `src/lib/watchlist/reducer.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { watchlistReducer } from './reducer'
import type { WatchlistEntry } from '@/types/watchlist'

const entry: WatchlistEntry = {
  animeId: 1,
  status: 'PLANNING',
  progress: 0,
  totalEpisodes: 12,
  addedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  snapshot: { title: { romaji: 'Test', english: null, native: 'テスト' }, coverImage: '/cover.jpg', format: 'TV' },
}

describe('watchlistReducer', () => {
  it('adds a new entry', () => {
    expect(watchlistReducer([], { type: 'ADD', entry })).toEqual([entry])
  })

  it('does not add a duplicate entry', () => {
    expect(watchlistReducer([entry], { type: 'ADD', entry })).toEqual([entry])
  })

  it('removes an entry', () => {
    expect(watchlistReducer([entry], { type: 'REMOVE', animeId: 1 })).toEqual([])
  })

  it('updates progress', () => {
    const result = watchlistReducer([entry], { type: 'SET_PROGRESS', animeId: 1, progress: 5 })
    expect(result[0].progress).toBe(5)
  })

  it('updates status', () => {
    const result = watchlistReducer([entry], { type: 'SET_STATUS', animeId: 1, status: 'WATCHING' })
    expect(result[0].status).toBe('WATCHING')
  })

  it('hydrates from stored entries', () => {
    expect(watchlistReducer([], { type: 'HYDRATE', entries: [entry] })).toEqual([entry])
  })
})
```

- [ ] **Step 2: Write failing test `src/lib/watchlist/storage.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { loadWatchlist, saveWatchlist } from './storage'
import { STORAGE_KEY } from '@/constants/config'
import type { WatchlistEntry } from '@/types/watchlist'

const entry: WatchlistEntry = {
  animeId: 1,
  status: 'PLANNING',
  progress: 0,
  totalEpisodes: 12,
  addedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  snapshot: { title: { romaji: 'Test', english: null, native: 'テスト' }, coverImage: '/cover.jpg', format: 'TV' },
}

describe('storage', () => {
  it('returns empty array when nothing stored', () => {
    expect(loadWatchlist()).toEqual([])
  })

  it('saves and loads entries', () => {
    saveWatchlist([entry])
    expect(loadWatchlist()).toEqual([entry])
  })

  it('returns empty array for corrupted data', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadWatchlist()).toEqual([])
  })
})
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `npm run test -- watchlist`
Expected: FAIL — `./reducer` and `./storage` modules not found.

- [ ] **Step 4: Write `src/lib/watchlist/reducer.ts`**

```ts
import type { WatchlistEntry, WatchStatus } from '@/types/watchlist'

export type WatchlistAction =
  | { type: 'ADD'; entry: WatchlistEntry }
  | { type: 'REMOVE'; animeId: number }
  | { type: 'SET_PROGRESS'; animeId: number; progress: number }
  | { type: 'SET_STATUS'; animeId: number; status: WatchStatus }
  | { type: 'HYDRATE'; entries: WatchlistEntry[] }

export function watchlistReducer(state: WatchlistEntry[], action: WatchlistAction): WatchlistEntry[] {
  switch (action.type) {
    case 'ADD':
      if (state.some((entry) => entry.animeId === action.entry.animeId)) return state
      return [...state, action.entry]
    case 'REMOVE':
      return state.filter((entry) => entry.animeId !== action.animeId)
    case 'SET_PROGRESS':
      return state.map((entry) =>
        entry.animeId === action.animeId
          ? { ...entry, progress: action.progress, updatedAt: new Date().toISOString() }
          : entry
      )
    case 'SET_STATUS':
      return state.map((entry) =>
        entry.animeId === action.animeId
          ? { ...entry, status: action.status, updatedAt: new Date().toISOString() }
          : entry
      )
    case 'HYDRATE':
      return action.entries
    default:
      return state
  }
}
```

- [ ] **Step 5: Write `src/lib/watchlist/storage.ts`**

```ts
import type { WatchlistEntry } from '@/types/watchlist'
import { STORAGE_KEY } from '@/constants/config'

export function loadWatchlist(): WatchlistEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveWatchlist(entries: WatchlistEntry[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `npm run test -- watchlist`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/watchlist
git commit -m "feat: add watchlist reducer and localStorage persistence"
```

---

## Task 8: Watchlist Context, Hook, and Test Render Helper

**Files:**
- Create: `src/context/WatchlistProvider.tsx`
- Create: `src/context/WatchlistProvider.test.tsx`
- Create: `src/hooks/useWatchlist.ts`
- Create: `src/test/utils/renderWithProviders.tsx`

**Interfaces:**
- Consumes: `Anime` (Task 4); `WatchlistEntry`, `WatchStatus` (Task 4); `watchlistReducer` (Task 7 `src/lib/watchlist/reducer.ts`); `loadWatchlist`, `saveWatchlist` (Task 7 `src/lib/watchlist/storage.ts`).
- Produces: `WatchlistContext: React.Context<WatchlistContextValue | null>`, `WatchlistProvider({ children }: { children: ReactNode })`, `WatchlistContextValue` interface (`entries: WatchlistEntry[]`, `addToWatchlist(anime: Anime): void`, `removeFromWatchlist(animeId: number): void`, `setProgress(animeId: number, progress: number): void`, `setStatus(animeId: number, status: WatchStatus): void`, `isInWatchlist(animeId: number): boolean`) — all in `src/context/WatchlistProvider.tsx`; `useWatchlist(): WatchlistContextValue` (`src/hooks/useWatchlist.ts`); `renderWithProviders(ui: ReactElement, options?): RenderResult` (`src/test/utils/renderWithProviders.tsx`, re-exports everything from `@testing-library/react`).

- [ ] **Step 1: Write failing test `src/context/WatchlistProvider.test.tsx`**

```tsx
import { describe, expect, it } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { WatchlistProvider } from './WatchlistProvider'
import { useWatchlist } from '@/hooks/useWatchlist'
import type { Anime } from '@/types/anime'

const anime: Anime = {
  id: 1,
  title: { romaji: 'Test', english: 'Test English', native: 'テスト' },
  coverImage: '/cover.jpg',
  bannerImage: null,
  format: 'TV',
  episodes: 12,
  duration: 24,
  seasonYear: 2020,
  season: 'FALL',
  genres: [],
  averageScore: 80,
  popularity: 100,
  status: 'FINISHED',
  studios: [],
  description: null,
}

function wrapper({ children }: { children: ReactNode }) {
  return <WatchlistProvider>{children}</WatchlistProvider>
}

describe('WatchlistProvider', () => {
  it('starts empty and adds an anime', async () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper })
    await waitFor(() => expect(result.current.entries).toEqual([]))

    act(() => result.current.addToWatchlist(anime))

    expect(result.current.entries).toHaveLength(1)
    expect(result.current.entries[0].animeId).toBe(1)
    expect(result.current.isInWatchlist(1)).toBe(true)
  })

  it('updates progress and status', () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper })
    act(() => result.current.addToWatchlist(anime))
    act(() => result.current.setProgress(1, 4))
    act(() => result.current.setStatus(1, 'WATCHING'))

    expect(result.current.entries[0].progress).toBe(4)
    expect(result.current.entries[0].status).toBe('WATCHING')
  })

  it('removes an anime', () => {
    const { result } = renderHook(() => useWatchlist(), { wrapper })
    act(() => result.current.addToWatchlist(anime))
    act(() => result.current.removeFromWatchlist(1))

    expect(result.current.entries).toEqual([])
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -- WatchlistProvider`
Expected: FAIL — `./WatchlistProvider` and `@/hooks/useWatchlist` not found.

- [ ] **Step 3: Write `src/context/WatchlistProvider.tsx`**

```tsx
'use client'

import { createContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import type { Anime } from '@/types/anime'
import type { WatchlistEntry, WatchStatus } from '@/types/watchlist'
import { watchlistReducer } from '@/lib/watchlist/reducer'
import { loadWatchlist, saveWatchlist } from '@/lib/watchlist/storage'

export interface WatchlistContextValue {
  entries: WatchlistEntry[]
  addToWatchlist: (anime: Anime) => void
  removeFromWatchlist: (animeId: number) => void
  setProgress: (animeId: number, progress: number) => void
  setStatus: (animeId: number, status: WatchStatus) => void
  isInWatchlist: (animeId: number) => boolean
}

export const WatchlistContext = createContext<WatchlistContextValue | null>(null)

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [entries, dispatch] = useReducer(watchlistReducer, [])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    dispatch({ type: 'HYDRATE', entries: loadWatchlist() })
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveWatchlist(entries)
  }, [entries, hydrated])

  const value: WatchlistContextValue = {
    entries,
    addToWatchlist: (anime) =>
      dispatch({
        type: 'ADD',
        entry: {
          animeId: anime.id,
          status: 'PLANNING',
          progress: 0,
          totalEpisodes: anime.episodes,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          snapshot: { title: anime.title, coverImage: anime.coverImage, format: anime.format },
        },
      }),
    removeFromWatchlist: (animeId) => dispatch({ type: 'REMOVE', animeId }),
    setProgress: (animeId, progress) => dispatch({ type: 'SET_PROGRESS', animeId, progress }),
    setStatus: (animeId, status) => dispatch({ type: 'SET_STATUS', animeId, status }),
    isInWatchlist: (animeId) => entries.some((entry) => entry.animeId === animeId),
  }

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
}
```

- [ ] **Step 4: Write `src/hooks/useWatchlist.ts`**

```ts
import { useContext } from 'react'
import { WatchlistContext, type WatchlistContextValue } from '@/context/WatchlistProvider'

export function useWatchlist(): WatchlistContextValue {
  const context = useContext(WatchlistContext)
  if (!context) throw new Error('useWatchlist must be used within WatchlistProvider')
  return context
}
```

- [ ] **Step 5: Run test, verify it passes**

Run: `npm run test -- WatchlistProvider`
Expected: PASS.

- [ ] **Step 6: Write `src/test/utils/renderWithProviders.tsx`**

```tsx
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { WatchlistProvider } from '@/context/WatchlistProvider'

function AllProviders({ children }: { children: ReactNode }) {
  return <WatchlistProvider>{children}</WatchlistProvider>
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
```

- [ ] **Step 7: Commit**

```bash
git add src/context src/hooks/useWatchlist.ts src/test/utils
git commit -m "feat: add WatchlistProvider context and useWatchlist hook"
```

---

## Task 9: `useDebounce` and `useAnimeSearch` Hooks

**Files:**
- Create: `src/hooks/useDebounce.ts`
- Create: `src/hooks/useDebounce.test.ts`
- Create: `src/hooks/useAnimeSearch.ts`
- Create: `src/hooks/useAnimeSearch.test.ts`

**Interfaces:**
- Consumes: `Anime` (Task 4); `SearchFilters` (Task 4); `fetchAnimeList` (Task 6 `src/lib/anilist/client.ts`); `DEFAULT_FILTERS` (Task 5 `src/lib/utils/searchParams.ts`).
- Produces: `useDebounce<T>(value: T, delayMs: number): T`; `useAnimeSearch(initialAnime: Anime[], initialHasNextPage: boolean, filters: SearchFilters): { anime: Anime[]; hasNextPage: boolean; isLoading: boolean; loadMore: () => void }`.

- [ ] **Step 1: Write failing test `src/hooks/useDebounce.test.ts`**

```ts
import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  it('delays updating the returned value', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe('b')

    vi.useRealTimers()
  })
})
```

- [ ] **Step 2: Write failing test `src/hooks/useAnimeSearch.test.ts`**

```tsx
import { describe, expect, it } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAnimeSearch } from './useAnimeSearch'
import { DEFAULT_FILTERS } from '@/lib/utils/searchParams'
import type { Anime } from '@/types/anime'

const initialAnime: Anime[] = [
  {
    id: 1,
    title: { romaji: 'First', english: null, native: 'ファースト' },
    coverImage: '/cover.jpg',
    bannerImage: null,
    format: 'TV',
    episodes: 12,
    duration: 24,
    seasonYear: 2020,
    season: 'FALL',
    genres: [],
    averageScore: 80,
    popularity: 100,
    status: 'FINISHED',
    studios: [],
    description: null,
  },
]

describe('useAnimeSearch', () => {
  it('starts with the initial page and appends loadMore results', async () => {
    const { result } = renderHook(() => useAnimeSearch(initialAnime, true, DEFAULT_FILTERS))

    expect(result.current.anime).toHaveLength(1)
    expect(result.current.hasNextPage).toBe(true)

    act(() => result.current.loadMore())

    await waitFor(() => expect(result.current.anime.length).toBeGreaterThan(1))
    expect(result.current.hasNextPage).toBe(true)
  })

  it('resets when initialAnime changes (new filters)', () => {
    const { result, rerender } = renderHook(
      ({ initial }) => useAnimeSearch(initial, true, DEFAULT_FILTERS),
      { initialProps: { initial: initialAnime } }
    )

    const secondPage: Anime[] = []
    rerender({ initial: secondPage })

    expect(result.current.anime).toEqual(secondPage)
  })
})
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `npm run test -- useDebounce useAnimeSearch`
Expected: FAIL — modules not found.

- [ ] **Step 4: Write `src/hooks/useDebounce.ts`**

```ts
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
```

- [ ] **Step 5: Write `src/hooks/useAnimeSearch.ts`**

```ts
'use client'

import { useEffect, useState } from 'react'
import type { Anime } from '@/types/anime'
import type { SearchFilters } from '@/types/filters'
import { fetchAnimeList } from '@/lib/anilist/client'

export function useAnimeSearch(
  initialAnime: Anime[],
  initialHasNextPage: boolean,
  filters: SearchFilters
) {
  const [anime, setAnime] = useState(initialAnime)
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setAnime(initialAnime)
    setHasNextPage(initialHasNextPage)
    setPage(1)
  }, [initialAnime, initialHasNextPage])

  async function loadMore() {
    if (isLoading || !hasNextPage) return
    setIsLoading(true)
    const nextPage = page + 1
    const result = await fetchAnimeList({ ...filters, page: nextPage })
    setAnime((current) => [...current, ...result.anime])
    setHasNextPage(result.hasNextPage)
    setPage(nextPage)
    setIsLoading(false)
  }

  return { anime, hasNextPage, isLoading, loadMore }
}
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `npm run test -- useDebounce useAnimeSearch`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/hooks
git commit -m "feat: add useDebounce and useAnimeSearch hooks"
```

---

## Task 10: UI Primitives

**Files:**
- Create: `src/components/ui/Button.tsx`, `src/components/ui/Button.test.tsx`
- Create: `src/components/ui/Input.tsx`, `src/components/ui/Input.test.tsx`
- Create: `src/components/ui/Select.tsx`, `src/components/ui/Select.test.tsx`
- Create: `src/components/ui/Badge.tsx`, `src/components/ui/Badge.test.tsx`
- Create: `src/components/ui/Skeleton.tsx`, `src/components/ui/Skeleton.test.tsx`
- Create: `src/components/ui/Spinner.tsx`, `src/components/ui/Spinner.test.tsx`
- Create: `src/components/ui/Dialog.tsx`, `src/components/ui/Dialog.test.tsx`

**Interfaces:**
- Consumes: `cn` (Task 5 `src/lib/utils/cn.ts`).
- Produces: `Button` (`variant?: 'primary'|'secondary'|'ghost'`, `size?: 'sm'|'md'`, extends `ButtonHTMLAttributes`); `Input` (extends `InputHTMLAttributes`); `Select` (extends `SelectHTMLAttributes`); `Badge` (`variant?: 'primary'|'secondary'|'neutral'`, extends `HTMLAttributes<HTMLSpanElement>`); `Skeleton` (extends `HTMLAttributes<HTMLDivElement>`); `Spinner({ size?: 'sm'|'md'; className?: string })`; `Dialog({ open: boolean; onClose: () => void; children: ReactNode; className?: string })` — all in `src/components/ui/`.

- [ ] **Step 1: Write failing tests**

`src/components/ui/Button.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders children and handles click', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Klick mich</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Klick mich' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies the primary variant by default', () => {
    render(<Button>Test</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')
  })
})
```

`src/components/ui/Input.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('renders and accepts a value', () => {
    render(<Input aria-label="Suche" defaultValue="bocchi" />)
    expect(screen.getByLabelText('Suche')).toHaveValue('bocchi')
  })
})
```

`src/components/ui/Select.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Select } from './Select'

describe('Select', () => {
  it('renders provided options', () => {
    render(
      <Select aria-label="Format">
        <option value="TV">TV</option>
      </Select>
    )
    expect(screen.getByLabelText('Format')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'TV' })).toBeInTheDocument()
  })
})
```

`src/components/ui/Badge.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders content with the requested variant', () => {
    render(<Badge variant="secondary">Neu</Badge>)
    expect(screen.getByText('Neu')).toHaveClass('bg-secondary')
  })
})
```

`src/components/ui/Skeleton.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders a loading status element', () => {
    render(<Skeleton className="h-4 w-4" />)
    expect(screen.getByRole('status', { name: 'loading' })).toBeInTheDocument()
  })
})
```

`src/components/ui/Spinner.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('renders a loading status element', () => {
    render(<Spinner />)
    expect(screen.getByRole('status', { name: 'loading' })).toBeInTheDocument()
  })
})
```

`src/components/ui/Dialog.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from './Dialog'

describe('Dialog', () => {
  it('renders children when open', () => {
    render(
      <Dialog open onClose={vi.fn()}>
        <p>Inhalt</p>
      </Dialog>
    )
    expect(screen.getByText('Inhalt')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(
      <Dialog open={false} onClose={vi.fn()}>
        <p>Inhalt</p>
      </Dialog>
    )
    expect(screen.queryByText('Inhalt')).not.toBeInTheDocument()
  })

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(
      <Dialog open onClose={onClose}>
        <p>Inhalt</p>
      </Dialog>
    )
    await userEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm run test -- src/components/ui`
Expected: FAIL — none of the modules exist yet.

- [ ] **Step 3: Write `src/components/ui/Button.tsx`**

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-white hover:opacity-90',
  secondary: 'bg-secondary text-white hover:opacity-90',
  ghost: 'bg-transparent text-text border border-border hover:bg-surface',
}

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-label',
  md: 'px-4 py-2 text-ui',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'rounded-card font-semibold transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'
```

- [ ] **Step 4: Write `src/components/ui/Input.tsx`**

```tsx
import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'rounded-card border border-border bg-surface px-3 py-2 text-ui text-text outline-none focus:ring-2 focus:ring-secondary',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
```

- [ ] **Step 5: Write `src/components/ui/Select.tsx`**

```tsx
import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'rounded-card border border-border bg-surface px-3 py-2 text-ui text-text outline-none focus:ring-2 focus:ring-secondary',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
)
Select.displayName = 'Select'
```

- [ ] **Step 6: Write `src/components/ui/Badge.tsx`**

```tsx
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'neutral'
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps['variant']>, string> = {
  primary: 'bg-primary text-white',
  secondary: 'bg-secondary text-white',
  neutral: 'bg-border text-text',
}

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-card px-2 py-0.5 text-meta font-mono uppercase tracking-wide',
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 7: Write `src/components/ui/Skeleton.tsx`**

```tsx
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="loading"
      className={cn('animate-pulse rounded-card bg-border', className)}
      {...props}
    />
  )
}
```

- [ ] **Step 8: Write `src/components/ui/Spinner.tsx`**

```tsx
import { cn } from '@/lib/utils/cn'

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
  const dimension = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'
  return (
    <div
      role="status"
      aria-label="loading"
      className={cn('animate-spin rounded-full border-2 border-border border-t-primary', dimension, className)}
    />
  )
}
```

- [ ] **Step 9: Write `src/components/ui/Dialog.tsx`**

```tsx
'use client'

import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={cn('rounded-panel bg-surface p-6 shadow-lift', className)}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 10: Run tests, verify they pass**

Run: `npm run test -- src/components/ui`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add src/components/ui
git commit -m "feat: add UI primitives styled with Tenji tokens"
```

---

## Task 11: Layout Components (Header, Footer, ThemeToggle)

**Files:**
- Create: `src/components/layout/ThemeToggle.tsx`, `src/components/layout/ThemeToggle.test.tsx`
- Create: `src/components/layout/Header.tsx`, `src/components/layout/Header.test.tsx`
- Create: `src/components/layout/Footer.tsx`, `src/components/layout/Footer.test.tsx`

**Interfaces:**
- Consumes: `Button` (Task 10 `src/components/ui/Button.tsx`).
- Produces: `ThemeToggle()`, `Header()`, `Footer()` — all in `src/components/layout/`.

- [ ] **Step 1: Write failing tests**

`src/components/layout/ThemeToggle.test.tsx`:

```tsx
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'

afterEach(() => {
  document.documentElement.classList.remove('dark')
})

describe('ThemeToggle', () => {
  it('toggles the dark class on <html> when clicked', async () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: 'Farbschema umschalten' })

    await userEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await userEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
```

`src/components/layout/Header.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from './Header'

describe('Header', () => {
  it('renders navigation links', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /anime tracker/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Watchlist' })).toHaveAttribute('href', '/watchlist')
  })
})
```

`src/components/layout/Footer.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'

describe('Footer', () => {
  it('renders attribution text', () => {
    render(<Footer />)
    expect(screen.getByText(/AniList/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm run test -- src/components/layout`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/components/layout/ThemeToggle.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'

const THEME_KEY = 'anime-tracker:theme'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = stored ? stored === 'dark' : prefersDark
    setIsDark(shouldBeDark)
    document.documentElement.classList.toggle('dark', shouldBeDark)
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    window.localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle} aria-label="Farbschema umschalten">
      {isDark ? 'Hell' : 'Dunkel'}
    </Button>
  )
}
```

- [ ] **Step 4: Write `src/components/layout/Header.tsx`**

```tsx
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-[34px] py-4">
        <Link href="/" className="text-h2 font-bold tracking-tight text-text">
          Anime Tracker
        </Link>
        <nav className="flex items-center gap-6 font-mono text-meta uppercase tracking-wide text-text-muted">
          <Link href="/">Home</Link>
          <Link href="/watchlist">Watchlist</Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Write `src/components/layout/Footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-6">
      <div className="mx-auto max-w-[1240px] px-[34px] font-mono text-meta text-text-muted">
        Daten von AniList · Anime Tracker
      </div>
    </footer>
  )
}
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `npm run test -- src/components/layout`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout
git commit -m "feat: add Header, Footer, ThemeToggle layout components"
```

---

## Task 12: Root Layout

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/icon.svg`

**Interfaces:**
- Consumes: `WatchlistProvider` (Task 8); `Header`, `Footer` (Task 11); `src/app/globals.css` (Task 2).
- Produces: default export `RootLayout({ children }: { children: React.ReactNode })`, `metadata: Metadata`.

Note: uses `src/app/icon.svg` instead of `public/favicon.ico` — Next.js App Router auto-detects `app/icon.svg` as the site favicon/icon; a plain-text SVG avoids needing to author a binary `.ico` file by hand.

- [ ] **Step 1: Write `src/app/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#F0531C" />
  <text x="16" y="22" font-family="Space Grotesk, sans-serif" font-size="16" font-weight="700" fill="white" text-anchor="middle">A</text>
</svg>
```

- [ ] **Step 2: Write `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { WatchlistProvider } from '@/context/WatchlistProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Anime Tracker',
  description: 'Anime suchen, verfolgen, Fortschritt tracken.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} bg-bg font-sans text-text`}>
        <WatchlistProvider>
          <Header />
          <main className="mx-auto min-h-screen max-w-[1240px] px-[34px] py-8">{children}</main>
          <Footer />
        </WatchlistProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify the app builds**

Run: `npm run build`
Expected: build succeeds (pages besides `/` will be added in later tasks; `/` doesn't exist yet either — this step just confirms the layout compiles. If `next build` fails because no page exists at all, skip this verification and defer to Task 18's build check instead).

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/icon.svg
git commit -m "feat: add root layout with fonts and providers"
```

---

## Task 13: Anime Card and Grid

**Files:**
- Create: `src/components/anime/AnimeCard.tsx`, `src/components/anime/AnimeCard.test.tsx`
- Create: `src/components/anime/AnimeGrid.tsx`, `src/components/anime/AnimeGrid.test.tsx`

**Interfaces:**
- Consumes: `Anime` (Task 4); `Badge` (Task 10); `formatScore` (Task 5 `src/lib/utils/format.ts`).
- Produces: `AnimeCard({ anime: Anime })`, `AnimeGrid({ anime: Anime[] })` — both in `src/components/anime/`.

- [ ] **Step 1: Write failing test `src/components/anime/AnimeCard.test.tsx`**

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimeCard } from './AnimeCard'
import type { Anime } from '@/types/anime'

const anime: Anime = {
  id: 1,
  title: { romaji: 'Test Romaji', english: 'Test English', native: 'テスト' },
  coverImage: '/cover.jpg',
  bannerImage: null,
  format: 'TV',
  episodes: 12,
  duration: 24,
  seasonYear: 2020,
  season: 'FALL',
  genres: [],
  averageScore: 85,
  popularity: 100,
  status: 'FINISHED',
  studios: [],
  description: null,
}

describe('AnimeCard', () => {
  it('links to the detail page using the english title', () => {
    render(<AnimeCard anime={anime} />)
    const link = screen.getByRole('link', { name: /Test English/ })
    expect(link).toHaveAttribute('href', '/anime/1')
  })

  it('shows the formatted score', () => {
    render(<AnimeCard anime={anime} />)
    expect(screen.getByText('8.5')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Write failing test `src/components/anime/AnimeGrid.test.tsx`**

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimeGrid } from './AnimeGrid'
import type { Anime } from '@/types/anime'

const anime: Anime = {
  id: 1,
  title: { romaji: 'Test', english: null, native: 'テスト' },
  coverImage: '/cover.jpg',
  bannerImage: null,
  format: 'TV',
  episodes: 12,
  duration: 24,
  seasonYear: 2020,
  season: 'FALL',
  genres: [],
  averageScore: 85,
  popularity: 100,
  status: 'FINISHED',
  studios: [],
  description: null,
}

describe('AnimeGrid', () => {
  it('renders a card per anime', () => {
    render(<AnimeGrid anime={[anime, { ...anime, id: 2, title: { ...anime.title, romaji: 'Second' } }]} />)
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('shows an empty state when there are no results', () => {
    render(<AnimeGrid anime={[]} />)
    expect(screen.getByText('Keine Ergebnisse gefunden.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `npm run test -- src/components/anime`
Expected: FAIL — modules not found.

- [ ] **Step 4: Write `src/components/anime/AnimeCard.tsx`**

```tsx
import Image from 'next/image'
import Link from 'next/link'
import type { Anime } from '@/types/anime'
import { Badge } from '@/components/ui/Badge'
import { formatScore } from '@/lib/utils/format'

export function AnimeCard({ anime }: { anime: Anime }) {
  const title = anime.title.english ?? anime.title.romaji

  return (
    <Link
      href={`/anime/${anime.id}`}
      className="group block overflow-hidden rounded-card bg-surface shadow-lift transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <Image
          src={anime.coverImage}
          alt={title}
          fill
          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
          className="rounded-image object-cover"
        />
      </div>
      <div className="space-y-1 p-3">
        <h3 className="line-clamp-2 text-ui font-semibold text-text">{title}</h3>
        <div className="flex items-center gap-2 font-mono text-meta text-text-muted">
          {anime.format && <span>{anime.format}</span>}
          {anime.averageScore !== null && <Badge variant="primary">{formatScore(anime.averageScore)}</Badge>}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 5: Write `src/components/anime/AnimeGrid.tsx`**

```tsx
import type { Anime } from '@/types/anime'
import { AnimeCard } from './AnimeCard'

export function AnimeGrid({ anime }: { anime: Anime[] }) {
  if (anime.length === 0) {
    return <p className="py-12 text-center text-ui text-text-muted">Keine Ergebnisse gefunden.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {anime.map((item) => (
        <AnimeCard key={item.id} anime={item} />
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `npm run test -- src/components/anime`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/anime/AnimeCard.tsx src/components/anime/AnimeCard.test.tsx src/components/anime/AnimeGrid.tsx src/components/anime/AnimeGrid.test.tsx
git commit -m "feat: add AnimeCard and AnimeGrid components"
```

---

## Task 14: Anime Detail Components

**Files:**
- Create: `src/components/anime/GenreList.tsx`, `src/components/anime/GenreList.test.tsx`
- Create: `src/components/anime/AnimeStats.tsx`, `src/components/anime/AnimeStats.test.tsx`
- Create: `src/components/anime/AnimeDescription.tsx`, `src/components/anime/AnimeDescription.test.tsx`
- Create: `src/components/anime/AnimeDetailHeader.tsx`, `src/components/anime/AnimeDetailHeader.test.tsx`
- Create: `src/components/anime/RelatedAnime.tsx`, `src/components/anime/RelatedAnime.test.tsx`

**Interfaces:**
- Consumes: `Anime` (Task 4); `Badge` (Task 10); `formatDuration`, `formatScore`, `formatSeasonYear` (Task 5); `sanitizeHtml` (Task 5).
- Produces: `GenreList({ genres: string[] })`, `AnimeStats({ anime: Anime })`, `AnimeDescription({ description: string | null })`, `AnimeDetailHeader({ anime: Anime })`, `RelatedAnime({ relations: Anime[] })` — all in `src/components/anime/`. `AnimeDetailHeader` does **not** render `WatchlistButton` — the detail page (Task 19) places `WatchlistButton` beside it, so this component has no dependency on `src/components/watchlist/`.

- [ ] **Step 1: Write failing tests**

`src/components/anime/GenreList.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GenreList } from './GenreList'

describe('GenreList', () => {
  it('renders each genre as a badge', () => {
    render(<GenreList genres={['Action', 'Drama']} />)
    expect(screen.getByText('Action')).toBeInTheDocument()
    expect(screen.getByText('Drama')).toBeInTheDocument()
  })

  it('renders nothing for an empty list', () => {
    const { container } = render(<GenreList genres={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

`src/components/anime/AnimeStats.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimeStats } from './AnimeStats'
import type { Anime } from '@/types/anime'

const anime: Anime = {
  id: 1,
  title: { romaji: 'Test', english: null, native: 'テスト' },
  coverImage: '/cover.jpg',
  bannerImage: null,
  format: 'TV',
  episodes: 12,
  duration: 24,
  seasonYear: 2020,
  season: 'FALL',
  genres: [],
  averageScore: 85,
  popularity: 100,
  status: 'FINISHED',
  studios: [],
  description: null,
}

describe('AnimeStats', () => {
  it('shows episodes, duration, season, score, and status', () => {
    render(<AnimeStats anime={anime} />)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('24 min')).toBeInTheDocument()
    expect(screen.getByText('Fall 2020')).toBeInTheDocument()
    expect(screen.getByText('8.5')).toBeInTheDocument()
    expect(screen.getByText('FINISHED')).toBeInTheDocument()
  })
})
```

`src/components/anime/AnimeDescription.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimeDescription } from './AnimeDescription'

describe('AnimeDescription', () => {
  it('renders sanitized HTML', () => {
    render(<AnimeDescription description="<p>Hi</p><script>alert(1)</script>" />)
    expect(screen.getByText('Hi')).toBeInTheDocument()
    expect(document.querySelector('script')).not.toBeInTheDocument()
  })

  it('renders nothing when description is null', () => {
    const { container } = render(<AnimeDescription description={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

`src/components/anime/AnimeDetailHeader.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimeDetailHeader } from './AnimeDetailHeader'
import type { Anime } from '@/types/anime'

const anime: Anime = {
  id: 1,
  title: { romaji: 'Test Romaji', english: 'Test English', native: 'テスト' },
  coverImage: '/cover.jpg',
  bannerImage: '/banner.jpg',
  format: 'TV',
  episodes: 12,
  duration: 24,
  seasonYear: 2020,
  season: 'FALL',
  genres: [],
  averageScore: 85,
  popularity: 100,
  status: 'FINISHED',
  studios: ['Test Studio'],
  description: null,
}

describe('AnimeDetailHeader', () => {
  it('shows the title, native title, and studio', () => {
    render(<AnimeDetailHeader anime={anime} />)
    expect(screen.getByRole('heading', { name: 'Test English' })).toBeInTheDocument()
    expect(screen.getByText('テスト')).toBeInTheDocument()
    expect(screen.getByText('Test Studio')).toBeInTheDocument()
  })
})
```

`src/components/anime/RelatedAnime.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RelatedAnime } from './RelatedAnime'
import type { Anime } from '@/types/anime'

const related: Anime = {
  id: 2,
  title: { romaji: 'Sequel', english: null, native: 'シークエル' },
  coverImage: '/cover2.jpg',
  bannerImage: null,
  format: 'TV',
  episodes: 12,
  duration: 24,
  seasonYear: 2021,
  season: 'FALL',
  genres: [],
  averageScore: 80,
  popularity: 100,
  status: 'FINISHED',
  studios: [],
  description: null,
}

describe('RelatedAnime', () => {
  it('links to each related anime', () => {
    render(<RelatedAnime relations={[related]} />)
    expect(screen.getByRole('link', { name: /Sequel/ })).toHaveAttribute('href', '/anime/2')
  })

  it('renders nothing when there are no relations', () => {
    const { container } = render(<RelatedAnime relations={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm run test -- src/components/anime/GenreList src/components/anime/AnimeStats src/components/anime/AnimeDescription src/components/anime/AnimeDetailHeader src/components/anime/RelatedAnime`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/components/anime/GenreList.tsx`**

```tsx
import { Badge } from '@/components/ui/Badge'

export function GenreList({ genres }: { genres: string[] }) {
  if (genres.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-2">
      {genres.map((genre) => (
        <li key={genre}>
          <Badge variant="secondary">{genre}</Badge>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 4: Write `src/components/anime/AnimeStats.tsx`**

```tsx
import type { Anime } from '@/types/anime'
import { formatDuration, formatScore, formatSeasonYear } from '@/lib/utils/format'

export function AnimeStats({ anime }: { anime: Anime }) {
  const stats = [
    { label: 'Episoden', value: anime.episodes ?? '—' },
    { label: 'Dauer', value: formatDuration(anime.duration) },
    { label: 'Season', value: formatSeasonYear(anime.seasonYear, anime.season) },
    { label: 'Score', value: formatScore(anime.averageScore) },
    { label: 'Status', value: anime.status ?? '—' },
  ]

  return (
    <dl className="grid grid-cols-2 gap-4 font-mono text-meta sm:grid-cols-5">
      {stats.map((stat) => (
        <div key={stat.label}>
          <dt className="uppercase text-text-muted">{stat.label}</dt>
          <dd className="text-body text-text">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
```

- [ ] **Step 5: Write `src/components/anime/AnimeDescription.tsx`**

```tsx
import { sanitizeHtml } from '@/lib/utils/sanitize'

export function AnimeDescription({ description }: { description: string | null }) {
  if (!description) return null
  return (
    <div
      className="space-y-3 text-body leading-relaxed text-text"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
    />
  )
}
```

- [ ] **Step 6: Write `src/components/anime/AnimeDetailHeader.tsx`**

```tsx
import Image from 'next/image'
import type { Anime } from '@/types/anime'

export function AnimeDetailHeader({ anime }: { anime: Anime }) {
  const title = anime.title.english ?? anime.title.romaji

  return (
    <div className="overflow-hidden rounded-panel bg-surface shadow-lift">
      {anime.bannerImage && (
        <div className="relative h-48 w-full sm:h-64">
          <Image src={anime.bannerImage} alt="" fill className="object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-4 p-6 sm:flex-row">
        <div className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-image">
          <Image src={anime.coverImage} alt={title} fill className="object-cover" />
        </div>
        <div className="flex-1 space-y-2">
          <h1 className="text-h2 font-bold tracking-tight text-text">{title}</h1>
          {anime.title.native && <p className="font-mono text-meta text-text-muted">{anime.title.native}</p>}
          {anime.studios.length > 0 && <p className="text-ui text-text-muted">{anime.studios.join(', ')}</p>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Write `src/components/anime/RelatedAnime.tsx`**

```tsx
import Image from 'next/image'
import Link from 'next/link'
import type { Anime } from '@/types/anime'

export function RelatedAnime({ relations }: { relations: Anime[] }) {
  if (relations.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="text-lead font-semibold text-text">Verwandte Anime</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {relations.map((anime) => {
          const title = anime.title.english ?? anime.title.romaji
          return (
            <Link
              key={anime.id}
              href={`/anime/${anime.id}`}
              className="w-28 shrink-0 space-y-1 rounded-card bg-surface p-2 shadow-lift"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-image">
                <Image src={anime.coverImage} alt={title} fill className="object-cover" />
              </div>
              <p className="line-clamp-2 text-meta text-text">{title}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Run tests, verify they pass**

Run: `npm run test -- src/components/anime/GenreList src/components/anime/AnimeStats src/components/anime/AnimeDescription src/components/anime/AnimeDetailHeader src/components/anime/RelatedAnime`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/anime/GenreList.tsx src/components/anime/GenreList.test.tsx src/components/anime/AnimeStats.tsx src/components/anime/AnimeStats.test.tsx src/components/anime/AnimeDescription.tsx src/components/anime/AnimeDescription.test.tsx src/components/anime/AnimeDetailHeader.tsx src/components/anime/AnimeDetailHeader.test.tsx src/components/anime/RelatedAnime.tsx src/components/anime/RelatedAnime.test.tsx
git commit -m "feat: add anime detail components"
```

---

## Task 15: Search Filter Components

**Files:**
- Create: `src/components/search/YearFilter.tsx`, `src/components/search/YearFilter.test.tsx`
- Create: `src/components/search/SeasonFilter.tsx`, `src/components/search/SeasonFilter.test.tsx`
- Create: `src/components/search/FormatFilter.tsx`, `src/components/search/FormatFilter.test.tsx`
- Create: `src/components/search/GenreFilter.tsx`, `src/components/search/GenreFilter.test.tsx`
- Create: `src/components/search/SortSelect.tsx`, `src/components/search/SortSelect.test.tsx`
- Create: `src/components/search/ActiveFilterChips.tsx`, `src/components/search/ActiveFilterChips.test.tsx`

**Interfaces:**
- Consumes: `Select` (Task 10); `Badge` (Task 10); `cn` (Task 5); `SEASONS` (Task 4 `src/constants/seasons.ts`); `FORMATS` (Task 4 `src/constants/formats.ts`); `GENRES` (Task 4 `src/constants/genres.ts`); `MediaSeason`, `MediaFormat` (Task 4); `SortOption`, `SearchFilters` (Task 4).
- Produces: `YearFilter({ value: number|null; onChange: (year: number|null) => void })`, `SeasonFilter({ value: MediaSeason|null; onChange: (season: MediaSeason|null) => void })`, `FormatFilter({ value: MediaFormat|null; onChange: (format: MediaFormat|null) => void })`, `GenreFilter({ value: string[]; onChange: (genres: string[]) => void })`, `SortSelect({ value: SortOption; onChange: (sort: SortOption) => void })`, `ActiveFilterChips({ filters: SearchFilters; onRemove: (key: 'search'|'year'|'season'|'format'|'genres', value?: string) => void })` — all in `src/components/search/`.

- [ ] **Step 1: Write failing tests**

`src/components/search/YearFilter.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YearFilter } from './YearFilter'

describe('YearFilter', () => {
  it('calls onChange with the selected year', async () => {
    const onChange = vi.fn()
    render(<YearFilter value={null} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Erscheinungsjahr'), '2020')
    expect(onChange).toHaveBeenCalledWith(2020)
  })
})
```

`src/components/search/SeasonFilter.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SeasonFilter } from './SeasonFilter'

describe('SeasonFilter', () => {
  it('calls onChange with the selected season', async () => {
    const onChange = vi.fn()
    render(<SeasonFilter value={null} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Season'), 'FALL')
    expect(onChange).toHaveBeenCalledWith('FALL')
  })
})
```

`src/components/search/FormatFilter.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormatFilter } from './FormatFilter'

describe('FormatFilter', () => {
  it('calls onChange with the selected format', async () => {
    const onChange = vi.fn()
    render(<FormatFilter value={null} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Format'), 'MOVIE')
    expect(onChange).toHaveBeenCalledWith('MOVIE')
  })
})
```

`src/components/search/GenreFilter.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenreFilter } from './GenreFilter'

describe('GenreFilter', () => {
  it('adds a genre when toggled on', async () => {
    const onChange = vi.fn()
    render(<GenreFilter value={[]} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Action' }))
    expect(onChange).toHaveBeenCalledWith(['Action'])
  })

  it('removes a genre when toggled off', async () => {
    const onChange = vi.fn()
    render(<GenreFilter value={['Action']} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Action' }))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
```

`src/components/search/SortSelect.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SortSelect } from './SortSelect'

describe('SortSelect', () => {
  it('calls onChange with the selected sort option', async () => {
    const onChange = vi.fn()
    render(<SortSelect value="TRENDING_DESC" onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Sortierung'), 'SCORE_DESC')
    expect(onChange).toHaveBeenCalledWith('SCORE_DESC')
  })
})
```

`src/components/search/ActiveFilterChips.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActiveFilterChips } from './ActiveFilterChips'
import { DEFAULT_FILTERS } from '@/lib/utils/searchParams'

describe('ActiveFilterChips', () => {
  it('renders nothing when no filters are active', () => {
    const { container } = render(<ActiveFilterChips filters={DEFAULT_FILTERS} onRemove={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a chip per active filter and calls onRemove', async () => {
    const onRemove = vi.fn()
    render(
      <ActiveFilterChips
        filters={{ ...DEFAULT_FILTERS, search: 'bocchi', genres: ['Action'] }}
        onRemove={onRemove}
      />
    )
    expect(screen.getByText(/"bocchi"/)).toBeInTheDocument()
    await userEvent.click(screen.getByText(/Action/))
    expect(onRemove).toHaveBeenCalledWith('genres', 'Action')
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm run test -- src/components/search`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/components/search/YearFilter.tsx`**

```tsx
import { Select } from '@/components/ui/Select'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR + 1 - i)

export function YearFilter({
  value,
  onChange,
}: {
  value: number | null
  onChange: (year: number | null) => void
}) {
  return (
    <Select
      aria-label="Erscheinungsjahr"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
    >
      <option value="">Jahr</option>
      {YEARS.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </Select>
  )
}
```

- [ ] **Step 4: Write `src/components/search/SeasonFilter.tsx`**

```tsx
import { Select } from '@/components/ui/Select'
import { SEASONS } from '@/constants/seasons'
import type { MediaSeason } from '@/types/anime'

export function SeasonFilter({
  value,
  onChange,
}: {
  value: MediaSeason | null
  onChange: (season: MediaSeason | null) => void
}) {
  return (
    <Select
      aria-label="Season"
      value={value ?? ''}
      onChange={(event) => onChange((event.target.value || null) as MediaSeason | null)}
    >
      <option value="">Season</option>
      {SEASONS.map((season) => (
        <option key={season.value} value={season.value}>
          {season.label}
        </option>
      ))}
    </Select>
  )
}
```

- [ ] **Step 5: Write `src/components/search/FormatFilter.tsx`**

```tsx
import { Select } from '@/components/ui/Select'
import { FORMATS } from '@/constants/formats'
import type { MediaFormat } from '@/types/anime'

export function FormatFilter({
  value,
  onChange,
}: {
  value: MediaFormat | null
  onChange: (format: MediaFormat | null) => void
}) {
  return (
    <Select
      aria-label="Format"
      value={value ?? ''}
      onChange={(event) => onChange((event.target.value || null) as MediaFormat | null)}
    >
      <option value="">Format</option>
      {FORMATS.map((format) => (
        <option key={format.value} value={format.value}>
          {format.label}
        </option>
      ))}
    </Select>
  )
}
```

- [ ] **Step 6: Write `src/components/search/GenreFilter.tsx`**

```tsx
'use client'

import { GENRES } from '@/constants/genres'
import { cn } from '@/lib/utils/cn'

export function GenreFilter({
  value,
  onChange,
}: {
  value: string[]
  onChange: (genres: string[]) => void
}) {
  function toggle(genre: string) {
    onChange(value.includes(genre) ? value.filter((g) => g !== genre) : [...value, genre])
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Genres">
      {GENRES.map((genre) => {
        const active = value.includes(genre)
        return (
          <button
            key={genre}
            type="button"
            onClick={() => toggle(genre)}
            aria-pressed={active}
            className={cn(
              'rounded-card border px-2 py-1 text-meta font-mono uppercase tracking-wide transition-colors',
              active
                ? 'border-secondary bg-secondary text-white'
                : 'border-border bg-surface text-text-muted hover:border-secondary'
            )}
          >
            {genre}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 7: Write `src/components/search/SortSelect.tsx`**

```tsx
import { Select } from '@/components/ui/Select'
import type { SortOption } from '@/types/filters'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'TRENDING_DESC', label: 'Trending' },
  { value: 'POPULARITY_DESC', label: 'Popularität' },
  { value: 'SCORE_DESC', label: 'Score' },
  { value: 'START_DATE_DESC', label: 'Neueste' },
]

export function SortSelect({
  value,
  onChange,
}: {
  value: SortOption
  onChange: (sort: SortOption) => void
}) {
  return (
    <Select aria-label="Sortierung" value={value} onChange={(event) => onChange(event.target.value as SortOption)}>
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )
}
```

- [ ] **Step 8: Write `src/components/search/ActiveFilterChips.tsx`**

```tsx
import type { SearchFilters } from '@/types/filters'
import { Badge } from '@/components/ui/Badge'

type FilterKey = 'search' | 'year' | 'season' | 'format' | 'genres'

export function ActiveFilterChips({
  filters,
  onRemove,
}: {
  filters: SearchFilters
  onRemove: (key: FilterKey, value?: string) => void
}) {
  const chips: { key: FilterKey; label: string; value?: string }[] = []

  if (filters.search) chips.push({ key: 'search', label: `"${filters.search}"` })
  if (filters.year) chips.push({ key: 'year', label: String(filters.year) })
  if (filters.season) chips.push({ key: 'season', label: filters.season })
  if (filters.format) chips.push({ key: 'format', label: filters.format })
  filters.genres.forEach((genre) => chips.push({ key: 'genres', label: genre, value: genre }))

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, index) => (
        <button key={`${chip.key}-${index}`} type="button" onClick={() => onRemove(chip.key, chip.value)}>
          <Badge variant="neutral" className="cursor-pointer">
            {chip.label} ✕
          </Badge>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 9: Run tests, verify they pass**

Run: `npm run test -- src/components/search`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/search/YearFilter.tsx src/components/search/YearFilter.test.tsx src/components/search/SeasonFilter.tsx src/components/search/SeasonFilter.test.tsx src/components/search/FormatFilter.tsx src/components/search/FormatFilter.test.tsx src/components/search/GenreFilter.tsx src/components/search/GenreFilter.test.tsx src/components/search/SortSelect.tsx src/components/search/SortSelect.test.tsx src/components/search/ActiveFilterChips.tsx src/components/search/ActiveFilterChips.test.tsx
git commit -m "feat: add search filter components"
```

---

## Task 16: SearchBar, FilterPanel, InfiniteScrollTrigger

**Files:**
- Create: `src/components/search/SearchBar.tsx`, `src/components/search/SearchBar.test.tsx`
- Create: `src/components/search/FilterPanel.tsx`, `src/components/search/FilterPanel.test.tsx`
- Create: `src/components/search/InfiniteScrollTrigger.tsx`, `src/components/search/InfiniteScrollTrigger.test.tsx`

**Interfaces:**
- Consumes: `Input` (Task 10); `Spinner` (Task 10); `useDebounce` (Task 9); `DEBOUNCE_MS` (Task 4); `YearFilter`, `SeasonFilter`, `FormatFilter`, `GenreFilter`, `SortSelect`, `ActiveFilterChips` (Task 15); `SearchFilters` (Task 4).
- Produces: `SearchBar({ defaultValue: string; onSearch: (value: string) => void })`, `FilterPanel({ filters: SearchFilters; onChange: (filters: SearchFilters) => void })`, `InfiniteScrollTrigger({ onIntersect: () => void; disabled: boolean })` — all in `src/components/search/`.

- [ ] **Step 1: Write failing tests**

`src/components/search/SearchBar.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './SearchBar'

describe('SearchBar', () => {
  it('calls onSearch with the debounced value', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const onSearch = vi.fn()
    const user = userEvent.setup({ delay: null })
    render(<SearchBar defaultValue="" onSearch={onSearch} />)

    await user.type(screen.getByLabelText('Anime suchen'), 'bocchi')
    vi.advanceTimersByTime(400)

    expect(onSearch).toHaveBeenLastCalledWith('bocchi')
    vi.useRealTimers()
  })
})
```

`src/components/search/FilterPanel.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterPanel } from './FilterPanel'
import { DEFAULT_FILTERS } from '@/lib/utils/searchParams'

describe('FilterPanel', () => {
  it('calls onChange when a filter is updated', async () => {
    const onChange = vi.fn()
    render(<FilterPanel filters={DEFAULT_FILTERS} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Season'), 'FALL')
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, season: 'FALL' })
  })

  it('clears a genre when its chip is removed', async () => {
    const onChange = vi.fn()
    render(<FilterPanel filters={{ ...DEFAULT_FILTERS, genres: ['Action'] }} onChange={onChange} />)
    await userEvent.click(screen.getByText(/Action/))
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, genres: [] })
  })
})
```

`src/components/search/InfiniteScrollTrigger.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { InfiniteScrollTrigger } from './InfiniteScrollTrigger'

describe('InfiniteScrollTrigger', () => {
  it('calls onIntersect when the element intersects', () => {
    let capturedCallback: IntersectionObserverCallback = () => {}
    class MockObserver {
      constructor(callback: IntersectionObserverCallback) {
        capturedCallback = callback
      }
      observe = vi.fn()
      disconnect = vi.fn()
    }
    // @ts-expect-error test stub
    global.IntersectionObserver = MockObserver

    const onIntersect = vi.fn()
    render(<InfiniteScrollTrigger onIntersect={onIntersect} disabled={false} />)

    capturedCallback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(onIntersect).toHaveBeenCalledOnce()
  })

  it('renders nothing when disabled', () => {
    const { container } = render(<InfiniteScrollTrigger onIntersect={vi.fn()} disabled />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm run test -- src/components/search/SearchBar src/components/search/FilterPanel src/components/search/InfiniteScrollTrigger`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/components/search/SearchBar.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { useDebounce } from '@/hooks/useDebounce'
import { DEBOUNCE_MS } from '@/constants/config'

export function SearchBar({
  defaultValue,
  onSearch,
}: {
  defaultValue: string
  onSearch: (value: string) => void
}) {
  const [value, setValue] = useState(defaultValue)
  const debounced = useDebounce(value, DEBOUNCE_MS)

  useEffect(() => {
    onSearch(debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder="Anime suchen…"
      aria-label="Anime suchen"
    />
  )
}
```

- [ ] **Step 4: Write `src/components/search/FilterPanel.tsx`**

```tsx
import type { SearchFilters } from '@/types/filters'
import { YearFilter } from './YearFilter'
import { SeasonFilter } from './SeasonFilter'
import { FormatFilter } from './FormatFilter'
import { GenreFilter } from './GenreFilter'
import { SortSelect } from './SortSelect'
import { ActiveFilterChips } from './ActiveFilterChips'

export function FilterPanel({
  filters,
  onChange,
}: {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
}) {
  return (
    <div className="space-y-4 rounded-panel bg-surface p-4 shadow-lift">
      <div className="flex flex-wrap gap-3">
        <YearFilter value={filters.year} onChange={(year) => onChange({ ...filters, year })} />
        <SeasonFilter value={filters.season} onChange={(season) => onChange({ ...filters, season })} />
        <FormatFilter value={filters.format} onChange={(format) => onChange({ ...filters, format })} />
        <SortSelect value={filters.sort} onChange={(sort) => onChange({ ...filters, sort })} />
      </div>
      <GenreFilter value={filters.genres} onChange={(genres) => onChange({ ...filters, genres })} />
      <ActiveFilterChips
        filters={filters}
        onRemove={(key, value) => {
          if (key === 'genres' && value) {
            onChange({ ...filters, genres: filters.genres.filter((g) => g !== value) })
          } else if (key === 'search') {
            onChange({ ...filters, search: '' })
          } else {
            onChange({ ...filters, [key]: null })
          }
        }}
      />
    </div>
  )
}
```

- [ ] **Step 5: Write `src/components/search/InfiniteScrollTrigger.tsx`**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { Spinner } from '@/components/ui/Spinner'

export function InfiniteScrollTrigger({
  onIntersect,
  disabled,
}: {
  onIntersect: () => void
  disabled: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) return
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersect()
      },
      { rootMargin: '200px' }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [onIntersect, disabled])

  if (disabled) return null

  return (
    <div ref={ref} className="flex justify-center py-6">
      <Spinner />
    </div>
  )
}
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `npm run test -- src/components/search/SearchBar src/components/search/FilterPanel src/components/search/InfiniteScrollTrigger`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/search/SearchBar.tsx src/components/search/SearchBar.test.tsx src/components/search/FilterPanel.tsx src/components/search/FilterPanel.test.tsx src/components/search/InfiniteScrollTrigger.tsx src/components/search/InfiniteScrollTrigger.test.tsx
git commit -m "feat: add SearchBar, FilterPanel, InfiniteScrollTrigger"
```

---

## Task 17: Watchlist Components

**Files:**
- Create: `src/components/watchlist/StatusSelect.tsx`, `src/components/watchlist/StatusSelect.test.tsx`
- Create: `src/components/watchlist/ProgressControl.tsx`, `src/components/watchlist/ProgressControl.test.tsx`
- Create: `src/components/watchlist/WatchlistButton.tsx`, `src/components/watchlist/WatchlistButton.test.tsx`
- Create: `src/components/watchlist/WatchlistItem.tsx`, `src/components/watchlist/WatchlistItem.test.tsx`
- Create: `src/components/watchlist/WatchlistFilterTabs.tsx`, `src/components/watchlist/WatchlistFilterTabs.test.tsx`

**Interfaces:**
- Consumes: `Select`, `Button` (Task 10); `cn` (Task 5); `useWatchlist` (Task 8); `renderWithProviders` (Task 8 `src/test/utils/renderWithProviders.tsx`); `WatchStatus`, `WatchlistEntry` (Task 4); `Anime` (Task 4).
- Produces: `StatusSelect({ value: WatchStatus; onChange: (status: WatchStatus) => void })`, `ProgressControl({ progress: number; totalEpisodes: number|null; onChange: (progress: number) => void })`, `WatchlistButton({ anime: Anime })`, `WatchlistItem({ entry: WatchlistEntry })`, `WatchlistFilterTabs({ value: WatchStatus|'ALL'; onChange: (value: WatchStatus|'ALL') => void })` — all in `src/components/watchlist/`.

- [ ] **Step 1: Write failing tests**

`src/components/watchlist/StatusSelect.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusSelect } from './StatusSelect'

describe('StatusSelect', () => {
  it('calls onChange with the selected status', async () => {
    const onChange = vi.fn()
    render(<StatusSelect value="PLANNING" onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'WATCHING')
    expect(onChange).toHaveBeenCalledWith('WATCHING')
  })
})
```

`src/components/watchlist/ProgressControl.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProgressControl } from './ProgressControl'

describe('ProgressControl', () => {
  it('increments progress', async () => {
    const onChange = vi.fn()
    render(<ProgressControl progress={2} totalEpisodes={12} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Episode vor' }))
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('decrements progress', async () => {
    const onChange = vi.fn()
    render(<ProgressControl progress={2} totalEpisodes={12} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Episode zurück' }))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('does not exceed totalEpisodes', async () => {
    const onChange = vi.fn()
    render(<ProgressControl progress={12} totalEpisodes={12} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Episode vor' })).toBeDisabled()
  })
})
```

`src/components/watchlist/WatchlistButton.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { WatchlistButton } from './WatchlistButton'
import type { Anime } from '@/types/anime'

const anime: Anime = {
  id: 1,
  title: { romaji: 'Test', english: null, native: 'テスト' },
  coverImage: '/cover.jpg',
  bannerImage: null,
  format: 'TV',
  episodes: 12,
  duration: 24,
  seasonYear: 2020,
  season: 'FALL',
  genres: [],
  averageScore: 80,
  popularity: 100,
  status: 'FINISHED',
  studios: [],
  description: null,
}

describe('WatchlistButton', () => {
  it('adds and then removes the anime from the watchlist', async () => {
    renderWithProviders(<WatchlistButton anime={anime} />)

    const addButton = await screen.findByRole('button', { name: 'Zur Watchlist hinzufügen' })
    await userEvent.click(addButton)

    expect(await screen.findByRole('button', { name: 'Von Watchlist entfernen' })).toBeInTheDocument()
  })
})
```

`src/components/watchlist/WatchlistItem.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { WatchlistItem } from './WatchlistItem'
import type { WatchlistEntry } from '@/types/watchlist'

const entry: WatchlistEntry = {
  animeId: 1,
  status: 'WATCHING',
  progress: 3,
  totalEpisodes: 12,
  addedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  snapshot: { title: { romaji: 'Test', english: 'Test English', native: 'テスト' }, coverImage: '/cover.jpg', format: 'TV' },
}

describe('WatchlistItem', () => {
  it('renders the title and links to the detail page', () => {
    renderWithProviders(<WatchlistItem entry={entry} />)
    const links = screen.getAllByRole('link', { name: /Test English/ })
    expect(links[0]).toHaveAttribute('href', '/anime/1')
  })
})
```

`src/components/watchlist/WatchlistFilterTabs.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WatchlistFilterTabs } from './WatchlistFilterTabs'

describe('WatchlistFilterTabs', () => {
  it('calls onChange with the selected tab', async () => {
    const onChange = vi.fn()
    render(<WatchlistFilterTabs value="ALL" onChange={onChange} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Schaue ich' }))
    expect(onChange).toHaveBeenCalledWith('WATCHING')
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npm run test -- src/components/watchlist`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/components/watchlist/StatusSelect.tsx`**

```tsx
import { Select } from '@/components/ui/Select'
import type { WatchStatus } from '@/types/watchlist'

const STATUS_OPTIONS: { value: WatchStatus; label: string }[] = [
  { value: 'PLANNING', label: 'Geplant' },
  { value: 'WATCHING', label: 'Schaue ich' },
  { value: 'COMPLETED', label: 'Abgeschlossen' },
  { value: 'PAUSED', label: 'Pausiert' },
  { value: 'DROPPED', label: 'Abgebrochen' },
]

export function StatusSelect({
  value,
  onChange,
}: {
  value: WatchStatus
  onChange: (status: WatchStatus) => void
}) {
  return (
    <Select aria-label="Status" value={value} onChange={(event) => onChange(event.target.value as WatchStatus)}>
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )
}
```

- [ ] **Step 4: Write `src/components/watchlist/ProgressControl.tsx`**

```tsx
import { Button } from '@/components/ui/Button'

export function ProgressControl({
  progress,
  totalEpisodes,
  onChange,
}: {
  progress: number
  totalEpisodes: number | null
  onChange: (progress: number) => void
}) {
  const max = totalEpisodes ?? Infinity

  return (
    <div className="flex items-center gap-2 font-mono text-ui">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(Math.max(0, progress - 1))}
        disabled={progress <= 0}
        aria-label="Episode zurück"
      >
        −
      </Button>
      <input
        type="number"
        value={progress}
        min={0}
        max={totalEpisodes ?? undefined}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value)))}
        className="w-14 rounded-card border border-border bg-surface px-2 py-1 text-center text-text"
        aria-label="Episoden-Fortschritt"
      />
      <span className="text-text-muted">/ {totalEpisodes ?? '?'}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(Math.min(max, progress + 1))}
        disabled={progress >= max}
        aria-label="Episode vor"
      >
        +
      </Button>
    </div>
  )
}
```

- [ ] **Step 5: Write `src/components/watchlist/WatchlistButton.tsx`**

```tsx
'use client'

import type { Anime } from '@/types/anime'
import { Button } from '@/components/ui/Button'
import { useWatchlist } from '@/hooks/useWatchlist'

export function WatchlistButton({ anime }: { anime: Anime }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()
  const inWatchlist = isInWatchlist(anime.id)

  return (
    <Button
      variant={inWatchlist ? 'ghost' : 'primary'}
      onClick={() => (inWatchlist ? removeFromWatchlist(anime.id) : addToWatchlist(anime))}
    >
      {inWatchlist ? 'Von Watchlist entfernen' : 'Zur Watchlist hinzufügen'}
    </Button>
  )
}
```

- [ ] **Step 6: Write `src/components/watchlist/WatchlistItem.tsx`**

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { WatchlistEntry } from '@/types/watchlist'
import { useWatchlist } from '@/hooks/useWatchlist'
import { StatusSelect } from './StatusSelect'
import { ProgressControl } from './ProgressControl'
import { Button } from '@/components/ui/Button'

export function WatchlistItem({ entry }: { entry: WatchlistEntry }) {
  const { setStatus, setProgress, removeFromWatchlist } = useWatchlist()
  const title = entry.snapshot.title.english ?? entry.snapshot.title.romaji

  return (
    <div className="flex items-center gap-4 rounded-card bg-surface p-3 shadow-lift">
      <Link
        href={`/anime/${entry.animeId}`}
        className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-image"
      >
        <Image src={entry.snapshot.coverImage} alt={title} fill className="object-cover" />
      </Link>
      <div className="flex-1 space-y-2">
        <Link href={`/anime/${entry.animeId}`} className="text-ui font-semibold text-text">
          {title}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <StatusSelect value={entry.status} onChange={(status) => setStatus(entry.animeId, status)} />
          <ProgressControl
            progress={entry.progress}
            totalEpisodes={entry.totalEpisodes}
            onChange={(progress) => setProgress(entry.animeId, progress)}
          />
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={() => removeFromWatchlist(entry.animeId)}>
        Entfernen
      </Button>
    </div>
  )
}
```

- [ ] **Step 7: Write `src/components/watchlist/WatchlistFilterTabs.tsx`**

```tsx
import { cn } from '@/lib/utils/cn'
import type { WatchStatus } from '@/types/watchlist'

const TABS: { value: WatchStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Alle' },
  { value: 'WATCHING', label: 'Schaue ich' },
  { value: 'PLANNING', label: 'Geplant' },
  { value: 'COMPLETED', label: 'Abgeschlossen' },
  { value: 'PAUSED', label: 'Pausiert' },
  { value: 'DROPPED', label: 'Abgebrochen' },
]

export function WatchlistFilterTabs({
  value,
  onChange,
}: {
  value: WatchStatus | 'ALL'
  onChange: (value: WatchStatus | 'ALL') => void
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'rounded-card px-3 py-1.5 text-label font-semibold transition-colors',
            value === tab.value ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:text-text'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 8: Run tests, verify they pass**

Run: `npm run test -- src/components/watchlist`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/watchlist
git commit -m "feat: add watchlist components"
```

---

## Task 18: Home Page (Search + Trending + Infinite Scroll)

**Files:**
- Create: `src/components/search/SearchExperience.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/loading.tsx`
- Create: `src/app/error.tsx`
- Create: `src/app/not-found.tsx`

**Interfaces:**
- Consumes: `useAnimeSearch` (Task 9); `filtersToSearchParams`, `parseSearchParams` (Task 5); `SearchBar`, `FilterPanel` (Task 16); `AnimeGrid` (Task 13); `InfiniteScrollTrigger` (Task 16); `Skeleton` (Task 10); `fetchAnimeList` (Task 6); `SearchFilters`, `Anime` (Task 4).
- Produces: `SearchExperience({ initialAnime: Anime[]; initialHasNextPage: boolean; filters: SearchFilters })` (client component, `src/components/search/SearchExperience.tsx`); default exports for `src/app/page.tsx`, `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`.

- [ ] **Step 1: Write `src/components/search/SearchExperience.tsx`**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import type { Anime } from '@/types/anime'
import type { SearchFilters } from '@/types/filters'
import { filtersToSearchParams } from '@/lib/utils/searchParams'
import { useAnimeSearch } from '@/hooks/useAnimeSearch'
import { SearchBar } from '@/components/search/SearchBar'
import { FilterPanel } from '@/components/search/FilterPanel'
import { AnimeGrid } from '@/components/anime/AnimeGrid'
import { InfiniteScrollTrigger } from '@/components/search/InfiniteScrollTrigger'

export function SearchExperience({
  initialAnime,
  initialHasNextPage,
  filters,
}: {
  initialAnime: Anime[]
  initialHasNextPage: boolean
  filters: SearchFilters
}) {
  const router = useRouter()
  const { anime, hasNextPage, loadMore } = useAnimeSearch(initialAnime, initialHasNextPage, filters)

  function updateFilters(next: SearchFilters) {
    const params = filtersToSearchParams(next)
    router.push(params.toString() ? `/?${params.toString()}` : '/')
  }

  return (
    <div className="space-y-6">
      <SearchBar defaultValue={filters.search} onSearch={(search) => updateFilters({ ...filters, search })} />
      <FilterPanel filters={filters} onChange={updateFilters} />
      <AnimeGrid anime={anime} />
      <InfiniteScrollTrigger onIntersect={loadMore} disabled={!hasNextPage} />
    </div>
  )
}
```

- [ ] **Step 2: Write `src/app/page.tsx`**

```tsx
import { parseSearchParams } from '@/lib/utils/searchParams'
import { fetchAnimeList } from '@/lib/anilist/client'
import { SearchExperience } from '@/components/search/SearchExperience'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedParams = await searchParams
  const urlParams = new URLSearchParams()
  for (const [key, value] of Object.entries(resolvedParams)) {
    if (typeof value === 'string') urlParams.set(key, value)
  }
  const filters = parseSearchParams(urlParams)
  const { anime, hasNextPage } = await fetchAnimeList(filters)

  return <SearchExperience initialAnime={anime} initialHasNextPage={hasNextPage} filters={filters} />
}
```

- [ ] **Step 3: Write `src/app/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton key={index} className="aspect-[2/3] w-full" />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Write `src/app/error.tsx`**

```tsx
'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4 py-12 text-center">
      <p className="text-ui text-text">Etwas ist schiefgelaufen beim Laden der Anime.</p>
      <button onClick={reset} className="rounded-card bg-primary px-4 py-2 text-white">
        Erneut versuchen
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Write `src/app/not-found.tsx`**

```tsx
export default function NotFound() {
  return (
    <div className="py-12 text-center">
      <p className="text-ui text-text">Seite nicht gefunden.</p>
    </div>
  )
}
```

- [ ] **Step 6: Verify the app builds and runs**

Run: `npm run build`
Expected: build succeeds with a static/dynamic route for `/`.

Run: `npm run dev` (manually stop after checking), open `http://localhost:3000`
Expected: trending anime grid renders; typing in the search box and changing filters updates the URL and results; scrolling to the bottom loads more results.

- [ ] **Step 7: Commit**

```bash
git add src/components/search/SearchExperience.tsx src/app/page.tsx src/app/loading.tsx src/app/error.tsx src/app/not-found.tsx
git commit -m "feat: add home page with search, filters, and infinite scroll"
```

---

## Task 19: Anime Detail Page

**Files:**
- Create: `src/app/anime/[id]/page.tsx`
- Create: `src/app/anime/[id]/loading.tsx`
- Create: `src/app/anime/[id]/error.tsx`

**Interfaces:**
- Consumes: `fetchAnimeById` (Task 6); `AniListError` (Task 6); `AnimeDetailHeader`, `AnimeStats`, `GenreList`, `AnimeDescription`, `RelatedAnime` (Task 14); `WatchlistButton` (Task 17); `Skeleton` (Task 10).

- [ ] **Step 1: Write `src/app/anime/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { fetchAnimeById } from '@/lib/anilist/client'
import { AniListError } from '@/lib/anilist/errors'
import { AnimeDetailHeader } from '@/components/anime/AnimeDetailHeader'
import { AnimeStats } from '@/components/anime/AnimeStats'
import { GenreList } from '@/components/anime/GenreList'
import { AnimeDescription } from '@/components/anime/AnimeDescription'
import { RelatedAnime } from '@/components/anime/RelatedAnime'
import { WatchlistButton } from '@/components/watchlist/WatchlistButton'

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const animeId = Number(id)
  if (Number.isNaN(animeId)) notFound()

  let anime
  try {
    anime = await fetchAnimeById(animeId)
  } catch (error) {
    if (error instanceof AniListError && error.status === 404) notFound()
    throw error
  }

  return (
    <div className="space-y-6">
      <AnimeDetailHeader anime={anime} />
      <WatchlistButton anime={anime} />
      <AnimeStats anime={anime} />
      <GenreList genres={anime.genres} />
      <AnimeDescription description={anime.description} />
      <RelatedAnime relations={anime.relations} />
    </div>
  )
}
```

- [ ] **Step 2: Write `src/app/anime/[id]/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return <Skeleton className="h-96 w-full" />
}
```

- [ ] **Step 3: Write `src/app/anime/[id]/error.tsx`**

```tsx
'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4 py-12 text-center">
      <p className="text-ui text-text">Dieser Anime konnte nicht geladen werden.</p>
      <button onClick={reset} className="rounded-card bg-primary px-4 py-2 text-white">
        Erneut versuchen
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Verify the app builds and runs**

Run: `npm run build`
Expected: build succeeds with a dynamic route for `/anime/[id]`.

Run: `npm run dev` (manually stop after checking), open `http://localhost:3000/anime/1`
Expected: detail header, stats, genres, description, related anime, and a working watchlist button render.

- [ ] **Step 5: Commit**

```bash
git add src/app/anime
git commit -m "feat: add anime detail page"
```

---

## Task 20: Watchlist Page

**Files:**
- Create: `src/app/watchlist/page.tsx`
- Create: `src/app/watchlist/loading.tsx`

**Interfaces:**
- Consumes: `useWatchlist` (Task 8); `WatchlistFilterTabs`, `WatchlistItem` (Task 17); `WatchStatus` (Task 4); `Skeleton` (Task 10).

- [ ] **Step 1: Write `src/app/watchlist/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useWatchlist } from '@/hooks/useWatchlist'
import { WatchlistFilterTabs } from '@/components/watchlist/WatchlistFilterTabs'
import { WatchlistItem } from '@/components/watchlist/WatchlistItem'
import type { WatchStatus } from '@/types/watchlist'

export default function WatchlistPage() {
  const { entries } = useWatchlist()
  const [filter, setFilter] = useState<WatchStatus | 'ALL'>('ALL')

  const filtered = filter === 'ALL' ? entries : entries.filter((entry) => entry.status === filter)

  return (
    <div className="space-y-6">
      <h1 className="text-h2 font-bold text-text">Meine Watchlist</h1>
      <WatchlistFilterTabs value={filter} onChange={setFilter} />
      {filtered.length === 0 ? (
        <p className="text-ui text-text-muted">Keine Einträge in dieser Ansicht.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <WatchlistItem key={entry.animeId} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write `src/app/watchlist/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full" />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify the app builds and runs**

Run: `npm run build`
Expected: build succeeds with a route for `/watchlist`.

Run: `npm run dev` (manually stop after checking), open `http://localhost:3000/watchlist` after adding an anime from a detail page
Expected: added anime appears, status/progress are editable and persist across a page reload (localStorage).

- [ ] **Step 4: Commit**

```bash
git add src/app/watchlist
git commit -m "feat: add watchlist page"
```

---

## Task 21: Static Assets and README

**Files:**
- Create: `public/placeholder-cover.svg`
- Create: `README.md`

**Interfaces:**
- Produces: `/placeholder-cover.svg` (used as the `coverImage` fallback by `mapMediaToAnime`, Task 6).

- [ ] **Step 1: Write `public/placeholder-cover.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 360">
  <rect width="240" height="360" fill="#ECEEEF" />
  <text x="120" y="180" font-family="Space Grotesk, sans-serif" font-size="20" fill="#17161A99" text-anchor="middle">
    Kein Cover
  </text>
</svg>
```

- [ ] **Step 2: Write `README.md`**

```md
# Anime Tracker

Anime suchen, zur Watchlist hinzufügen, Fortschritt tracken. Next.js (App Router) ·
React · Tailwind CSS v4 · Vitest · AniList GraphQL API.

## Entwicklung

npm install
npm run dev

Öffnet auf http://localhost:3000.

## Tests

npm run test        # einmalig
npm run test:watch  # Watch-Modus

## Build

npm run build
npm run start
```

- [ ] **Step 3: Run the full test suite and build one last time**

Run: `npm run test`
Expected: PASS — all tests across the project green.

Run: `npm run build`
Expected: build succeeds for all routes (`/`, `/anime/[id]`, `/watchlist`).

- [ ] **Step 4: Commit**

```bash
git add public/placeholder-cover.svg README.md
git commit -m "chore: add placeholder cover asset and README"
```

---

## Post-Plan Note

`AnimeDetailHeader` (Task 14) deliberately does not render `WatchlistButton` itself — the detail page (Task 19) places `WatchlistButton` directly below it. This avoids a forward dependency from `components/anime/` onto `components/watchlist/` and matches the spec's data flow description ("Detailseite — Server Component, plus `<WatchlistButton>` als Client-Insel").
