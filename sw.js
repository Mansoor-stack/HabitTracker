// ============================================
// HabitFlow Service Worker
// For push notifications and offline support
// ============================================

const CACHE_NAME = 'habitflow-v4';
const STATIC_CACHE = 'habitflow-static-v4';
const DYNAMIC_CACHE = 'habitflow-dynamic-v1';

// Core assets that must be cached for offline use
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './reset-password.html',
    './styles.css',
    './app.js',
    './auth.js',
    './database.js',
    './notifications.js',
    './utils.js',
    './config.js',
    './manifest.json',
    './icons/icon.svg',
    './icons/icon-maskable.svg'
];

// External resources to cache
const EXTERNAL_ASSETS = [
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE)
                .then((cache) => {
                    console.log('[SW] Caching static assets');
                    return cache.addAll(ASSETS_TO_CACHE);
                }),
            // Cache external assets separately (optional, may fail due to CORS)
            caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                    console.log('[SW] Caching external assets');
                    return Promise.allSettled(
                        EXTERNAL_ASSETS.map(url => 
                            fetch(url, { mode: 'cors' })
                                .then(response => {
                                    if (response.ok) {
                                        return cache.put(url, response);
                                    }
                                })
                                .catch(() => console.log('[SW] Could not cache:', url))
                        )
                    );
                })
        ]).catch((error) => {
            console.log('[SW] Cache install error:', error);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => !currentCaches.includes(name))
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('[SW] Service worker activated');
        })
    );
    self.clients.claim();
});

// Fetch event - Network first for HTML, Cache first for assets
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    const url = new URL(event.request.url);
    
    // Skip Supabase API requests - always go to network
    if (url.hostname.includes('supabase')) return;
    
    // For HTML pages - Network first, fall back to cache
    if (event.request.mode === 'navigate' || 
        event.request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the latest version
                    const responseClone = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Offline - return cached version
                    return caches.match(event.request)
                        .then((cached) => cached || caches.match('./index.html'));
                })
        );
        return;
    }
    
    // For other assets - Cache first, fall back to network
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(event.request)
                    .then((response) => {
                        if (!response || response.status !== 200) {
                            return response;
                        }
                        
                        // Cache successful responses
                        const responseToCache = response.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Return offline placeholder for images if needed
                        if (event.request.destination === 'image') {
                            return new Response(
                                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle">📷</text></svg>',
                                { headers: { 'Content-Type': 'image/svg+xml' } }
                            );
                        }
                    });
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    let data = {
        title: 'HabitFlow Reminder',
        body: 'Time to check your habits!',
        icon: '🎯'
    };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon || '🎯',
        badge: '🎯',
        vibrate: [100, 50, 100],
        data: {
            url: self.location.origin
        },
        actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // If app is already open, focus it
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open a new window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-habits') {
        event.waitUntil(syncHabits());
    }
});

async function syncHabits() {
    // This would sync any pending offline changes
    console.log('Background sync: syncing habits...');
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'habit-reminder') {
        event.waitUntil(checkAndRemind());
    }
});

async function checkAndRemind() {
    // Check if user has incomplete habits and send reminder
    console.log('Periodic sync: checking habits...');
}
