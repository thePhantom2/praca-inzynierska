import { FirebaseError, type FirebaseApp } from 'firebase/app';
import { initializeFirestore, type Firestore } from 'firebase/firestore';

const instances = new WeakMap<FirebaseApp, Firestore>();

export function getPlatformFirestore(app: FirebaseApp): Firestore {
  const existing = instances.get(app);
  if (existing) return existing;
  try {
    // Short-lived responses avoid WebChannel streaming incompatibilities in
    // React Native and emulator networks. The web build keeps its defaults.
    const database = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false,
    });
    instances.set(app, database);
    return database;
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'failed-precondition') {
      throw new Error('Zmieniono ustawienia połączenia z bazą. Przeładuj całą aplikację, aby je zastosować.');
    }
    throw error;
  }
}
