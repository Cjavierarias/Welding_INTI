export class KalmanFilter {
  private R: number; // Ruido del proceso
  private Q: number; // Ruido de medición
  private A: number; // Factor de estado
  private B: number; // Factor de control
  private C: number; // Factor de medición
  
  private cov: number;
  private x: number;
  
  constructor({
    R = 1,
    Q = 1,
    A = 1,
    B = 0,
    C = 1
  } = {}) {
    this.R = R; // Ruido del proceso
    this.Q = Q; // Ruido de medición
    this.A = A; // Factor de estado
    this.B = B; // Factor de control
    this.C = C; // Factor de medición
    
    this.cov = NaN;
    this.x = NaN; // Estimación del estado
  }
  
  filter(z: number, u = 0): number {
    if (isNaN(this.x)) {
      this.x = (1 / this.C) * z;
      this.cov = (1 / this.C) * this.Q * (1 / this.C);
    } else {
      // Predicción
      const predX = this.A * this.x + this.B * u;
      const predCov = this.A * this.cov * this.A + this.R;
      
      // Actualización de Kalman
      const K = predCov * this.C * (1 / (this.C * predCov * this.C + this.Q));
      
      this.x = predX + K * (z - this.C * predX);
      this.cov = predCov - K * this.C * predCov;
    }
    
    return this.x;
  }
  
  getCovariance(): number {
    return this.cov;
  }
  
  getEstimate(): number {
    return this.x;
  }
  
  reset(): void {
    this.cov = NaN;
    this.x = NaN;
  }
}

export class MultiDimensionalKalmanFilter {
  private F: number[][]; // Matriz de transición de estado
  private H: number[][]; // Matriz de observación
  private Q: number[][]; // Covarianza del ruido del proceso
  private R: number[][]; // Covarianza del ruido de medición
  private P: number[][]; // Covarianza del error de estimación
  private x: number[];   // Estado estimado
  
  constructor(
    stateDimension: number,
    measurementDimension: number
  ) {
    // Inicializar matrices
    this.F = this.identityMatrix(stateDimension);
    this.H = this.zerosMatrix(measurementDimension, stateDimension);
    for (let i = 0; i < Math.min(measurementDimension, stateDimension); i++) {
      this.H[i][i] = 1;
    }
    
    this.Q = this.identityMatrix(stateDimension).map(row => 
      row.map(val => val * 0.01)
    );
    
    this.R = this.identityMatrix(measurementDimension).map(row => 
      row.map(val => val * 0.1)
    );
    
    this.P = this.identityMatrix(stateDimension);
    this.x = new Array(stateDimension).fill(0);
  }
  
  predict(u: number[] = []): number[] {
    // Predicción del estado
    this.x = this.matrixMultiplyVector(this.F, this.x);
    
    if (u.length > 0) {
      this.x = this.vectorAdd(this.x, u);
    }
    
    // Predicción de la covarianza
    const F_transpose = this.transposeMatrix(this.F);
    this.P = this.matrixAdd(
      this.matrixMultiply(this.matrixMultiply(this.F, this.P), F_transpose),
      this.Q
    );
    
    return [...this.x];
  }
  
  update(z: number[]): number[] {
    // Ganancia de Kalman
    const H_transpose = this.transposeMatrix(this.H);
    const S = this.matrixAdd(
      this.matrixMultiply(this.matrixMultiply(this.H, this.P), H_transpose),
      this.R
    );
    
    const S_inv = this.inverseMatrix(S);
    const K = this.matrixMultiply(
      this.matrixMultiply(this.P, H_transpose),
      S_inv
    );
    
    // Actualización del estado
    const y = this.vectorSubtract(z, this.matrixMultiplyVector(this.H, this.x));
    this.x = this.vectorAdd(this.x, this.matrixMultiplyVector(K, y));
    
    // Actualización de la covarianza
    const I = this.identityMatrix(this.x.length);
    const KH = this.matrixMultiply(K, this.H);
    const I_KH = this.matrixSubtract(I, KH);
    this.P = this.matrixMultiply(this.matrixMultiply(I_KH, this.P), this.transposeMatrix(I_KH));
    
    // Agregar K*R*K^T para estabilidad
    const KRKt = this.matrixMultiply(
      this.matrixMultiply(K, this.R),
      this.transposeMatrix(K)
    );
    this.P = this.matrixAdd(this.P, KRKt);
    
    return [...this.x];
  }
  
  filter(z: number[], u: number[] = []): number[] {
    this.predict(u);
    return this.update(z);
  }
  
  getEstimate(): number[] {
    return [...this.x];
  }
  
  getCovariance(): number[][] {
    return this.P.map(row => [...row]);
  }
  
  reset(): void {
    const n = this.x.length;
    this.P = this.identityMatrix(n);
    this.x = new Array(n).fill(0);
  }
  
  private identityMatrix(n: number): number[][] {
    return Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
    );
  }
  
  private zerosMatrix(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () => new Array(cols).fill(0));
  }
  
  private transposeMatrix(matrix: number[][]): number[][] {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }
  
  private matrixMultiply(A: number[][], B: number[][]): number[][] {
    const result = this.zerosMatrix(A.length, B[0].length);
    for (let i = 0; i < A.length; i++) {
      for (let j = 0; j < B[0].length; j++) {
        for (let k = 0; k < A[0].length; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return result;
  }
  
  private matrixMultiplyVector(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row =>
      row.reduce((sum, val, idx) => sum + val * (vector[idx] || 0), 0)
    );
  }
  
  private matrixAdd(A: number[][], B: number[][]): number[][] {
    return A.map((row, i) => row.map((val, j) => val + (B[i]?.[j] || 0)));
  }
  
  private matrixSubtract(A: number[][], B: number[][]): number[][] {
    return A.map((row, i) => row.map((val, j) => val - (B[i]?.[j] || 0)));
  }
  
  private vectorAdd(a: number[], b: number[]): number[] {
    return a.map((val, i) => val + (b[i] || 0));
  }
  
  private vectorSubtract(a: number[], b: number[]): number[] {
    return a.map((val, i) => val - (b[i] || 0));
  }
  
  private inverseMatrix(matrix: number[][]): number[][] {
    // Implementación simplificada para matrices pequeñas
    // En producción, usar una librería numérica
    const n = matrix.length;
    if (n === 1) {
      return [[1 / matrix[0][0]]];
    }
    
    if (n === 2) {
      const [[a, b], [c, d]] = matrix;
      const det = a * d - b * c;
      if (det === 0) return this.identityMatrix(n);
      
      return [
        [d / det, -b / det],
        [-c / det, a / det]
      ];
    }
    
    // Para matrices más grandes, retornar identidad
    return this.identityMatrix(n);
  }
}

// Filtro específico para datos de sensores
export class SensorFusionFilter {
  private angleFilter: KalmanFilter;
  private distanceFilter: KalmanFilter;
  private velocityFilter: MultiDimensionalKalmanFilter;
  
  constructor() {
    this.angleFilter = new KalmanFilter({ R: 0.01, Q: 0.1 });
    this.distanceFilter = new KalmanFilter({ R: 0.05, Q: 0.2 });
    this.velocityFilter = new MultiDimensionalKalmanFilter(3, 3);
  }
  
  fuseSensorData(
    cameraData: { angle: number; distance: number },
    sensorData: { acceleration: number[]; rotation: number[] },
    timestamp: number
  ): {
    angle: number;
    distance: number;
    velocity: number[];
    stability: number;
  } {
    // Filtrar ángulo
    const filteredAngle = this.angleFilter.filter(cameraData.angle);
    
    // Filtrar distancia
    const filteredDistance = this.distanceFilter.filter(cameraData.distance);
    
    // Fusión de velocidad usando Kalman multidimensional
    const velocityEstimate = this.velocityFilter.filter(
      sensorData.acceleration,
      sensorData.rotation
    );
    
    // Calcular estabilidad basada en covarianza
    const angleVariance = this.angleFilter.getCovariance();
    const distanceVariance = this.distanceFilter.getCovariance();
    const stability = Math.max(0, 100 - 
      (Math.abs(angleVariance) * 100 + 
       Math.abs(distanceVariance) * 50)
    );
    
    return {
      angle: filteredAngle,
      distance: filteredDistance,
      velocity: velocityEstimate,
      stability
    };
  }
  
  reset(): void {
    this.angleFilter.reset();
    this.distanceFilter.reset();
    this.velocityFilter.reset();
  }
}
