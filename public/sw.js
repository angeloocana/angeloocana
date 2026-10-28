// The old Gatsby site installed an offline service worker at this address. Browsers that still have it
// keep showing the old, broken pages. When they check for an update they get this file instead:
// it clears the old caches, removes itself and reloads open tabs, so they load the new site.
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (let key of await caches.keys()) await caches.delete(key)
      await self.registration.unregister()
      for (let client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url)
    })(),
  )
})
