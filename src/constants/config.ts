export const PAGE_SIZE = 20
export const STORAGE_KEY = 'anime-tracker:watchlist:v1'
/**
 * Überschreibbar, damit die Playwright-Tests gegen einen lokalen Mock laufen statt
 * gegen die echte API. NEXT_PUBLIC_, weil der Browser dieselbe Adresse braucht —
 * Next.js setzt den Wert beim Build fest ein.
 */
export const ANILIST_API_URL =
  process.env.NEXT_PUBLIC_ANILIST_API_URL || 'https://graphql.anilist.co'
export const DEBOUNCE_MS = 400

/**
 * Node schickt serverseitig keinen brauchbaren User-Agent. Viele Schutzschichten
 * vor öffentlichen APIs werfen solche Anfragen pauschal raus — im Browser wird der
 * Header ohnehin ignoriert, er kostet also nichts.
 */
export const ANILIST_USER_AGENT = 'anime-tracker (https://github.com/kaosmajor/anime-tracker)'

/** Nach dieser Zeit gilt AniList als nicht erreichbar, statt die Seite hängen zu lassen. */
export const ANILIST_TIMEOUT_MS = 10_000

/**
 * Serverseitige Zwischenspeicherung. Trending ändert sich nicht im Minutentakt, und
 * AniList läuft derzeit mit reduziertem Limit von 30 Anfragen pro Minute.
 */
export const ANILIST_REVALIDATE_SECONDS = 300

/** Vorgeschlagener Dateiname für Export und Geräteabgleich. */
export const WATCHLIST_FILE_NAME = 'anime-watchlist.json'
/**
 * Wie lange Grabsteine mitgeschleppt werden. Ein Gerät, das länger als diese Frist
 * offline war, bekommt gelöschte Einträge beim nächsten Abgleich zurück.
 */
export const TOMBSTONE_MAX_AGE_DAYS = 90
