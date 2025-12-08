import { useState, useRef, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';

interface ARMarker {
  id: number;
  corners: { x: number; y: number }[];
  center: { x: number; y: number };
  size: number;
  detected: boolean;
}

interface CameraState {
  isSupported: boolean;
  isActive: boolean;
  hasPermission: boolean;
  stream: MediaStream | null;
  error: string | null;
  markers: ARMarker[];
  metrics: {
    distance: number | null;
    angle: {
      pitch: number | null;
      yaw: number | null;
      roll: number | null;
    };
    speed: {
      approach: number | null;
      lateral: number | null;
    };
    stability: number;
  };
}

export const useCameraAR = () => {
  const [state, setState] = useState<CameraState>({
    isSupported: false,
    isActive: false,
    hasPermission: false,
    stream: null,
    error: null,
    markers: [],
    metrics: {
      distance: null,
      angle: { pitch: null, yaw: null, roll: null },
      speed: { approach: null, lateral: null },
      stability: 0,
    },
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastMarkerData = useRef<any>(null);
  const lastTimestamp = useRef<number>(0);

  const checkCameraSupport = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  const requestCameraPermission = useCallback(async () => {
    try {
      if (!checkCameraSupport()) {
        throw new Error('Cámara no soportada');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 60 },
        },
        audio: false,
      });

      setState(prev => ({
        ...prev,
        stream,
        hasPermission: true,
        isSupported: true,
        error: null,
      }));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Error al acceder a la cámara',
        hasPermission: false,
      }));
      return null;
    }
  }, [checkCameraSupport]);

  const detectMarkers = useCallback((imageData: ImageData) => {
    // Implementar detección de marcadores AR
    // Por ahora, usamos jsQR para detectar códigos QR como marcadores simples
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    const markers: ARMarker[] = [];
    
    if (code) {
      markers.push({
        id: 1,
        corners: code.location.topLeftCorner,
        center: code.location.topLeftCorner, // Simplificado
        size: Math.abs(code.location.bottomRightCorner.x - code.location.topLeftCorner.x),
        detected: true,
      });
    }
    
    return markers;
  }, []);

  const calculateMetrics = useCallback((markers: ARMarker[], timestamp: number) => {
    if (markers.length === 0) {
      return {
        distance: null,
        angle: { pitch: null, yaw: null, roll: null },
        speed: { approach: null, lateral: null },
        stability: 0,
      };
    }

    const marker = markers[0];
    const now = timestamp;
    const dt = now - lastTimestamp.current;
    lastTimestamp.current = now;

    // Calcular distancia basada en tamaño del marcador (simplificado)
    const distance = marker.size > 0 ? 1000 / marker.size : null;

    // Calcular ángulos (simplificado - basado en posición en pantalla)
    const centerX = marker.center.x;
    const centerY = marker.center.y;
    const pitch = centerY - 240; // Normalizado
    const yaw = centerX - 320;
    const roll = 0; // Necesitaríamos más información para calcular roll

    // Calcular velocidades
    let approachSpeed = null;
    let lateralSpeed = null;

    if (lastMarkerData.current && dt > 0) {
      const lastDistance = lastMarkerData.current.distance;
      const lastCenterX = lastMarkerData.current.centerX;
      
      if (distance !== null && lastDistance !== null) {
        approachSpeed = (distance - lastDistance) / dt;
      }
      
      lateralSpeed = (centerX - lastCenterX) / dt;
    }

    // Calcular estabilidad
    const stability = Math.max(0, 100 - Math.abs(pitch) - Math.abs(yaw));

    // Guardar datos actuales para siguiente cálculo
    lastMarkerData.current = {
      distance,
      centerX,
      timestamp: now,
    };

    return {
      distance,
      angle: { pitch, yaw, roll },
      speed: { approach: approachSpeed, lateral: lateralSpeed },
      stability,
    };
  }, []);

  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !state.stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Configurar canvas al tamaño del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar video en canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Obtener datos de imagen
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Detectar marcadores
    const markers = detectMarkers(imageData);

    // Calcular métricas
    const metrics = calculateMetrics(markers, performance.now());

    // Actualizar estado
    setState(prev => ({
      ...prev,
      markers,
      metrics,
      isActive: true,
    }));

    // Continuar procesamiento
    animationRef.current = requestAnimationFrame(processFrame);
  }, [state.stream, detectMarkers, calculateMetrics]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await requestCameraPermission();
      if (stream) {
        // Esperar a que el video esté listo
        if (videoRef.current) {
          videoRef.current.onloadeddata = () => {
            animationRef.current = requestAnimationFrame(processFrame);
          };
        }
      }
    } catch (error) {
      console.error('Error starting camera:', error);
    }
  }, [requestCameraPermission, processFrame]);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }

    setState(prev => ({
      ...prev,
      stream: null,
      isActive: false,
      markers: [],
      metrics: {
        distance: null,
        angle: { pitch: null, yaw: null, roll: null },
        speed: { approach: null, lateral: null },
        stability: 0,
      },
    }));
  }, [state.stream]);

  useEffect(() => {
    // Verificar soporte inicial
    setState(prev => ({
      ...prev,
      isSupported: checkCameraSupport(),
    }));

    return () => {
      stopCamera();
    };
  }, [checkCameraSupport, stopCamera]);

  return {
    ...state,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureFrame: () => {
      if (!canvasRef.current) return null;
      return canvasRef.current.toDataURL('image/png');
    },
  };
};
