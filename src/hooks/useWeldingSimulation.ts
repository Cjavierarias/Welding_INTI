import { useState, useRef, useEffect, useCallback } from 'react';

export type WeldingTechnique = 'MIG' | 'TIG' | 'ELECTRODE';
export type WeldingState = 'idle' | 'running' | 'paused' | 'completed';

interface WeldingParameters {
  technique: WeldingTechnique;
  idealAngle: { min: number; max: number };
  idealDistance: { min: number; max: number };
  idealSpeed: { min: number; max: number };
  duration: number; // segundos
}

interface RealTimeMetrics {
  angle: number;
  distance: number;
  speed: number;
  stability: number;
  quality: number;
  timestamp: number;
}

interface SimulationResult {
  technique: WeldingTechnique;
  duration: number;
  metrics: RealTimeMetrics[];
  score: number;
  grade: string;
  feedback: string[];
  startedAt: number;
  completedAt: number;
}

const TECHNIQUE_PARAMS: Record<WeldingTechnique, WeldingParameters> = {
  MIG: {
    technique: 'MIG',
    idealAngle: { min: 70, max: 80 },
    idealDistance: { min: 10, max: 15 },
    idealSpeed: { min: 5, max: 10 }, // mm/s
    duration: 60,
  },
  TIG: {
    technique: 'TIG',
    idealAngle: { min: 60, max: 75 },
    idealDistance: { min: 2, max: 5 },
    idealSpeed: { min: 2, max: 5 }, // mm/s
    duration: 90,
  },
  ELECTRODE: {
    technique: 'ELECTRODE',
    idealAngle: { min: 60, max: 80 },
    idealDistance: { min: 5, max: 10 },
    idealSpeed: { min: 3, max: 7 }, // mm/s
    duration: 75,
  },
};

export const useWeldingSimulation = (technique: WeldingTechnique) => {
  const [state, setState] = useState<WeldingState>('idle');
  const [parameters, setParameters] = useState<WeldingParameters>(TECHNIQUE_PARAMS[technique]);
  const [currentMetrics, setCurrentMetrics] = useState<RealTimeMetrics>({
    angle: 0,
    distance: 0,
    speed: 0,
    stability: 0,
    quality: 0,
    timestamp: 0,
  });
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const metricsHistory = useRef<RealTimeMetrics[]>([]);
  const startTime = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastPosition = useRef<{ x: number; y: number; time: number } | null>(null);

  const updateParameters = useCallback((newParams: Partial<WeldingParameters>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const calculateQuality = useCallback((
    angle: number,
    distance: number,
    speed: number,
    stability: number
  ): number => {
    const params = parameters;
    
    // Ponderaciones
    const weights = {
      angle: 0.4,
      distance: 0.3,
      speed: 0.2,
      stability: 0.1,
    };

    // Calcular puntuación de ángulo (0-100)
    let angleScore = 0;
    if (angle >= params.idealAngle.min && angle <= params.idealAngle.max) {
      angleScore = 100;
    } else if (angle < params.idealAngle.min) {
      angleScore = Math.max(0, 100 * (angle / params.idealAngle.min));
    } else {
      angleScore = Math.max(0, 100 * (params.idealAngle.max / angle));
    }

    // Calcular puntuación de distancia
    let distanceScore = 0;
    if (distance >= params.idealDistance.min && distance <= params.idealDistance.max) {
      distanceScore = 100;
    } else if (distance < params.idealDistance.min) {
      distanceScore = Math.max(0, 100 * (distance / params.idealDistance.min));
    } else {
      distanceScore = Math.max(0, 100 * (params.idealDistance.max / distance));
    }

    // Calcular puntuación de velocidad
    let speedScore = 0;
    if (speed >= params.idealSpeed.min && speed <= params.idealSpeed.max) {
      speedScore = 100;
    } else if (speed < params.idealSpeed.min) {
      speedScore = Math.max(0, 100 * (speed / params.idealSpeed.min));
    } else {
      speedScore = Math.max(0, 100 * (params.idealSpeed.max / speed));
    }

    // Calcular puntuación total ponderada
    const totalScore = 
      angleScore * weights.angle +
      distanceScore * weights.distance +
      speedScore * weights.speed +
      stability * weights.stability;

    return Math.min(100, Math.max(0, totalScore));
  }, [parameters]);

  const calculateSpeed = useCallback((approachSpeed: number | null): number => {
  // Si no hay datos, devuelve 5 (valor neutro)
  return approachSpeed !== null ? Math.abs(approachSpeed) : 5;
}, []);

  const updateMetrics = useCallback((
    angle: number,
    distance: number,
    position: { x: number; y: number },
    stability: number
  ) => {
    const speed = calculateSpeed(camera.metrics.speed.approach);
    const quality = calculateQuality(angle, distance, speed, stability);
    const timestamp = Date.now();

    const newMetrics: RealTimeMetrics = {
      angle,
      distance,
      speed,
      stability,
      quality,
      timestamp,
    };

    setCurrentMetrics(newMetrics);
    metricsHistory.current.push(newMetrics);

    // Mantener solo los últimos 1000 registros
    if (metricsHistory.current.length > 1000) {
      metricsHistory.current.shift();
    }

    return newMetrics;
  }, [calculateQuality, calculateSpeed]);

  const startSimulation = useCallback(() => {
    if (state !== 'idle') return;

    setState('running');
    startTime.current = Date.now();
    metricsHistory.current = [];
    lastPosition.current = null;

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      setElapsedTime(elapsed);

      // Detener si se alcanza el tiempo máximo
      if (elapsed >= parameters.duration) {
        stopSimulation();
      }
    }, 100);
  }, [state, parameters.duration]);

  const pauseSimulation = useCallback(() => {
    if (state !== 'running') return;
    
    setState('paused');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [state]);

  const resumeSimulation = useCallback(() => {
    if (state !== 'paused') return;
    
    setState('running');
    // Reanudar temporizador
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      setElapsedTime(elapsed);

      if (elapsed >= parameters.duration) {
        stopSimulation();
      }
    }, 100);
  }, [state, parameters.duration]);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const finalResults = calculateFinalResults();
    setResults(finalResults);
    setState('completed');
    setElapsedTime(0);
  }, []);

  const calculateFinalResults = useCallback((): SimulationResult => {
    if (metricsHistory.current.length === 0) {
      return {
        technique: parameters.technique,
        duration: elapsedTime,
        metrics: [],
        score: 0,
        grade: 'F',
        feedback: ['No se registraron métricas'],
        startedAt: startTime.current,
        completedAt: Date.now(),
      };
    }

    // Calcular puntuación promedio
    const avgQuality = metricsHistory.current.reduce((sum, m) => sum + m.quality, 0) / 
                      metricsHistory.current.length;

    // Calcular tiempo en rango ideal
    const timeInRange = metricsHistory.current.filter(m => m.quality > 80).length / 
                        metricsHistory.current.length;

    // Generar feedback
    const feedback = generateFeedback(metricsHistory.current);

    // Calcular calificación
    const grade = calculateGrade(avgQuality);

    return {
      technique: parameters.technique,
      duration: elapsedTime,
      metrics: [...metricsHistory.current],
      score: Math.round(avgQuality),
      grade,
      feedback,
      startedAt: startTime.current,
      completedAt: Date.now(),
    };
  }, [parameters.technique, elapsedTime]);

  const generateFeedback = useCallback((metrics: RealTimeMetrics[]): string[] => {
    const feedback: string[] = [];
    const avgAngle = metrics.reduce((sum, m) => sum + m.angle, 0) / metrics.length;
    const avgDistance = metrics.reduce((sum, m) => sum + m.distance, 0) / metrics.length;
    const avgSpeed = metrics.reduce((sum, m) => sum + m.speed, 0) / metrics.length;

    if (avgAngle < parameters.idealAngle.min) {
      feedback.push('Ángulo demasiado cerrado. Inclina más la herramienta.');
    } else if (avgAngle > parameters.idealAngle.max) {
      feedback.push('Ángulo demasiado abierto. Reduce la inclinación.');
    }

    if (avgDistance < parameters.idealDistance.min) {
      feedback.push('Muy cerca del material. Aleja ligeramente.');
    } else if (avgDistance > parameters.idealDistance.max) {
      feedback.push('Muy lejos del material. Aproxima la herramienta.');
    }

    if (avgSpeed < parameters.idealSpeed.min) {
      feedback.push('Movimiento muy lento. Aumenta la velocidad.');
    } else if (avgSpeed > parameters.idealSpeed.max) {
      feedback.push('Movimiento muy rápido. Reduce la velocidad.');
    }

    // Agregar sugerencias específicas por técnica
    switch (parameters.technique) {
      case 'MIG':
        feedback.push('Recuerda el movimiento oscilante controlado.');
        break;
      case 'TIG':
        feedback.push('Mantén una distancia constante y movimiento lineal.');
        break;
      case 'ELECTRODE':
        feedback.push('Ajusta la distancia según el consumo del electrodo.');
        break;
    }

    return feedback;
  }, [parameters]);

  const calculateGrade = useCallback((score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }, []);

  const resetSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setState('idle');
    setCurrentMetrics({
      angle: 0,
      distance: 0,
      speed: 0,
      stability: 0,
      quality: 0,
      timestamp: 0,
    });
    setResults(null);
    setElapsedTime(0);
    metricsHistory.current = [];
    lastPosition.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    state,
    parameters,
    currentMetrics,
    elapsedTime,
    results,
    updateMetrics,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
    resetSimulation,
    updateParameters,
  };
};
