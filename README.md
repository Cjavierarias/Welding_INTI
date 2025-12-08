# Welding_INTI
# Simulador de Soldadura AR

Una aplicación web progresiva (PWA) para simulación de técnicas de soldadura utilizando realidad aumentada y sensores del dispositivo.

## 🚀 Características

### Técnicas de Soldadura Soportadas
- **MIG/MAG**: Movimiento oscilante controlado
- **TIG**: Movimiento lineal preciso
- **Electrodo**: Movimiento con arrastre

### Tecnologías Utilizadas
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Material-UI con componentes personalizados
- **AR Tracking**: jsQR + patrón personalizado
- **Sensores**: DeviceMotion y DeviceOrientation APIs
- **Gráficos**: Chart.js + Recharts
- **Audio**: Web Audio API para feedback
- **Almacenamiento**: IndexedDB + Service Worker

### Funcionalidades Principales
1. **Seguimiento AR en tiempo real** con patrón 4x4
2. **Feedback multisensorial** (audio, vibración, visual)
3. **Evaluación automática** basada en parámetros ideales
4. **Generación de certificados** personalizables
5. **Modo demostración** sin hardware requerido
6. **Accesibilidad completa** (alto contraste, guía por voz)

## 📦 Instalación y Desarrollo

### Requisitos Previos
- Node.js 18 o superior
- npm 9 o superior

### Instalación Local
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/welding-simulator.git
cd welding-simulator

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview
