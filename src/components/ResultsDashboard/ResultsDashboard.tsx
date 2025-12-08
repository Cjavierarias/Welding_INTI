import React, { useRef, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Download,
  Share,
  Email,
  Print,
  Assessment,
  TrendingUp,
  Speed,
  Straighten,
  Timeline,
  Grade,
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResultsDashboardProps {
  data: any;
  onGenerateCertificate: () => void;
  onRestart: () => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  data,
  onGenerateCertificate,
  onRestart,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const processMetricsForCharts = () => {
    if (!data?.metrics || data.metrics.length === 0) {
      return {
        timelineData: [],
        angleDistribution: [],
        radarData: [],
        speedProfile: [],
      };
    }

    // Datos para gráfico de línea (ángulo vs tiempo)
    const timelineData = data.metrics.map((metric: any, index: number) => ({
      time: index,
      angle: metric.angle,
      distance: metric.distance,
      quality: metric.quality,
      speed: metric.speed,
    }));

    // Datos para histograma de ángulo
    const angleBins = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${(i + 1) * 10}°`,
      count: 0,
    }));

    data.metrics.forEach((metric: any) => {
      const binIndex = Math.floor(metric.angle / 10);
      if (binIndex >= 0 && binIndex < angleBins.length) {
        angleBins[binIndex].count++;
      }
    });

    // Datos para gráfico de radar
    const radarData = [
      {
        subject: 'Ángulo',
        A: data.score,
        fullMark: 100,
      },
      {
        subject: 'Distancia',
        A: calculateComponentScore(data.metrics, 'distance'),
        fullMark: 100,
      },
      {
        subject: 'Velocidad',
        A: calculateComponentScore(data.metrics, 'speed'),
        fullMark: 100,
      },
      {
        subject: 'Estabilidad',
        A: calculateComponentScore(data.metrics, 'stability'),
        fullMark: 100,
      },
      {
        subject: 'Consistencia',
        A: calculateConsistencyScore(data.metrics),
        fullMark: 100,
      },
    ];

    // Datos para perfil de velocidad
    const speedProfile = data.metrics.map((metric: any, index: number) => ({
      position: index,
      speed: metric.speed,
    }));

    return {
      timelineData,
      angleDistribution: angleBins,
      radarData,
      speedProfile,
    };
  };

  const calculateComponentScore = (metrics: any[], component: string) => {
    const values = metrics.map(m => m[component]);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.min(100, Math.max(0, avg));
  };

  const calculateConsistencyScore = (metrics: any[]) => {
    if (metrics.length < 2) return 0;
    
    const angles = metrics.map(m => m.angle);
    const mean = angles.reduce((a, b) => a + b, 0) / angles.length;
    const variance = angles.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / angles.length;
    const stdDev = Math.sqrt(variance);
    
    // Puntaje más alto para menor desviación
    const consistency = Math.max(0, 100 - stdDev * 5);
    return Math.round(consistency);
  };

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = pdf.internal.pageSize.height;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`resultados-soldadura-${data.technique}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Resultados de Soldadura - ${data.technique}`,
          text: `Obtuve un ${data.score}% en simulación de soldadura ${data.technique}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const chartData = processMetricsForCharts();

  return (
    <Container maxWidth="xl" sx={{ py: 3, height: '100%', overflow: 'auto' }}>
      <div ref={dashboardRef}>
        <Paper sx={{ p: 3, mb: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Resultados de la Práctica
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip 
                  label={`Técnica: ${data.technique}`}
                  color="primary"
                  icon={<Assessment />}
                />
                <Chip 
                  label={`Duración: ${Math.floor(data.duration)}s`}
                  variant="outlined"
                />
                <Chip 
                  label={`Calificación: ${data.grade}`}
                  color={data.grade === 'A' ? 'success' : data.grade === 'B' ? 'warning' : 'error'}
                  icon={<Grade />}
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Exportar PDF">
                <IconButton onClick={handleExportPDF}>
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="Compartir">
                <IconButton onClick={handleShare}>
                  <Share />
                </IconButton>
              </Tooltip>
              <Tooltip title="Imprimir">
                <IconButton onClick={() => window.print()}>
                  <Print />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Puntuación principal */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container alignItems="center" spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" color="primary" fontWeight="bold">
                      {data.score}%
                    </Typography>
                    <Typography variant="h6" color="textSecondary">
                      Puntuación Final
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={data.score}
                      sx={{ mt: 2, height: 10, borderRadius: 5 }}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ textAlign: 'center', p: 1 }}>
                        <Straighten color="primary" />
                        <Typography variant="h6">{calculateComponentScore(data.metrics, 'angle').toFixed(0)}%</Typography>
                        <Typography variant="caption">Ángulo</Typography>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ textAlign: 'center', p: 1 }}>
                        <Timeline color="primary" />
                        <Typography variant="h6">{calculateComponentScore(data.metrics, 'distance').toFixed(0)}%</Typography>
                        <Typography variant="caption">Distancia</Typography>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ textAlign: 'center', p: 1 }}>
                        <Speed color="primary" />
                        <Typography variant="h6">{calculateComponentScore(data.metrics, 'speed').toFixed(0)}%</Typography>
                        <Typography variant="caption">Velocidad</Typography>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ textAlign: 'center', p: 1 }}>
                        <TrendingUp color="primary" />
                        <Typography variant="h6">{calculateConsistencyScore(data.metrics)}%</Typography>
                        <Typography variant="caption">Consistencia</Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs para diferentes visualizaciones */}
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ mb: 3 }}>
            <Tab label="Evolución Temporal" />
            <Tab label="Distribución Angular" />
            <Tab label="Análisis Multivariable" />
            <Tab label="Perfil de Velocidad" />
          </Tabs>

          {/* Contenido de los tabs */}
          <Box sx={{ mb: 3 }}>
            {activeTab === 0 && (
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Evolución de Parámetros en el Tiempo
                </Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={chartData.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" label={{ value: 'Tiempo (samples)', position: 'insideBottom' }} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="angle" stroke="#8884d8" name="Ángulo (°)" />
                    <Line yAxisId="left" type="monotone" dataKey="distance" stroke="#82ca9d" name="Distancia (mm)" />
                    <Line yAxisId="right" type="monotone" dataKey="quality" stroke="#ff7300" name="Calidad (%)" />
                    <Line yAxisId="right" type="monotone" dataKey="speed" stroke="#0088fe" name="Velocidad (mm/s)" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            )}

            {activeTab === 1 && (
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Distribución del Ángulo de Trabajo
                </Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={chartData.angleDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Frecuencia" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            )}

            {activeTab === 2 && (
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Análisis de Competencias por Dimensión
                </Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <RadarChart data={chartData.radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Tu desempeño" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </Paper>
            )}

            {activeTab === 3 && (
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Perfil de Velocidad Durante la Práctica
                </Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <AreaChart data={chartData.speedProfile}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="position" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="speed" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>
            )}
          </Box>

          {/* Feedback y sugerencias */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Análisis y Recomendaciones
            </Typography>
            <Grid container spacing={2}>
              {data.feedback?.map((feedback: string, index: number) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2">
                        {feedback}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Comparación histórica (placeholder) */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Progreso del Aprendizaje
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Aquí se mostraría tu progreso comparado con sesiones anteriores
            </Typography>
            <Button variant="outlined" disabled>
              Ver Historial Completo
            </Button>
          </Paper>
        </Paper>
      </div>

      {/* Acciones */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onRestart}
          size="large"
        >
          Nueva Práctica
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={onGenerateCertificate}
            size="large"
            startIcon={<Grade />}
          >
            Generar Certificado
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ResultsDashboard;
