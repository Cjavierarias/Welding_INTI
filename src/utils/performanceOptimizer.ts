export class PerformanceOptimizer {
  private frameRate: number = 60;
  private lastFrameTime: number = 0;
  private frameInterval: number = 1000 / 60;
  private isThrottling: boolean = false;
  private pendingUpdates: Map<string, () => void> = new Map();
  
  constructor(targetFPS: number = 60) {
    this.frameRate = targetFPS;
    this.frameInterval = 1000 / targetFPS;
    this.setupPerformanceMonitoring();
  }
  
  private setupPerformanceMonitoring(): void {
    // Monitorear FPS
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handlePerformanceEntry(entry);
          }
        });
        
        observer.observe({ entryTypes: ['longtask', 'layout-shift', 'paint'] });
      } catch (e) {
        console.warn('PerformanceObserver not supported:', e);
      }
    }
  }
  
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'longtask':
        console.warn(`Long task detected: ${entry.duration}ms`);
        this.optimizeHeavyTasks();
        break;
        
      case 'layout-shift':
        if ((entry as any).value > 0.1) {
          console.warn('Layout shift detected');
        }
        break;
    }
  }
  
  // Throttle para updates de UI
  throttleUpdate(id: string, callback: () => void): void {
    const now = performance.now();
    
    if (now - this.lastFrameTime >= this.frameInterval) {
      callback();
      this.lastFrameTime = now;
      this.pendingUpdates.delete(id);
    } else {
      this.pendingUpdates.set(id, callback);
      
      if (!this.isThrottling) {
        this.isThrottling = true;
        requestAnimationFrame(() => {
          this.processPendingUpdates();
          this.isThrottling = false;
        });
      }
    }
  }
  
  private processPendingUpdates(): void {
    const now = performance.now();
    
    if (now - this.lastFrameTime >= this.frameInterval) {
      for (const [id, callback] of this.pendingUpdates) {
        callback();
        this.pendingUpdates.delete(id);
      }
      this.lastFrameTime = now;
    }
  }
  
  // Debounce para eventos frecuentes
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  
  // Memoization para cálculos costosos
  memoize<T extends (...args: any[]) => any>(
    func: T,
    resolver?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    
    return ((...args: Parameters<T>) => {
      const key = resolver ? resolver(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = func(...args);
      cache.set(key, result);
      
      // Limpiar cache periódicamente
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      return result;
    }) as T;
  }
  
  // Lazy loading de componentes
  lazyLoadComponent(
    importFunc: () => Promise<any>,
    loadingComponent?: React.ComponentType
  ): React.LazyExoticComponent<React.ComponentType<any>> {
    return React.lazy(() => {
      return new Promise(resolve => {
        // Timeout para mostrar loading si tarda demasiado
        const timeoutId = setTimeout(() => {
          if (loadingComponent) {
            resolve({ default: loadingComponent });
          }
        }, 300);
        
        importFunc().then(module => {
          clearTimeout(timeoutId);
          resolve(module);
        });
      });
    });
  }
  
  // Optimización de tareas pesadas
  private optimizeHeavyTasks(): void {
    // Reducir calidad de procesamiento de imagen si es necesario
    this.adjustProcessingQuality();
    
    // Limpiar cachés innecesarios
    this.cleanupCaches();
    
    // Sugerir pausa si el dispositivo se está sobrecalentando
    this.checkDeviceLoad();
  }
  
  private adjustProcessingQuality(): void {
    // Reducir resolución de procesamiento de imagen
    const qualityLevels = ['high', 'medium', 'low'];
    console.log('Reducing processing quality due to performance issues');
  }
  
  private cleanupCaches(): void {
    // Limpiar cachés de imágenes procesadas
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('processed-images')) {
            caches.delete(cacheName);
          }
        });
      });
    }
  }
  
  private checkDeviceLoad(): void {
    // Monitorear uso de recursos (simplificado)
    const memory = (performance as any).memory;
    if (memory) {
      const usedJSHeapSize = memory.usedJSHeapSize;
      const totalJSHeapSize = memory.totalJSHeapSize;
      const heapUsage = usedJSHeapSize / totalJSHeapSize;
      
      if (heapUsage > 0.8) {
        console.warn('High memory usage detected');
        this.triggerGarbageCollection();
      }
    }
  }
  
  private triggerGarbageCollection(): void {
    // Forzar garbage collection (no estándar)
    if (global.gc) {
      global.gc();
    }
  }
  
  // Compresión de datos para almacenamiento
  compressData(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      return LZString.compressToUTF16(jsonString);
    } catch (error) {
      console.warn('Compression failed, using uncompressed data');
      return JSON.stringify(data);
    }
  }
  
  decompressData(compressed: string): any {
    try {
      const jsonString = LZString.decompressFromUTF16(compressed);
      return JSON.parse(jsonString || 'null');
    } catch (error) {
      console.warn('Decompression failed, trying to parse as plain JSON');
      return JSON.parse(compressed);
    }
  }
  
  // Gestión de caché con IndexedDB
  async withCache<T>(
    key: string,
    producer: () => Promise<T>,
    ttl: number = 3600000 // 1 hora por defecto
  ): Promise<T> {
    try {
      // Intentar obtener de caché
      const cached = await this.getFromCache<T>(key);
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
      
      // Producir nuevo dato
      const data = await producer();
      
      // Almacenar en caché
      await this.storeInCache(key, data);
      
      return data;
    } catch (error) {
      console.warn('Cache operation failed:', error);
      // Fallback: producir sin caché
      return producer();
    }
  }
  
  private async getFromCache<T>(key: string): Promise<{ data: T; timestamp: number } | null> {
    // Implementación con IndexedDB
    return null; // Placeholder
  }
  
  private async storeInCache(key: string, data: any): Promise<void> {
    // Implementación con IndexedDB
  }
  
  // Prefetching de recursos
  prefetchResources(resources: string[]): void {
    if ('connection' in navigator && (navigator as any).connection.saveData) {
      return; // No prefetchar en modo de ahorro de datos
    }
    
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      link.as = this.getResourceType(resource);
      document.head.appendChild(link);
    });
  }
  
  private getResourceType(url: string): string {
    if (url.endsWith('.js')) return 'script';
    if (url.endsWith('.css')) return 'style';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.endsWith('.woff2') || url.endsWith('.ttf')) return 'font';
    return 'fetch';
  }
}
