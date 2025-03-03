/* service-worker.js */
importScripts("/idb.js");

const CACHE_NAME = "my-app-cache-v1.1.9";
const DB_NAME = "request-queue";
const STORE_NAME = "requests";
const DB_VERSION = 2;

// URLs to cache for offline GET requests
const urlsToCache = [
  "/",
  "/index.html",
  "/static/js/bundle.js",
  "/static/js/0.chunk.js",
  "/static/js/main.chunk.js",
  "/static/js/vendors~main.chunk.js",
  "/static/css/main.css",
  "/manifest.json",
  "/favicon.ico",
  "/icons/logo192.png",
  "/icons/logo512.png",
];

// ========== Open and initialize IndexedDB ==========
async function openDatabase() {
  return idb.openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      // Future DB upgrades can go here
    },
  });
}

// ========== Install event: cache static assets ==========
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  // Force the SW to become active immediately
  self.skipWaiting();
});

// ========== Activate event: clean up old caches ==========
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  // Become available to all pages
  self.clients.claim();
});

// ========== Fetch event: handle GET vs. mutation requests ==========
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const method = request.method;

  if (method === "GET") {
    event.respondWith(handleGetRequest(request));
  } else if (["POST", "DELETE", "PATCH"].includes(method)) {
    event.respondWith(handleMutationRequest(request));
  }
});

// ========== Handle GET requests ==========
async function handleGetRequest(request) {
  // If offline, try cache first
  if (!navigator.onLine) {
    const cacheResponse = await caches.match(request);
    return cacheResponse || fetch(request);
  } else {
    // If online, try network first, then update cache
    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.status === 200) {
        const responseToCache = networkResponse.clone();
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, responseToCache);
      }
      return networkResponse;
    } catch (error) {
      // If network fails, fallback to cache
      const cacheResponse = await caches.match(request);
      return cacheResponse;
    }
  }
}

// ========== Handle mutation requests (POST, DELETE, PATCH) ==========
async function handleMutationRequest(request) {
  try {
    // Try the network first
    return await fetch(request.clone());
  } catch (error) {
    // If offline or fetch fails, enqueue the request for later replay
    const body = await request.clone().text();
    await enqueueRequest(request, body);
    // Return a 202 to indicate "Accepted" but not yet processed
    return new Response(null, { status: 202, statusText: "Accepted" });
  }
}

// ========== Enqueue failed requests for later retry ==========
async function enqueueRequest(request, body) {
  const db = await openDatabase();

  // Keep original headers as an Array of [key, value]
  const requestHeaders = [...request.headers.entries()];

  const queuedRequest = {
    url: request.url,
    method: request.method,
    headers: requestHeaders,
    body: body,
    timestamp: Date.now(),
  };

  // Add to IndexedDB
  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.objectStore(STORE_NAME).add(queuedRequest);
  await tx.done;

  // Attempt to register a background sync if supported
  if ("sync" in self.registration) {
    try {
      await self.registration.sync.register("replay-queued-requests");
    } catch (err) {
      console.error("Sync registration failed:", err);
    }
  } else {
    // If sync isn't supported, try replay after a small delay
    setTimeout(() => {
      replayQueuedRequests().catch((err) => console.error(err));
    }, 5000);
  }
}

// ========== Sync event: replay queued requests when online ==========
self.addEventListener("sync", (event) => {
  if (event.tag === "replay-queued-requests") {
    event.waitUntil(replayQueuedRequests());
  }
});

// ========== Message event: client can force replay (fallback) ==========
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "REPLAY_REQUESTS") {
    event.waitUntil(replayQueuedRequests());
  }
});

// ========== Replay queued requests ==========
async function replayQueuedRequests() {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const requests = await store.getAll();
  await tx.done;

  for (const queuedRequest of requests) {
    // Rebuild Headers object from stored array
    const headers = new Headers(queuedRequest.headers);

    // Construct the fetch options
    const fetchOptions = {
      method: queuedRequest.method,
      headers: headers,
      body: queuedRequest.body,
    };

    try {
      // Attempt the network request
      const networkResponse = await fetch(queuedRequest.url, fetchOptions);

      // If successful (2xx response), remove from queue
      if (networkResponse.ok) {
        const deleteTx = db.transaction(STORE_NAME, "readwrite");
        await deleteTx.objectStore(STORE_NAME).delete(queuedRequest.id);
        await deleteTx.done;
        console.log(
          `Request ${queuedRequest.id} replayed successfully and removed from queue.`
        );
      } else {
        console.error(
          `Failed to replay request ${queuedRequest.id}. Status: ${networkResponse.status}`
        );
      }
    } catch (error) {
      console.error(`Error replaying request ${queuedRequest.id}:`, error);
    }

    // Add a delay to avoid flooding the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
