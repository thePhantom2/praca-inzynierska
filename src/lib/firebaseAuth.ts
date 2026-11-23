import { getAuth, type Auth } from 'firebase/auth';

import { getFirebaseApp } from '@/lib/firebase';

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
