export class AniListError extends Error {
  status: number
  /**
   * Anfang der Antwort, wenn sie kein JSON war. Genau der Fall, der vorher
   * unsichtbar blieb: Eine HTML-Sperrseite ließ schon `response.json()` mit einem
   * nackten SyntaxError scheitern, lange bevor irgendeine Fehlerbehandlung griff.
   */
  bodySnippet: string | null

  constructor(message: string, status: number, bodySnippet: string | null = null) {
    super(message)
    this.name = 'AniListError'
    this.status = status
    this.bodySnippet = bodySnippet
  }
}
