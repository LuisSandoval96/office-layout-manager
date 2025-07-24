#!/usr/bin/env node

/**
 * Script para verificar e inicializar Git si es necesario
 * Ejecutar con: node check-git.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log(`
🔍 VERIFICANDO CONFIGURACIÓN DE GIT
====================================
`);

// Verificar si ya existe .git
if (fs.existsSync('.git')) {
  console.log('✅ Repositorio Git ya está inicializado');
  
  // Verificar si hay remote origin
  try {
    const remoteOrigin = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    console.log(`✅ Remote origin configurado: ${remoteOrigin}`);
    
    // Verificar status
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      console.log('⚠️  Hay archivos sin commitear:');
      console.log(status);
      console.log(`
📝 Para hacer commit de los cambios:
   git add .
   git commit -m "Update: Firebase and Netlify configuration"
   git push origin main
`);
    } else {
      console.log('✅ Todos los archivos están commiteados');
    }
    
  } catch (error) {
    console.log('⚠️  No hay remote origin configurado');
    console.log(`
🌐 Para conectar con GitHub:
   1. Crea un repositorio en GitHub.com
   2. Ejecuta:
      git remote add origin https://github.com/TU-USUARIO/office-layout-manager.git
      git branch -M main
      git push -u origin main
`);
  }
  
} else {
  console.log('❌ Git no está inicializado');
  console.log(`
🚀 Para inicializar Git:
   git init
   git add .
   git commit -m "Initial commit: Office Layout Manager"
   
   Luego conecta con GitHub:
   git remote add origin https://github.com/TU-USUARIO/office-layout-manager.git
   git branch -M main
   git push -u origin main
`);
}

// Verificar archivos importantes
const importantFiles = [
  'netlify.toml',
  '.env.example',
  'DEPLOYMENT.md',
  'GITHUB-NETLIFY-GUIDE.md',
  'setup-firebase.js'
];

console.log(`
📁 ARCHIVOS DE CONFIGURACIÓN:
`);

importantFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} (faltante)`);
  }
});

console.log(`
🎯 PRÓXIMOS PASOS:
==================

1. 📋 Subir a GitHub (si no está hecho):
   - Crear repositorio en GitHub.com
   - Ejecutar comandos de git mostrados arriba

2. 🔥 Configurar Firebase:
   - npm run setup:firebase
   - Seguir las instrucciones

3. 🌍 Desplegar en Netlify:
   - Conectar repositorio de GitHub
   - Configurar variables de entorno
   - Deploy automático

4. 📖 Guía completa:
   - Ver GITHUB-NETLIFY-GUIDE.md

🎉 ¡Tu app estará disponible globalmente con colaboración en tiempo real!
`);
