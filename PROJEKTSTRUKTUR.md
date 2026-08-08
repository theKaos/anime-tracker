# Anime Tracker — Ordner- und Dateistruktur

**Stack (nach Rückfragen festgelegt):** Next.js (App Router, TypeScript) · React · Tailwind CSS · Vitest + React Testing Library · AniList GraphQL API · Watchlist in `localStorage`

> **Hinweis zum Build-Tool:** Vite ist hier *nicht* der App-Bundler — Next.js bringt seinen eigenen mit. Vite steckt nur unter Vitest (Test-Transformation). Das ist der einzige Punkt, an dem deine ursprüngliche Anforderung abweicht.

---

## 1. Vollständiger Baum

```
anime-tracker/
├── .env.local                       # optional: NEXT_PUBLIC_ANILIST_URL (AniList braucht keinen Key)
├── .env.example                     # Vorlage, wird eingecheckt
├── .gitignore
├── .eslintrc.json                   # bzw. eslint.config.mjs (Flat Config)
├── .prettierrc
├── next.config.ts                   # images.remotePatterns für s4.anilist.co
├── package.json
├── postcss.config.mjs               # @tailwindcss/postcss
├── tsconfig.json                    # paths: "@/*" -> "./src/*"
├── vitest.config.ts                 # jsdom, setupFiles, tsconfig-paths
├── vitest.setup.ts                  # jest-dom Matcher, MSW-Server, localStorage-Reset
├── README.md
│
├── public/
│   ├── favicon.ico
│   └── placeholder-cover.svg        # Fallback, wenn AniList kein Cover liefert
│
└── src/
    ├── app/                         # App Router — nur Routing, Layouts, Pages
    │   ├── layout.tsx               # Root-Layout: <html>, Fonts, Provider, Header/Footer
    │   ├── globals.css              # @import "tailwindcss" + CSS-Variablen (Theme)
    │   ├── page.tsx                 # STARTSEITE: Trending Top 20 (default) + Suche/Filter
    │   ├── loading.tsx              # Skeleton für die Startseite
    │   ├── error.tsx                # Client-Error-Boundary
    │   ├── not-found.tsx
    │   │
    │   ├── anime/
    │   │   └── [id]/
    │   │       ├── page.tsx         # DETAILSEITE: Server Component, fetch by ID
    │   │       ├── loading.tsx
    │   │       └── error.tsx
    │   │
    │   ├── watchlist/
    │   │   ├── page.tsx             # WATCHLIST: Client Component (localStorage)
    │   │   └── loading.tsx
    │   │
    │   └── api/                     # optional — nur falls du AniList serverseitig proxen willst
    │       └── anime/
    │           └── route.ts
    │
    ├── components/
    │   ├── ui/                      # dumme, wiederverwendbare Primitives (keine Domänenlogik)
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Select.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Dialog.tsx
    │   │   ├── Skeleton.tsx
    │   │   └── Spinner.tsx
    │   │
    │   ├── layout/
    │   │   ├── Header.tsx           # Logo, Nav (Home / Watchlist), Suchfeld
    │   │   ├── Footer.tsx
    │   │   └── ThemeToggle.tsx
    │   │
    │   ├── anime/
    │   │   ├── AnimeCard.tsx        # Cover, Titel, Format, Score — verlinkt auf /anime/[id]
    │   │   ├── AnimeGrid.tsx        # responsives Grid, rendert AnimeCard[]
    │   │   ├── AnimeDetailHeader.tsx# Banner, Titel, Studio, Status
    │   │   ├── AnimeDescription.tsx # HTML-Beschreibung von AniList (sanitized!)
    │   │   ├── AnimeStats.tsx       # Episoden, Dauer, Score, Popularität
    │   │   ├── GenreList.tsx
    │   │   └── RelatedAnime.tsx     # optional: Prequel/Sequel
    │   │
    │   ├── search/
    │   │   ├── SearchBar.tsx        # debounced Texteingabe -> URL-Query
    │   │   ├── FilterPanel.tsx      # Container für alle Filter
    │   │   ├── YearFilter.tsx       # Erscheinungsjahr
    │   │   ├── SeasonFilter.tsx     # WINTER | SPRING | SUMMER | FALL
    │   │   ├── FormatFilter.tsx     # TV | MOVIE | OVA | ONA | SPECIAL | MUSIC
    │   │   ├── GenreFilter.tsx      # Mehrfachauswahl
    │   │   └── ActiveFilterChips.tsx# zeigt aktive Filter, einzeln entfernbar
    │   │
    │   └── watchlist/
    │       ├── WatchlistButton.tsx  # Hinzufügen/Entfernen, überall einsetzbar
    │       ├── WatchlistItem.tsx    # Zeile inkl. Fortschritt
    │       ├── ProgressControl.tsx  # +1 / -1 / direkte Eingabe der Episode
    │       ├── StatusSelect.tsx     # PLANNING | WATCHING | COMPLETED | DROPPED | PAUSED
    │       └── WatchlistFilterTabs.tsx
    │
    ├── lib/
    │   ├── anilist/
    │   │   ├── client.ts            # fetch-Wrapper gegen https://graphql.anilist.co
    │   │   ├── queries.ts           # GraphQL-Dokumente (trending, search, byId)
    │   │   ├── mappers.ts           # AniList-Response -> internes Anime-Modell
    │   │   └── errors.ts            # AniListError, Rate-Limit-Handling (429)
    │   │
    │   ├── watchlist/
    │   │   ├── storage.ts           # read/write localStorage, Versionierung + Migration
    │   │   └── reducer.ts           # reine Zustandslogik (add/remove/progress/status)
    │   │
    │   └── utils/
    │       ├── cn.ts                # clsx + tailwind-merge
    │       ├── format.ts            # Datum, Dauer, Score-Formatierung
    │       ├── sanitize.ts          # AniList-Beschreibung enthält HTML -> XSS-Schutz
    │       └── searchParams.ts      # URLSearchParams <-> Filter-Objekt
    │
    ├── hooks/
    │   ├── useWatchlist.ts          # Zugriff auf Context + Actions
    │   ├── useDebounce.ts
    │   └── useAnimeSearch.ts        # optional: clientseitiges Nachladen / Infinite Scroll
    │
    ├── context/
    │   └── WatchlistProvider.tsx    # "use client", useReducer + localStorage-Sync
    │
    ├── types/
    │   ├── anime.ts                 # Anime, AnimeDetail, MediaFormat, MediaSeason
    │   ├── watchlist.ts             # WatchlistEntry, WatchStatus
    │   ├── filters.ts               # SearchFilters
    │   └── anilist.ts               # rohe API-Response-Typen
    │
    ├── constants/
    │   ├── genres.ts                # feste AniList-Genre-Liste
    │   ├── formats.ts
    │   ├── seasons.ts
    │   └── config.ts                # PAGE_SIZE = 20, STORAGE_KEY, API_URL
    │
    └── test/
        ├── mocks/
        │   ├── handlers.ts          # MSW: GraphQL-Handler für AniList
        │   ├── server.ts            # setupServer für Node/Vitest
        │   └── fixtures/
        │       ├── trending.json
        │       ├── searchResult.json
        │       └── animeDetail.json
        └── utils/
            └── renderWithProviders.tsx  # RTL-render + WatchlistProvider
```

Tests liegen **neben** dem Code (`AnimeCard.test.tsx` neben `AnimeCard.tsx`), nicht in einem separaten Spiegel-Baum. Nur Fixtures und Setup wohnen unter `src/test/`.

---

## 2. Warum diese Aufteilung

| Ordner | Regel |
|---|---|
| `app/` | Enthält **nur** Routing-Artefakte. Keine wiederverwendbaren Komponenten, keine Fetch-Logik. |
| `components/` | Präsentation. Kennt keine `fetch`-Aufrufe — bekommt Daten per Props. |
| `lib/` | Framework-unabhängig und rein testbar. `lib/watchlist/reducer.ts` ist eine pure Funktion und braucht kein DOM. |
| `types/` | Trennt **rohe API-Typen** (`anilist.ts`) vom **internen Modell** (`anime.ts`). Wenn AniList sein Schema ändert, ändert sich nur `mappers.ts`. |
| `constants/` | Alles, was sonst als Magic String im JSX landet. |

---

## 3. Datenfluss

**Startseite (`/`)** — Server Component, liest `searchParams`:

```
URL ?search=&year=&season=&format=&genres=
   ↓ searchParams.ts parst zu SearchFilters
   ↓ lib/anilist/client.ts + queries.ts
   ↓ mappers.ts  →  Anime[]
   ↓ <AnimeGrid> → <AnimeCard>
```

Ohne Query-Parameter läuft dieselbe Query mit `sort: TRENDING_DESC, perPage: 20` — Trending ist also kein Sonderfall, sondern der Default-Filter. Filteränderungen schreiben in die URL (`router.push`), Next re-rendert serverseitig. Vorteil: Suchergebnisse sind teilbar und bookmarkbar.

**Detailseite (`/anime/[id]`)** — Server Component, eine Query nach ID, plus `<WatchlistButton>` als Client-Insel.

**Watchlist** — komplett clientseitig. `WatchlistProvider` hält den Zustand in `useReducer`, spiegelt ihn nach jedem Dispatch in `localStorage`. Wichtig: beim ersten Render **nichts** aus `localStorage` lesen, sonst Hydration-Mismatch — stattdessen im `useEffect` nachladen.

---

## 4. Zentrale Typen (Skizze)

```ts
// types/anime.ts
export type MediaFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC'
export type MediaSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'

export interface Anime {
  id: number
  title: { romaji: string; english: string | null; native: string }
  coverImage: string
  format: MediaFormat | null
  episodes: number | null
  seasonYear: number | null
  season: MediaSeason | null
  genres: string[]
  averageScore: number | null
}

// types/watchlist.ts
export type WatchStatus = 'PLANNING' | 'WATCHING' | 'COMPLETED' | 'PAUSED' | 'DROPPED'

export interface WatchlistEntry {
  animeId: number
  status: WatchStatus
  progress: number          // gesehene Episoden
  totalEpisodes: number | null
  addedAt: string           // ISO
  updatedAt: string
  snapshot: Pick<Anime, 'title' | 'coverImage' | 'format'>  // damit die Watchlist offline rendert
}
```

Das `snapshot`-Feld ist bewusst redundant: sonst müsstest du beim Öffnen der Watchlist für jeden Eintrag einzeln die API abfragen.

---

## 5. Testplan (Vitest)

| Ebene | Was | Wo |
|---|---|---|
| Unit | `reducer.ts`, `mappers.ts`, `searchParams.ts`, `format.ts` | neben der Datei, kein DOM nötig |
| Component | `AnimeCard`, `ProgressControl`, `FilterPanel`, `WatchlistButton` | RTL + `renderWithProviders` |
| Integration | Suche mit Filtern → Grid rendert erwartete Titel | MSW fängt die GraphQL-Calls ab |

**Einschränkung, die dich sonst später trifft:** async Server Components lassen sich mit React Testing Library nicht sinnvoll rendern. Deshalb liegt die Fetch-Logik in `lib/anilist/` — die testest du direkt, und die Server Component selbst bleibt eine dünne Hülle. Für echte End-to-End-Abdeckung der Seiten brauchst du später Playwright, nicht Vitest.

---

## 6. Abhängigkeiten

```
Runtime:   next  react  react-dom  clsx  tailwind-merge
Dev:       typescript  @types/react  @types/node
           tailwindcss  @tailwindcss/postcss
           vitest  @vitejs/plugin-react  vite-tsconfig-paths  jsdom
           @testing-library/react  @testing-library/user-event  @testing-library/jest-dom
           msw
           eslint  eslint-config-next  prettier
```

Kein State-Management-Paket (Zustand/Redux): Für eine Watchlist mit fünf Aktionen reicht `useReducer` + Context. Kein React Query: Das Daten-Fetching passiert serverseitig, Next cached selbst.

---

## 7. Offene Punkte für den nächsten Schritt

1. **Tailwind-Version** — v4 konfiguriert das Theme in CSS (`@theme` in `globals.css`, keine `tailwind.config.js`). v3 braucht die JS-Config. Der Baum oben geht von v4 aus; sag Bescheid, falls du v3 willst.
2. **Rate Limiting** — AniList erlaubt begrenzte Requests pro Minute. Bei Tippen-während-Suchen brauchst du das Debounce aus `hooks/useDebounce.ts` (min. 300 ms), sonst kassierst du 429er.
3. **Pagination** — Der Baum sieht 20 Ergebnisse vor. Klassische Seitennummern oder Infinite Scroll? Das ändert, ob `useAnimeSearch.ts` überhaupt gebraucht wird.
4. **Sortierung** — Soll man Suchergebnisse umsortieren können (Score, Popularität, Datum)? Dann kommt ein `SortSelect.tsx` in `components/search/`.
