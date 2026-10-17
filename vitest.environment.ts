import type { Environment } from 'vitest/environments'
import { builtinEnvironments } from 'vitest/environments'

/**
 * jsdom mit einem Signal, das Nodes fetch akzeptiert.
 *
 * jsdom ersetzt das globale AbortSignal, fetch/Request stammen aber weiter aus
 * Node (undici). Dessen Request lehnt fremde Signale ab ("Expected signal to be
 * an instance of AbortSignal"). Deshalb merken wir uns Nodes AbortSignal, bevor
 * jsdom es überschreibt, und leiten AbortSignal.timeout dorthin um.
 */
export default <Environment>{
  name: 'jsdom-node-fetch',
  transformMode: 'web',
  async setup(global, options) {
    const NodeAbortSignal = global.AbortSignal as typeof AbortSignal
    const env = await builtinEnvironments.jsdom.setup(global, options)
    global.AbortSignal.timeout = (ms: number) => NodeAbortSignal.timeout(ms)
    return env
  },
}
