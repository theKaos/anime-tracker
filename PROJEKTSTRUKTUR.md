# Anime Tracker — Ordner- und Dateistruktur

**Stand:** 03.11.2026. Das Dokument begann als Plan und beschreibt jetzt den tatsächlichen Code. Was sich gegenüber dem Plan geändert hat, steht in [Abschnitt 7](#7-änderungen-gegenüber-dem-ursprünglichen-plan).

**Stack:** Next.js 15 (App Router, TypeScript) · React 19 · Tailwind CSS v4 · Zustand · Zod · Vitest + React Testing Library · Playwright · AniList GraphQL API · Watchlist in `localStorage`, geräteübergreifend über eine JSON-Datei im Cloud-Ordner

> **Hinweis zum Build-Tool:** Vite ist hier *nicht* der App-Bundler — Next.js bringt seinen eigenen mit. Vite steckt nur unter Vitest (Test-Transformation).
>
> **Persistenz:** Kein Backend, keine Datenbank, kein Account. Details in `PERSISTENZ-PLAN.md` — dieses Dokument zeigt nur, wo die Dateien liegen.

---

## 1. Vollständiger Baum

Testdateien (`*.test.ts(x)`) sind nicht aufgeführt, sie liegen neben dem jeweiligen Code.

```
anime-tracker/
├── .claude/
│   └── launch.json
├── .github/
│   └── workflows/
│       └── ci.yml                   # Jobs: Typecheck/Lint/Unit-Tests, E2E, Barrierefreiheit
├── .env.example                     # Vorlage, wird eingecheckt (siehe Abschnitt 7: Bekannte Abweichung)
├── .gitignore
├── .prettierrc
├── eslint.config.mjs                # Flat Config
├── LICENSE
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── PERSISTENZ-PLAN.md
├── playwright.config.ts             # Projekte desktop, mobile, accessibility, performance
├── postcss.config.mjs               # @tailwindcss/postcss
├── PROJEKTSTRUKTUR.md
├── README.md
├── tsconfig.json                    # paths: "@/*" -> "./src/*"
├── tsconfig.tsbuildinfo
├── vitest.config.ts
├── vitest.environment.ts            # Test-Umgebung für Vitest
├── vitest.setup.ts                  # globales Test-Setup
│
├── e2e/
│   ├── mock-anilist.mjs             # ersetzt graphql.anilist.co für Playwright (Port 4010)
│   ├── fixtures.ts                  # Playwright-Fixture, Platzhalterbild
│   ├── perf-utils.ts                # Drosselung, Messung, Median
│   ├── accessibility.spec.ts
│   ├── detail.spec.ts
│   ├── search.spec.ts
│   ├── settings.spec.ts
│   ├── watchlist.spec.ts
│   └── performance.perf.ts
│
├── public/
│   └── placeholder-cover.svg        # Fallback, wenn AniList kein Cover liefert
│
└── src/
    ├── app/                         # App Router — nur Routing, Layouts, Pages
    │   ├── layout.tsx               # Root-Layout: Schriften, Header/Footer, Sync-Provider, Banner
    │   ├── globals.css              # @import "tailwindcss" + @theme
    │   ├── icon.svg                 # App-Icon
    │   ├── page.tsx                 # STARTSEITE: erste Suchseite serverseitig laden
    │   ├── loading.tsx
    │   ├── error.tsx
    │   ├── not-found.tsx
    │   │
    │   ├── anime/
    │   │   └── [id]/
    │   │       ├── page.tsx         # DETAILSEITE: prüft die ID, lädt per Server Component
    │   │       ├── loading.tsx
    │   │       └── error.tsx
    │   │
    │   ├── watchlist/
    │   │   ├── page.tsx             # WATCHLIST: Status-Filter und Sortierung
    │   │   └── loading.tsx
    │   │
    │   └── settings/
    │       └── page.tsx             # Einstellungen: Auto-Sync und Datei-Sync
    │
    ├── components/
    │   ├── ui/                      # wiederverwendbare Primitives ohne Domänenlogik
    │   │   ├── Badge.tsx
    │   │   ├── Button.tsx
    │   │   ├── Dialog.tsx           # modal, mit Fokus-Rückkehr
    │   │   ├── Input.tsx
    │   │   ├── OptionSelect.tsx     # Auswahlfeld mit Optionsliste
    │   │   ├── Select.tsx
    │   │   ├── Skeleton.tsx
    │   │   └── Spinner.tsx
    │   │
    │   ├── layout/
    │   │   ├── Header.tsx
    │   │   ├── Footer.tsx
    │   │   └── ReconnectBanner.tsx  # erscheint, wenn die Dateiberechtigung neu erteilt werden muss
    │   │
    │   ├── settings/
    │   │   ├── AutoSyncPanel.tsx    # Automatik: verbinden, abgleichen, lösen
    │   │   ├── FileSyncPanel.tsx    # Datei-Sync-Panel
    │   │   ├── SyncStatusBadge.tsx
    │   │   ├── MergeSummaryDialog.tsx    # zeigt, was der Import verändert hat
    │   │   └── ManualTransferButtons.tsx # Export-Download / Import-Upload (alle Browser)
    │   │
    │   ├── anime/
    │   │   ├── AnimeCard.tsx
    │   │   ├── AnimeGrid.tsx
    │   │   ├── AnimeDetailHeader.tsx
    │   │   ├── AnimeDescription.tsx # HTML-Beschreibung von AniList (sanitized)
    │   │   ├── AnimeStats.tsx
    │   │   ├── GenreList.tsx
    │   │   └── RelatedAnime.tsx
    │   │
    │   ├── search/
    │   │   ├── SearchExperience.tsx # Suchbereich: Filter, Ergebnisse, Nachladen
    │   │   ├── SearchBar.tsx
    │   │   ├── FilterPanel.tsx      # Container für alle Filter und die Sortierung
    │   │   ├── YearFilter.tsx
    │   │   ├── SeasonFilter.tsx
    │   │   ├── FormatFilter.tsx
    │   │   ├── GenreFilter.tsx
    │   │   ├── SortSelect.tsx
    │   │   ├── ActiveFilterChips.tsx
    │   │   └── InfiniteScrollTrigger.tsx # IntersectionObserver löst Nachladen aus
    │   │
    │   └── watchlist/
    │       ├── WatchlistButton.tsx  # Hinzufügen/Entfernen, überall einsetzbar
    │       ├── WatchlistItem.tsx
    │       ├── ProgressControl.tsx
    │       ├── StatusSelect.tsx
    │       ├── WatchlistFilterTabs.tsx
    │       └── WatchlistSortSelect.tsx
    │
    ├── lib/
    │   ├── anilist/
    │   │   ├── client.ts            # Fetch-Wrapper, prüft Antworten mit Zod
    │   │   ├── queries.ts           # GraphQL-Dokumente (Suche, Detail)
    │   │   ├── mappers.ts           # AniList-Response -> internes Anime-Modell
    │   │   └── errors.ts            # AniListError mit Antwortausschnitt
    │   │
    │   ├── watchlist/
    │   │   ├── storage.ts           # read/write localStorage
    │   │   ├── parseEntries.ts      # prüft Einträge aus Datei und localStorage, verwirft kaputte
    │   │   ├── reducer.ts           # reine Zustandslogik (add/remove/progress/status)
    │   │   ├── selectors.ts         # isActive, activeEntries, isInWatchlist
    │   │   └── sort.ts              # Sortierung und Status-Filter ohne Grabsteine
    │   │
    │   ├── sync/                    # siehe PERSISTENZ-PLAN.md
    │   │   ├── fileFormat.ts        # SCHEMA_VERSION, APP_ID, Migrationen
    │   │   ├── validate.ts          # Laufzeitprüfung fremder Dateien
    │   │   ├── serialize.ts         # toFile() / toJson() / fromJson()
    │   │   ├── applyImport.ts       # kompletter Import als pure Funktion
    │   │   ├── merge.ts             # mergeWatchlists() -> MergeResult  ← Kern des Features
    │   │   ├── tombstones.ts        # entfernt Grabsteine nach 90 Tagen
    │   │   ├── fileHandleStore.ts   # IndexedDB: Datei-Handle speichern / laden / löschen
    │   │   ├── permissions.ts       # Berechtigungsabfrage und Status-Mapping
    │   │   ├── syncPort.ts          # Interface — macht die Logik testbar
    │   │   ├── fsaAdapter.ts        # File System Access als SyncPort (Chromium)
    │   │   ├── download.ts          # manueller Transfer: Blob-Download und Datei-Lesen
    │   │   └── syncController.ts    # Read-Merge-Write-Controller
    │   │
    │   └── utils/
    │       ├── cn.ts                # clsx + tailwind-merge
    │       ├── format.ts            # Titel, Dauer, Score, Zeit
    │       ├── sanitize.ts          # AniList-Beschreibung enthält HTML -> XSS-Schutz
    │       └── searchParams.ts      # URLSearchParams <-> Filter-Objekt
    │
    ├── store/
    │   └── watchlistStore.ts        # Zustand-Store der Watchlist, spiegelt nach localStorage
    │
    ├── context/
    │   └── FileSyncProvider.tsx     # genau ein Sync-Controller für die App, Hook useFileSync
    │
    ├── hooks/
    │   ├── useAnimeSearch.ts        # Infinite Scroll, Fehler, Retry, Laden im Browser
    │   ├── useDebounce.ts
    │   ├── useFileSyncController.ts # erzeugt den Sync-Controller, hängt ihn an den Store
    │   └── useSyncTriggers.ts       # visibilitychange / focus
    │
    ├── types/                       # Zod-Schemas, Typen per z.infer daraus abgeleitet
    │   ├── anime.ts                 # Anime, AnimeDetail, MediaFormat, MediaSeason
    │   ├── watchlist.ts             # WatchlistEntry, WatchStatus, StoredEntrySchema (tolerant)
    │   ├── sync.ts                  # SyncStatus, MergeResult, WatchlistFile, ParseResult
    │   ├── filters.ts               # SearchFilters, SortOption
    │   ├── anilist.ts               # rohe API-Response-Schemas
    │   └── css.d.ts
    │
    ├── constants/
    │   ├── genres.ts
    │   ├── formats.ts
    │   ├── seasons.ts
    │   └── config.ts                # PAGE_SIZE, STORAGE_KEY, API-URL, Timeouts, Fristen
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
            ├── renderWithProviders.tsx
            ├── memorySyncPort.ts    # In-Memory-Datei statt File System Access
            ├── watchlistFactory.ts  # makeEntry() für Testdaten
            └── watchlistStoreTestUtils.ts # setzt das Store-Singleton zurück
```

---

## 2. Warum diese Aufteilung

| Ordner | Regel |
|---|---|
| `app/` | Enthält **nur** Routing-Artefakte. Keine wiederverwendbaren Komponenten. Server Components rufen `lib/anilist/` direkt auf. |
| `components/` | UI ohne eigene `fetch`-Aufrufe. Nachgeladen wird über Hooks, Watchlist-Komponenten greifen auf den Store zu. |
| `lib/` | Framework-unabhängig und rein testbar. `lib/watchlist/reducer.ts` ist eine pure Funktion und braucht kein DOM. |
| `store/` | Der Watchlist-Zustand als Modul-Singleton. Die eigentliche Logik bleibt in `lib/watchlist/reducer.ts`. |
| `context/` | Nur der Datei-Sync-Controller. Der Watchlist-Zustand liegt nicht hier. |
| `types/` | Trennt **rohe API-Schemas** (`anilist.ts`) vom **internen Modell** (`anime.ts`). Wenn AniList sein Schema ändert, ändern sich nur `anilist.ts` und `mappers.ts`. Typen werden nicht von Hand geschrieben, sondern per `z.infer` aus dem Schema abgeleitet. |
| `constants/` | Alles, was sonst als Magic String im JSX landet. |

Andere `interface`s bleiben bewusst außerhalb von `types/`: Component-Props, `SyncPort` und Controller-Verträge beschreiben Code, keine Daten von außen, und brauchen kein Schema.

---

## 3. Datenfluss

**Startseite (`/`)** — Server Component, liest `searchParams`:

```
URL ?search=&year=&season=&format=&genres=&sort=
   ↓ searchParams.ts parst zu SearchFilters
   ↓ lib/anilist/client.ts + queries.ts
   ↓ AniListPageResponseSchema prüft die Antwort zur Laufzeit
   ↓ mappers.ts  →  Anime[]
   ↓ <SearchExperience> → <AnimeGrid> → <AnimeCard>
```

Ohne Query-Parameter läuft dieselbe Query mit `sort: TRENDING_DESC` und `PAGE_SIZE` 20 — Trending ist also kein Sonderfall, sondern der Default-Filter. Filteränderungen schreiben in die URL (`router.push`), Next re-rendert serverseitig. Vorteil: Suchergebnisse sind teilbar und bookmarkbar.

**Nachladen im Browser** — Der Server liefert nur die erste Seite. Weitere Seiten holt `useAnimeSearch` im Browser, ausgelöst von `InfiniteScrollTrigger`. Scheitert der Serverabruf, lädt der Browser auch die erste Seite selbst: AniList blockt Anfragen aus Rechenzentren, die Leitung des Nutzers kommt durch.

**Detailseite (`/anime/[id]`)** — Server Component, eine Query nach ID, plus `<WatchlistButton>` als Client-Insel. Eine ungültige ID führt direkt zur 404-Seite.

**Watchlist** — komplett clientseitig. `watchlistStore` hält den Zustand, schickt Änderungen durch `reducer.ts` und spiegelt sie nach `localStorage`. Der Store lädt beim Modulstart im Browser und setzt dann `hydrated`; auf dem Server bleibt er leer.

**Datei-Sync** — `FileSyncProvider` hält über `useFileSyncController` genau einen `syncController`. Der spricht über `SyncPort` mit der Datei (`fsaAdapter.ts`), `useSyncTriggers` startet den Abgleich bei `visibilitychange` und `focus`. Der manuelle Import läuft über dieselbe pure Funktion `applyImport.ts`.

**Laufzeitvalidierung** — Daten von außen werden beim Einlesen mit den Schemas aus `types/` geprüft: AniList-Antworten, Dateien, `localStorage`, URL-Parameter und die Route-ID. Das Verhalten je Quelle steht in der [README](README.md#laufzeitvalidierung).

---

## 4. Zentrale Typen (Skizze)

```ts
// types/anime.ts
export const MediaFormatSchema = z.enum(['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'])
export type MediaFormat = z.infer<typeof MediaFormatSchema>

export const MediaSeasonSchema = z.enum(['WINTER', 'SPRING', 'SUMMER', 'FALL'])
export type MediaSeason = z.infer<typeof MediaSeasonSchema>

export const AnimeSchema = z.object({
  id: z.number(),
  title: AnimeTitleSchema,          // romaji, english (nullable), native
  coverImage: z.string(),
  format: MediaFormatSchema.nullable(),
  episodes: z.number().nullable(),
  seasonYear: z.number().nullable(),
  season: MediaSeasonSchema.nullable(),
  genres: z.array(z.string()),
  averageScore: z.number().nullable(),
  // ... weitere Felder in types/anime.ts
})
export type Anime = z.infer<typeof AnimeSchema>

// types/watchlist.ts
export const WatchStatusSchema = z.enum(['PLANNING', 'WATCHING', 'COMPLETED', 'PAUSED', 'DROPPED'])
export type WatchStatus = z.infer<typeof WatchStatusSchema>

export const WatchlistEntrySchema = z.object({
  animeId: z.number(),
  status: WatchStatusSchema,
  progress: z.number().min(0),      // gesehene Episoden
  totalEpisodes: z.number().nullable(),
  addedAt: IsoDateSchema,
  updatedAt: IsoDateSchema,         // Grundlage für Last-Write-Wins beim Merge
  deletedAt: IsoDateSchema.nullable(),  // Tombstone — siehe unten
  snapshot: AnimeSchema.pick({ title: true, coverImage: true, format: true }),  // damit die Watchlist offline rendert
})
export type WatchlistEntry = z.infer<typeof WatchlistEntrySchema>
```

Zwei bewusst redundante Felder:

`snapshot` — sonst müsste beim Öffnen der Watchlist für jeden Eintrag einzeln die API abgefragt werden.

`deletedAt` — gelöschte Einträge werden nicht entfernt, sondern markiert. Ohne diese Markierung bringt der nächste Geräteabgleich sie zurück, weil das andere Gerät sie noch kennt und ein fehlender Eintrag nicht von einem gelöschten zu unterscheiden ist.

`WatchlistEntrySchema` beschreibt den gültigen Eintrag. Beim Einlesen gilt das tolerantere `StoredEntrySchema`: Es ergänzt, was ältere Versionen nicht geschrieben haben, zum Beispiel `deletedAt`.

---

## 5. Tests

Unit- und Komponententests liegen **neben** dem Code (`AnimeCard.test.tsx` neben `AnimeCard.tsx`), nicht in einem separaten Spiegel-Baum. Nur Fixtures und Helfer wohnen unter `src/test/`. E2E-Tests liegen in `e2e/`.

| Ebene | Was | Wo |
|---|---|---|
| Unit | `reducer.ts`, `mappers.ts`, `searchParams.ts`, `format.ts` | neben der Datei, kein DOM nötig |
| Unit | `merge.ts`, `validate.ts`, `parseEntries.ts` (über `validate.test.ts` und `storage.test.ts`), `serialize.ts`, `tombstones.ts` | höchste Priorität — hier liegt das Datenverlust-Risiko |
| Component | Komponenten unter `components/` | RTL + `renderWithProviders` |
| Page | Server Components wie `app/anime/[id]/page.tsx` | werden in `page.test.tsx` direkt aufgerufen und gerendert |
| Integration | Suche gegen gemockte GraphQL-Calls | MSW |
| Integration | Zwei Geräte tauschen eine Datei → gleicher Endzustand | `twoDevices.test.ts`, gegen die pure Schicht |
| E2E | Suche, Detailseite, Watchlist, Settings auf Desktop und Mobile | Playwright gegen `mock-anilist.mjs` |
| Barrierefreiheit | WCAG 2.2 AA | Playwright + axe-core |
| Performance | Messungen mit Drosselung | `performance.perf.ts` |

---

## 6. Abhängigkeiten

```
Runtime:   next  react  react-dom  clsx  tailwind-merge  zod  zustand
Dev:       typescript  @types/react  @types/react-dom  @types/node  @types/wicg-file-system-access
           tailwindcss  @tailwindcss/postcss
           vitest  @vitest/coverage-v8  @vitejs/plugin-react  vite-tsconfig-paths  jsdom  fake-indexeddb
           @testing-library/react  @testing-library/user-event  @testing-library/jest-dom
           msw
           @playwright/test  @axe-core/playwright
           eslint  eslint-config-next  prettier
```

Kein React Query: Die erste Seite kommt vom Server, und für das Nachladen reicht `useAnimeSearch`.

Für die Persistenz kommt keine Runtime-Bibliothek hinzu — File System Access und IndexedDB sind Browser-APIs, `fileHandleStore.ts` nutzt IndexedDB direkt. `@types/wicg-file-system-access` liefert die FSA-Typen, die nicht in der TypeScript-Standardbibliothek stehen.

---

## 7. Änderungen gegenüber dem ursprünglichen Plan

### Architektur

| Thema | Plan | Heute |
|---|---|---|
| Watchlist-Zustand | `useReducer` + Context (`WatchlistProvider`, `useWatchlist`), kein State-Paket | Zustand-Store als Modul-Singleton in `store/`. `reducer.ts` blieb als pure Logik erhalten. |
| Hydration | Im `useEffect` aus `localStorage` nachladen | Der Store lädt beim Modulstart im Browser und setzt `hydrated`. |
| Datenabruf | Nur serverseitig, clientseitiges Nachladen optional | Erste Seite vom Server, weitere im Browser. Der Browser übernimmt auch die erste Seite, wenn AniList den Server blockt. |
| AniList-Client | Einfacher Fetch-Wrapper | Liest die Antwort erst als Text, setzt Timeout (10 s), `User-Agent` und Revalidierung (300 s). Auslöser war eine HTML-Sperrseite von AniList in Produktion. |
| Typen | Von Hand geschrieben | Zod-Schemas in `types/`, Typen per `z.infer` abgeleitet |
| Laufzeitprüfung | Nur `validate.ts` für fremde Dateien | Auch AniList-Antworten, `localStorage`, URL-Parameter und Route-ID |
| API-Proxy | Optional unter `app/api/` | Nicht gebaut |

### Entschiedene Punkte aus dem Plan

| Frage | Entscheidung |
|---|---|
| Tailwind-Version | v4, konfiguriert per `@theme` in `globals.css`, keine `tailwind.config.js` |
| Rate Limiting | Debounce von 400 ms (`DEBOUNCE_MS`), Plan war mindestens 300 ms |
| Pagination | Infinite Scroll mit 20 Einträgen pro Seite |
| Sortierung | Gebaut: `SortSelect.tsx` in der Suche, `WatchlistSortSelect.tsx` in der Watchlist |
| E2E-Tests | Gebaut mit Playwright, dazu axe-core und Performance-Messungen. CI über GitHub Actions. |
| Server Components testen | Plan hielt das mit RTL für nicht sinnvoll. `page.test.tsx` ruft sie jetzt direkt auf und rendert das Ergebnis. |

### Dateien, die anders heißen oder wegfielen

| Plan | Heute |
|---|---|
| `context/WatchlistProvider.tsx` | Entfallen, ersetzt durch `store/watchlistStore.ts` |
| `hooks/useWatchlist.ts` | Entfallen, Komponenten nutzen `useWatchlistStore` |
| `hooks/useFileSync.ts` | Hook `useFileSync` in `context/FileSyncProvider.tsx` |
| `lib/sync/downloadAdapter.ts` | `lib/sync/download.ts` |
| `test/utils/fakeSyncPort.ts` | `test/utils/memorySyncPort.ts` |
| `test/mocks/fixtures/watchlistFile.json` | Entfallen, Testdaten kommen aus `watchlistFactory.ts` |
| `components/layout/ThemeToggle.tsx` | Nicht gebaut |
| `public/favicon.ico` | `src/app/icon.svg` |
| `.eslintrc.json` | `eslint.config.mjs` |
| `idb-keyval` (optional) | Nicht verwendet |

### Neu gegenüber dem Plan

- **Zustand und Sync:** `store/watchlistStore.ts`, `context/FileSyncProvider.tsx`, `hooks/useFileSyncController.ts`, `lib/sync/applyImport.ts`, `components/settings/AutoSyncPanel.tsx`
- **Suche:** `SearchExperience.tsx`, `InfiniteScrollTrigger.tsx`, `SortSelect.tsx`
- **Watchlist:** `lib/watchlist/sort.ts`, `lib/watchlist/parseEntries.ts`, `WatchlistSortSelect.tsx`
- **UI:** `ui/OptionSelect.tsx`
- **Tests und CI:** `e2e/`, `playwright.config.ts`, `vitest.environment.ts`, `.github/workflows/ci.yml`, `test/utils/watchlistFactory.ts`, `test/utils/watchlistStoreTestUtils.ts`
- **Pakete:** `zustand`, `zod`, `@playwright/test`, `@axe-core/playwright`, `@vitest/coverage-v8`, `fake-indexeddb`

### Bekannte Abweichung

Die Variable für den AniList-Endpunkt heißt im Code und in der README `NEXT_PUBLIC_ANILIST_API_URL`. In `.env.example` steht noch der Name aus dem Plan, `NEXT_PUBLIC_ANILIST_URL`. Wird die Vorlage kopiert, bleibt die Einstellung wirkungslos, und die App nutzt den Standard-Endpunkt.
