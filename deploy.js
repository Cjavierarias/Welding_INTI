import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Iniciando despliegue...');

try {
  // Limpiar
  console.log('🧹 Limpiando caché...');
  execSync('rm -rf dist', { stdio: 'inherit' });
  execSync('rm -rf node_modules/.vite', { stdio: 'inherit' });

  // Instalar si es necesario
  console.log('📦 Instalando dependencias...');
  execSync('npm install', { stdio: 'inherit' });

  // Build
  console.log('🔨 Construyendo proyecto...');
  execSync('npm run build', { stdio: 'inherit' });

  // Verificar build
  console.log('✅ Build completado');
  
  const distPath = path.join(process.cwd(), 'dist');
  const files = fs.readdirSync(distPath);
  console.log('📁 Archivos en dist/:', files);

  // Desplegar
  console.log('🚀 Desplegando a GitHub Pages...');
  execSync('npx gh-pages -d dist', { stdio: 'inherit' });

  console.log('🎉 ¡Despliegue exitoso!');
  console.log('🔗 URL: https://cjavierarias.github.io/Welding_INTI/');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
