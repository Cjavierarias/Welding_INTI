const CACHE_NAME = 'welding-simulator-v1';
const BASE_PATH = '/Welding_INTI/';
const OFFLINE_URL = `${BASE_PATH}offline.html`;

// Assets a cachear - TODAS las rutas deben incluir BASE_PATH
const PRECACHE_ASSETS = [
  `${BASE_PATH}`,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}icon-192x192.png`,
  `${BASE_PATH}icon-512x512.png`,
  `${BASE_PATH}offline.html`,
  `${BASE_PATH}favicon.ico`,
  `${BASE_PATH}assets/index.css`,
  `${BASE_PATH}assets/index.js`
];

// Instalación - Precaché de assets críticos
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Cache addAll error:', error);
      })
  );
});

// Activación - Limpiar cachés viejas
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Estrategia de cache
self.addEventListener('fetch', (event) => {
  // Ignorar solicitudes no GET
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  
  // Solo cachear solicitudes de nuestro dominio
  if (!requestUrl.origin.startsWith(self.location.origin)) {
    return;
  }

  // Para navegación, usar network first, fallback a cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
        .then(response => response || caches.match(OFFLINE_URL))
    );
    return;
  }

  // Para otros recursos, usar cache first
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // No cachear respuestas inválidas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar respuesta para cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch(error => {
                console.error('Cache put error:', error);
              });

            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Para imágenes, puedes retornar un placeholder
            if (event.request.destination === 'image') {
              return caches.match(`${BASE_PATH}icon-192x192.png`);
            }
          });
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'PRECACHE_ASSETS') {
    const assets = event.data.payload.assets;
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(assets.map(asset => `${BASE_PATH}${asset}`)))
    );
  }
});

// Para GitHub Pages, simplificamos (no necesitamos Background Sync ni Push)
// Background Sync (comentado para GitHub Pages)
/*
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-welding-data') {
    event.waitUntil(syncWeldingData());
  }
});
*/

// Push notifications (comentado para GitHub Pages)
/*
self.addEventListener('push', (event) => {
  let data = {};
  
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.body || 'Nueva notificación del simulador',
    icon: `${BASE_PATH}icon-192x192.png`,
    badge: `${BASE_PATH}badge-72x72.png`,
    vibrate: [200, 100, 200],
    data: data.data || {},
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Simulador de Soldadura', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(BASE_PATH) && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(`${BASE_PATH}`);
        }
      })
  );
});
*/
