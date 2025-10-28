
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

/**
 * CONFIGURACIÓN DE FIREBASE
 * 
 * Configuración para Firebase Authentication y Firestore.
 * Reemplaza estos valores con los de tu proyecto Firebase.
 */
const firebaseConfig = {
  apiKey: "AIzaSyDkGgajWEDKgZMKnhjJ4HBdTpMSuhrhoUg",
  authDomain: "anime-2ab87.firebaseapp.com",
  projectId: "anime-2ab87",
  storageBucket: "anime-2ab87.firebasestorage.app",
  messagingSenderId: "745778355235",
  appId: "1:745778355235:web:56736316a63a0bbea0a596",
  measurementId: "G-D15Y6QBL21"
};

// Inicializar Firebase con manejo de errores
let app;
let analytics;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  auth = getAuth(app);
  db = getFirestore(app);
  
  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
  // Crear objetos mock para evitar errores
  app = null;
  analytics = null;
  auth = null;
  db = null;
}

// Exportar servicios de Firebase
export { auth, db };
export default app;
