// LSAT Study Tool Service Worker
const CACHE_NAME = 'lsat-study-tool-v1.0.0';
const RUNTIME_CACHE_NAME = 'lsat-runtime-cache-v1.0.0';

// Files to cache immediately (App Shell)
const STATIC_CACHE_FILES = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Additional runtime files to cache (will be discovered dynamically)
const RUNTIME_CACHE_PATTERNS = [
  /\/static\/js\/.+\.js$/,
  /\/static\/css\/.+\.css$/,
  /\/static\/media\/.+\.(png|jpg|jpeg|svg|gif|webp)$/
];

// Install event - Cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_CACHE_FILES.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch(err => {
        console.warn('[SW] Cache installation failed for some resources:', err);
        // Continue installation even if some resources fail to cache
        return Promise.resolve();
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE_NAME)
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - Cache-first strategy with fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache if not a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Check if we should cache this resource
            const shouldCache = RUNTIME_CACHE_PATTERNS.some(pattern => 
              pattern.test(event.request.url)
            ) || event.request.url.includes('/static/');

            if (shouldCache) {
              // Clone the response
              const responseToCache = networkResponse.clone();

              // Cache the fetched response
              caches.open(RUNTIME_CACHE_NAME)
                .then(cache => {
                  console.log('[SW] Caching new resource:', event.request.url);
                  cache.put(event.request, responseToCache);
                });
            }

            return networkResponse;
          })
          .catch(error => {
            console.log('[SW] Fetch failed, serving offline fallback:', error);
            
            // Return offline fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            // Return a basic offline response for other requests
            return new Response('Offline - Please check your internet connection', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background Sync - for future study session data
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-study-progress') {
    event.waitUntil(syncStudyProgress());
  }
});

// Push notifications for study reminders
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Time for your LSAT study session!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'study-reminder',
    requireInteraction: false,
    actions: [
      {
        action: 'start-study',
        title: 'Start Studying'
      },
      {
        action: 'dismiss',
        title: 'Later'
      }
    ],
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.body || options.body;
      options.data = { ...options.data, ...payload.data };
    } catch (e) {
      console.warn('[SW] Invalid push payload:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification('LSAT Study Tool', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();

  if (event.action === 'start-study' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clientList => {
          // If app is already open, focus it
          for (const client of clientList) {
            if (client.url === self.registration.scope && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Otherwise open new window
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// Helper function for syncing study progress (placeholder)
async function syncStudyProgress() {
  try {
    console.log('[SW] Syncing study progress...');
    // This would sync study progress with a backend service
    // For now, it's a placeholder
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Failed to sync study progress:', error);
    throw error;
  }
}

// Message handling from main thread
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service Worker script loaded');