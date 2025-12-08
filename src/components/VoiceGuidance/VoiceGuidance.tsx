import React, { useEffect, useRef, useState } from 'react';

interface VoiceGuidanceProps {
  enabled: boolean;
  rate: number;
  volume: number;
  messages: {
    type: 'instruction' | 'feedback' | 'warning' | 'success';
    text: string;
    priority: number;
  }[];
  currentAngle?: number;
  currentDistance?: number;
  currentQuality?: number;
}

const VoiceGuidance: React.FC<VoiceGuidanceProps> = ({
  enabled,
  rate,
  volume,
  messages,
  currentAngle,
  currentDistance,
  currentQuality,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messageQueueRef = useRef<Array<{ text: string; priority: number }>>([]);
  const lastSpokenRef = useRef<{ type: string; timestamp: number }>({ type: '', timestamp: 0 });

  const speak = (text: string) => {
    if (!enabled || !('speechSynthesis' in window)) return;

    // Cancelar speech actual
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.max(0.5, Math.min(2, rate));
    utterance.volume = volume / 100;
    utterance.lang = 'es-ES';
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentMessage(text);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentMessage('');
      processNextMessage();
    };
    
    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
      setCurrentMessage('');
      processNextMessage();
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const addMessageToQueue = (text: string, priority: number) => {
    messageQueueRef.current.push({ text, priority });
    messageQueueRef.current.sort((a, b) => b.priority - a.priority);
    
    if (!isSpeaking) {
      processNextMessage();
    }
  };

  const processNextMessage = () => {
    if (messageQueueRef.current.length > 0 && !isSpeaking) {
      const nextMessage = messageQueueRef.current.shift();
      if (nextMessage) {
        speak(nextMessage.text);
      }
    }
  };

  // Generar feedback basado en métricas actuales
  useEffect(() => {
    if (!enabled || !currentAngle || !currentDistance) return;

    const now = Date.now();
    const timeSinceLastSpoken = now - lastSpokenRef.current.timestamp;
    const minDelay = 3000; // 3 segundos entre mensajes

    if (timeSinceLastSpoken < minDelay) return;

    let message = '';
    let priority = 1;

    // Feedback de ángulo
    if (currentAngle < 60) {
      message = 'Ángulo muy cerrado. Incrementa la inclinación.';
      priority = 3;
    } else if (currentAngle > 85) {
      message = 'Ángulo muy abierto. Reduce la inclinación.';
      priority = 3;
    } else if (currentAngle >= 70 && currentAngle <= 80) {
      message = 'Ángulo perfecto. Mantén esta posición.';
      priority = 2;
    }

    // Feedback de distancia
    if (currentDistance < 5) {
      message = message ? `${message} Demasiado cerca.` : 'Demasiado cerca del material.';
      priority = Math.max(priority, 3);
    } else if (currentDistance > 20) {
      message = message ? `${message} Demasiado lejos.` : 'Demasiado lejos del material.';
      priority = Math.max(priority, 3);
    }

    // Feedback de calidad
    if (currentQuality && currentQuality < 50) {
      message = message || 'Calidad baja. Revisa posición y movimiento.';
      priority = Math.max(priority, 4);
    } else if (currentQuality && currentQuality > 85) {
      message = message || 'Excelente trabajo. Continúa así.';
      priority = 1;
    }

    if (message && message !== lastSpokenRef.current.type) {
      addMessageToQueue(message, priority);
      lastSpokenRef.current = { type: message, timestamp: now };
    }
  }, [enabled, currentAngle, currentDistance, currentQuality]);

  // Procesar mensajes de la prop
  useEffect(() => {
    if (!enabled || messages.length === 0) return;

    const now = Date.now();
    const timeSinceLastSpoken = now - lastSpokenRef.current.timestamp;
    const minDelay = 2000; // 2 segundos entre mensajes externos

    if (timeSinceLastSpoken >= minDelay) {
      const highestPriorityMessage = messages.reduce((prev, current) => 
        prev.priority > current.priority ? prev : current
      );

      if (highestPriorityMessage.text !== lastSpokenRef.current.type) {
        addMessageToQueue(highestPriorityMessage.text, highestPriorityMessage.priority);
        lastSpokenRef.current = { 
          type: highestPriorityMessage.text, 
          timestamp: now 
        };
      }
    }
  }, [enabled, messages]);

  // Cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Componente sin UI (puede renderizar un indicador de estado si se desea)
  return null;
};

export default VoiceGuidance;
