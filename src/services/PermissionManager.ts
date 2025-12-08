export class PermissionManager {
  private requestedPermissions: Set<string> = new Set();
  private permissionStates: Map<string, PermissionState> = new Map();

  constructor() {
    this.initializePermissionStates();
  }

  private async initializePermissionStates() {
    // Estado inicial de permisos comunes
    this.permissionStates.set('camera', await this.queryPermission('camera'));
    this.permissionStates.set('microphone', await this.queryPermission('microphone'));
    this.permissionStates.set('sensors', await this.querySensorPermission());
    this.permissionStates.set('notifications', await this.queryPermission('notifications'));
  }

  async requestPermission(
    permissionName: string,
    options?: { explanation?: string; fallback?: () => void }
  ): Promise<PermissionState> {
    // Evitar solicitudes duplicadas
    if (this.requestedPermissions.has(permissionName)) {
      return this.permissionStates.get(permissionName) || 'prompt';
    }

    this.requestedPermissions.add(permissionName);

    try {
      let state: PermissionState;

      switch (permissionName) {
        case 'camera':
          state = await this.requestCameraPermission(options);
          break;

        case 'sensors':
          state = await this.requestSensorPermission(options);
          break;

        case 'notifications':
          state = await this.requestNotificationPermission(options);
          break;

        default:
          state = await this.genericPermissionRequest(permissionName, options);
      }

      this.permissionStates.set(permissionName, state);
      this.logPermissionRequest(permissionName, state);

      return state;
    } catch (error) {
      console.error(`Error requesting ${permissionName} permission:`, error);
      this.permissionStates.set(permissionName, 'denied');
      return 'denied';
    }
  }

  private async requestCameraPermission(options?: any): Promise<PermissionState> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return 'denied';
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Detener stream inmediatamente después de la verificación
      stream.getTracks().forEach(track => track.stop());

      return 'granted';
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return 'denied';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        return 'denied';
      } else {
        return 'prompt';
      }
    }
  }

  private async requestSensorPermission(options?: any): Promise<PermissionState> {
    // iOS requiere solicitud explícita para DeviceMotionEvent
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        return response === 'granted' ? 'granted' : 'denied';
      } catch {
        return 'denied';
      }
    }

    // Android y otros navegadores
    if (typeof DeviceMotionEvent !== 'undefined') {
      return 'granted';
    }

    return 'denied';
  }

  private async requestNotificationPermission(options?: any): Promise<PermissionState> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default' && options?.explanation) {
      // Mostrar explicación antes de solicitar
      await this.showPermissionExplanation('notifications', options.explanation);
    }

    const permission = await Notification.requestPermission();
    return permission as PermissionState;
  }

  private async genericPermissionRequest(
    permissionName: string,
    options?: any
  ): Promise<PermissionState> {
    // Intentar usar la API de permisos genérica
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({
          name: permissionName as PermissionName
        });
        return result.state;
      } catch {
        // La API de permisos no soporta este tipo
      }
    }

    return 'prompt';
  }

  private async queryPermission(permissionName: string): Promise<PermissionState> {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({
          name: permissionName as PermissionName
        });
        return result.state;
      } catch {
        // Permiso no soportado por la API
      }
    }

    // Verificación basada en capacidades del navegador
    switch (permissionName) {
      case 'camera':
        return !!navigator.mediaDevices?.getUserMedia ? 'prompt' : 'denied';
      case 'sensors':
        return typeof DeviceMotionEvent !== 'undefined' ? 'prompt' : 'denied';
      default:
        return 'prompt';
    }
  }

  private async querySensorPermission(): Promise<PermissionState> {
    // Para iOS, verificar si ya se concedió
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      // iOS no expone el estado actual, asumir 'prompt'
      return 'prompt';
    }

    return typeof DeviceMotionEvent !== 'undefined' ? 'granted' : 'denied';
  }

  private async showPermissionExplanation(
    permissionName: string,
    explanation: string
  ): Promise<void> {
    return new Promise((resolve) => {
      // Implementar diálogo de explicación
      const dialog = document.createElement('div');
      dialog.className = 'permission-explanation-dialog';
      dialog.innerHTML = `
        <div class="permission-dialog-content">
          <h3>Permiso necesario</h3>
          <p>${explanation}</p>
          <div class="permission-dialog-actions">
            <button class="permission-deny">Ahora no</button>
            <button class="permission-allow">Permitir</button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const denyButton = dialog.querySelector('.permission-deny');
      const allowButton = dialog.querySelector('.permission-allow');

      const cleanup = () => {
        dialog.remove();
        resolve();
      };

      denyButton?.addEventListener('click', cleanup);
      allowButton?.addEventListener('click', cleanup);
    });
  }

  private logPermissionRequest(permissionName: string, state: PermissionState): void {
    console.log(`Permission ${permissionName}: ${state}`);
    
    // Podrías enviar esto a analytics (anonimizado)
    if (typeof gtag !== 'undefined') {
      gtag('event', 'permission_request', {
        permission_name: permissionName,
        permission_state: state,
        app_version: process.env.REACT_APP_VERSION
      });
    }
  }

  getPermissionState(permissionName: string): PermissionState {
    return this.permissionStates.get(permissionName) || 'prompt';
  }

  hasPermission(permissionName: string): boolean {
    return this.getPermissionState(permissionName) === 'granted';
  }

  getMissingPermissions(): string[] {
    const requiredPermissions = ['camera', 'sensors'];
    return requiredPermissions.filter(perm => !this.hasPermission(perm));
  }

  async requestAllPermissions(): Promise<Map<string, PermissionState>> {
    const permissions = ['camera', 'sensors'];
    const results = new Map<string, PermissionState>();

    for (const permission of permissions) {
      const state = await this.requestPermission(permission, {
        explanation: `Necesitamos acceso a ${permission === 'camera' ? 'la cámara' : 'los sensores'} para la simulación de soldadura.`
      });
      results.set(permission, state);
    }

    return results;
  }

  reset(): void {
    this.requestedPermissions.clear();
    this.permissionStates.clear();
    this.initializePermissionStates();
  }
}

// Hook de React para usar el PermissionManager
export function usePermissions() {
  const [permissionManager] = useState(() => new PermissionManager());
  const [permissions, setPermissions] = useState<Map<string, PermissionState>>(new Map());

  useEffect(() => {
    const updatePermissions = async () => {
      const states = new Map();
      for (const [name] of permissionManager.permissionStates) {
        states.set(name, permissionManager.getPermissionState(name));
      }
      setPermissions(states);
    };

    updatePermissions();
  }, [permissionManager]);

  const requestPermission = useCallback(
    async (permissionName: string, options?: any) => {
      const state = await permissionManager.requestPermission(permissionName, options);
      setPermissions(new Map(permissionManager.permissionStates));
      return state;
    },
    [permissionManager]
  );

  const requestAllPermissions = useCallback(async () => {
    const results = await permissionManager.requestAllPermissions();
    setPermissions(new Map(permissionManager.permissionStates));
    return results;
  }, [permissionManager]);

  return {
    permissions,
    requestPermission,
    requestAllPermissions,
    hasPermission: (name: string) => permissionManager.hasPermission(name),
    getMissingPermissions: () => permissionManager.getMissingPermissions()
  };
}
