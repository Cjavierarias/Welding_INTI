export interface WeldingScore {
  overall: number;
  components: {
    angle: number;
    distance: number;
    speed: number;
    stability: number;
    consistency: number;
  };
  grade: string;
}

export interface TechniqueParameters {
  angleRange: [number, number];
  distanceRange: [number, number];
  speedRange: [number, number];
  movementPattern: string;
  vibrationTolerance: number;
}

export const TECHNIQUE_PARAMETERS = {
  MIG: {
    angleRange: [70, 80] as [number, number],
    distanceRange: [10, 15] as [number, number],
    speedRange: [5, 10] as [number, number],
    movementPattern: 'oscillating',
    vibrationTolerance: 0.3,
  },
  TIG: {
    angleRange: [60, 75] as [number, number],
    distanceRange: [2, 5] as [number, number],
    speedRange: [2, 5] as [number, number],
    movementPattern: 'linear',
    vibrationTolerance: 0.1,
  },
  ELECTRODE: {
    angleRange: [60, 80] as [number, number],
    distanceRange: [5, 10] as [number, number],
    speedRange: [3, 7] as [number, number],
    movementPattern: 'dragging',
    vibrationTolerance: 0.2,
  },
} as const;

export function calculateAngleScore(
  currentAngle: number,
  idealRange: [number, number],
  timeInRange: number,
  totalTime: number
): number {
  const [min, max] = idealRange;
  const rangeWidth = max - min;
  const center = (min + max) / 2;
  
  // Puntaje por tiempo en rango (40%)
  const timeScore = (timeInRange / totalTime) * 40;
  
  // Puntaje por proximidad al centro del rango (30%)
  const distanceFromCenter = Math.abs(currentAngle - center);
  const maxDistance = rangeWidth / 2;
  const proximityScore = Math.max(0, 30 * (1 - distanceFromCenter / maxDistance));
  
  // Puntaje por consistencia (30%)
  // Esto se calcularía basado en la variación del ángulo a lo largo del tiempo
  const consistencyScore = 30; // Placeholder
  
  return timeScore + proximityScore + consistencyScore;
}

export function calculateDistanceScore(
  currentDistance: number,
  idealRange: [number, number],
  stability: number
): number {
  const [min, max] = idealRange;
  
  if (currentDistance >= min && currentDistance <= max) {
    // En rango ideal: 100% base, ajustado por estabilidad
    return 100 * (stability / 100);
  }
  
  // Fuera de rango: cálculo basado en distancia al rango más cercano
  const closestBoundary = currentDistance < min ? min : max;
  const distanceToBoundary = Math.abs(currentDistance - closestBoundary);
  const maxTolerance = (max - min) * 2; // 2x el ancho del rango
  
  const baseScore = Math.max(0, 100 * (1 - distanceToBoundary / maxTolerance));
  return baseScore * (stability / 100);
}

export function calculateSpeedScore(
  currentSpeed: number,
  idealRange: [number, number],
  speedHistory: number[]
): number {
  const [min, max] = idealRange;
  
  // Puntaje por velocidad actual (40%)
  let currentScore = 0;
  if (currentSpeed >= min && currentSpeed <= max) {
    currentScore = 40;
  } else if (currentSpeed < min) {
    currentScore = 40 * (currentSpeed / min);
  } else {
    currentScore = 40 * (max / currentSpeed);
  }
  
  // Puntaje por consistencia (60%)
  if (speedHistory.length < 2) {
    return currentScore;
  }
  
  // Calcular desviación estándar de la velocidad
  const mean = speedHistory.reduce((a, b) => a + b, 0) / speedHistory.length;
  const variance = speedHistory.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / speedHistory.length;
  const stdDev = Math.sqrt(variance);
  
  // Velocidad ideal promedio
  const idealMean = (min + max) / 2;
  
  // Calcular puntaje de consistencia
  const consistencyFactor = Math.max(0, 1 - stdDev / idealMean);
  const consistencyScore = 60 * consistencyFactor;
  
  return currentScore + consistencyScore;
}

export function calculateStabilityScore(
  accelerationData: number[],
  rotationData: number[],
  technique: keyof typeof TECHNIQUE_PARAMETERS
): number {
  const vibrationTolerance = TECHNIQUE_PARAMETERS[technique].vibrationTolerance;
  
  // Calcular RMS de aceleración
  const accelRMS = Math.sqrt(
    accelerationData.reduce((sum, val) => sum + val * val, 0) / accelerationData.length
  );
  
  // Calcular RMS de rotación
  const rotationRMS = Math.sqrt(
    rotationData.reduce((sum, val) => sum + val * val, 0) / rotationData.length
  );
  
  // Normalizar y combinar
  const combinedStability = 100 * (1 - Math.min(1, 
    (accelRMS / vibrationTolerance + rotationRMS / vibrationTolerance) / 2
  ));
  
  return Math.max(0, combinedStability);
}

export function calculateOverallScore(
  angleScore: number,
  distanceScore: number,
  speedScore: number,
  stabilityScore: number,
  technique: keyof typeof TECHNIQUE_PARAMETERS
): WeldingScore {
  // Ponderaciones basadas en técnica
  const weights = {
    MIG: { angle: 0.35, distance: 0.25, speed: 0.20, stability: 0.20 },
    TIG: { angle: 0.30, distance: 0.30, speed: 0.25, stability: 0.15 },
    ELECTRODE: { angle: 0.25, distance: 0.30, speed: 0.20, stability: 0.25 },
  };
  
  const weight = weights[technique];
  
  const overallScore = 
    angleScore * weight.angle +
    distanceScore * weight.distance +
    speedScore * weight.speed +
    stabilityScore * weight.stability;
  
  return {
    overall: Math.round(overallScore),
    components: {
      angle: Math.round(angleScore),
      distance: Math.round(distanceScore),
      speed: Math.round(speedScore),
      stability: Math.round(stabilityScore),
      consistency: Math.round((angleScore + speedScore) / 2), // Placeholder
    },
    grade: calculateGrade(overallScore),
  };
}

export function calculateGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'C-';
  if (score >= 40) return 'D';
  return 'F';
}

export function generateFeedback(
  score: WeldingScore,
  technique: keyof typeof TECHNIQUE_PARAMETERS
): string[] {
  const feedback: string[] = [];
  const { components } = score;
  
  // Feedback basado en componentes
  if (components.angle < 70) {
    feedback.push(`Ángulo de trabajo necesita mejora. Objetivo: ${TECHNIQUE_PARAMETERS[technique].angleRange[0]}°-${TECHNIQUE_PARAMETERS[technique].angleRange[1]}°`);
  }
  
  if (components.distance < 70) {
    feedback.push(`Distancia al material fuera del rango ideal.`);
  }
  
  if (components.speed < 70) {
    feedback.push(`Controla mejor la velocidad de avance.`);
  }
  
  if (components.stability < 70) {
    feedback.push(`Mantén la mano más estable durante la soldadura.`);
  }
  
  if (components.consistency < 70) {
    feedback.push(`Busca mayor consistencia en tus movimientos.`);
  }
  
  // Feedback positivo
  if (score.overall >= 80) {
    feedback.unshift('¡Excelente trabajo! Técnica muy bien ejecutada.');
  } else if (score.overall >= 60) {
    feedback.unshift('Buen esfuerzo. Con práctica mejorarás aún más.');
  } else {
    feedback.unshift('Sigue practicando. Enfócate en los puntos de mejora.');
  }
  
  // Consejos específicos por técnica
  const techniqueTips = {
    MIG: [
      'Realiza movimientos oscilantes suaves y controlados',
      'Mantén el ángulo constante durante todo el recorrido',
      'Observa la formación del cordón de soldadura'
    ],
    TIG: [
      'Control preciso del electrodo de tungsteno',
      'Mantén distancia constante al material',
      'Atención al baño de fusión'
    ],
    ELECTRODE: [
      'Ajusta distancia según consumo del electrodo',
      'Movimiento de arrastre suave',
      'Control de velocidad según tipo de junta'
    ],
  };
  
  if (score.overall < 80) {
    feedback.push(...techniqueTips[technique]);
  }
  
  return feedback;
}
