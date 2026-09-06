export const PAGE_SIZE = 20
export const STORAGE_KEY = 'anime-tracker:watchlist:v1'
export const ANILIST_API_URL = 'https://graphql.anilist.co'
export const DEBOUNCE_MS = 400

/** Vorgeschlagener Dateiname für Export und Geräteabgleich. */
export const WATCHLIST_FILE_NAME = 'anime-watchlist.json'
/**
 * Wie lange Grabsteine mitgeschleppt werden. Ein Gerät, das länger als diese Frist
 * offline war, bekommt gelöschte Einträge beim nächsten Abgleich zurück.
 */
export const TOMBSTONE_MAX_AGE_DAYS = 90
