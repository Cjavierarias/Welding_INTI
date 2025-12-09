import React from 'react'
import { ThemeProvider, createTheme, CssBaseline, Container, Typography, Box, Button } from '@mui/material'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#ff9800',
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <Box sx={{ 
          textAlign: 'center', 
          mt: 8,
          p: 4,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <Typography variant="h2" component="h1" gutterBottom>
            🛠️ Simulador de Soldadura AR
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            Una aplicación web progresiva para simulación de técnicas de soldadura
          </Typography>
          <Typography variant="body1" paragraph>
            Próximamente: seguimiento AR, feedback multisensorial, evaluación en tiempo real
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            sx={{ mt: 2 }}
            href="https://github.com/Cjavierarias/Welding_INTI"
            target="_blank"
          >
            Ver Código en GitHub
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default App
