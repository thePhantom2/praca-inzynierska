import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export function getPlatformFirestore(app: FirebaseApp) {
  return getFirestore(app);
}
