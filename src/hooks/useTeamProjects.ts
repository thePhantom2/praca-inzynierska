import { useEffect, useRef, useState } from 'react';
import { collectionGroup, query, where } from 'firebase/firestore';
import { subscribeToQuery } from '@/lib/subscribeToQuery';
import { useTeams } from '@/context/teams';
import { useSession } from '@/context/session';
import { getFirestoreDatabase } from '@/lib/firebase';
import { cloudErrorMessage } from '@/storage/cloudStorage';
import { parseProject, type Project } from '@/storage/projectsStorage';

export function useTeamProjects() {
  const { user } = useSession();
  const { teams, ready: teamsReady, loadError: teamsError, reload: reloadTeams } = useTeams();
  const uid = user?.uid;
  const ids = teams.map((team) => team.id).sort();
  const scope = JSON.stringify([uid, ids]);
  const currentScope = useRef(scope); currentScope.current = scope;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ scope: string; projects: Record<string, Project[]>; finished: string[]; errors: Record<string, string> }>({ scope: '', projects: {}, finished: [], errors: {} });
  useEffect(() => {
    const [uid, ids] = JSON.parse(scope) as [string | null, string[]];
    let active = true;
    setState({ scope, projects: {}, finished: [], errors: {} });
    if (!uid || !teamsReady || teamsError) return;
    const stop = ids.map((teamId) => {
      const fail = (error: unknown) => {
        if (active && currentScope.current === scope) setState((old) => ({ ...old, projects: { ...old.projects, [teamId]: [] }, finished: [...new Set([...old.finished, teamId])], errors: { ...old.errors, [teamId]: cloudErrorMessage(error) } }));
      };
      try {
        return subscribeToQuery(query(collectionGroup(getFirestoreDatabase(), 'projects'), where('teamId', '==', teamId)), (snapshot) => {
          if (!active || currentScope.current !== scope) return;
          try {
            const projects = snapshot.docs.flatMap((item) => {
              const parts = item.ref.path.split('/');
              if (parts.length !== 4 || parts[0] !== 'users') throw new Error('Nieprawidłowa lokalizacja projektu.');
              const ownerId = parts[1];
              const project = parseProject({ ...item.data(), id: item.id });
              if (project.ownerId !== ownerId || project.teamId !== teamId) throw new Error('Nieprawidłowe udostępnienie projektu.');
              return ownerId === uid ? [] : [{ ...project, id: `${ownerId}:${item.id}`, sourceId: item.id, ownerId }];
            });
            setState((old) => ({ ...old, projects: { ...old.projects, [teamId]: projects }, finished: [...new Set([...old.finished, teamId])], errors: { ...old.errors, [teamId]: '' } }));
          } catch (error) { fail(error); }
        }, fail);
      } catch (error) { fail(error); return () => {}; }
    });
    return () => { active = false; stop.forEach((unsubscribe) => unsubscribe()); };
  }, [scope, teamsReady, teamsError, attempt]);
  const visible: Pick<typeof state, 'projects' | 'finished' | 'errors'> = state.scope === scope ? state : { projects: {}, finished: [], errors: {} };
  return {
    projects: ids.flatMap((id) => visible.projects[id] ?? []),
    ready: !uid || teamsError || (teamsReady && ids.every((id) => visible.finished.includes(id))),
    error: ids.map((id) => visible.errors[id]).find(Boolean) ?? '',
    reload: () => { reloadTeams(); setAttempt((value) => value + 1); },
  };
}
