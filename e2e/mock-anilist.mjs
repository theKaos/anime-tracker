/**
 * Ersetzt graphql.anilist.co für die Playwright-Tests.
 *
 * Playwright kann nur Anfragen des Browsers abfangen. Die Startseite holt ihre
 * erste Seite aber auf dem Next.js-Server — deshalb ein echter Server, auf den
 * NEXT_PUBLIC_ANILIST_API_URL zeigt. So laufen die Tests offline, schnell und
 * ohne das Rate-Limit der echten API.
 *
 * Absichtlich präparierte Suchbegriffe:
 * - "serverfail": Der Next.js-Server bekommt einen 403 mit HTML-Sperrseite, der
 *   Browser die normale Antwort. Das ist der Produktionsfehler, für den es den
 *   Browser-Fallback gibt.
 * - "nichts":     leere Trefferliste.
 */
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'

const PORT = Number(process.env.MOCK_ANILIST_PORT ?? 4010)
const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`../src/test/mocks/fixtures/${name}.json`, import.meta.url)))

const trending = fixture('trending')
const searchResult = fixture('searchResult')
const animeDetail = fixture('animeDetail')

/** Zweite Seite für das Nachladen beim Scrollen. */
const secondPage = [
  { id: 101, romaji: 'Sousou no Frieren', english: 'Frieren: Beyond Journey’s End' },
  { id: 102, romaji: 'Mushishi', english: null },
].map(({ id, romaji, english }) => ({
  ...trending[0],
  id,
  title: { romaji, english, native: romaji },
}))

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { ...CORS, 'Content-Type': type })
  res.end(typeof body === 'string' ? body : JSON.stringify(body))
}

const page = (media, hasNextPage) => ({ data: { Page: { pageInfo: { hasNextPage }, media } } })

function answer(req, { query, variables }) {
  // Browser schicken immer einen Origin-Header, Node-fetch auf dem Server nicht.
  const fromBrowser = Boolean(req.headers.origin)

  if (query.includes('Media(id:')) {
    if (variables.id === 404) return [404, { data: { Media: null }, errors: [{ message: 'Not Found.' }] }]
    return [200, { data: { Media: { ...animeDetail, id: variables.id } } }]
  }

  const search = variables.search ?? ''
  if (search === 'serverfail' && !fromBrowser) {
    return [403, '<html><body>error code: 1020</body></html>', 'text/html']
  }
  if (search === 'serverfail') return [200, page(searchResult, false)]
  if (search === 'nichts') return [200, page([], false)]
  if (search) return [200, page(searchResult, false)]

  return variables.page === 1 ? [200, page(trending, true)] : [200, page(secondPage, false)]
}

createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, '')
  if (req.method === 'GET') return send(res, 200, { ok: true })

  let raw = ''
  req.on('data', (chunk) => (raw += chunk))
  req.on('end', () => {
    try {
      const [status, body, type] = answer(req, JSON.parse(raw))
      send(res, status, body, type)
    } catch (error) {
      send(res, 400, { errors: [{ message: String(error) }] })
    }
  })
}).listen(PORT, () => console.log(`AniList-Mock läuft auf http://localhost:${PORT}`))
