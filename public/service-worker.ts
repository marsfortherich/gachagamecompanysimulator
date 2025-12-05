/**
 * Service Worker - Prompt 6.3
 * 
 * Provides offline-first caching strategy for PWA support:
 * - Cache static assets for offline use
 * - Handle network requests with fallbacks
 * - Enable background sync for save data
 */

/// <reference lib="webworker" />

// Type assertion for service worker global scope
declare const self: ServiceWorkerGlobalScope;

// =============================================================================
// Cache Configuration
// =============================================================================

const CACHE_NAME = 'gacha-sim-v1';
const RUNTIME_CACHE = 'gacha-sim-runtime-v1';

// Assets to cache on install (app shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add built assets here (Vite will handle this in production)
];

// Paths that should always go to network first
const NETWORK_FIRST_PATHS = [
  '/api/',
  '/analytics/',
];

// Paths that should use cache-first strategy
const CACHE_FIRST_PATHS = [
  '/icons/',
  '/fonts/',
  '/images/',
  '/assets/',
];

// =============================================================================
// Install Event
// =============================================================================

self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // Use addAll for atomic caching (all or nothing)
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn('[SW] Some static assets failed to cache:', error);
          // Don't fail the install if some assets are missing
        });
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// =============================================================================
// Activate Event
// =============================================================================

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Delete old caches
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Claim all clients immediately
        return self.clients.claim();
      })
  );
});

// =============================================================================
// Fetch Event - Caching Strategies
// =============================================================================

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip non-GET requests (let POST, PUT, etc. go to network)
  if (request.method !== 'GET') {
    return;
  }

  // Determine caching strategy based on path
  if (NETWORK_FIRST_PATHS.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(networkFirst(request));
  } else if (CACHE_FIRST_PATHS.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(cacheFirst(request));
  } else {
    // Default: Stale-while-revalidate for HTML and other resources
    event.respondWith(staleWhileRevalidate(request));
  }
});

// =============================================================================
// Caching Strategies
// =============================================================================

/**
 * Network-first strategy: Try network, fall back to cache
 * Best for: API calls, dynamic content
 */
async function networkFirst(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache, return offline page or error
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Cache-first strategy: Try cache, fall back to network
 * Best for: Static assets, images, fonts
 */
async function cacheFirst(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response for future
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch {
    return new Response('Asset not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Stale-while-revalidate: Return cache immediately, update in background
 * Best for: Pages, non-critical updates
 */
async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  // Start network fetch in background
  const networkFetch = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Wait for network if no cache
  const networkResponse = await networkFetch;
  if (networkResponse) {
    return networkResponse;
  }
  
  // Both failed
  return new Response('Content not available', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

// =============================================================================
// Background Sync
// =============================================================================

// SyncEvent type declaration for background sync API
interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
}

self.addEventListener('sync', ((event: SyncEvent) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-save-data') {
    event.waitUntil(syncSaveData());
  }
}) as EventListener);

/**
 * Sync save data from IndexedDB to server (if applicable)
 */
async function syncSaveData(): Promise<void> {
  try {
    // Open IndexedDB
    const db = await openSyncDB();
    const pendingItems = await getPendingSyncItems(db);
    
    for (const item of pendingItems) {
      try {
        // In a real app, this would sync to a server
        console.log('[SW] Would sync item:', item.id);
        
        // Mark as synced
        await removeSyncItem(db, item.id);
      } catch (error) {
        console.error('[SW] Failed to sync item:', item.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// IndexedDB helpers for sync
function openSyncDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GachaSimulator', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

interface SyncItem {
  id: string;
  status: string;
}

function getPendingSyncItems(db: IDBDatabase): Promise<SyncItem[]> {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains('syncQueue')) {
      resolve([]);
      return;
    }
    
    const transaction = db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const index = store.index('status');
    const request = index.getAll('pending');
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

function removeSyncItem(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// =============================================================================
// Push Notifications (placeholder)
// =============================================================================

self.addEventListener('push', (event: PushEvent) => {
  console.log('[SW] Push received');
  
  const data = event.data?.json() ?? {
    title: 'Gacha Game Simulator',
    body: 'Something happened in your company!',
    icon: '/icons/icon-192x192.png',
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.tag || 'default',
      data: data.data,
    } as NotificationOptions)
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if available
        for (const client of clients) {
          if (client.url === '/' && 'focus' in client) {
            return (client as WindowClient).focus();
          }
        }
        // Otherwise open new window
        return self.clients.openWindow('/');
      })
  );
});

// =============================================================================
// Message Handling
// =============================================================================

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(RUNTIME_CACHE)
          .then((cache) => cache.addAll(payload.urls))
      );
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then((names) => 
          Promise.all(names.map((name) => caches.delete(name)))
        )
      );
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Export empty object to satisfy TypeScript module requirements
export {};
