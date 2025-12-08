import { useState, useEffect, useCallback } from 'react';

interface SensorData {
  acceleration: {
    x: number | null;
    y: number | null;
    z: number | null;
  };
  rotation: {
    alpha: number | null; // Z-axis rotation
    beta: number | null;  // X-axis rotation
    gamma: number | null; // Y-axis rotation
  };
  orientation: {
    absolute: boolean;
    webkitCompassHeading?: number;
  };
  interval: number;
  timestamp: number;
  stability: number;
}

interface SensorState {
  isSupported: boolean;
  isActive: boolean;
  hasPermission: boolean;
  data: SensorData;
  error: string | null;
}

const initialSensorData: SensorData = {
  acceleration: { x: null, y: null, z: null },
  rotation: { alpha: null, beta: null, gamma: null },
  orientation: { absolute: false },
  interval: 0,
  timestamp: 0,
  stability: 0,
};

export const useSensors = () => {
  const [state, setState] = useState<SensorState>({
    isSupported: false,
    isActive: false,
    hasPermission: false,
    data: initialSensorData,
    error: null,
  });

  const checkPermission = useCallback(async (): Promise<boolean> => {
    if (typeof DeviceMotionEvent !== 'undefined' && 
        typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        return response === 'granted';
      } catch (error) {
        console.error('Error requesting motion permission:', error);
        return false;
      }
    }
    return true;
  }, []);

  const startSensors = useCallback(async () => {
    try {
      const hasPermission = await checkPermission();
      
      if (!hasPermission) {
        setState(prev => ({
          ...prev,
          error: 'Se requiere permiso para acceder a los sensores',
          hasPermission: false,
        }));
        return false;
      }

      let lastTimestamp = 0;
      const motionHandler = (event: DeviceMotionEvent) => {
        const now = performance.now();
        const interval = now - lastTimestamp;
        lastTimestamp = now;

        const acceleration = event.accelerationIncludingGravity;
        const rotationRate = event.rotationRate;

        setState(prev => {
          const newData: SensorData = {
            acceleration: {
              x: acceleration?.x ?? prev.data.acceleration.x,
              y: acceleration?.y ?? prev.data.acceleration.y,
              z: acceleration?.z ?? prev.data.acceleration.z,
            },
            rotation: {
              alpha: rotationRate?.alpha ?? prev.data.rotation.alpha,
              beta: rotationRate?.beta ?? prev.data.rotation.beta,
              gamma: rotationRate?.gamma ?? prev.data.rotation.gamma,
            },
            orientation: prev.data.orientation,
            interval,
            timestamp: now,
            stability: calculateStability(acceleration, rotationRate),
          };
          return { ...prev, data: newData, isActive: true, hasPermission: true };
        });
      };

      const orientationHandler = (event: DeviceOrientationEvent) => {
        setState(prev => ({
          ...prev,
          data: {
            ...prev.data,
            orientation: {
              absolute: event.absolute,
              webkitCompassHeading: (event as any).webkitCompassHeading,
            },
          },
        }));
      };

      window.addEventListener('devicemotion', motionHandler);
      window.addEventListener('deviceorientation', orientationHandler);

      setState(prev => ({
        ...prev,
        isSupported: true,
        isActive: true,
        hasPermission: true,
        error: null,
      }));

      return () => {
        window.removeEventListener('devicemotion', motionHandler);
        window.removeEventListener('deviceorientation', orientationHandler);
      };
    } catch (error) {
      console.error('Error starting sensors:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al iniciar los sensores',
        isActive: false,
      }));
      return false;
    }
  }, [checkPermission]);

  const stopSensors = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  const calculateStability = (acceleration: DeviceMotionEvent['accelerationIncludingGravity'], rotationRate: DeviceMotionEvent['rotationRate']): number => {
    if (!acceleration || !rotationRate) return 0;
    
    const accelMagnitude = Math.sqrt(
      Math.pow(acceleration.x || 0, 2) +
      Math.pow(acceleration.y || 0, 2) +
      Math.pow(acceleration.z || 0, 2)
    );
    
    const rotationMagnitude = Math.sqrt(
      Math.pow(rotationRate.alpha || 0, 2) +
      Math.pow(rotationRate.beta || 0, 2) +
      Math.pow(rotationRate.gamma || 0, 2)
    );
    
    // Normalizar y calcular estabilidad (0-100)
    const stability = Math.max(0, 100 - (accelMagnitude * 10 + rotationMagnitude * 5));
    return Math.min(100, stability);
  };

  useEffect(() => {
    // Verificar soporte de sensores
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS || isAndroid) {
      setState(prev => ({ ...prev, isSupported: true }));
    } else {
      setState(prev => ({
        ...prev,
        isSupported: false,
        error: 'Los sensores no son soportados en este dispositivo',
      }));
    }

    return () => {
      stopSensors();
    };
  }, [stopSensors]);

  return {
    ...state,
    startSensors,
    stopSensors,
    calibrate: () => {
      // Lógica de calibración
      console.log('Calibrando sensores...');
    },
  };
};
