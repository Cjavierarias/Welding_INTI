/// <reference lib="webworker" />

// Worker para procesamiento de imágenes en segundo plano
interface ProcessingMessage {
  type: 'processImage' | 'detectMarkers' | 'calculateMetrics';
  data: ImageData | any;
  id: number;
}

interface ProcessingResult {
  type: string;
  data: any;
  id: number;
}

self.onmessage = async (event: MessageEvent<ProcessingMessage>) => {
  const { type, data, id } = event.data;
  
  try {
    switch (type) {
      case 'processImage':
        const processed = await processImageData(data as ImageData);
        self.postMessage({ type: 'imageProcessed', data: processed, id });
        break;
        
      case 'detectMarkers':
        const markers = await detectARMarkers(data as ImageData);
        self.postMessage({ type: 'markersDetected', data: markers, id });
        break;
        
      case 'calculateMetrics':
        const metrics = calculateDetailedMetrics(data);
        self.postMessage({ type: 'metricsCalculated', data: metrics, id });
        break;
        
      default:
        self.postMessage({ type: 'error', data: 'Unknown message type', id });
    }
  } catch (error) {
    self.postMessage({ type: 'error', data: error.message, id });
  }
};

async function processImageData(imageData: ImageData): Promise<ImageData> {
  const { width, height, data } = imageData;
  const processedData = new Uint8ClampedArray(data.length);
  
  // Aplicar filtros para mejorar detección de marcadores
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convertir a escala de grises
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Aplicar umbral adaptativo
    const threshold = 128;
    const value = gray > threshold ? 255 : 0;
    
    processedData[i] = value;
    processedData[i + 1] = value;
    processedData[i + 2] = value;
    processedData[i + 3] = 255;
  }
  
  return new ImageData(processedData, width, height);
}

async function detectARMarkers(imageData: ImageData): Promise<any[]> {
  const { width, height, data } = imageData;
  const markers: any[] = [];
  
  // Implementación simplificada de detección de marcadores
  // En producción, usar una librería como js-aruco
  
  // Buscar patrones cuadrados (simulación)
  const squareSize = 50;
  const threshold = 200;
  
  for (let y = 0; y < height - squareSize; y += 5) {
    for (let x = 0; x < width - squareSize; x += 5) {
      const corners = [
        { x, y },
        { x: x + squareSize, y },
        { x: x + squareSize, y: y + squareSize },
        { x, y: y + squareSize }
      ];
      
      let isSquare = true;
      for (const corner of corners) {
        const index = (corner.y * width + corner.x) * 4;
        const brightness = data[index];
        if (brightness < threshold) {
          isSquare = false;
          break;
        }
      }
      
      if (isSquare) {
        markers.push({
          id: markers.length,
          corners,
          center: {
            x: x + squareSize / 2,
            y: y + squareSize / 2
          },
          size: squareSize,
          confidence: 0.8
        });
      }
    }
  }
  
  return markers;
}

function calculateDetailedMetrics(sensorData: any): any {
  // Implementar filtro de Kalman simplificado
  const { acceleration, rotation, timestamp } = sensorData;
  
  // Estado previo (posición, velocidad, aceleración)
  const state = {
    x: 0, y: 0, z: 0,
    vx: 0, vy: 0, vz: 0,
    ax: acceleration?.x || 0,
    ay: acceleration?.y || 0,
    az: acceleration?.z || 0,
    timestamp
  };
  
  // Matrices del filtro de Kalman
  const F = [ // Matriz de transición de estado
    [1, 0, 0, 0.1, 0, 0],
    [0, 1, 0, 0, 0.1, 0],
    [0, 0, 1, 0, 0, 0.1],
    [0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 1]
  ];
  
  // Predicción
  const predictedState = {
    x: state.x + state.vx * 0.1,
    y: state.y + state.vy * 0.1,
    z: state.z + state.vz * 0.1,
    vx: state.vx + state.ax * 0.1,
    vy: state.vy + state.ay * 0.1,
    vz: state.vz + state.az * 0.1
  };
  
  // Calcular métricas avanzadas
  const accelerationMagnitude = Math.sqrt(
    Math.pow(state.ax, 2) + 
    Math.pow(state.ay, 2) + 
    Math.pow(state.az, 2)
  );
  
  const rotationMagnitude = Math.sqrt(
    Math.pow(rotation?.alpha || 0, 2) + 
    Math.pow(rotation?.beta || 0, 2) + 
    Math.pow(rotation?.gamma || 0, 2)
  );
  
  // Calcular jerk (derivada de la aceleración)
  const jerk = accelerationMagnitude / 0.1;
  
  // Calcular estabilidad basada en variaciones
  const stability = Math.max(0, 100 - (accelerationMagnitude * 10 + rotationMagnitude * 5));
  
  return {
    predictedState,
    accelerationMagnitude,
    rotationMagnitude,
    jerk,
    stability,
    timestamp
  };
}

// Inicializar worker
console.log('Image Processor Worker initialized');
