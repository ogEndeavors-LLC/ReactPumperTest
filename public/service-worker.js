importScripts("/idb.js");

const CACHE_NAME = "my-app-cache-v1.1.4"; // Updated cache version
const DB_NAME = "request-queue";
const STORE_NAME = "requests";
const DB_VERSION = 2;

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

// Function to open and initialize IndexedDB
async function openDatabase() {
  return idb.openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      // Add more upgrade logic here if needed for future versions
    },
  });
}

// Install event: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Force the SW to become active immediately
});

// Fetch event: handle network requests
self.addEventListener("fetch", (event) => {
  if (event.request.method === "GET") {
    event.respondWith(handleGetRequest(event.request));
  } else if (["POST", "DELETE", "PATCH"].includes(event.request.method)) {
    event.respondWith(handleMutationRequest(event.request));
  }
});

// Handle GET requests
async function handleGetRequest(request) {
  if (!navigator.onLine) {
    const cacheResponse = await caches.match(request);
    return cacheResponse || fetch(request);
  } else {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.status === 200) {
        const responseToCache = networkResponse.clone();
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, responseToCache);
      }
      return networkResponse;
    } catch (error) {
      const cacheResponse = await caches.match(request);
      return cacheResponse;
    }
  }
}

// Handle mutation requests (POST, DELETE, PATCH)
async function handleMutationRequest(request) {
  try {
    return await fetch(request.clone());
  } catch (error) {
    const body = await request.clone().text();
    await enqueueRequest(request, body);
    return new Response(null, { status: 202, statusText: "Accepted" });
  }
}

// Activate event: clean up old caches
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
  self.clients.claim();
});

// Enqueue failed requests for later retry
async function enqueueRequest(request, body) {
  const db = await openDatabase();

  const queuedRequest = {
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body: body,
    timestamp: Date.now(),
  };

  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.objectStore(STORE_NAME).add(queuedRequest);
  await tx.done;

  if ("sync" in self.registration) {
    await self.registration.sync.register("replay-queued-requests");
  } else {
    setTimeout(replayQueuedRequests, 5000);
  }
}

// Sync event: trigger request replay when online
self.addEventListener("sync", (event) => {
  if (event.tag === "replay-queued-requests") {
    event.waitUntil(replayQueuedRequests());
  }
});

// Replay queued requests
async function replayQueuedRequests() {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const requests = await store.getAll();

  for (const queuedRequest of requests) {
    const headers = new Headers(queuedRequest.headers);
    if (queuedRequest.body) {
      headers.set("Content-Type", "application/json");
    }

    const fetchOptions = {
      method: queuedRequest.method,
      headers: headers,
      body: queuedRequest.body,
    };

    try {
      const networkResponse = await fetch(queuedRequest.url, fetchOptions);
      if (networkResponse.ok) {
        const txDelete = db.transaction(STORE_NAME, "readwrite");
        await txDelete.objectStore(STORE_NAME).delete(queuedRequest.id);
        await txDelete.done;
        console.log(
          `Request ${queuedRequest.id} successfully replayed and removed from queue`
        );
      } else {
        console.error(
          `Failed to replay request ${queuedRequest.id}. Status: ${networkResponse.status}`
        );
      }
    } catch (error) {
      console.error(`Error replaying request ${queuedRequest.id}:`, error);
    }

    // Add a small delay between requests to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
