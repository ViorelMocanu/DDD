// Retires the cache-first service worker the old site registered: clears its caches, unregisters, reloads open tabs.
// Nothing on the current site registers a worker. Keep this file so returning browsers pick it up.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) await caches.delete(key);
			await self.registration.unregister();
			for (const client of await self.clients.matchAll({ type: "window" })) client.navigate(client.url);
		})(),
	);
});
