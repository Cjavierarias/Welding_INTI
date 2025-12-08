import React, { useEffect, useCallback } from 'react';

interface HapticFeedbackProps {
  enabled: boolean;
  vibrationType: 'success' | 'warning' | 'error' | 'pulse' | 'none';
  intensity: number; // 0-100
  pattern?: number[];
  onVibrate?: () => void;
}

const HapticFeedback: React.FC<HapticFeedbackProps> = ({
  enabled,
  vibrationType,
  intensity,
  pattern,
  onVibrate,
}) => {
  const isVibrationSupported = 'vibrate' in navigator;

  const getVibrationPattern = useCallback((type: string, customIntensity: number): number[] => {
    const intensityFactor = customIntensity / 100;
    
    switch (type) {
      case 'success':
        return [100 * intensityFactor, 50, 100 * intensityFactor];
      case 'warning':
        return [150 * intensityFactor, 100, 150 * intensityFactor, 100, 150 * intensityFactor];
      case 'error':
        return [200 * intensityFactor, 50, 200 * intensityFactor, 50, 200 * intensityFactor];
      case 'pulse':
        return [50 * intensityFactor, 100, 50 * intensityFactor, 100, 50 * intensityFactor];
      default:
        return pattern || [100 * intensityFactor];
    }
  }, [pattern]);

  const triggerVibration = useCallback(() => {
    if (!enabled || !isVibrationSupported || vibrationType === 'none') {
      return;
    }

    try {
      const pattern = getVibrationPattern(vibrationType, intensity);
      navigator.vibrate(pattern);
      
      if (onVibrate) {
        onVibrate();
      }
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }, [enabled, isVibrationSupported, vibrationType, intensity, getVibrationPattern, onVibrate]);

  useEffect(() => {
    triggerVibration();
  }, [vibrationType, intensity, triggerVibration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isVibrationSupported) {
        navigator.vibrate(0);
      }
    };
  }, [isVibrationSupported]);

  // Component doesn't render anything
  return null;
};

export default HapticFeedback;
