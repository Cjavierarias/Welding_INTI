import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Slider,
  Typography,
  Box,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  IconButton,
} from '@mui/material';
import {
  SettingsAccessibility,
  VolumeUp,
  Vibration,
  Contrast,
  TextFields,
  KeyboardVoice,
  Close,
} from '@mui/icons-material';

interface AccessibilitySettingsProps {
  open: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onSettingsChange: (settings: AccessibilitySettings) => void;
}

export interface AccessibilitySettings {
  // Sonido
  audioEnabled: boolean;
  audioVolume: number;
  audioFeedbackType: 'continuous' | 'discrete' | 'minimal';
  
  // Vibración
  hapticEnabled: boolean;
  hapticIntensity: number;
  
  // Visual
  highContrast: boolean;
  fontSize: number;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  
  // Voice
  voiceGuidance: boolean;
  voiceRate: number;
  voiceVolume: number;
  
  // Motion
  reduceMotion: boolean;
  simpleAnimations: boolean;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  open,
  onClose,
  settings,
  onSettingsChange,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = (key: keyof AccessibilitySettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleReset = () => {
    const defaultSettings: AccessibilitySettings = {
      audioEnabled: true,
      audioVolume: 70,
      audioFeedbackType: 'continuous',
      hapticEnabled: true,
      hapticIntensity: 50,
      highContrast: false,
      fontSize: 16,
      colorBlindMode: 'none',
      voiceGuidance: false,
      voiceRate: 1,
      voiceVolume: 70,
      reduceMotion: false,
      simpleAnimations: false,
    };
    setLocalSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsAccessibility />
            <Typography variant="h6">Configuración de Accesibilidad</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Sección de Sonido */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <VolumeUp /> Feedback Auditivo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.audioEnabled}
                      onChange={(e) => handleSettingChange('audioEnabled', e.target.checked)}
                    />
                  }
                  label="Habilitar sonido de feedback"
                />
              </Grid>
              
              {localSettings.audioEnabled && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Volumen: {localSettings.audioVolume}%
                    </Typography>
                    <Slider
                      value={localSettings.audioVolume}
                      onChange={(_, value) => handleSettingChange('audioVolume', value)}
                      min={0}
                      max={100}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo de feedback</InputLabel>
                      <Select
                        value={localSettings.audioFeedbackType}
                        label="Tipo de feedback"
                        onChange={(e) => handleSettingChange('audioFeedbackType', e.target.value)}
                      >
                        <MenuItem value="continuous">Continuo (para precisión)</MenuItem>
                        <MenuItem value="discrete">Discreto (para confort)</MenuItem>
                        <MenuItem value="minimal">Mínimo (solo alertas)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, width: '100%' }} />

          {/* Sección de Vibración */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Vibration /> Feedback Háptico
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.hapticEnabled}
                      onChange={(e) => handleSettingChange('hapticEnabled', e.target.checked)}
                    />
                  }
                  label="Habilitar vibración"
                />
              </Grid>
              
              {localSettings.hapticEnabled && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Intensidad: {localSettings.hapticIntensity}%
                  </Typography>
                  <Slider
                    value={localSettings.hapticIntensity}
                    onChange={(_, value) => handleSettingChange('hapticIntensity', value)}
                    min={10}
                    max={100}
                    valueLabelDisplay="auto"
                  />
                </Grid>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, width: '100%' }} />

          {/* Sección Visual */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Contrast /> Configuración Visual
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.highContrast}
                      onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                    />
                  }
                  label="Alto contraste"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.simpleAnimations}
                      onChange={(e) => handleSettingChange('simpleAnimations', e.target.checked)}
                    />
                  }
                  label="Animaciones simplificadas"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <TextFields sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Tamaño de texto: {localSettings.fontSize}px
                </Typography>
                <Slider
                  value={localSettings.fontSize}
                  onChange={(_, value) => handleSettingChange('fontSize', value)}
                  min={12}
                  max={24}
                  marks={[
                    { value: 12, label: 'Pequeño' },
                    { value: 16, label: 'Normal' },
                    { value: 20, label: 'Grande' },
                    { value: 24, label: 'Muy grande' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Modo para daltonismo</InputLabel>
                  <Select
                    value={localSettings.colorBlindMode}
                    label="Modo para daltonismo"
                    onChange={(e) => handleSettingChange('colorBlindMode', e.target.value)}
                  >
                    <MenuItem value="none">Normal</MenuItem>
                    <MenuItem value="protanopia">Protanopia (rojo-verde)</MenuItem>
                    <MenuItem value="deuteranopia">Deuteranopia (rojo-verde)</MenuItem>
                    <MenuItem value="tritanopia">Tritanopia (azul-amarillo)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, width: '100%' }} />

          {/* Sección de Voz */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <KeyboardVoice /> Guía por Voz
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.voiceGuidance}
                      onChange={(e) => handleSettingChange('voiceGuidance', e.target.checked)}
                    />
                  }
                  label="Habilitar guía por voz"
                />
              </Grid>
              
              {localSettings.voiceGuidance && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Velocidad del habla: {localSettings.voiceRate.toFixed(1)}x
                    </Typography>
                    <Slider
                      value={localSettings.voiceRate}
                      onChange={(_, value) => handleSettingChange('voiceRate', value)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      marks={[
                        { value: 0.5, label: 'Lento' },
                        { value: 1, label: 'Normal' },
                        { value: 1.5, label: 'Rápido' },
                        { value: 2, label: 'Muy rápido' },
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Volumen de voz: {localSettings.voiceVolume}%
                    </Typography>
                    <Slider
                      value={localSettings.voiceVolume}
                      onChange={(_, value) => handleSettingChange('voiceVolume', value)}
                      min={0}
                      max={100}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, width: '100%' }} />

          {/* Sección de Movimiento */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Preferencias de Movimiento
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.reduceMotion}
                      onChange={(e) => handleSettingChange('reduceMotion', e.target.checked)}
                    />
                  }
                  label="Reducir movimiento"
                />
                <Typography variant="caption" color="textSecondary">
                  Reduce animaciones y efectos de movimiento
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleReset} color="inherit">
          Restaurar valores predeterminados
        </Button>
        <Button onClick={onClose} variant="contained">
          Aplicar cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccessibilitySettings;
