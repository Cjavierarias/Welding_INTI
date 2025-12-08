export interface PatternMetrics {
  distance: number;
  angle: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  stability: number;
  confidence: number;
}

export class PatternRecognizer {
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private patternSize: number = 100; // mm
  private focalLength: number = 800; // pixels (aproximado)
  private lastDetection: PatternMetrics | null = null;
  private detectionHistory: PatternMetrics[] = [];

  constructor(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.ctx = canvasElement.getContext('2d')!;
  }

  async detectPattern(): Promise<PatternMetrics | null> {
    if (!this.videoElement.videoWidth || !this.videoElement.videoHeight) {
      return null;
    }

    // Configurar canvas al tamaño del video
    this.canvasElement.width = this.videoElement.videoWidth;
    this.canvasElement.height = this.videoElement.videoHeight;

    // Dibujar el video en el canvas
    this.ctx.drawImage(
      this.videoElement,
      0, 0,
      this.canvasElement.width,
      this.canvasElement.height
    );

    // Obtener datos de imagen
    const imageData = this.ctx.getImageData(
      0, 0,
      this.canvasElement.width,
      this.canvasElement.height
    );

    // Buscar patrones (simplificado - en producción usar js-aruco o similar)
    const pattern = this.findPattern(imageData);

    if (pattern) {
      const metrics = this.calculateMetrics(pattern);
      this.lastDetection = metrics;
      this.detectionHistory.push(metrics);
      
      // Mantener solo los últimos 100 registros
      if (this.detectionHistory.length > 100) {
        this.detectionHistory.shift();
      }

      return metrics;
    }

    return null;
  }

  private findPattern(imageData: ImageData): any {
    // Implementación simplificada de detección de patrón
    // En una implementación real, usaríamos js-aruco o similar
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    // Buscar bordes brillantes (simulación)
    const edges = [];
    const threshold = 200;

    for (let y = 0; y < height; y += 10) {
      for (let x = 0; x < width; x += 10) {
        const index = (y * width + x) * 4;
        const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
        
        if (brightness > threshold) {
          edges.push({ x, y });
        }
      }
    }

    // Buscar patrones cuadrados (simplificado)
    if (edges.length >= 4) {
      const sortedEdges = edges.sort((a, b) => a.x - b.x);
      const left = sortedEdges[0];
      const right = sortedEdges[sortedEdges.length - 1];
      const sortedByY = edges.sort((a, b) => a.y - b.y);
      const top = sortedByY[0];
      const bottom = sortedByY[sortedByY.length - 1];

      return {
        corners: [left, top, right, bottom],
        width: Math.abs(right.x - left.x),
        height: Math.abs(bottom.y - top.y),
      };
    }

    return null;
  }

  private calculateMetrics(pattern: any): PatternMetrics {
    // Calcular distancia basada en tamaño del patrón
    const pixelWidth = pattern.width;
    const pixelHeight = pattern.height;
    const pixelSize = Math.max(pixelWidth, pixelHeight);
    
    // Fórmula simplificada para distancia
    const distance = (this.patternSize * this.focalLength) / pixelSize;

    // Calcular ángulos basados en posición en pantalla
    const centerX = pattern.corners.reduce((sum: number, p: any) => sum + p.x, 0) / 4;
    const centerY = pattern.corners.reduce((sum: number, p: any) => sum + p.y, 0) / 4;
    
    const screenCenterX = this.canvasElement.width / 2;
    const screenCenterY = this.canvasElement.height / 2;
    
    const yaw = ((centerX - screenCenterX) / screenCenterX) * 45; // Grados
    const pitch = ((centerY - screenCenterY) / screenCenterY) * 45; // Grados
    
    // Calcular roll basado en inclinación de los lados
    const topLeft = pattern.corners[0];
    const topRight = pattern.corners[2];
    const roll = Math.atan2(
      topRight.y - topLeft.y,
      topRight.x - topLeft.x
    ) * (180 / Math.PI);

    // Calcular estabilidad basada en variaciones recientes
    let stability = 100;
    if (this.lastDetection) {
      const angleDiff = Math.abs(this.lastDetection.angle.pitch - pitch) +
                       Math.abs(this.lastDetection.angle.yaw - yaw);
      stability = Math.max(0, 100 - angleDiff * 2);
    }

    // Calcular confianza basada en tamaño y claridad
    const confidence = Math.min(100, (pixelSize / 100) * 100);

    return {
      distance,
      angle: { pitch, yaw, roll },
      stability,
      confidence,
    };
  }

  getStabilityScore(): number {
    if (this.detectionHistory.length < 10) return 0;
    
    const recentHistory = this.detectionHistory.slice(-10);
    const angleVariances = recentHistory.map((m, i, arr) => {
      if (i === 0) return 0;
      const prev = arr[i - 1];
      return Math.abs(m.angle.pitch - prev.angle.pitch) +
             Math.abs(m.angle.yaw - prev.angle.yaw);
    });

    const avgVariance = angleVariances.reduce((a, b) => a + b, 0) / angleVariances.length;
    return Math.max(0, 100 - avgVariance * 10);
  }

  reset(): void {
    this.lastDetection = null;
    this.detectionHistory = [];
  }
}

// Helper para fusión de datos de sensores
export function fuseSensorData(
  patternMetrics: PatternMetrics,
  sensorData: any
): PatternMetrics {
  // Implementar fusión de datos usando filtro de Kalman simplificado
  const fusionFactor = 0.7; // Peso para datos del patrón
  
  const fusedMetrics = { ...patternMetrics };

  if (sensorData?.rotation) {
    // Fusionar datos de giroscopio con ángulos del patrón
    fusedMetrics.angle.pitch = fusionFactor * patternMetrics.angle.pitch +
                              (1 - fusionFactor) * (sensorData.rotation.beta || 0);
    
    fusedMetrics.angle.roll = fusionFactor * patternMetrics.angle.roll +
                             (1 - fusionFactor) * (sensorData.rotation.gamma || 0);
  }

  // Ajustar estabilidad con datos de sensores
  if (sensorData?.stability) {
    fusedMetrics.stability = (patternMetrics.stability + sensorData.stability) / 2;
  }

  return fusedMetrics;
}
