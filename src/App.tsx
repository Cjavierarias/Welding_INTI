import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import SensorCalibration from './components/SensorCalibration/SensorCalibration';
import WeldingSimulator from './components/WeldingSimulator/WeldingSimulator';
import ResultsDashboard from './components/ResultsDashboard/ResultsDashboard';
import CertificateGenerator from './components/CertificateGenerator/CertificateGenerator';
import { useSensors } from './hooks/useSensors';
import { useCameraAR } from './hooks/useCameraAR';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#ff9800',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

type AppState = 'calibration' | 'simulation' | 'results' | 'certificate';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('calibration');
  const [weldingData, setWeldingData] = useState<any>(null);
  const sensors = useSensors();
  const camera = useCameraAR();

  useEffect(() => {
    // Registrar service worker para PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
      });
    }
  }, []);

  const handleCalibrationComplete = () => {
    setCurrentState('simulation');
  };

  const handleSimulationComplete = (data: any) => {
    setWeldingData(data);
    setCurrentState('results');
  };

  const handleGenerateCertificate = () => {
    setCurrentState('certificate');
  };

  const handleBackToResults = () => {
    setCurrentState('results');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {currentState === 'calibration' && (
          <SensorCalibration
            onComplete={handleCalibrationComplete}
            sensors={sensors}
            camera={camera}
          />
        )}
        {currentState === 'simulation' && (
          <WeldingSimulator
            onComplete={handleSimulationComplete}
            sensors={sensors}
            camera={camera}
          />
        )}
        {currentState === 'results' && weldingData && (
          <ResultsDashboard
            data={weldingData}
            onGenerateCertificate={handleGenerateCertificate}
            onRestart={() => setCurrentState('calibration')}
          />
        )}
        {currentState === 'certificate' && weldingData && (
          <CertificateGenerator
            data={weldingData}
            onBack={handleBackToResults}
          />
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
