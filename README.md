# Anime Tracker

Eine Web-App zum Suchen von Anime, Verwalten einer persönlichen Watchlist und Tracken des Schaufortschritts. Die Daten kommen live aus der [AniList GraphQL API](https://docs.anilist.co/). Die Watchlist bleibt lokal im Browser und lässt sich optional mit einer Datei synchronisieren.

[![CI](https://github.com/theKaos/anime-tracker/actions/workflows/ci.yml/badge.svg)](.github/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![License](https://img.shields.io/badge/License-MIT-green)

## Inhalt

- [Features](#features)
- [Tech-Stack](#tech-stack)
- [Schnellstart](#schnellstart)
- [Konfiguration](#konfiguration)
- [Scripts](#scripts)
- [Tests](#tests)
- [Projektstruktur](#projektstruktur)
- [Datenhaltung](#datenhaltung)
- [CI](#ci)
- [Lizenz](#lizenz)

## Features

- **Suche:** Volltextsuche mit Filtern für Format, Genre, Jahr und Season, dazu Sortierung und Infinite Scroll.
- **Detailseite:** Beschreibung, Statistiken, Genres und verwandte Titel, jeweils mit direktem Hinzufügen zur Watchlist.
- **Watchlist:** Filter nach Status, Sortierung, Status-Auswahl und Episoden-Fortschritt pro Eintrag.
- **Datei-Sync:** Watchlist über die File System Access API mit einer lokalen Datei abgleichen, mit Auto-Sync, manuellem Import/Export und einem Merge-Dialog bei Konflikten.
- **Responsiv und barrierearm:** optimiert für Desktop und Mobilgeräte, automatisiert gegen WCAG 2.2 AA geprüft.

## Tech-Stack

| Bereich       | Technologie                                             |
| ------------- | ------------------------------------------------------- |
| Framework     | Next.js 15 (App Router), React 19, TypeScript 5         |
| Styling       | Tailwind CSS v4                                         |
| State         | Zustand                                                 |
| Daten         | AniList GraphQL API                                     |
| Unit-Tests    | Vitest, Testing Library, MSW, jsdom                     |
| E2E-Tests     | Playwright, axe-core                                    |
| Code-Qualität | ESLint, Prettier, `tsc --noEmit`                        |

## Schnellstart

**Voraussetzungen:** Node.js 24 (wie in der CI) und npm.

```bash
git clone https://github.com/theKaos/anime-tracker.git
cd anime-tracker
npm install
npm run dev
```

Die App läuft danach unter <http://localhost:3000>.

Produktions-Build:

```bash
npm run build
npm run start
```

## Konfiguration

Ohne Konfiguration nutzt die App den öffentlichen AniList-Endpunkt. Wer einen anderen Endpunkt nutzen will (z. B. einen Mock), legt eine `.env.local` an:

```bash
NEXT_PUBLIC_ANILIST_API_URL=https://graphql.anilist.co
```

| Variable                      | Standard                     | Beschreibung                 |
| ----------------------------- | ---------------------------- | ---------------------------- |
| `NEXT_PUBLIC_ANILIST_API_URL` | `https://graphql.anilist.co` | GraphQL-Endpunkt von AniList |

## Scripts

| Befehl                  | Beschreibung                                        |
| ----------------------- | --------------------------------------------------- |
| `npm run dev`           | Entwicklungsserver starten                          |
| `npm run build`         | Produktions-Build erstellen                         |
| `npm run start`         | Produktions-Build ausführen                         |
| `npm run lint`          | ESLint ausführen                                    |
| `npm run typecheck`     | TypeScript prüfen, ohne Ausgabe                     |
| `npm run test`          | Unit-Tests einmal ausführen                         |
| `npm run test:watch`    | Unit-Tests im Watch-Modus                           |
| `npm run test:coverage` | Unit-Tests mit Coverage-Report (`coverage/`)        |
| `npm run e2e`           | E2E-Tests für Desktop und Mobile                    |
| `npm run e2e:ui`        | Playwright im interaktiven UI-Modus                 |
| `npm run e2e:a11y`      | Barrierefreiheits-Tests (axe-core)                  |
| `npm run e2e:perf`      | Performance-Tests                                   |

## Tests

### Unit- und Komponententests

Die Tests liegen als `*.test.ts(x)` direkt neben dem Code in `src/`. API-Aufrufe werden mit [MSW](https://mswjs.io/) gemockt, Mocks und Test-Helfer liegen in `src/test/`.

```bash
npm run test:coverage
```

Der HTML-Report landet in `coverage/index.html`.

### End-to-End-Tests

Playwright startet automatisch einen AniList-Mock-Server (Port 4010) und einen Produktions-Build der App (Port 3100). Es sind also keine echten API-Aufrufe nötig.

```bash
npx playwright install chromium   # einmalig
npm run e2e
```

| Projekt         | Gerät          | Inhalt                                  |
| --------------- | -------------- | --------------------------------------- |
| `desktop`       | Desktop Chrome | Suche, Detailseite, Watchlist, Settings |
| `mobile`        | Pixel 7        | Tests mit dem Tag `@mobile`             |
| `accessibility` | Desktop Chrome | WCAG-Prüfung mit axe-core               |
| `performance`   | Desktop Chrome | Performance-Messungen (`*.perf.ts`)     |

## Projektstruktur

```text
src/
├── app/          # Routen: /, /anime/[id], /watchlist, /settings
├── components/   # UI-Komponenten nach Bereich (search, anime, watchlist, settings, ui, layout)
├── constants/    # Konfiguration und Konstanten
├── context/      # React-Kontexte
├── hooks/        # Custom Hooks
├── lib/          # AniList-Client, Watchlist-Logik, Datei-Sync, Utils
├── store/        # Zustand-Stores
├── test/         # Test-Mocks und -Helfer
└── types/        # Gemeinsame TypeScript-Typen
e2e/              # Playwright-Tests und AniList-Mock-Server
```

Details stehen in [PROJEKTSTRUKTUR.md](PROJEKTSTRUKTUR.md).

## Datenhaltung

Die App hat kein Backend und braucht keinen Account.

- Die **Watchlist** liegt im `localStorage` unter dem Key `anime-tracker:watchlist:v1`.
- Das **Datei-Handle** für den Datei-Sync speichert die App in IndexedDB, damit Auto-Sync auch nach einem Neuladen funktioniert.
- Der Datei-Sync nutzt die File System Access API. Die gibt es derzeit nur in Chromium-Browsern. In anderen Browsern bleiben Import und Export per Datei möglich.

Mehr zum Konzept steht in [PERSISTENZ-PLAN.md](PERSISTENZ-PLAN.md).

## CI

Die GitHub-Actions-Pipeline ([ci.yml](.github/workflows/ci.yml)) läuft bei jedem Push und Pull Request auf `master`:

1. Typecheck
2. Lint
3. Unit-Tests mit Coverage
4. E2E-Tests (Desktop und Mobile)
5. Barrierefreiheit (WCAG 2.2 AA)

## Lizenz

[MIT](LICENSE) © 2026 theKaos

Anime-Daten und Cover-Bilder stammen von [AniList](https://anilist.co/). Dieses Projekt steht in keiner Verbindung zu AniList.
