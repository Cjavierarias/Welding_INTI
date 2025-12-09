Crea una webapp progresiva (PWA) para simulación de técnicas de soldadura (MIG, TIG, Electrodo) con las siguientes características:

TECNOLOGÍAS:
- Frontend: React 18 con TypeScript y Vite
- UI: Material-UI con componentes personalizados
- Sensores: API DeviceMotion y DeviceOrientation
- Cámara: MediaDevices API para AR markers
- Gráficos: Chart.js para visualización de resultados
- Sonido: Web Audio API para feedback auditivo
- Almacenamiento: IndexedDB para historial de prácticas

ESTRUCTURA DEL PROYECTO:
/
├── src/
│   ├── components/
│   │   ├── SensorCalibration/
│   │   ├── WeldingSimulator/
│   │   ├── ResultsDashboard/
│   │   └── CertificateGenerator/
│   ├── hooks/
│   │   ├── useSensors.ts
│   │   ├── useCameraAR.ts
│   │   └── useWeldingSimulation.ts
│   ├── utils/
│   │   ├── patternRecognition.ts
│   │   ├── weldingCalculations.ts
│   │   └── certificateUtils.ts
│   ├── styles/
│   └── assets/ (patrones AR, sonidos, etc.)

REQUISITOS MÓVIL:
- Compatible con Chrome Android
- Usa servicio worker para offline
- Diseño responsive mobile-first
- Acceso a sensores y cámara  
