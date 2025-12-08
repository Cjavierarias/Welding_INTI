import React, { useEffect, useRef } from 'react';

interface AudioFeedbackProps {
  angle: number;
  idealAngle: { min: number; max: number };
  quality: number;
  enabled: boolean;
}

const AudioFeedback: React.FC<AudioFeedbackProps> = ({ 
  angle, 
  idealAngle, 
  quality, 
  enabled 
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const lastQualityRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      stopSound();
      return;
    }

    initializeAudio();
    updateSound();

    return () => {
      stopSound();
    };
  }, [enabled, angle, quality]);

  const initializeAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
  };

  const updateSound = () => {
    if (!audioContextRef.current || !gainNodeRef.current || !enabled) return;

    const isInRange = angle >= idealAngle.min && angle <= idealAngle.max;
    const isClose = Math.abs(angle - (idealAngle.min + idealAngle.max) / 2) < 5;

    let frequency = 440; // Hz base (A4)
    let volume = 0.1;

    if (isInRange) {
      // Tono continuo cuando está en rango
      frequency = 440 + (quality / 100) * 220; // Sube el tono con mejor calidad
      volume = 0.15;
      
      // Agregar harmonicos para mejor feedback
      if (isClose) {
        frequency *= 1.5; // Octava más alta cuando está perfecto
        volume = 0.2;
      }
    } else {
      // Tono de alerta cuando está fuera de rango
      frequency = 220; // Ton más grave
      volume = 0.25;
      
      // Pulsación rápida para alerta
      const now = Date.now();
      const pulseRate = 10; // Hz
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.001 * 2 * Math.PI * pulseRate);
      volume *= pulse;
    }

    // Cambio brusco en calidad = sonido de error
    if (Math.abs(quality - lastQualityRef.current) > 20) {
      playErrorSound();
    }
    lastQualityRef.current = quality;

    // Crear o actualizar oscilador
    if (!oscillatorRef.current) {
      oscillatorRef.current = audioContextRef.current.createOscillator();
      oscillatorRef.current.type = 'sine';
      oscillatorRef.current.connect(gainNodeRef.current!);
      oscillatorRef.current.start();
    }

    oscillatorRef.current.frequency.setValueAtTime(
      frequency,
      audioContextRef.current.currentTime
    );

    gainNodeRef.current!.gain.setValueAtTime(
      volume,
      audioContextRef.current.currentTime
    );
  };

  const playErrorSound = () => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    // Crear oscilador para sonido de error
    const errorOscillator = audioContextRef.current.createOscillator();
    const errorGain = audioContextRef.current.createGain();
    
    errorOscillator.connect(errorGain);
    errorGain.connect(audioContextRef.current.destination);
    
    // Sonido descendente
    errorOscillator.frequency.setValueAtTime(880, audioContextRef.current.currentTime);
    errorOscillator.frequency.exponentialRampToValueAtTime(
      110,
      audioContextRef.current.currentTime + 0.5
    );
    
    // Envolvente ADSR
    errorGain.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    errorGain.gain.exponentialRampToValueAtTime(
      0.01,
      audioContextRef.current.currentTime + 0.5
    );
    
    errorOscillator.start();
    errorOscillator.stop(audioContextRef.current.currentTime + 0.5);
  };

  const stopSound = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  return null; // Componente sin UI
};

export default AudioFeedback;
