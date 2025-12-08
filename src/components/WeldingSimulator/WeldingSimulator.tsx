import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  Fab,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  RestartAlt,
  Settings,
  VolumeUp,
  Vibration,
} from '@mui/icons-material';
import { useWeldingSimulation, WeldingTechnique } from '../../hooks/useWeldingSimulation';
import AudioFeedback from '../AudioFeedback/AudioFeedback';

interface WeldingSimulatorProps {
  onComplete: (data: any) => void;
  sensors: any;
  camera: any;
}

const WeldingSimulator: React.FC<WeldingSimulatorProps> = ({ onComplete, sensors, camera }) => {
  const [selectedTechnique, setSelectedTechnique] = useState<WeldingTechnique>('MIG');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const simulation = useWeldingSimulation(selectedTechnique);

  useEffect(() => {
    // Actualizar métricas basadas en datos de sensores y cámara
    const updateInterval = setInterval(() => {
      if (simulation.state === 'running' && camera.metrics && sensors.data) {
        const angle = camera.metrics.angle.pitch || 0;
        const distance = camera.metrics.distance || 0;
        const stability = (camera.metrics.stability + sensors.data.stability) / 2;
        const position = camera.markers[0]?.center || { x: 0, y: 0 };

        simulation.updateMetrics(angle, distance, position, stability);
      }
    }, 100);

    return () => clearInterval(updateInterval);
  }, [simulation.state, camera, sensors, simulation.updateMetrics]);

  useEffect(() => {
    if (simulation.state === 'completed' && simulation.results) {
      onComplete(simulation.results);
    }
  }, [simulation.state, simulation.results, onComplete]);

  const handleStart = () => {
    simulation.startSimulation();
  };

  const handlePauseResume = () => {
    if (simulation.state === 'running') {
      simulation.pauseSimulation();
    } else if (simulation.state === 'paused') {
      simulation.resumeSimulation();
    }
  };

  const handleStop = () => {
    simulation.stopSimulation();
  };

  const handleReset = () => {
    simulation.resetSimulation();
  };

  const getAngleColor = (angle: number) => {
    const { min, max } = simulation.parameters.idealAngle;
    if (angle >= min && angle <= max) return '#4caf50';
    if (angle >= min - 10 && angle <= max + 10) return '#ff9800';
    return '#f44336';
  };

  const getDistanceColor = (distance: number) => {
    const { min, max } = simulation.parameters.idealDistance;
    if (distance >= min && distance <= max) return '#4caf50';
    if (distance >= min - 3 && distance <= max + 3) return '#ff9800';
    return '#f44336';
  };

  const getProgressPercentage = () => {
    return (simulation.elapsedTime / simulation.parameters.duration) * 100;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2, height: '100%' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Panel izquierdo - Cámara y métricas */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                Simulador de Soldadura - {selectedTechnique}
              </Typography>
              <Box>
                <IconButton onClick={() => setAudioEnabled(!audioEnabled)}>
                  <VolumeUp color={audioEnabled ? 'primary' : 'disabled'} />
                </IconButton>
                <IconButton onClick={() => setVibrationEnabled(!vibrationEnabled)}>
                  <Vibration color={vibrationEnabled ? 'primary' : 'disabled'} />
                </IconButton>
                <IconButton onClick={() => setShowSettings(!showSettings)}>
                  <Settings />
                </IconButton>
              </Box>
            </Box>

            {/* Vista de cámara */}
            <Box sx={{ flex: 1, position: 'relative', mb: 2 }}>
              <Box
                component="video"
                ref={camera.videoRef}
                autoPlay
                playsInline
                muted
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 2,
                  backgroundColor: '#000',
                }}
              />
              
              {/* Overlay AR */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                }}
              >
                {/* Indicador de ángulo */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 200,
                    height: 200,
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: 4,
                      height: 100,
                      backgroundColor: getAngleColor(simulation.currentMetrics.angle),
                      transformOrigin: 'top center',
                      transform: `translateX(-50%) rotate(${simulation.currentMetrics.angle || 0}deg)`,
                    }}
                  />
                </Box>

                {/* Indicador de distancia */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 300,
                    height: 10,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: 5,
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${Math.min(100, (simulation.currentMetrics.distance / 30) * 100)}%`,
                      width: 20,
                      height: 20,
                      backgroundColor: getDistanceColor(simulation.currentMetrics.distance),
                      borderRadius: '50%',
                      top: -5,
                      transform: 'translateX(-50%)',
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Métricas en tiempo real */}
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography color="textSecondary" variant="caption">
                      Ángulo
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ color: getAngleColor(simulation.currentMetrics.angle) }}
                    >
                      {simulation.currentMetrics.angle.toFixed(1)}°
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Ideal: {simulation.parameters.idealAngle.min}°-{simulation.parameters.idealAngle.max}°
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography color="textSecondary" variant="caption">
                      Distancia
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ color: getDistanceColor(simulation.currentMetrics.distance) }}
                    >
                      {simulation.currentMetrics.distance.toFixed(1)}mm
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Ideal: {simulation.parameters.idealDistance.min}-{simulation.parameters.idealDistance.max}mm
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography color="textSecondary" variant="caption">
                      Velocidad
                    </Typography>
                    <Typography variant="h6">
                      {simulation.currentMetrics.speed.toFixed(1)}mm/s
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Ideal: {simulation.parameters.idealSpeed.min}-{simulation.parameters.idealSpeed.max}mm/s
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography color="textSecondary" variant="caption">
                      Calidad
                    </Typography>
                    <Typography variant="h6">
                      {simulation.currentMetrics.quality.toFixed(0)}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={simulation.currentMetrics.quality}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Panel derecho - Controles y configuración */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Selección de técnica */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Técnica de Soldadura</InputLabel>
              <Select
                value={selectedTechnique}
                label="Técnica de Soldadura"
                onChange={(e) => setSelectedTechnique(e.target.value as WeldingTechnique)}
                disabled={simulation.state !== 'idle'}
              >
                <MenuItem value="MIG">MIG/MAG</MenuItem>
                <MenuItem value="TIG">TIG</MenuItem>
                <MenuItem value="ELECTRODE">Electrodo</MenuItem>
              </Select>
            </FormControl>

            {/* Información de la técnica */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Parámetros ideales
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    • Ángulo: {simulation.parameters.idealAngle.min}° - {simulation.parameters.idealAngle.max}°
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    • Distancia: {simulation.parameters.idealDistance.min}mm - {simulation.parameters.idealDistance.max}mm
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    • Velocidad: {simulation.parameters.idealSpeed.min}mm/s - {simulation.parameters.idealSpeed.max}mm/s
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    • Duración: {simulation.parameters.duration} segundos
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Configuración avanzada */}
            {showSettings && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configuración avanzada
                  </Typography>
                  
                  <Typography gutterBottom sx={{ mt: 2 }}>
                    Ángulo ideal
                  </Typography>
                  <Slider
                    value={[simulation.parameters.idealAngle.min, simulation.parameters.idealAngle.max]}
                    onChange={(_, newValue) => {
                      const [min, max] = newValue as number[];
                      simulation.updateParameters({
                        idealAngle: { min, max }
                      });
                    }}
                    valueLabelDisplay="auto"
                    min={30}
                    max={90}
                    disabled={simulation.state !== 'idle'}
                  />

                  <Typography gutterBottom sx={{ mt: 2 }}>
                    Distancia ideal (mm)
                  </Typography>
                  <Slider
                    value={[simulation.parameters.idealDistance.min, simulation.parameters.idealDistance.max]}
                    onChange={(_, newValue) => {
                      const [min, max] = newValue as number[];
                      simulation.updateParameters({
                        idealDistance: { min, max }
                      });
                    }}
                    valueLabelDisplay="auto"
                    min={1}
                    max={30}
                    disabled={simulation.state !== 'idle'}
                  />
                </CardContent>
              </Card>
            )}

            {/* Controles de simulación */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {simulation.state === 'idle' && 'Listo para comenzar'}
                  {simulation.state === 'running' && 'Simulación en progreso'}
                  {simulation.state === 'paused' && 'Simulación en pausa'}
                  {simulation.state === 'completed' && 'Simulación completada'}
                </Typography>
                
                <Typography variant="h3" color="primary">
                  {Math.floor(simulation.elapsedTime)}s
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={getProgressPercentage()}
                  sx={{ mt: 2 }}
                />
                <Typography variant="caption" color="textSecondary">
                  {Math.floor(simulation.elapsedTime)} / {simulation.parameters.duration} segundos
                </Typography>
              </Box>

              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <Fab
                    color="primary"
                    onClick={handleStart}
                    disabled={simulation.state !== 'idle'}
                  >
                    <PlayArrow />
                  </Fab>
                </Grid>
                
                <Grid item>
                  <Fab
                    color="secondary"
                    onClick={handlePauseResume}
                    disabled={simulation.state === 'idle' || simulation.state === 'completed'}
                  >
                    {simulation.state === 'running' ? <Pause /> : <PlayArrow />}
                  </Fab>
                </Grid>
                
                <Grid item>
                  <Fab
                    color="error"
                    onClick={handleStop}
                    disabled={simulation.state !== 'running' && simulation.state !== 'paused'}
                  >
                    <Stop />
                  </Fab>
                </Grid>
                
                <Grid item>
                  <Fab
                    onClick={handleReset}
                    disabled={simulation.state === 'idle'}
                  >
                    <RestartAlt />
                  </Fab>
                </Grid>
              </Grid>

              {/* Estado de sensores */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Estado del sistema:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label="Sensores" 
                    size="small"
                    color={sensors.isActive ? "success" : "error"}
                  />
                  <Chip 
                    label="Cámara" 
                    size="small"
                    color={camera.isActive ? "success" : "error"}
                  />
                  <Chip 
                    label="Patrón AR" 
                    size="small"
                    color={camera.markers.length > 0 ? "success" : "error"}
                  />
                  <Chip 
                    label="Estabilidad" 
                    size="small"
                    color={simulation.currentMetrics.stability > 70 ? "success" : "warning"}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Feedback de audio */}
      {audioEnabled && (
        <AudioFeedback
          angle={simulation.currentMetrics.angle}
          idealAngle={simulation.parameters.idealAngle}
          quality={simulation.currentMetrics.quality}
          enabled={audioEnabled && simulation.state === 'running'}
        />
      )}
    </Container>
  );
};

export default WeldingSimulator;
