export const name = 'dsh-mobile-shell'

export function apply(ctx) {
  // Server side does nothing: this plugin only ships a web client module
  // (see lib/client.js), which the profile bundle injects into the browser.
  ctx?.logger?.debug?.('dsh-mobile-shell loaded')
}
