/**
 * Browser-Seite des manuellen Transfers. Bewusst dünn gehalten: Alles, was schiefgehen
 * kann, steckt in den puren Modulen daneben (validate, merge, applyImport).
 */

export function downloadTextFile(
  filename: string,
  text: string,
  mimeType = 'application/json'
): void {
  const blob = new Blob([text], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(url)
}

/** FileReader statt File.text(), weil das in jeder unterstützten Umgebung existiert. */
export function readFileAsText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error ?? new Error('Datei konnte nicht gelesen werden.'))
    reader.readAsText(file)
  })
}
