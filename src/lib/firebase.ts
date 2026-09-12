/**
 * Cliente de Firebase para el navegador.
 *
 * La configuración llega por variables `NEXT_PUBLIC_*`. Si faltan (por ejemplo
 * en un build de vista previa sin credenciales), `firebaseListo` queda en falso
 * y la interfaz muestra un aviso en lugar de romperse con una excepción.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Falso mientras el proyecto de Firebase no esté configurado. */
export const firebaseListo = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;
let authRef: Auth | null = null;
let dbRef: Firestore | null = null;

function obtenerApp(): FirebaseApp {
  if (!firebaseListo) {
    throw new Error(
      "Firebase no está configurado. Copia .env.example a .env.local y rellena las variables NEXT_PUBLIC_FIREBASE_*.",
    );
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(config);
  }
  return app;
}

export function auth(): Auth {
  if (!authRef) authRef = getAuth(obtenerApp());
  return authRef;
}

export function db(): Firestore {
  if (!dbRef) dbRef = getFirestore(obtenerApp());
  return dbRef;
}
