#!/bin/bash

# Limpiar caché
rm -rf node_modules/.vite
rm -rf dist

# Instalar dependencias si es necesario
npm install

# Construir proyecto
npm run build

# Verificar que la build fue exitosa
if [ $? -eq 0 ]; then
    echo "✅ Build exitoso"
    
    # Copiar assets adicionales
    cp public/offline.html dist/offline.html
    cp public/sw.js dist/sw.js
    cp public/manifest.json dist/manifest.json
    
    # Verificar estructura
    echo "📁 Estructura de dist/:"
    ls -la dist/
    
    echo "🚀 Listo para desplegar a GitHub Pages"
    echo "Ejecuta: npm run deploy"
else
    echo "❌ Error en build"
    exit 1
fi
