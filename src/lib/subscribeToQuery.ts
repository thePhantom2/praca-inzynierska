import { FirebaseError } from 'firebase/app';
import { onSnapshot, type DocumentData, type FirestoreError, type Query, type QuerySnapshot, type Unsubscribe } from 'firebase/firestore';

const FIRST_RESPONSE_TIMEOUT_MS = 15_000;

// Transient network failures are retried internally by Firestore and do not
// reach onSnapshot's error callback. Bound the first load, but keep listening
// so a recovered connection can replace the error with confirmed server data.
export function subscribeToQuery<T extends DocumentData>(
  query: Query<T>,
  next: (snapshot: QuerySnapshot<T>) => void,
  error: (cause: unknown) => void,
): Unsubscribe {
  let active = true;
  const timeout = setTimeout(() => {
    if (active) error(new FirebaseError('unavailable', 'Nie otrzymano odpowiedzi z Firestore.'));
  }, FIRST_RESPONSE_TIMEOUT_MS);
  let unsubscribe: Unsubscribe;
  try {
    unsubscribe = onSnapshot(query, { includeMetadataChanges: true }, (snapshot) => {
      if (!active || snapshot.metadata.fromCache) return;
      clearTimeout(timeout);
      next(snapshot);
    }, (cause: FirestoreError) => {
      if (!active) return;
      clearTimeout(timeout);
      active = false;
      error(cause);
    });
  } catch (cause) {
    clearTimeout(timeout);
    throw cause;
  }
  return () => { active = false; clearTimeout(timeout); unsubscribe(); };
}
