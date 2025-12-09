const CACHE_NAME = 'welding-simulator-v1';
const OFFLINE_URL = '/offline.html';

// Assets a cachear
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html',
  '/favicon.ico'
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

// Estrategia de cache: Network First, fallback a Cache
self.addEventListener('fetch', (event) => {
  // Ignorar solicitudes no GET
  if (event.request.method !== 'GET') return;

  // Para solicitudes de la API, usar network first
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clonar respuesta para cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback a cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Para assets estáticos, usar cache first
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
              });

            return response;
          })
          .catch(() => {
            // Si falla la red y no está en cache, mostrar offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
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
        .then((cache) => cache.addAll(assets))
    );
  }
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-welding-data') {
    event.waitUntil(syncWeldingData());
  }
});

async function syncWeldingData() {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction('sync-welding-data', 'readonly');
    const store = tx.objectStore('sync-welding-data');
    const unsyncedData = await getAllFromStore(store);
    
    for (const data of unsyncedData) {
      // Aquí iría la lógica para enviar datos al servidor
      console.log('Syncing data:', data);
      
      // Marcar como sincronizado
      await markAsSynced(data.id);
    }
    
    // Notificar al cliente
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          payload: { count: unsyncedData.length }
        });
      });
    });
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('WeldingSimulatorDB', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function markAsSynced(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('WeldingSimulatorDB', 2);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction('sync-welding-data', 'readwrite');
      const store = tx.objectStore('sync-welding-data');
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const data = getRequest.result;
        data.synced = true;
        const putRequest = store.put(data);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  let data = {};
  
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.body || 'Nueva notificación del simulador',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
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
        // Si hay un cliente abierto, enfocarlo
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no hay cliente abierto, abrir uno nuevo
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
