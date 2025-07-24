// Configuración para alternar entre Firebase y localStorage
export const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

// Si Firebase está habilitado pero las variables no están configuradas, fallback a localStorage
export const isFirebaseConfigured = () => {
  if (!USE_FIREBASE) return false;
  
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  return requiredVars.every(varName => 
    import.meta.env[varName] && 
    import.meta.env[varName] !== 'your-project-id' && 
    import.meta.env[varName] !== 'your-api-key-here'
  );
};

console.log('Firebase configuration status:', {
  USE_FIREBASE,
  isConfigured: isFirebaseConfigured(),
  mode: isFirebaseConfigured() ? 'Firebase' : 'localStorage'
});
