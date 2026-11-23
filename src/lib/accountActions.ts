import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp } from '@/lib/firebase';

export async function disableCurrentAccount() {
  const callable = httpsCallable<{ confirmation: string }, { disabled: boolean }>(
    getFunctions(getFirebaseApp(), 'europe-west1'), 'disableMyAccount'
  );
  const result = await callable({ confirmation: 'DISABLE_MY_ACCOUNT' });
  if (result.data.disabled !== true) throw new Error('Nie otrzymano potwierdzenia wyłączenia konta. Spróbuj ponownie.');
}
