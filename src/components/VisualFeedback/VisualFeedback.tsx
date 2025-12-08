import React from 'react';
import { Box, Typography } from '@mui/material';

interface VisualFeedbackProps {
  angle: number;
  idealAngle: { min: number; max: number };
  distance: number;
  idealDistance: { min: number; max: number };
  quality: number;
  stability: number;
}

const VisualFeedback: React.FC<VisualFeedbackProps> = ({
  angle,
  idealAngle,
  distance,
  idealDistance,
  quality,
  stability,
}) => {
  const getAngleColor = () => {
    if (angle >= idealAngle.min && angle <= idealAngle.max) return '#4caf50';
    if (angle >= idealAngle.min - 10 && angle <= idealAngle.max + 10) return '#ff9800';
    return '#f44336';
  };

  const getDistanceColor = () => {
    if (distance >= idealDistance.min && distance <= idealDistance.max) return '#4caf50';
    if (distance >= idealDistance.min - 3 && distance <= idealDistance.max + 3) return '#ff9800';
    return '#f44336';
  };

  const getQualityColor = () => {
    if (quality >= 80) return '#4caf50';
    if (quality >= 60) return '#ff9800';
    return '#f44336';
  };

  const getStabilityColor = () => {
    if (stability >= 80) return '#4caf50';
    if (stability >= 60) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        padding: 2,
        minWidth: 300,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 2, color: '#fff' }}>
        Feedback Visual
      </Typography>

      {/* Indicador de Ángulo */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#ccc' }}>
            Ángulo: {angle.toFixed(1)}°
          </Typography>
          <Typography variant="caption" sx={{ color: '#ccc' }}>
            Ideal: {idealAngle.min}°-{idealAngle.max}°
          </Typography>
        </Box>
        <Box
          sx={{
            height: 8,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: `${((idealAngle.min - 30) / 60) * 100}%`,
              right: `${100 - ((idealAngle.max - 30) / 60) * 100}%`,
              height: '100%',
              background: 'rgba(76, 175, 80, 0.3)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: `${((angle - 30) / 60) * 100}%`,
              width: 3,
              height: '100%',
              background: getAngleColor(),
              transform: 'translateX(-50%)',
            }}
          />
        </Box>
      </Box>

      {/* Indicador de Distancia */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#ccc' }}>
            Distancia: {distance.toFixed(1)}mm
          </Typography>
          <Typography variant="caption" sx={{ color: '#ccc' }}>
            Ideal: {idealDistance.min}-{idealDistance.max}mm
          </Typography>
        </Box>
        <Box
          sx={{
            height: 8,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: `${(idealDistance.min / 30) * 100}%`,
              right: `${100 - (idealDistance.max / 30) * 100}%`,
              height: '100%',
              background: 'rgba(76, 175, 80, 0.3)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: `${(distance / 30) * 100}%`,
              width: 3,
              height: '100%',
              background: getDistanceColor(),
              transform: 'translateX(-50%)',
            }}
          />
        </Box>
      </Box>

      {/* Indicador de Calidad */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: '#ccc', mb: 0.5, display: 'block' }}>
          Calidad: {quality.toFixed(0)}%
        </Typography>
        <Box
          sx={{
            height: 8,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: `${quality}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${getQualityColor()} 0%, ${getQualityColor()}80 100%)`,
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }}
          />
        </Box>
      </Box>

      {/* Indicador de Estabilidad */}
      <Box>
        <Typography variant="caption" sx={{ color: '#ccc', mb: 0.5, display: 'block' }}>
          Estabilidad: {stability.toFixed(0)}%
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              flex: 1,
              height: 8,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${stability}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${getStabilityColor()} 0%, ${getStabilityColor()}80 100%)`,
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: getStabilityColor(),
              animation: stability >= 70 ? 'pulse 2s infinite' : 'none',
              opacity: stability >= 70 ? 0.7 : 1,
            }}
          />
        </Box>
      </Box>

      {/* Indicadores de estado */}
      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: getAngleColor(),
              animation: angle >= idealAngle.min && angle <= idealAngle.max ? 'pulse 1s infinite' : 'none',
            }}
          />
          <Typography variant="caption" sx={{ color: '#ccc' }}>
            Ángulo
          </Typography>
        </Box>
        
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: getDistanceColor(),
              animation: distance >= idealDistance.min && distance <= idealDistance.max ? 'pulse 1s infinite' : 'none',
            }}
          />
          <Typography variant="caption" sx={{ color: '#ccc' }}>
            Distancia
          </Typography>
        </Box>
        
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: getQualityColor(),
              animation: quality >= 80 ? 'pulse 1.5s infinite' : 'none',
            }}
          />
          <Typography variant="caption" sx={{ color: '#ccc' }}>
            Calidad
          </Typography>
        </Box>
      </Box>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px currentColor; }
          50% { box-shadow: 0 0 20px currentColor; }
        }
      `}</style>
    </Box>
  );
};

export default VisualFeedback;
