import React, { useRef, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Download,
  Share,
  Email,
  Print,
  Edit,
  Save,
  QrCode2,
  Verified,
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface CertificateGeneratorProps {
  data: any;
  onBack: () => void;
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({ data, onBack }) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [studentName, setStudentName] = useState('');
  const [instructorName, setInstructorName] = useState('Instructor Virtual');
  const [courseName, setCourseName] = useState('Técnicas de Soldadura Avanzada');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as const });

  const generateQRCode = async () => {
    try {
      const verificationUrl = `${window.location.origin}/verify/${Date.now()}-${data.score}-${data.technique}`;
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1976d2',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qrDataUrl);
      return qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  const handleGenerateCertificate = async () => {
    if (!certificateRef.current) return;

    try {
      // Generar QR code si no existe
      let qrToUse = qrCodeUrl;
      if (!qrToUse) {
        qrToUse = await generateQRCode();
      }

      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const fileName = `certificado-${studentName || 'estudiante'}-${data.technique}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      setSnackbar({
        open: true,
        message: 'Certificado generado exitosamente',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error generating certificate:', error);
      setSnackbar({
        open: true,
        message: 'Error al generar el certificado',
        severity: 'error',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && certificateRef.current) {
      try {
        const canvas = await html2canvas(certificateRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'certificado.png', { type: 'image/png' });
            await navigator.share({
              title: `Certificado de Soldadura - ${data.technique}`,
              text: `Certificado de ${studentName || 'Estudiante'} en técnica ${data.technique} - Calificación: ${data.grade}`,
              files: [file],
            });
          }
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      setOpenDialog(true);
    }
  };

  const handleEmail = () => {
    const subject = `Certificado de Soldadura - ${data.technique}`;
    const body = `Hola,\n\nAdjunto certificado de la práctica de soldadura ${data.technique}.\n\nCalificación: ${data.grade} (${data.score}%)\n\nSaludos.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3, height: '100%', overflow: 'auto' }}>
      <Grid container spacing={3}>
        {/* Panel de configuración */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Personalizar Certificado
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="Nombre del Estudiante"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                sx={{ mb: 3 }}
                placeholder="Ingresa tu nombre"
              />
              
              <TextField
                fullWidth
                label="Nombre del Curso"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="Instructor"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Detalles de la Práctica
                  </Typography>
                  <Typography variant="body2">
                    • Técnica: {data.technique}
                  </Typography>
                  <Typography variant="body2">
                    • Calificación: {data.grade} ({data.score}%)
                  </Typography>
                  <Typography variant="body2">
                    • Duración: {Math.floor(data.duration)} segundos
                  </Typography>
                  <Typography variant="body2">
                    • Fecha: {formatDate(data.completedAt)}
                  </Typography>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleGenerateCertificate}
                  startIcon={<Download />}
                  fullWidth
                >
                  Descargar PDF
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleShare}
                  startIcon={<Share />}
                  fullWidth
                >
                  Compartir
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleEmail}
                  startIcon={<Email />}
                  fullWidth
                >
                  Enviar por Email
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => window.print()}
                  startIcon={<Print />}
                  fullWidth
                >
                  Imprimir
                </Button>
                
                <Button
                  variant="text"
                  onClick={onBack}
                  fullWidth
                >
                  Volver a Resultados
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Vista previa del certificado */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5">
                Vista Previa del Certificado
              </Typography>
              <IconButton onClick={() => setOpenDialog(true)}>
                <Edit />
              </IconButton>
            </Box>

            <Box
              ref={certificateRef}
              sx={{
                position: 'relative',
                width: '100%',
                minHeight: '500px',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                border: '2px solid #e0e0e0',
                borderRadius: 2,
                p: 4,
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: 'radial-gradient(#1976d2 1px, transparent 1px)',
                  backgroundSize: '50px 50px',
                  opacity: 0.05,
                  pointerEvents: 'none',
                },
              }}
            >
              {/* Encabezado */}
              <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 100,
                    height: 100,
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg...")',
                    opacity: 0.1,
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 'bold',
                    color: '#1976d2',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                  }}
                >
                  Certificado de Acreditación
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ color: '#666', letterSpacing: 1 }}
                >
                  {courseName}
                </Typography>
              </Box>

              {/* Contenido principal */}
              <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Se otorga el presente certificado a
                </Typography>
                
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 'bold',
                    color: '#333',
                    mb: 3,
                    borderBottom: '3px solid #1976d2',
                    display: 'inline-block',
                    pb: 1,
                  }}
                >
                  {studentName || 'Nombre del Estudiante'}
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 4 }}>
                  por haber completado exitosamente la práctica de soldadura en la técnica
                </Typography>
                
                <Box
                  sx={{
                    display: 'inline-block',
                    px: 4,
                    py: 2,
                    backgroundColor: '#1976d2',
                    color: 'white',
                    borderRadius: 2,
                    mb: 4,
                  }}
                >
                  <Typography variant="h5">
                    {data.technique}
                  </Typography>
                </Box>
                
                <Typography variant="body1" sx={{ mb: 2 }}>
                  con una calificación de
                </Typography>
                
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Typography
                    variant="h2"
                    sx={{
                      color: '#4caf50',
                      fontWeight: 'bold',
                    }}
                  >
                    {data.score}%
                  </Typography>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      backgroundColor: 
                        data.grade === 'A' ? '#4caf50' :
                        data.grade === 'B' ? '#ff9800' : '#f44336',
                      color: 'white',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="h6">
                      {data.grade}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Información detallada */}
              <Grid container spacing={4} sx={{ mb: 6 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Fecha de Emisión
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(Date.now())}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Duración de la Práctica
                  </Typography>
                  <Typography variant="body1">
                    {Math.floor(data.duration)} segundos
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Instructor
                  </Typography>
                  <Typography variant="body1">
                    {instructorName}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    ID de Certificado
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {`CERT-${Date.now().toString(36).toUpperCase()}`}
                  </Typography>
                </Grid>
              </Grid>

              {/* Firmas y QR */}
              <Grid container spacing={4} alignItems="flex-end">
                <Grid item xs={8}>
                  <Box sx={{ borderTop: '2px solid #ccc', pt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Firma del Instructor
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {instructorName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Instructor Certificado
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    {qrCodeUrl ? (
                      <Box
                        component="img"
                        src={qrCodeUrl}
                        alt="QR Code"
                        sx={{ width: 100, height: 100 }}
                      />
                    ) : (
                      <Button
                        size="small"
                        startIcon={<QrCode2 />}
                        onClick={generateQRCode}
                      >
                        Generar QR
                      </Button>
                    )}
                    <Typography variant="caption" display="block">
                      Código de Verificación
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Sello de validez */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 20,
                  right: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: '#4caf50',
                }}
              >
                <Verified />
                <Typography variant="caption">
                  Certificado Digital Verificado
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog para compartir */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Compartir Certificado</DialogTitle>
        <DialogContent>
          <Typography>
            Copia el siguiente enlace para compartir tu certificado:
          </Typography>
          <TextField
            fullWidth
            value={`${window.location.origin}/certificate/${Date.now()}`}
            sx={{ mt: 2 }}
            InputProps={{
              readOnly: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/certificate/${Date.now()}`);
            setSnackbar({
              open: true,
              message: 'Enlace copiado al portapapeles',
              severity: 'success',
            });
            setOpenDialog(false);
          }}>
            Copiar Enlace
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CertificateGenerator;
