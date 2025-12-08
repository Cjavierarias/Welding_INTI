import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Grid,
} from '@mui/material';

interface SensorCalibrationProps {
  onComplete: () => void;
  sensors: any;
  camera: any;
}

const steps = [
  'Permisos del dispositivo',
  'Calibración de sensores',
  'Colocación del patrón AR',
  'Verificación final',
];

const SensorCalibration: React.FC<SensorCalibrationProps> = ({ 
  onComplete, 
  sensors, 
  camera 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [calibrationData, setCalibrationData] = useState({
    sensorsReady: false,
    cameraReady: false,
    patternDetected: false,
    calibrationComplete: false,
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Iniciar calibración automáticamente
    if (activeStep === 0) {
      handleRequestPermissions();
    } else if (activeStep === 1) {
      handleSensorCalibration();
    } else if (activeStep === 2) {
      handlePatternDetection();
    } else if (activeStep === 3) {
      handleFinalVerification();
    }
  }, [activeStep]);

  const handleRequestPermissions = async () => {
    try {
      const sensorSuccess = await sensors.startSensors();
      const cameraSuccess = await camera.startCamera();
      
      if (sensorSuccess && cameraSuccess) {
        setCalibrationData(prev => ({ ...prev, sensorsReady: true, cameraReady: true }));
        setTimeout(() => setActiveStep(1), 1500);
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const handleSensorCalibration = () => {
    // Simular calibración
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCalibrationData(prev => ({ ...prev, calibrationComplete: true }));
          setTimeout(() => setActiveStep(2), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handlePatternDetection = () => {
    // Verificar detección de patrón
    const checkPattern = setInterval(() => {
      if (camera.markers.length > 0) {
        setCalibrationData(prev => ({ ...prev, patternDetected: true }));
        clearInterval(checkPattern);
        setTimeout(() => setActiveStep(3), 1500);
      }
    }, 500);
  };

  const handleFinalVerification = () => {
    // Verificación final
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Permisos requeridos
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Esta aplicación necesita acceso a:
            </Typography>
            <Box sx={{ my: 3 }}>
              <Chip 
                label="Sensores del dispositivo" 
                color={calibrationData.sensorsReady ? "success" : "default"}
                sx={{ m: 1 }}
              />
              <Chip 
                label="Cámara" 
                color={calibrationData.cameraReady ? "success" : "default"}
                sx={{ m: 1 }}
              />
            </Box>
            <Button 
              variant="contained" 
              onClick={handleRequestPermissions}
              disabled={calibrationData.sensorsReady && calibrationData.cameraReady}
            >
              Solicitar permisos
            </Button>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Calibrando sensores
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Mantén el dispositivo estable sobre una superficie plana
            </Typography>
            <Box sx={{ my: 4 }}>
              <CircularProgress 
                variant="determinate" 
                value={progress} 
                size={120}
                thickness={2}
              />
              <Typography variant="h6" sx={{ mt: 2 }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ my: 2 }}
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Coloca el patrón AR
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Apunta la cámara hacia el patrón de calibración
            </Typography>
            <Box sx={{ my: 4 }}>
              <Paper 
                sx={{ 
                  width: 200, 
                  height: 200, 
                  mx: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: calibrationData.patternDetected ? 'success.main' : 'text.secondary',
                }}
              >
                {calibrationData.patternDetected ? (
                  <Typography color="success.main" variant="h4">
                    ✓
                  </Typography>
                ) : (
                  <Typography variant="body1">
                    Patrón AR
                  </Typography>
                )}
              </Paper>
            </Box>
            <Alert severity="info" sx={{ mt: 2 }}>
              El patrón debe estar bien iluminado y ocupar al menos el 30% de la pantalla
            </Alert>
          </Box>
        );
      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Verificación final
            </Typography>
            <Box sx={{ my: 4 }}>
              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <Paper sx={{ p: 2, minWidth: 150 }}>
                    <Typography variant="caption">Sensores</Typography>
                    <Typography variant="h6" color="success.main">
                      ✓ Listo
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item>
                  <Paper sx={{ p: 2, minWidth: 150 }}>
                    <Typography variant="caption">Cámara</Typography>
                    <Typography variant="h6" color="success.main">
                      ✓ Listo
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item>
                  <Paper sx={{ p: 2, minWidth: 150 }}>
                    <Typography variant="caption">Patrón AR</Typography>
                    <Typography variant="h6" color="success.main">
                      ✓ Detectado
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ my: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Completando calibración...
              </Typography>
            </Box>
          </Box>
        );
      default:
        return 'Paso desconocido';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, height: '100%' }}>
      <Paper sx={{ p: 3, height: '100%', overflow: 'auto' }}>
        <Typography variant="h4" align="center" gutterBottom>
          Calibración del Sistema
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ my: 4 }}>
          {getStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep(activeStep - 1)}
          >
            Atrás
          </Button>
          <Button
            variant="contained"
            onClick={() => setActiveStep(activeStep + 1)}
            disabled={activeStep === steps.length - 1}
          >
            Siguiente
          </Button>
        </Box>

        {sensors.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error en sensores: {sensors.error}
          </Alert>
        )}
        
        {camera.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error en cámara: {camera.error}
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default SensorCalibration;
