# Persistenz-Plan: Watchlist als JSON-Datei im Cloud-Ordner

**Entscheidung:** Keine Datenbank, kein Account, kein Backend. Die Watchlist lebt weiterhin im `localStorage`; zusätzlich schreibt die App sie in eine JSON-Datei, die der Nutzer selbst auswählt — typischerweise in seinem Dropbox-Ordner. Dropbox übernimmt den Transport zwischen den Geräten.

**Bewusst akzeptierte Einschränkung:** Der automatische Modus läuft nur in Chromium-Browsern — auf dem Desktop und, seit Chrome 132, auch auf Android. Firefox, Safari und alle übrigen Browser bekommen denselben Funktionsumfang manuell (Download / Datei auswählen) über exakt dieselbe Merge-Logik. Zu den Android-Besonderheiten siehe Abschnitt 15.

> **Stand:** Vollständig umgesetzt (Phasen 1–5).
>
> **Korrektur zum ursprünglichen Entwurf:** Der Zustand der Watchlist liegt in einem Zustand-Store (`src/store/watchlistStore.ts`), nicht in einem Context-Provider. Der `syncController` aus Phase 4 hängt sich entsprechend an `useWatchlistStore.subscribe()` statt an einen Provider — und bekommt Lese-/Schreibzugriff als Parameter, weil der Store ein Modul-Singleton ist und in Tests nicht zweimal instanziiert werden kann.

---

## 1. Die drei Ebenen

| Ebene | Rolle | Wer schreibt |
|---|---|---|
| `localStorage` | **Source of Truth für die UI.** Jede Interaktion landet zuerst hier. App funktioniert vollständig ohne alles Weitere. | Die App, synchron |
| JSON-Datei | **Transportformat.** Vollständiger Zustand inklusive Löschmarkierungen. | Die App, verzögert (Debounce) |
| Dropbox | **Transportweg.** Nicht Teil deiner App — der Nutzer bringt ihn mit. | Der Cloud-Client des Nutzers |

Der wichtigste Satz dieses Dokuments: **Die Datei ist nie die Wahrheit, sie ist ein Postfach.** Deshalb wird sie nie blind überschrieben, sondern immer gelesen, zusammengeführt und dann geschrieben.

---

## 2. Ablauf

### Verbinden (einmalig pro Gerät)

```
Erstes Gerät — "Neue Datei anlegen"
  → showSaveFilePicker({ suggestedName: 'anime-watchlist.json' })
  → Nutzer navigiert in seinen Dropbox-Ordner
  → FileSystemFileHandle in IndexedDB ablegen
  → sofort ein Read-Merge-Write ausführen

Jedes weitere Gerät — "Vorhandene Datei auswählen"
  → showOpenFilePicker({ multiple: false })
  → Nutzer tippt die bereits synchronisierte Datei an
  → requestPermission({ mode: 'readwrite' }) in derselben Nutzergeste
  → FileSystemFileHandle in IndexedDB ablegen
  → sofort ein Read-Merge-Write ausführen
```

Warum die Trennung zwingend ist, steht in Abschnitt 15 — auf Android führt der falsche Dialog dazu, dass eine leere Kopie statt der gemeinsamen Datei verbunden wird.

### Schreiben (nach jeder Änderung)

```
Änderung im Reducer
  → localStorage sofort aktualisieren (UI ist fertig)
  → Debounce 2 s
  → Datei lesen  →  merge(lokal, datei)  →  Ergebnis schreiben
  → merge-Ergebnis auch zurück in localStorage (falls die Datei Neueres hatte)
```

Read-Merge-Write statt blindem Schreiben ist nicht optional. Ohne den Lesevorgang überschreibt Gerät B jede Änderung, die Gerät A seit dem letzten Abgleich gemacht hat — und zwar trotz Merge-Algorithmus, weil B dessen Datenstand nie gesehen hätte.

### Lesen (Änderungen des anderen Geräts bemerken)

Es gibt keine Datei-Watch-API. Du musst pollen — aber sparsam:

| Auslöser | Grund |
|---|---|
| App-Start, nachdem die Berechtigung steht | Häufigster Fall: Gerätewechsel |
| `visibilitychange` → sichtbar | Tab war im Hintergrund, Dropbox hat inzwischen synchronisiert |
| `window.focus` | Nutzer kommt aus einer anderen Anwendung zurück |
| Manueller "Jetzt abgleichen"-Button | Wenn jemand ungeduldig ist |

Vor dem Parsen immer `file.lastModified` gegen den zuletzt gesehenen Wert prüfen. Ist er unverändert, passiert nichts — spart das Deserialisieren und verhindert unnötige Re-Renders.

---

## 3. Dateiformat

```jsonc
{
  "schemaVersion": 1,
  "exportedAt": "2026-08-25T18:42:11.000Z",
  "app": "anime-tracker",
  "entries": [
    {
      "animeId": 21,
      "status": "WATCHING",
      "progress": 12,
      "totalEpisodes": null,
      "addedAt": "2026-08-01T10:00:00.000Z",
      "updatedAt": "2026-08-25T18:41:55.000Z",
      "deletedAt": null,
      "snapshot": {
        "title": { "romaji": "ONE PIECE", "english": "ONE PIECE", "native": "ONE PIECE" },
        "coverImage": "https://s4.anilist.co/…",
        "format": "TV"
      }
    }
  ]
}
```

Drei Felder, die auf den ersten Blick überflüssig wirken und es nicht sind:

**`schemaVersion`** — Ohne dieses Feld kannst du dein Datenmodell nie wieder ändern, ohne alte Dateien unlesbar zu machen. Beim Lesen: unbekannte höhere Version → Import verweigern mit dem Hinweis „Diese Datei stammt aus einer neueren Version der App". Niedrigere Version → durch eine Migrationskette schicken.

**`deletedAt`** (Tombstone) — Der Fallstrick, der sonst erst in Woche drei auffällt: Löscht du auf Gerät A einen Eintrag und entfernst ihn ersatzlos aus der Datei, kennt Gerät B ihn noch — und beim nächsten Merge kommt er zurück. Gelöschte Einträge bleiben deshalb mit `deletedAt` in der Datei stehen und werden nur in der UI ausgeblendet. Aufräumen: Tombstones älter als 90 Tage beim Schreiben verwerfen.

**`snapshot`** — Macht die Datei ohne API-Zugriff lesbar und sie damit zu einem echten Backup statt zu einer Liste nackter IDs.

---

## 4. Merge-Algorithmus

Zusammengeführt wird pro `animeId`, nicht pro Feld. Feldweises Mergen klingt cleverer, erzeugt aber Zustände, die nie jemand eingegeben hat (Status von Gerät A, Fortschritt von Gerät B).

```
für jede animeId in (lokal ∪ datei):
  nur lokal          → übernehmen
  nur in der Datei   → übernehmen
  in beiden:
    updatedAt unterschiedlich → der neuere Eintrag gewinnt komplett
    updatedAt identisch       → der mit dem höheren progress gewinnt
```

Die Gleichstandsregel ist Absicht: Bei identischem Zeitstempel ist jede Wahl willkürlich, also nimm die, die keine gesehenen Folgen verliert. Fortschritt zu verlieren ärgert Nutzer mehr, als eine Folge doppelt angeboten zu bekommen.

Tombstones nehmen an derselben Regel teil. Ein Löschen mit neuerem `updatedAt` schlägt eine ältere Änderung, eine neuere Änderung holt einen älteren gelöschten Eintrag zurück. Beides ist richtig.

Die Funktion gibt neben dem Ergebnis eine Statistik zurück:

```ts
interface MergeResult {
  entries: WatchlistEntry[]
  stats: { unchanged: number; updated: number; added: number; removed: number }
}
```

Nach jedem manuellen Import zeigst du diese Zahlen an — „14 unverändert · 3 aktualisiert · 2 neu · 0 entfernt". Eine reine Erfolgsmeldung sagt nichts darüber aus, ob gerade etwas verschwunden ist.

**Uhrzeit-Vorbehalt:** Last-Write-Wins hängt an den Systemuhren beider Geräte. Geht eine davon zwei Minuten falsch, gewinnt in seltenen Fällen die ältere Änderung. Für einen Anime-Tracker ist das hinnehmbar; nur die Konsequenz kennen solltest du.

---

## 5. Berechtigungen — der Teil, an dem solche Apps scheitern

[Verifiziert an der Chrome-Dokumentation]

Das Handle in IndexedDB überlebt Neustarts. **Die Berechtigung nicht.** Sobald alle Tabs deiner Origin geschlossen sind, verliert die Seite den Zugriff. Beim nächsten Start hast du also ein gültiges Handle ohne Leserecht.

Und: `requestPermission()` funktioniert nur innerhalb einer Nutzergeste. Ein automatischer Aufruf beim Seitenaufbau schlägt fehl — genau der Fehler, der dazu führt, dass sich solche Features „kaputt" anfühlen.

Der korrekte Ablauf beim Start:

```
Handle aus IndexedDB laden
  kein Handle          → nichts tun, App läuft auf localStorage
  handle.queryPermission({ mode: 'readwrite' })
    'granted' → sofort abgleichen
    'prompt'  → NICHT automatisch anfragen.
                Stattdessen ein unaufdringliches Banner:
                "Watchlist-Datei verbinden" mit Button.
                Klick → requestPermission() → abgleichen
    'denied'  → Datei neu auswählen anbieten (showOpenFilePicker)
```

Die App darf zu keinem Zeitpunkt auf die Berechtigung warten. Sie startet immer sofort mit dem localStorage-Stand.

---

## 6. Dropbox-spezifische Fallstricke

**Konfliktkopien.** Schreiben zwei Geräte, bevor Dropbox synchronisiert hat, entsteht `anime-watchlist (KAOS's in Konflikt stehende Kopie 2026-08-25).json`. Deine App sieht diese Datei nie — sie kennt nur ihr eigenes Handle. Abhilfe: Der manuelle Import-Weg (Abschnitt 7) muss immer verfügbar bleiben, damit jemand eine Konfliktkopie einlesen und mergen kann. Erwähne das in der README, sonst rätselt der erste Nutzer.

**Online-only-Dateien.** Dropbox Smart Sync und OneDrive Files On-Demand legen Platzhalter an. Ein Lesezugriff darauf ist langsam oder schlägt fehl. Empfehlung im Verbinden-Dialog: die Datei als „Auf diesem Gerät behalten" markieren.

**Sync-Latenz.** Zwischen Schreiben auf Gerät A und Sichtbarkeit auf Gerät B liegen Sekunden bis Minuten. Formuliere die UI entsprechend — „zuletzt abgeglichen vor 3 Minuten" statt eines Live-Versprechens.

**Schreibzeitpunkt.** Änderungen landen erst beim Schließen des Streams auf der Platte. Das passt gut zum Cloud-Client, der auf abgeschlossene Schreibvorgänge reagiert. Der 2-Sekunden-Debounce ist trotzdem nötig, sonst erzeugt jeder Klick auf „+1 Folge" einen Sync-Vorgang.

---

## 7. Fallback für alle anderen Browser

Identische Funktion, manuelle Bedienung, **derselbe Code für Serialisierung und Merge**:

- **Export:** `Blob` + `URL.createObjectURL` + `<a download>` → Datei landet in Downloads, Nutzer legt sie selbst in Dropbox
- **Import:** `<input type="file" accept="application/json">` → dieselbe `merge()`-Funktion → Merge-Statistik anzeigen

Feature-Erkennung über `'showSaveFilePicker' in window`. Der automatische Modus wird nur angeboten, wenn er verfügbar ist; sonst zeigt der Settings-Bereich direkt die manuellen Buttons — ohne Fehlermeldung und ohne Hinweis darauf, was der Nutzer nicht bekommt.

---

## 8. Neue Dateien

```
src/
├── app/
│   ├── layout.tsx                       # FileSyncProvider + ReconnectBanner
│   └── settings/page.tsx                # AutoSyncPanel + FileSyncPanel
│
├── context/FileSyncProvider.tsx         # genau ein Controller für die ganze App
│
├── hooks/
│   ├── useFileSyncController.ts         # Controller erzeugen, an den Store hängen
│   └── useSyncTriggers.ts               # visibilitychange / focus
│
├── components/
│   ├── layout/ReconnectBanner.tsx       # der einzige Weg zurück nach Permission-Verlust
│   ├── settings/
│   │   ├── AutoSyncPanel.tsx            # verbinden / abgleichen / lösen
│   │   ├── SyncStatusBadge.tsx          # "abgeglichen vor 3 Minuten"
│   │   ├── FileSyncPanel.tsx            # manueller Export/Import, alle Browser
│   │   ├── ManualTransferButtons.tsx    # rein präsentativ: Export-Button, Datei-Input
│   │   └── MergeSummaryDialog.tsx       # zeigt MergeResult.stats
│   └── ui/Dialog.tsx                    # schlichtes Modal (Overlay, Escape, aria-modal)
│
├── lib/
│   ├── sync/
│   │   ├── fileFormat.ts                # SCHEMA_VERSION, APP_ID, Migrationskette
│   │   ├── validate.ts                  # Laufzeitprüfung fremder Dateien
│   │   ├── serialize.ts                 # toFile / toJson / fromJson
│   │   ├── merge.ts                     # mergeWatchlists() -> MergeResult
│   │   ├── tombstones.ts                # purgeTombstones(90 Tage)
│   │   ├── applyImport.ts               # parse -> merge -> purge, als pure Funktion
│   │   ├── download.ts                  # Blob-Download, FileReader
│   │   ├── syncPort.ts                  # Interface — die Naht zur Browser-API
│   │   ├── fsaAdapter.ts                # File System Access (Chromium Desktop)
│   │   ├── fileHandleStore.ts           # IndexedDB: Handle speichern / laden / löschen
│   │   ├── permissions.ts               # query/request + Status-Mapping
│   │   └── syncController.ts            # Read-Merge-Write, Debounce, Fehlertexte
│   └── watchlist/selectors.ts           # isActive / activeEntries / isInWatchlist
│
├── test/utils/
│   ├── watchlistFactory.ts              # makeEntry() für alle Tests
│   ├── watchlistStoreTestUtils.ts       # Reset des Singleton-Stores
│   └── memorySyncPort.ts                # In-Memory-Datei statt File System Access
│
└── types/sync.ts                        # WatchlistFile, MergeResult, ValidationError, SyncStatus
```

**Geänderte bestehende Dateien:**

- `types/watchlist.ts` — `deletedAt: string | null` im `WatchlistEntry`
- `lib/watchlist/reducer.ts` — `REMOVE` setzt einen Grabstein; `ADD` belebt einen vorhandenen Grabstein wieder; `SET_PROGRESS`/`SET_STATUS` ignorieren Grabsteine; neue Aktion `REPLACE_ALL` für Merge-Ergebnisse
- `lib/watchlist/storage.ts` — ergänzt `deletedAt` bei Einträgen aus einer älteren Version
- `lib/watchlist/sort.ts` — `filterWatchlistEntries` wirft Grabsteine immer weg
- `store/watchlistStore.ts` — `isInWatchlist` über die Selektoren, neue Aktion `replaceAll`
- `constants/config.ts` — `WATCHLIST_FILE_NAME`, `TOMBSTONE_MAX_AGE_DAYS`
- `components/layout/Header.tsx` — Link auf `/settings`

Der `reducer.ts` bleibt eine pure Funktion ohne Kenntnis von Dateien. Der `syncController` wird ihn beobachten, nicht umgekehrt.

---

## 9. UI-Zustände

Der Sync-Status hat fünf Ausprägungen, und jede braucht eine eigene Anzeige:

| Status | Anzeige |
|---|---|
| `unsupported` | Nur manuelle Buttons, kein Hinweis auf Fehlendes |
| `disconnected` | „Watchlist-Datei verbinden" |
| `needs-permission` | Banner mit Button — der einzige Weg zurück |
| `synced` | „zuletzt abgeglichen vor 3 Min" |
| `error` | Konkrete Ursache + Wiederholen-Button |

Bei `error` nie nur „Fehler beim Synchronisieren" schreiben. Die realistischen Ursachen sind: Datei gelöscht oder verschoben, Berechtigung entzogen, Datei nicht lesbar (online-only), ungültiges JSON, zu neue `schemaVersion`. Jede davon braucht eine eigene Handlungsempfehlung.

---

## 10. Testplan

Der Großteil ist reine Logik und damit ohne DOM testbar — genau dafür liegt sie in `lib/sync/`.

**Unit (`merge.ts`)** — hier liegt das ganze Risiko:

- Eintrag nur lokal → bleibt
- Eintrag nur in der Datei → kommt dazu
- Beide Seiten, Datei neuer → Datei gewinnt
- Beide Seiten, lokal neuer → lokal gewinnt
- Identischer `updatedAt`, unterschiedlicher `progress` → höherer gewinnt
- Tombstone neuer als lokale Änderung → Eintrag verschwindet
- Lokale Änderung neuer als Tombstone → Eintrag kommt zurück
- Merge ist idempotent: `merge(merge(a,b), b) === merge(a,b)`
- Merge ist kommutativ: `merge(a,b) === merge(b,a)`

Die letzten beiden Eigenschaften sind die wichtigsten Tests im Projekt. Ist der Merge nicht idempotent, driften die Geräte bei jedem Abgleich weiter auseinander.

**Unit (`validate.ts`, `serialize.ts`, `tombstones.ts`)** — kaputtes JSON, fehlende Felder, fremde Datei, zu neue Version.

**Component** — `FileSyncPanel` und `ReconnectBanner` gegen einen gefälschten `SyncPort`. jsdom kennt keine File System Access API, deshalb existiert das `syncPort.ts`-Interface: In Tests wird eine In-Memory-Implementierung eingesetzt, die eine Datei simuliert.

**Integration** — Zwei Provider-Instanzen gegen dieselbe Fake-Datei laufen lassen und prüfen, dass beide am Ende denselben Zustand haben. Das ist der Test, der echten Multi-Device-Betrieb nachbildet.

---

## 11. Umsetzungsreihenfolge

Jede Phase ist für sich benutzbar. Brichst du nach Phase 2 ab, hast du trotzdem ein funktionierendes Backup-Feature.

1. ✅ **Datenmodell** — `deletedAt` einführen, Reducer auf Tombstones umstellen, Selektoren anpassen. Reine Refaktorierung, keine neue Funktion.
2. ✅ **Format & Merge** — `fileFormat`, `serialize`, `validate`, `merge`, `tombstones` plus vollständige Unit-Tests. Noch keine UI.
3. ✅ **Manueller Transfer** — Download/Upload-Buttons und Merge-Dialog. Funktioniert in jedem Browser. Ab hier ist das Feature nutzbar.
4. ✅ **Automatik** — `fileHandleStore`, `permissions`, `fsaAdapter`, `syncController`, Verbinden-Dialog, Reconnect-Banner. Zusätzliche Pakete: `fake-indexeddb` (jsdom hat kein IndexedDB) und `@types/wicg-file-system-access` (`showSaveFilePicker` und `requestPermission` fehlen in der TS-Standardbibliothek).
5. ✅ **Trigger & Politur** — `visibilitychange`/`focus`, Debounce, Status-Badge, Fehlerzustände.

Die Automatik nimmt exakt denselben Weg wie der manuelle Import (`lib/sync/applyImport.ts`), nur mit einer anderen Textquelle.

## 13. Zwei Schleifen, die im Controller entschärft sind

**Endlosschleife über das Store-Abo.** Jede Änderung im Store plant einen Abgleich. Der Abgleich schreibt sein Ergebnis in den Store — was den nächsten Abgleich plant. Der Controller ruft `setEntries` deshalb nur auf, wenn das Merge-Ergebnis tatsächlich vom lokalen Stand abweicht. Ein folgenloser Abgleich berührt den Store nicht und endet damit.

**Sinnlose Cloud-Synchronisation.** Die Datei trägt einen `exportedAt`-Zeitstempel; jeder Schreibvorgang erzeugt also formal neuen Inhalt, und der Cloud-Client würde bei jedem Abgleich hochladen. Vor dem Schreiben wird deshalb der Inhalt **ohne** diesen Zeitstempel mit dem zuletzt geschriebenen verglichen. Ist er gleich, passiert nichts.

Dazu: Zwei Abgleiche können sich nicht überlappen. Ein Aufruf während eines laufenden hängt sich an ihn an, statt parallel dieselbe Datei zu schreiben.

Phase 2 vor Phase 3 ist wichtig: Der Merge muss stehen und getestet sein, bevor irgendein Import in echte Nutzerdaten schreibt.

---

## 12. Offene Punkte

1. **Dateiname vorgeben oder freie Wahl?** Ein fester Vorschlag (`anime-watchlist.json`) macht Support-Fragen einfacher, freie Wahl erlaubt mehrere Profile auf einem Gerät.
2. **Automatisches Schreiben abschaltbar?** Manche Nutzer wollen bewusst kontrollieren, wann geschrieben wird. Ein Schalter „nur auf Knopfdruck abgleichen" ist billig zu bauen.
3. **Tombstone-Frist.** 90 Tage sind gegriffen. Kürzer hält die Datei klein, länger schützt Geräte, die lange nicht online waren. Bei einem Gerät, das länger als die Frist offline war, kehren gelöschte Einträge zurück.
4. **Verschlüsselung.** Die Datei liegt im Klartext in der Cloud. Für Watchlists unkritisch, aber falls du später Notizen unterstützt, wäre eine passphrase-basierte Verschlüsselung zu überlegen — dann allerdings ohne Wiederherstellungsmöglichkeit bei vergessener Passphrase.

## 14. Regeln, die aus dem Produktionsbetrieb kamen

**Eine leere Datei ist kein Fehler.** `showSaveFilePicker` legt beim Anlegen einer neuen Datei eine 0-Byte-Datei an. Sie zu parsen scheitert — und weil der Controller bei einem Parse-Fehler nicht schreibt, bliebe sie für immer leer und der Fehler wiederholte sich bei jedem Abgleich. Leerer oder reiner Leerraum-Inhalt wird deshalb als „noch nicht befüllt" behandelt: Der Abgleich schreibt den lokalen Stand hinein. Nur der manuelle Import meldet dann „Die Datei ist leer" — dort hat der Nutzer bewusst eine Datei ausgewählt und erwartet Inhalt.

**Die Datei ist die Wahrheit, nicht der gemerkte letzte Schreibvorgang.** Ob geschrieben werden muss, entscheidet ein Vergleich mit dem, was gerade wirklich in der Datei steht — nicht mit dem, was dieses Gerät zuletzt geschrieben zu haben glaubt. Sonst repariert der Abgleich eine extern geleerte oder überschriebene Datei nie, weil er sie für unverändert hält.

**BOM wird abgeschnitten.** Windows-Editoren schreiben UTF-8 gern mit Byte Order Mark; `JSON.parse` wirft darüber, obwohl der Inhalt gültig ist.

**Was weiterhin bewusst fehlschlägt:** Eine Datei mit unlesbarem Inhalt wird *nicht* überschrieben. Das wäre der einzige Fall, in dem der Abgleich Daten des anderen Geräts vernichten könnte. Stattdessen meldet er den Fehler und der Nutzer entscheidet — Datei löschen und neu verbinden, oder eine Kopie von Hand importieren.

## 15. Verbinden: zwei Dialoge, zwei Bedeutungen

Der Browser hat zwei Dateidialoge, und sie tun etwas grundsätzlich Verschiedenes:

| Aufruf | Bedeutung | Wofür hier |
|---|---|---|
| `showOpenFilePicker` | Eine **vorhandene** Datei auswählen | „Vorhandene Datei auswählen" — der Normalfall auf jedem Gerät ab dem zweiten |
| `showSaveFilePicker` | Eine **neue** Datei anlegen | „Neue Datei anlegen" — nur auf dem ersten Gerät |

**Warum das auf Android nicht egal ist.** Chrome für Android unterstützt die File System Access API seit Version 132, setzt sie aber auf das Storage Access Framework auf. Der Speichern-Dialog läuft dort über `ACTION_CREATE_DOCUMENT` — eine reine Anlegen-Operation. Tippt man darin eine vorhandene Datei an, überschreibt ein Cloud-Anbieter wie Dropbox sie nicht, sondern erzeugt ein neues Dokument mit selbst vergebenem Namen (eine ID, keine lesbare Bezeichnung). Das Gerät verbindet sich dann mit einer leeren Kopie statt mit der gemeinsamen Datei, und der Abgleich läuft ins Leere.

Der Öffnen-Dialog nutzt `ACTION_OPEN_DOCUMENT` und liefert ein Handle auf genau die Datei, die angetippt wurde.

**Schreibrecht direkt mit anfragen.** Der Öffnen-Dialog gibt nur Leserecht. `requestPermission({ mode: 'readwrite' })` muss unmittelbar danach folgen, solange die Nutzergeste des Dialogs noch gilt — später lehnt der Browser die Anfrage ab. Verweigert der Nutzer, wird das Handle trotzdem gespeichert: So kann er die Berechtigung nachreichen, statt die Datei erneut heraussuchen zu müssen. Der Zustand ist dann `needs-permission`, und die Einstellungsseite bietet neben „Zugriff bestätigen" auch „Andere Datei wählen" an.

**Weitere Android-Eigenheiten**, dokumentiert im Chromium-Intent-to-Ship: MIME-Filter werden im Dialog ignoriert, Dateiendungen nicht automatisch angehängt, und Schreibvorgänge auf `content://`-URIs sind nicht atomar. Für diese App unkritisch — die Datei wird ohnehin immer komplett geschrieben.
