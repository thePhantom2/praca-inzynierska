import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { subscribeToQuery } from '@/lib/subscribeToQuery';
import { useSession } from '@/context/session';
import { getFirestoreDatabase } from '@/lib/firebase';
import { cloudErrorMessage } from '@/storage/cloudStorage';
import { parseTeam, type Team } from '@/storage/teamsStorage';

type TeamsValue = { teams: Team[]; ready: boolean; loadError: boolean; error: string; reload: () => void };
const TeamsContext = createContext<TeamsValue | null>(null);
export function TeamsProvider({ children }: PropsWithChildren) {
  const { user } = useSession();
  const uid = user?.uid;
  const currentUid = useRef(uid); currentUid.current = uid;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ uid?: string; teams: Team[]; ready: boolean; error: string }>({ teams: [], ready: false, error: '' });
  useEffect(() => {
    let active = true;
    setState({ uid, teams: [], ready: !uid, error: '' });
    if (!uid) return;
    const fail = (error: unknown) => { if (active && currentUid.current === uid) setState({ uid, teams: [], ready: true, error: cloudErrorMessage(error) }); };
    try {
      const stop = subscribeToQuery(query(collection(getFirestoreDatabase(), 'teams'), where('memberIds', 'array-contains', uid)), (snapshot) => {
        if (!active || currentUid.current !== uid) return;
        try { setState({ uid, teams: snapshot.docs.map((item) => parseTeam({ ...item.data(), id: item.id })).sort((a, b) => a.name.localeCompare(b.name, 'pl')), ready: true, error: '' }); }
        catch (error) { fail(error); }
      }, fail);
      return () => { active = false; stop(); };
    } catch (error) { fail(error); }
    return () => { active = false; };
  }, [uid, attempt]);
  const visible = state.uid === uid ? state : { teams: [], ready: !uid, error: '' };
  return <TeamsContext.Provider value={{ ...visible, loadError: !!visible.error, reload: () => setAttempt((value) => value + 1) }}>{children}</TeamsContext.Provider>;
}
export function useTeams() {
  const value = useContext(TeamsContext);
  if (!value) throw new Error('useTeams musi być użyty wewnątrz TeamsProvider');
  return value;
}
