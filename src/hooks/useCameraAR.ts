import { useState, useRef, useCallback, useEffect } from 'react';
import { detectArucoMarkers } from '@thegrumpys/odv2-aruco';

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

const MARKER_REAL_SIZE_MM = 100; // Tamaño físico del marcador (ajustar según impresión)
const FOCAL_LENGTH_PX = 800; // Estimación para cámaras móviles promedio

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
  const lastMarkerMetrics = useRef<any>(null);
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
          frameRate: { ideal: 30 },
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

  const calculateMetricsFromMarker = useCallback((marker: any, timestamp: number) => {
    const now = timestamp;
    const dt = now - lastTimestamp.current;
    lastTimestamp.current = now;

    // Distancia basada en tamaño aparente
    const pixelSize = Math.max(
      Math.abs(marker.corners[1].x - marker.corners[0].x),
      Math.abs(marker.corners[2].y - marker.corners[1].y)
    );
    const distance = pixelSize > 0 ? (MARKER_REAL_SIZE_MM * FOCAL_LENGTH_PX) / pixelSize : null;

    // Centro del marcador
    const centerX = marker.corners.reduce((sum: number, p: any) => sum + p.x, 0) / 4;
    const centerY = marker.corners.reduce((sum: number, p: any) => sum + p.y, 0) / 4;

    // Ángulos respecto al centro de la imagen
    const screenCenterX = videoRef.current?.videoWidth / 2 || 320;
    const screenCenterY = videoRef.current?.videoHeight / 2 || 240;
    const yaw = ((centerX - screenCenterX) / screenCenterX) * 30; // grados
    const pitch = ((centerY - screenCenterY) / screenCenterY) * 30;
    const roll = 0; // requiere análisis de perspectiva

    let approachSpeed = null;
    let lateralSpeed = null;
    if (lastMarkerMetrics.current && dt > 0) {
      const lastDistance = lastMarkerMetrics.current.distance;
      if (distance !== null && lastDistance !== null) {
        approachSpeed = (distance - lastDistance) / (dt / 1000); // mm/s
      }
      lateralSpeed = (centerX - lastMarkerMetrics.current.centerX) / (dt / 1000); // px/s
    }

    const stability = Math.max(0, 100 - Math.abs(yaw) - Math.abs(pitch));

    lastMarkerMetrics.current = { distance, centerX, timestamp: now };

    return {
      distance,
      angle: { pitch, yaw, roll },
      speed: { approach: approachSpeed, lateral: lateralSpeed },
      stability,
    };
  }, []);

  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !state.stream || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const markers = detectArucoMarkers(imageData);

    let metrics = {
      distance: null,
      angle: { pitch: null, yaw: null, roll: null },
      speed: { approach: null, lateral: null },
      stability: 0,
    };

    if (markers.length > 0) {
      const marker = markers[0];
      const corners = marker.corners.map((c: any) => ({ x: c.x, y: c.y }));
      const center = corners.reduce((acc: any, c: any) => ({ x: acc.x + c.x, y: acc.y + c.y }), { x: 0, y: 0 });
      center.x /= 4;
      center.y /= 4;
      const size = Math.sqrt(
        Math.pow(corners[1].x - corners[0].x, 2) +
        Math.pow(corners[1].y - corners[0].y, 2)
      );

      const arucoMarker: ARMarker = {
        id: marker.id,
        corners,
        center,
        size,
        detected: true,
      };

      metrics = calculateMetricsFromMarker(marker, performance.now());

      setState(prev => ({
        ...prev,
        markers: [arucoMarker],
        metrics,
        isActive: true,
      }));
    } else {
      setState(prev => ({
        ...prev,
        markers: [],
        metrics,
        isActive: true,
      }));
    }

    animationRef.current = requestAnimationFrame(processFrame);
  }, [state.stream, calculateMetricsFromMarker]);

  const startCamera = useCallback(async () => {
    const stream = await requestCameraPermission();
    if (stream && videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        animationRef.current = requestAnimationFrame(processFrame);
      };
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
    setState(prev => ({ ...prev, isSupported: checkCameraSupport() }));
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (state.stream) state.stream.getTracks().forEach(t => t.stop());
    };
  }, [checkCameraSupport]);

  return {
    ...state,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureFrame: () => canvasRef.current?.toDataURL('image/png') || null,
  };
};
