# Anime Tracker — Design Spec

## 1. Zweck

Web-App zum Suchen von Anime, Verwalten einer persönlichen Watchlist mit
Fortschritt, und Ansehen von Detailinformationen zu einzelnen Anime.
Startseite zeigt standardmäßig die Top-20-Trending-Anime.

## 2. Stack

- **Next.js** (App Router, TypeScript)
- **React**
- **Tailwind CSS v4** (Theme via `@theme` in `globals.css`, kein `tailwind.config.js`)
- **Vitest** + React Testing Library (Vite steckt unter Vitest zur Test-Transformation,
  nicht als App-Bundler — Next.js bringt seinen eigenen Bundler mit)
- **AniList GraphQL API** (`https://graphql.anilist.co`, kein API-Key nötig)
- **Watchlist** in `localStorage`
- **Package Manager:** npm

## 3. Projektstruktur

Siehe `PROJEKTSTRUKTUR.md` im Projekt-Root für den vollständigen Datei-Baum.
Kernregeln:

| Ordner | Regel |
|---|---|
| `app/` | Nur Routing-Artefakte. Keine wiederverwendbaren Komponenten, keine Fetch-Logik. |
| `components/` | Präsentation. Kennt keine `fetch`-Aufrufe — bekommt Daten per Props. |
| `lib/` | Framework-unabhängig, rein testbar (z.B. `lib/watchlist/reducer.ts` ist pure Funktion). |
| `types/` | Trennt rohe API-Typen (`anilist.ts`) vom internen Modell (`anime.ts`). |
| `constants/` | Alles, was sonst als Magic String im JSX landet. |

Tests liegen neben dem Code (`AnimeCard.test.tsx` neben `AnimeCard.tsx`).
Nur Fixtures und Setup wohnen unter `src/test/`.

## 4. Datenfluss

**Startseite (`/`)** — Server Component liest `searchParams`
(`search, year, season, format, genres, sort`):

```
URL ?search=&year=&season=&format=&genres=&sort=
   ↓ searchParams.ts parst zu SearchFilters
   ↓ lib/anilist/client.ts + queries.ts   (SSR, erste 20 Treffer)
   ↓ mappers.ts  →  Anime[]
   ↓ <AnimeGrid> → <AnimeCard>
```

Ohne Query-Parameter läuft dieselbe Query mit `sort: TRENDING_DESC, perPage: 20` —
Trending ist kein Sonderfall, sondern der Default-Filter. Filteränderungen
schreiben in die URL (`router.push`), Ergebnis ist teilbar/bookmarkbar.

**Infinite Scroll (Seite 2+):** Da kein serverseitiger API-Proxy existiert, läuft
das Nachladen komplett clientseitig über `hooks/useAnimeSearch.ts`. Dieselben
Module (`lib/anilist/client.ts`, `queries.ts`, `mappers.ts`) werden im Browser
wiederverwendet (AniList erlaubt CORS, kein Key nötig). Ein
`IntersectionObserver` in `components/search/InfiniteScrollTrigger.tsx` löst das
Nachladen aus; neue Treffer werden ans bestehende Grid angehängt. Sortierung
und Filter fließen unverändert in jede Nachlade-Query ein.

**Sortierung:** `SortSelect.tsx` in `components/search/`, schreibt `sort` in die
URL (`SCORE_DESC`, `POPULARITY_DESC`, `TRENDING_DESC`, `START_DATE_DESC`, …).

**Detailseite (`/anime/[id]`)** — Server Component, eine Query nach ID, plus
`<WatchlistButton>` als Client-Insel.

**Watchlist** — komplett clientseitig. `WatchlistProvider` hält Zustand in
`useReducer`, spiegelt ihn nach jedem Dispatch in `localStorage`. Beim ersten
Render wird **nichts** aus `localStorage` gelesen (Hydration-Mismatch),
stattdessen im `useEffect` nachgeladen.

## 5. Zentrale Typen

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
  snapshot: Pick<Anime, 'title' | 'coverImage' | 'format'>  // Watchlist rendert offline
}
```

## 6. Testplan (Vitest)

| Ebene | Was | Wo |
|---|---|---|
| Unit | `reducer.ts`, `mappers.ts`, `searchParams.ts`, `format.ts` | neben der Datei, kein DOM |
| Component | `AnimeCard`, `ProgressControl`, `FilterPanel`, `SortSelect`, `WatchlistButton` | RTL + `renderWithProviders` |
| Integration | Suche mit Filtern/Sort → Grid rendert erwartete Titel; Infinite-Scroll hängt Seite 2 an | MSW fängt GraphQL-Calls ab |

Async Server Components lassen sich mit RTL nicht sinnvoll rendern — Fetch-Logik
bleibt deshalb in `lib/anilist/`, direkt getestet; die Server Component selbst
bleibt dünne Hülle.

## 7. Visuelles Design — Tenji

Übernommen wird nur die **visuelle Sprache** aus dem Tenji Design System
(`C:\Users\KAOS\Desktop\Tenji`), nicht die Shopify-spezifische Struktur
(kein Collage/Pinnwand-Layout, kein Satz-Filter, kein Accessibility-Panel).
Layout bleibt normales responsives Grid, Filter bleiben normale Formular-Controls
(Select/Chips) im Tenji-Look.

**Farben** (nur Orange + Türkis aus Tenji übernommen, Rest selbst definiert):

| Rolle | Light | Dark |
|---|---|---|
| Primär (CTA, aktiver Status, Score, Progress-Bar) | `#F0531C` | `#F0531C` |
| Sekundär (Badges, Fokus-Ring, Bullets) | `#12B5A6` (als Text: `#0E7C72` für AA) | `#12B5A6` |
| Hintergrund | neutral hell (z.B. `#F7F7F5`) | `#17161A` (Tenji Ink) |
| Karten-Fläche | `#FFFFFF` | leicht aufgehellt ggü. Ink (z.B. `#1F1E22`) |
| Text | dunkel (z.B. `#17161A`) | hell (z.B. `#ECEEEF`) |

Grau-/Neutral-Skala für Light/Dark abseits von Ink/Orange/Türkis wird bei der
Umsetzung selbst festgelegt (Tenji liefert dafür keine Vorgabe).

**Typografie:** Space Grotesk (Headlines, UI, Body), JetBrains Mono (Meta-Infos:
Episodenzahl, Score, Format, Season, Genre-Tags — passt zu `AnimeStats`,
`GenreList`).

**Radien:** 4px Cover-Bilder, 7px Karten/Buttons/Chips, 11px große Panels.

**Schatten:** Tenji Lift-Shadow für `AnimeCard`:
`0 2px 4px #17161a12, 0 24px 44px -26px #17161a80`.

**Motion:** dezent (Tenji Motion-Level 4/10), `prefers-reduced-motion` wird
respektiert.

**Dark/Light Toggle:** `ThemeToggle.tsx` im Header, wie ursprünglich geplant —
kein Bestandteil von Tenji selbst, wird ergänzt.

## 8. Explizit außerhalb des Scopes

- Kein serverseitiger API-Proxy (`api/anime/route.ts` entfällt)
- Keine klassische Seiten-Pagination (stattdessen Infinite Scroll)
- Keine Collage/Pinnwand-Layouts, kein Satz-Filter, kein Accessibility-Panel
  aus Tenji
- Kein State-Management-Paket (Zustand/Redux) — `useReducer` + Context reicht
- Kein React Query — Fetching läuft server- und clientseitig direkt über
  `lib/anilist/`
