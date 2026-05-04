// Self-destruct service worker — unregisters and clears all caches on next visit.
// Replaces the previous memelli-v2 cache that was serving stale HTML to phones.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {}
    try { await self.registration.unregister(); } catch {}
    try {
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      for (const c of clients) {
        try { c.postMessage({ type: 'sw-uninstalled' }); } catch {}
        try { if (c.url) c.navigate(c.url); } catch {}
      }
    } catch {}
  })());
});
self.addEventListener('fetch', (event) => {
  // Pass-through. Never serve cached. The unregister above runs first.
  event.respondWith(fetch(event.request));
});
