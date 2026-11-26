import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { type Firestore } from 'firebase/firestore';
import { getPlatformFirestore } from '@/lib/firestore';

// Expo substitutes EXPO_PUBLIC_ values referenced with dot notation at build time.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseApp(): FirebaseApp {
  const existing = getApps().find((app) => app.name === '[DEFAULT]');
  if (existing) return existing;

  const requiredFields = ['apiKey', 'projectId', 'appId'] as const;
  const missing = requiredFields.filter((field) => !firebaseConfig[field]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Brakuje konfiguracji Firebase (${missing.join(', ')}). Uzupełnij .env.local na podstawie .env.example.`
    );
  }
  return initializeApp(firebaseConfig);
}

export function getFirestoreDatabase(): Firestore {
  return getPlatformFirestore(getFirebaseApp());
}
