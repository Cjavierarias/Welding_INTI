import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Paper,
  IconButton,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Close,
  ArrowBack,
  ArrowForward,
  CameraAlt,
  Sensors,
  School,
  Assessment,
  VolumeUp,
  Vibration,
} from '@mui/icons-material';

interface OnboardingGuideProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const steps = [
  {
    title: 'Bienvenido al Simulador',
    description: 'Una herramienta interactiva para practicar técnicas de soldadura',
    icon: <School />,
    content: (
      <Box>
        <Typography variant="body1" paragraph>
          Este simulador utiliza realidad aumentada y sensores de tu dispositivo para 
          proporcionar una experiencia de práctica realista.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Podrás practicar tres técnicas principales de soldadura con feedback en tiempo real.
        </Typography>
      </Box>
    ),
  },
  {
    title: 'Configuración de Sensores',
    description: 'Permisos necesarios para una experiencia óptima',
    icon: <Sensors />,
    content: (
      <Box>
        <Typography variant="body1" paragraph>
          La aplicación necesita acceso a:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  <Sensors sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Sensores del dispositivo
                </Typography>
                <Typography variant="body2">
                  Acelerómetro, giroscopio y magnetómetro para medir movimientos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  <CameraAlt sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Cámara
                </Typography>
                <Typography variant="body2">
                  Para seguimiento del patrón AR y realidad aumentada
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    ),
  },
  {
    title: 'Patrón AR',
    description: 'Prepara tu espacio de práctica',
    icon: <CameraAlt />,
    content: (
      <Box>
        <Typography variant="body1" paragraph>
          Para el seguimiento preciso, necesitarás:
        </Typography>
        <Box component="ol" sx={{ pl: 2 }}>
          <li>
            <Typography variant="body2">
              <strong>Imprimir el patrón AR</strong> (disponible para descargar)
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Colocarlo en una superficie plana</strong> a la altura de trabajo
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Buena iluminación</strong> para una detección óptima
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Espacio suficiente</strong> para moverse cómodamente
            </Typography>
          </li>
        </Box>
        <Paper 
          variant="outlined" 
          sx={{ 
            mt: 2, 
            p: 2, 
            textAlign: 'center',
            borderStyle: 'dashed',
          }}
        >
          <Typography variant="caption" color="textSecondary">
            Área para visualizar patrón AR
          </Typography>
        </Paper>
      </Box>
    ),
  },
  {
    title: 'Feedback Multisensorial',
    description: 'Cómo recibirás información durante la práctica',
    icon: <VolumeUp />,
    content: (
      <Box>
        <Typography variant="body1" paragraph>
          Recibirás feedback a través de múltiples canales:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <VolumeUp sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle2">Audio</Typography>
              <Typography variant="body2" color="textSecondary">
                Tono continuo cuando estás en el rango ideal
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Vibration sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle2">Vibración</Typography>
              <Typography variant="body2" color="textSecondary">
                Alertas hápticas para correcciones importantes
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ textAlign: 'center', p: 2 }}>
              <Assessment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle2">Visual</Typography>
              <Typography variant="body2" color="textSecondary">
                Indicadores en tiempo real en la pantalla
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    ),
  },
  {
    title: 'Listo para Comenzar',
    description: 'Últimos consejos antes de empezar',
    icon: <Assessment />,
    content: (
      <Box>
        <Typography variant="body1" paragraph>
          Consejos para una práctica exitosa:
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li>
            <Typography variant="body2">
              <strong>Mantén el dispositivo estable</strong> durante la calibración
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Sigue los rangos ideales</strong> mostrados en pantalla
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Practica movimientos suaves</strong> y controlados
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Revisa tus resultados</strong> después de cada sesión
            </Typography>
          </li>
        </Box>
        <Paper
          variant="outlined"
          sx={{
            mt: 3,
            p: 3,
            backgroundColor: 'rgba(33, 150, 243, 0.05)',
            borderColor: 'primary.main',
          }}
        >
          <Typography variant="body2" color="primary">
            <strong>Recordatorio:</strong> Esta es una herramienta de práctica. 
            Las técnicas aprendidas deben complementarse con supervisión profesional 
            en entornos de trabajo real.
          </Typography>
        </Paper>
      </Box>
    ),
  },
];

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ open, onClose, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onComplete();
      onClose();
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {steps[activeStep].icon}
            <Typography variant="h6">{steps[activeStep].title}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
        <Typography variant="body2" color="textSecondary">
          {steps[activeStep].description}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>{step.title}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 300 }}>
          {steps[activeStep].content}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleSkip}
          color="inherit"
        >
          Saltar tutorial
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Atrás
          </Button>
        )}
        
        <Button
          onClick={handleNext}
          variant="contained"
          endIcon={activeStep === steps.length - 1 ? null : <ArrowForward />}
        >
          {activeStep === steps.length - 1 ? 'Comenzar práctica' : 'Siguiente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingGuide;
