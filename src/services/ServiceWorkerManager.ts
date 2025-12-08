export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isUpdateAvailable: boolean = false;
  private updateListeners: Array<() => void> = [];

  constructor() {
    this.initializeServiceWorker();
  }

  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      this.setupEventListeners();
      this.checkForUpdates();
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }

  private setupEventListeners(): void {
    if (!this.registration) return;

    // Escuchar actualizaciones del service worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service worker controller changed');
      window.location.reload();
    });

    // Escuchar mensajes del service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });

    // Escuchar actualizaciones
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration?.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Nueva versión disponible
              this.isUpdateAvailable = true;
              this.notifyUpdateListeners();
            } else {
              // Primera instalación
              console.log('Service worker installed for the first time');
            }
          }
        });
      }
    });
  }

  private handleServiceWorkerMessage(message: any): void {
    switch (message.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', message.payload);
        break;
        
      case 'SYNC_REGISTERED':
        console.log('Background sync registered:', message.payload);
        break;
        
      case 'PUSH_RECEIVED':
        this.handlePushNotification(message.payload);
        break;
        
      default:
        console.log('Unknown message from service worker:', message);
    }
  }

  private handlePushNotification(payload: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const options: NotificationOptions = {
        body: payload.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: payload.data,
        requireInteraction: payload.requireInteraction || false
      };

      const notification = new Notification(payload.title, options);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
      };
    }
  }

  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      return this.isUpdateAvailable;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  }

  async skipWaitingAndReload(): Promise<void> {
    if (!this.registration?.waiting) return;

    // Enviar mensaje al service worker para saltar la espera
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Recargar la página
    window.location.reload();
  }

  async getCacheStatus(): Promise<CacheStatus> {
    if (!('caches' in window)) {
      return { total: 0, used: 0, items: 0 };
    }

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      let totalItems = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        totalItems += requests.length;

        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const clone = response.clone();
            const blob = await clone.blob();
            totalSize += blob.size;
          }
        }
      }

      return {
        total: 50 * 1024 * 1024, // 50MB límite estimado
        used: totalSize,
        items: totalItems
      };
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return { total: 0, used: 0, items: 0 };
    }
  }

  async clearCache(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async precacheAssets(assets: string[]): Promise<void> {
    if (!this.registration?.active) return;

    try {
      this.registration.active.postMessage({
        type: 'PRECACHE_ASSETS',
        payload: { assets }
      });
    } catch (error) {
      console.error('Failed to send precache message:', error);
    }
  }

  async syncData(data: any): Promise<void> {
    if (!this.registration?.sync) {
      // Fallback: almacenar localmente y sincronizar más tarde
      this.storeForLaterSync(data);
      return;
    }

    try {
      // Registrar sync
      await this.registration.sync.register('sync-welding-data');
      
      // Almacenar datos temporalmente
      await this.storeSyncData(data);
    } catch (error) {
      console.error('Failed to register sync:', error);
      this.storeForLaterSync(data);
    }
  }

  private async storeSyncData(data: any): Promise<void> {
    const storeName = 'sync-welding-data';
    
    if ('indexedDB' in window) {
      const db = await this.openIndexedDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.put({ ...data, timestamp: Date.now(), synced: false });
    }
  }

  private async storeForLaterSync(data: any): Promise<void> {
    // Almacenar en localStorage como fallback
    const pendingSyncs = JSON.parse(localStorage.getItem('pending-syncs') || '[]');
    pendingSyncs.push({ ...data, timestamp: Date.now() });
    localStorage.setItem('pending-syncs', JSON.stringify(pendingSyncs));
  }

  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WeldingSimulatorDB', 2);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Crear object store para datos de sincronización
        if (!db.objectStoreNames.contains('sync-welding-data')) {
          db.createObjectStore('sync-welding-data', { keyPath: 'id', autoIncrement: true });
        }
        
        // Crear object store para historial
        if (!db.objectStoreNames.contains('welding-history')) {
          const historyStore = db.createObjectStore('welding-history', { keyPath: 'id', autoIncrement: true });
          historyStore.createIndex('technique', 'technique', { unique: false });
          historyStore.createIndex('date', 'date', { unique: false });
        }
      };
    });
  }

  addUpdateListener(listener: () => void): void {
    this.updateListeners.push(listener);
  }

  removeUpdateListener(listener: () => void): void {
    this.updateListeners = this.updateListeners.filter(l => l !== listener);
  }

  private notifyUpdateListeners(): void {
    this.updateListeners.forEach(listener => listener());
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  isUpdateReady(): boolean {
    return this.isUpdateAvailable;
  }
}

interface CacheStatus {
  total: number;
  used: number;
  items: number;
}

// Hook de React para usar el ServiceWorkerManager
export function useServiceWorker(): ServiceWorkerManager {
  const [manager] = useState(() => new ServiceWorkerManager());
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setUpdateAvailable(true);
    manager.addUpdateListener(handleUpdate);

    return () => {
      manager.removeUpdateListener(handleUpdate);
    };
  }, [manager]);

  return {
    ...manager,
    updateAvailable
  };
}
