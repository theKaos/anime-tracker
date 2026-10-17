import { defineConfig, devices } from '@playwright/test'

const APP_PORT = 3100
const MOCK_PORT = 4010

/** Wird in den Build eingebacken — Server und Browser sprechen dann mit dem Mock. */
const appEnv = {
  NEXT_PUBLIC_ANILIST_API_URL: `http://localhost:${MOCK_PORT}`,
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // In CI zusätzlich der HTML-Report: Der Workflow lädt ihn als Artefakt hoch.
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: 'on-first-retry',
    locale: 'de-DE',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      grepInvert: /@mobile/,
      testIgnore: /accessibility\.spec\.ts/,
    },
    // Nur die Tests mit @mobile im Titel: Die Layout-Fehler auf 375px waren echt.
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
    // Barrierefreiheit (axe-core, Tastatur, Dialog, Umbruch): eigenes Projekt, damit
    // CI sie als eigenen Job fahren kann und sie nicht doppelt im Desktop-Lauf landen.
    {
      name: 'accessibility',
      testMatch: /accessibility\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Messungen statt Funktionsprüfung, eigene Dateiendung *.perf.ts. Läuft nur
    // gezielt über `npm run e2e:perf` — und dort mit einem Worker, damit sich
    // parallele Tests nicht gegenseitig die CPU wegnehmen und die Werte verfälschen.
    {
      name: 'performance',
      testMatch: /.*\.perf\.ts/,
      use: { ...devices['Desktop Chrome'] },
      fullyParallel: false,
      retries: 0,
    },
  ],
  webServer: [
    {
      command: 'node e2e/mock-anilist.mjs',
      url: `http://localhost:${MOCK_PORT}`,
      env: { MOCK_ANILIST_PORT: String(MOCK_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      // Produktions-Build statt dev: kein Kompilieren beim ersten Seitenaufruf,
      // und getestet wird, was tatsächlich ausgeliefert wird. Baut nach .next —
      // also nicht parallel zu `npm run dev` starten.
      command: `npm run build && npx next start -p ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}`,
      env: appEnv,
      timeout: 300_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
