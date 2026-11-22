import { useEffect, useRef, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useSession } from '@/context/session';
import { cloudErrorMessage, commitChanges, mergeFields, userCollection } from '@/storage/cloudStorage';

export function useUserCollection<T extends { id: string }>(
  name: string, decode: (value: unknown) => T,
  merge: (old: T, next: T, remote: T) => T = mergeFields,
) {
  const { user } = useSession();
  const uid = user?.uid;
  const owner = useRef(uid);
  owner.current = uid;
  const pending = useRef(new Set<string>());
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ uid?: string; items: T[]; ready: boolean; loadError: boolean; error: string }>({ items: [], ready: false, loadError: false, error: '' });
  const [savingUid, setSavingUid] = useState<string>();
  useEffect(() => {
    let active = true;
    setState({ uid, items: [], ready: !uid, loadError: false, error: '' });
    if (!uid) return;
    const fail = (error: unknown) => {
      if (active && owner.current === uid) setState({ uid, items: [], ready: true, loadError: true, error: cloudErrorMessage(error) });
    };
    try {
      const stop = onSnapshot(userCollection(uid, name), (snapshot) => {
        if (!active || owner.current !== uid) return;
        try {
          const items = snapshot.docs.map((item) => decode({ ...item.data(), id: item.id }));
          setState({ uid, items, ready: true, loadError: false, error: '' });
        } catch (error) { fail(error); }
      }, fail);
      return () => { active = false; stop(); };
    } catch (error) { fail(error); }
    return () => { active = false; };
  }, [uid, name, decode, attempt]);
  const current = state.uid === uid ? state : { items: [] as T[], ready: !uid, loadError: false, error: '' };
  const setError = (error: string) => setState((old) => old.uid === uid && owner.current === uid ? { ...old, error } : old);
  async function persist(next: T[]) {
    if (!uid || !current.ready || current.loadError) throw new Error('Poczekaj na wczytanie danych konta.');
    if (pending.current.has(uid)) throw new Error('Poczekaj na zakończenie zapisu.');
    pending.current.add(uid);
    setSavingUid(uid);
    setError('');
    try {
      await commitChanges(uid, name, current.items, next, decode, merge);
    } catch (error) {
      setError(cloudErrorMessage(error));
      throw error;
    } finally {
      pending.current.delete(uid);
      setSavingUid((value) => value === uid ? undefined : value);
    }
  }
  return { ...current, saving: !!uid && savingUid === uid, persist, setError, load: async () => { setAttempt((value) => value + 1); } };
}
