// Service Worker for UniPlan - Basic Offline Functionality

const CACHE_NAME = 'uniplan-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  // Add other static assets as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If network fails and no cache, return offline page
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Handle background sync for data persistence
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Attempt to sync data when connection is restored
      syncData()
    );
  }
});

// Sync function to handle offline data
async function syncData() {
  try {
    // Get stored offline data
    const offlineData = await getOfflineData();
    
    if (offlineData && offlineData.length > 0) {
      // Send data to server when online
      for (const data of offlineData) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      }
      
      // Clear offline data after successful sync
      await clearOfflineData();
      console.log('Service Worker: Data synced successfully');
    }
  } catch (error) {
    console.error('Service Worker: Failed to sync data', error);
  }
}

// Helper functions for offline data management
async function getOfflineData() {
  try {
    const cache = await caches.open('offline-data');
    const response = await cache.match('/offline-data');
    if (response) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Service Worker: Failed to get offline data', error);
    return [];
  }
}

async function clearOfflineData() {
  try {
    const cache = await caches.open('offline-data');
    await cache.delete('/offline-data');
  } catch (error) {
    console.error('Service Worker: Failed to clear offline data', error);
  }
}

// Store data for offline sync
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'STORE_OFFLINE_DATA') {
    storeOfflineData(event.data.payload);
  }
});

async function storeOfflineData(data) {
  try {
    const cache = await caches.open('offline-data');
    const existingData = await getOfflineData();
    const updatedData = [...existingData, { ...data, timestamp: Date.now() }];
    
    const response = new Response(JSON.stringify(updatedData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put('/offline-data', response);
    console.log('Service Worker: Data stored for offline sync');
  } catch (error) {
    console.error('Service Worker: Failed to store offline data', error);
  }
}