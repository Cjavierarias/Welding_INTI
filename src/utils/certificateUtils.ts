import QRCode from 'qrcode';

export interface CertificateData {
  studentName: string;
  instructorName: string;
  courseName: string;
  technique: string;
  score: number;
  grade: string;
  duration: number;
  date: string;
  certificateId: string;
  qrCodeUrl?: string;
}

export interface CertificateTemplate {
  templateId: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  backgroundImage?: string;
  fontFamily: string;
  layout: 'modern' | 'classic' | 'minimal';
}

export const CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    templateId: 'modern-blue',
    name: 'Moderno Azul',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    accentColor: '#1976d2',
    fontFamily: 'Roboto, sans-serif',
    layout: 'modern',
  },
  {
    templateId: 'classic-gold',
    name: 'Clásico Dorado',
    backgroundColor: '#f8f5e6',
    textColor: '#4a4a4a',
    accentColor: '#d4af37',
    fontFamily: 'Playfair Display, serif',
    layout: 'classic',
  },
  {
    templateId: 'minimal-dark',
    name: 'Minimalista Oscuro',
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    accentColor: '#00bcd4',
    fontFamily: 'Montserrat, sans-serif',
    layout: 'minimal',
  },
];

export async function generateCertificateHTML(
  data: CertificateData,
  template: CertificateTemplate
): Promise<string> {
  const qrCodeUrl = data.qrCodeUrl || await generateQRCode(data.certificateId);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificado - ${data.studentName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Playfair+Display:wght@400;700&family=Montserrat:wght@300;400;600&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          background-color: ${template.backgroundColor};
          color: ${template.textColor};
          font-family: ${template.fontFamily};
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .certificate-container {
          width: 210mm;
          height: 297mm;
          position: relative;
          background: ${template.backgroundColor};
          border: 2px solid ${template.accentColor}20;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        
        .certificate-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.03;
          pointer-events: none;
        }
        
        .certificate-content {
          padding: 60px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .title {
          font-size: 48px;
          font-weight: 700;
          color: ${template.accentColor};
          margin-bottom: 10px;
          letter-spacing: 3px;
        }
        
        .subtitle {
          font-size: 18px;
          color: ${template.textColor}cc;
          letter-spacing: 2px;
        }
        
        .main-content {
          text-align: center;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .awarded-to {
          font-size: 18px;
          margin-bottom: 20px;
          color: ${template.textColor}cc;
        }
        
        .student-name {
          font-size: 64px;
          font-weight: 700;
          margin: 40px 0;
          color: ${template.textColor};
          border-bottom: 3px solid ${template.accentColor};
          display: inline-block;
          padding-bottom: 20px;
        }
        
        .achievement {
          font-size: 20px;
          margin: 20px 0;
          color: ${template.textColor}cc;
          line-height: 1.6;
        }
        
        .technique-badge {
          display: inline-block;
          background: ${template.accentColor};
          color: white;
          padding: 15px 40px;
          border-radius: 50px;
          font-size: 24px;
          font-weight: 600;
          margin: 30px 0;
          box-shadow: 0 10px 20px ${template.accentColor}40;
        }
        
        .score-display {
          display: inline-flex;
          align-items: center;
          gap: 20px;
          margin: 40px 0;
        }
        
        .score-value {
          font-size: 72px;
          font-weight: 700;
          color: ${getGradeColor(data.grade)};
        }
        
        .grade-badge {
          background: ${getGradeColor(data.grade)};
          color: white;
          padding: 10px 30px;
          border-radius: 10px;
          font-size: 36px;
          font-weight: 700;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
          margin: 40px 0;
        }
        
        .detail-item {
          text-align: left;
        }
        
        .detail-label {
          font-size: 14px;
          color: ${template.textColor}99;
          margin-bottom: 5px;
        }
        
        .detail-value {
          font-size: 18px;
          font-weight: 600;
          color: ${template.textColor};
        }
        
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 40px;
          padding-top: 40px;
          border-top: 1px solid ${template.accentColor}30;
        }
        
        .signature {
          text-align: center;
        }
        
        .signature-line {
          width: 200px;
          height: 1px;
          background: ${template.textColor};
          margin: 20px auto 10px;
        }
        
        .qr-code {
          width: 100px;
          height: 100px;
        }
        
        .certificate-id {
          font-family: monospace;
          font-size: 12px;
          color: ${template.textColor}99;
          text-align: right;
        }
        
        @media print {
          body {
            background: white;
          }
          
          .certificate-container {
            box-shadow: none;
            border: none;
            width: 100%;
            height: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <div class="certificate-background">
          <!-- Background pattern would go here -->
        </div>
        
        <div class="certificate-content">
          <div class="header">
            <h1 class="title">CERTIFICADO DE ACREDITACIÓN</h1>
            <div class="subtitle">${data.courseName}</div>
          </div>
          
          <div class="main-content">
            <div class="awarded-to">Se otorga el presente certificado a</div>
            
            <div class="student-name">${data.studentName}</div>
            
            <div class="achievement">
              por haber completado exitosamente la práctica de soldadura en la técnica
            </div>
            
            <div class="technique-badge">${data.technique}</div>
            
            <div class="achievement">con una calificación de</div>
            
            <div class="score-display">
              <div class="score-value">${data.score}%</div>
              <div class="grade-badge">${data.grade}</div>
            </div>
            
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Fecha de Emisión</div>
                <div class="detail-value">${data.date}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Duración de la Práctica</div>
                <div class="detail-value">${Math.floor(data.duration)} segundos</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">Instructor</div>
                <div class="detail-value">${data.instructorName}</div>
              </div>
              
              <div class="detail-item">
                <div class="detail-label">ID del Certificado</div>
                <div class="detail-value">${data.certificateId}</div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="signature">
              <div class="signature-line"></div>
              <div class="detail-label">Firma del Instructor</div>
              <div class="detail-value">${data.instructorName}</div>
            </div>
            
            <div>
              <img src="${qrCodeUrl}" alt="QR Code" class="qr-code">
              <div class="certificate-id">${data.certificateId}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getGradeColor(grade: string): string {
  switch (grade.toUpperCase()) {
    case 'A+':
    case 'A':
    case 'A-':
      return '#4caf50';
    case 'B+':
    case 'B':
    case 'B-':
      return '#ff9800';
    case 'C+':
    case 'C':
    case 'C-':
      return '#ff5722';
    case 'D':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
}

export async function generateQRCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1976d2',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
}

export function generateCertificateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

export function validateCertificateData(data: Partial<CertificateData>): string[] {
  const errors: string[] = [];
  
  if (!data.studentName?.trim()) {
    errors.push('El nombre del estudiante es requerido');
  }
  
  if (!data.technique) {
    errors.push('La técnica de soldadura es requerida');
  }
  
  if (data.score === undefined || data.score < 0 || data.score > 100) {
    errors.push('La puntuación debe estar entre 0 y 100');
  }
  
  if (!data.grade) {
    errors.push('La calificación es requerida');
  }
  
  return errors;
}

export function formatCertificateDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function generateCertificatePDF(
  htmlContent: string,
  filename: string
): Promise<Blob> {
  // Esta función requeriría una biblioteca como jsPDF con html2canvas
  // Retornamos un Blob vacío como placeholder
  return new Blob([htmlContent], { type: 'text/html' });
}

export function getCertificateTemplate(templateId: string): CertificateTemplate {
  return CERTIFICATE_TEMPLATES.find(t => t.templateId === templateId) || CERTIFICATE_TEMPLATES[0];
}
