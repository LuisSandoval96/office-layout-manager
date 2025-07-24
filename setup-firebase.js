#!/usr/bin/env node

/**
 * Script de ayuda para configurar Firebase
 * Ejecutar con: node setup-firebase.js
 */

console.log(`
🔥 CONFIGURACIÓN DE FIREBASE PARA OFFICE LAYOUT MANAGER
======================================================

📋 PASOS A SEGUIR:

1. 🌐 Ve a Firebase Console:
   👉 https://console.firebase.google.com/

2. 📁 Crea un nuevo proyecto:
   - Nombre: office-layout-manager (o el que prefieras)
   - Habilita Google Analytics (opcional)

3. 🗄️ Configura Firestore Database:
   - Ve a "Build" > "Firestore Database"
   - Clic en "Create database"
   - Selecciona "Start in production mode"
   - Elige una ubicación cercana

4. 🛡️ Actualiza las reglas de Firestore:
   - Ve a "Rules" en Firestore
   - Reemplaza el contenido con:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /office-layout-state/{document} {
      allow read, write: if true;
    }
  }
}

5. 🔧 Configura la Web App:
   - Ve a "Project Settings" (⚙️)
   - Scroll hacia abajo hasta "Your apps"
   - Clic en "Web" (</>)
   - Nombre: office-layout-web
   - ✅ También configurar Firebase Hosting (opcional)

6. 📝 Copia las credenciales:
   - Después de crear la app, copia la configuración
   - Debe verse algo así:

const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};

7. 🎯 Configura las variables de entorno:
   - Crea archivo .env.production:

VITE_USE_FIREBASE=true
VITE_FIREBASE_API_KEY=tu-api-key-aqui
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

8. 🚀 Para desplegar en Netlify:
   - Sube el código a GitHub
   - Conecta el repo en Netlify
   - Configura las variables VITE_* en Netlify Dashboard
   - Deploy automático

9. ✅ Verificar funcionamiento:
   - La app debería mostrar en consola: "Using Firebase Database Manager"
   - Los cambios deberían sincronizarse en tiempo real entre pestañas

📞 SOPORTE:
Si necesitas ayuda, revisa el archivo DEPLOYMENT.md

🎉 ¡Listo! Tu aplicación estará disponible para colaboración global.
`);
