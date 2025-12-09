import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Slider,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { Settings, PlayArrow, Pause, Refresh } from '@mui/icons-material';

interface DemoModeProps {
  open: boolean;
  onClose: () => void;
  onDataChange: (data: any) => void;
}

const DemoMode: React.FC<DemoModeProps> = ({ open, onClose, onDataChange }) => {
  const [isActive, setIsActive] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [angleRange, setAngleRange] = useState([60, 80]);
  const [distanceRange, setDistanceRange] = useState([5, 15]);
  const [stabilityLevel, setStabilityLevel] = useState(70);
  const [demoInterval, setDemoInterval] = useState<NodeJS.Timeout | null>(null);

  const startDemo = () => {
    if (demoInterval) {
      clearInterval(demoInterval);
    }

    setIsActive(true);
    
    const interval = setInterval(() => {
      generateDemoData();
    }, 1000 / simulationSpeed);
    
    setDemoInterval(interval);
  };

  const stopDemo = () => {
    if (demoInterval) {
      clearInterval(demoInterval);
      setDemoInterval(null);
    }
    setIsActive(false);
  };

  const generateDemoData = () => {
    // Generar datos de demostración realistas
    const time = Date.now();
    const baseAngle = 70;
    const angleVariation = Math.sin(time / 1000) * 10;
    const currentAngle = Math.max(angleRange[0], Math.min(angleRange[1], baseAngle + angleVariation));
    
    const baseDistance = 10;
    const distanceVariation = Math.cos(time / 800) * 5;
    const currentDistance = Math.max(distanceRange[0], Math.min(distanceRange[1], baseDistance + distanceVariation));
    
    const stabilityVariation = (Math.random() - 0.5) * (100 - stabilityLevel);
    const currentStability = Math.max(0, Math.min(100, stabilityLevel + stabilityVariation));
    
    const quality = calculateQuality(currentAngle, currentDistance, currentStability);
    
    const demoData = {
      angle: currentAngle,
      distance: currentDistance,
      speed: 5 + Math.random() * 3,
      stability: currentStability,
      quality,
      timestamp: time,
      
      metrics: {
      distance: currentDistance,
      angle: { pitch: currentAngle, yaw: 0, roll: 0 },
      speed: { approach: 2, lateral: 0 },
      stability: currentStability,
      }
        
      markers: [{
        id: 1,
        corners: [
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          { x: 200, y: 200 },
          { x: 100, y: 200 }
        ],
        center: { x: 150, y: 150 },
        size: 100,
        detected: true
      }]
      
    };
    
    onDataChange(demoData);
  };

  const calculateQuality = (angle: number, distance: number, stability: number): number => {
    const angleScore = Math.max(0, 100 - Math.abs(angle - 70) * 5);
    const distanceScore = Math.max(0, 100 - Math.abs(distance - 10) * 10);
    const stabilityScore = stability;
    
    return (angleScore * 0.4 + distanceScore * 0.3 + stabilityScore * 0.3);
  };

  const handleSpeedChange = (event: Event, newValue: number | number[]) => {
    setSimulationSpeed(newValue as number);
    
    if (isActive) {
      stopDemo();
      startDemo();
    }
  };

  const resetDemo = () => {
    stopDemo();
    setSimulationSpeed(1);
    setAngleRange([60, 80]);
    setDistanceRange([5, 15]);
    setStabilityLevel(70);
  };

  React.useEffect(() => {
    return () => {
      if (demoInterval) {
        clearInterval(demoInterval);
      }
    };
  }, [demoInterval]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings />
          <Typography variant="h6">Modo Demostración</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Estado y controles */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    Estado: {isActive ? 'Activo' : 'Inactivo'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {isActive ? (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Pause />}
                        onClick={stopDemo}
                        size="small"
                      >
                        Pausar
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<PlayArrow />}
                        onClick={startDemo}
                        size="small"
                      >
                        Iniciar
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={resetDemo}
                      size="small"
                    >
                      Reiniciar
                    </Button>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Velocidad de simulación
                </Typography>
                <Slider
                  value={simulationSpeed}
                  onChange={handleSpeedChange}
                  min={0.1}
                  max={5}
                  step={0.1}
                  marks={[
                    { value: 0.5, label: 'Lento' },
                    { value: 1, label: 'Normal' },
                    { value: 3, label: 'Rápido' },
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value.toFixed(1)}x`}
                  disabled={isActive}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Parámetros de simulación */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Rango de Ángulo
                </Typography>
                <Slider
                  value={angleRange}
                  onChange={(_, newValue) => setAngleRange(newValue as number[])}
                  valueLabelDisplay="auto"
                  min={30}
                  max={90}
                  disabled={isActive}
                />
                <Typography variant="caption" color="textSecondary">
                  {angleRange[0]}° - {angleRange[1]}°
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Rango de Distancia
                </Typography>
                <Slider
                  value={distanceRange}
                  onChange={(_, newValue) => setDistanceRange(newValue as number[])}
                  valueLabelDisplay="auto"
                  min={1}
                  max={30}
                  disabled={isActive}
                />
                <Typography variant="caption" color="textSecondary">
                  {distanceRange[0]}mm - {distanceRange[1]}mm
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Nivel de Estabilidad
                </Typography>
                <Slider
                  value={stabilityLevel}
                  onChange={(_, newValue) => setStabilityLevel(newValue as number)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                  marks={[
                    { value: 0, label: 'Inestable' },
                    { value: 50, label: 'Moderado' },
                    { value: 100, label: 'Perfecto' },
                  ]}
                  disabled={isActive}
                />
                <Typography variant="caption" color="textSecondary">
                  {stabilityLevel}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Información */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ backgroundColor: 'rgba(33, 150, 243, 0.05)' }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  Información del Modo Demo
                </Typography>
                <Typography variant="body2" paragraph>
                  Este modo genera datos simulados para permitirte explorar todas las 
                  funcionalidades de la aplicación sin necesidad de sensores físicos.
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Los datos se generan usando patrones sinusoidales con variaciones 
                  controladas para simular movimientos realistas de soldadura.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cerrar
        </Button>
        <FormControlLabel
          control={
            <Switch
              checked={isActive}
              onChange={(e) => e.target.checked ? startDemo() : stopDemo()}
            />
          }
          label="Modo Demo Activo"
        />
      </DialogActions>
    </Dialog>
  );
};

export default DemoMode;
