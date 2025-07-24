# Despliegue en Netlify con Firebase

Esta aplicación de Office Layout puede desplegarse en Netlify y usar Firebase como base de datos en tiempo real para colaboración entre usuarios.

## 🚀 Pasos para el Despliegue

### 1. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o usa uno existente
3. Habilita **Firestore Database** en modo de producción
4. Ve a **Project Settings** > **General** > **Your apps**
5. Crea una nueva Web App o usa una existente
6. Copia las credenciales de configuración

### 2. Configurar Variables de Entorno

Crea un archivo `.env.production` con las siguientes variables:

```bash
# Habilitar Firebase para producción
VITE_USE_FIREBASE=true

# Credenciales de Firebase (reemplazar con valores reales)
VITE_FIREBASE_API_KEY=tu-api-key-aqui
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Configurar Reglas de Firestore

En Firebase Console, ve a **Firestore Database** > **Rules** y actualiza con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura y escritura para todos (para colaboración pública)
    match /office-layout-state/{document} {
      allow read, write: if true;
    }
    
    // Si quieres agregar autenticación más tarde:
    // allow read, write: if request.auth != null;
  }
}
```

### 4. Desplegar en Netlify

#### Opción A: Desde Git Repository
1. Sube tu código a GitHub
2. Ve a [Netlify](https://netlify.com)
3. Conecta tu repositorio
4. Configura las variables de entorno en Netlify Dashboard
5. Haz el despliegue

#### Opción B: Deploy Manual
1. Ejecuta `npm run build`
2. Arrastra la carpeta `dist` a Netlify Drop

### 5. Configurar Variables en Netlify

En tu dashboard de Netlify:
1. Ve a **Site settings** > **Environment variables**
2. Agrega todas las variables `VITE_*` con sus valores correspondientes

## 🔧 Desarrollo Local

Para desarrollo local (usando localStorage):
```bash
npm install
npm run dev
```

Para probar con Firebase en desarrollo:
```bash
# Cambiar VITE_USE_FIREBASE=true en .env
npm run dev
```

## 📱 Funcionalidades

- **Colaboración en tiempo real**: Múltiples usuarios pueden editar simultáneamente
- **Sincronización automática**: Los cambios se reflejan instantáneamente en todos los navegadores
- **Persistencia**: Los datos se mantienen entre sesiones
- **Fallback local**: Si Firebase no está configurado, usa localStorage

## 🛠️ Estructura del Proyecto

```
src/
├── config/
│   ├── firebase.ts          # Configuración de Firebase
│   └── database.ts          # Configuración del tipo de BD
├── services/
│   ├── DatabaseManager.ts         # Manager para localStorage
│   ├── FirebaseDatabaseManager.ts # Manager para Firebase
│   └── DatabaseWrapper.ts         # Wrapper que alterna entre ambos
└── components/
    └── ... (componentes de React)
```

## 🔗 URLs de Ejemplo

- **Desarrollo**: http://localhost:5173
- **Producción**: https://tu-app.netlify.app

## 🐛 Troubleshooting

1. **Error de CORS**: Verificar configuración de Firebase
2. **Variables no definidas**: Revisar que todas las `VITE_*` estén configuradas
3. **Build falla**: Ejecutar `npm install` y verificar dependencias

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
