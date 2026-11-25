import { createContext, useContext, useRef, useState, type PropsWithChildren } from 'react';
import { useUserCollection } from '@/hooks/useUserCollection';
import { useTeamProjects } from '@/hooks/useTeamProjects';
import { useSession } from '@/context/session';
import { cloudErrorMessage, mergeProject } from '@/storage/cloudStorage';
import { parseProject, type Project } from '@/storage/projectsStorage';
import { isProjectOwner, persistProjectChanges } from '@/storage/sharedProjects';

type ProjectsContextValue = {
  projects: Project[]; ready: boolean; loadError: boolean; error: string; saving: boolean;
  load: () => Promise<void>;
  persist: (projects: Project[]) => Promise<boolean>;
  archiveProject: (id: string) => Promise<boolean>;
  removeProject: (id: string) => Promise<boolean>;
  canManage: (project: Project) => boolean;
  setError: (error: string) => void;
};
const ProjectsContext = createContext<ProjectsContextValue | null>(null);
export function ProjectsProvider({ children }: PropsWithChildren) {
  const { user } = useSession();
  const data = useUserCollection('projects', parseProject, mergeProject);
  const shared = useTeamProjects();
  const projects = [...data.items, ...shared.projects];
  const uid = user?.uid;
  const currentUid = useRef(uid); currentUid.current = uid;
  const pending = useRef(new Set<string>());
  const [mutation, setMutation] = useState<{ uid?: string; saving: boolean; error: string }>({ saving: false, error: '' });
  const ready = data.ready && shared.ready;
  const loadError = data.loadError || !!shared.error;
  const setError = (error: string) => {
    data.setError(error);
    setMutation((old) => ({ uid, saving: old.uid === uid && old.saving, error }));
  };
  async function persist(next: Project[]) {
    if (!uid || pending.current.has(uid)) return false;
    if (!ready || loadError) { setError('Poczekaj na wczytanie projektów lub ponów odczyt.'); return false; }
    pending.current.add(uid); setMutation({ uid, saving: true, error: '' }); data.setError('');
    try {
      await persistProjectChanges(uid, projects, next);
      return true;
    } catch (error) {
      if (currentUid.current === uid) setMutation({ uid, saving: false, error: cloudErrorMessage(error) });
      return false;
    } finally {
      pending.current.delete(uid);
      setMutation((old) => old.uid === uid ? { ...old, saving: false } : old);
    }
  }
  const canManage = (project: Project) => isProjectOwner(project, uid);
  return <ProjectsContext.Provider value={{
    projects, ready, loadError, error: (mutation.uid === uid ? mutation.error : '') || data.error || shared.error,
    saving: !!uid && mutation.uid === uid && mutation.saving,
    load: async () => { await data.load(); shared.reload(); }, setError, persist, canManage,
    archiveProject: (id) => {
      if (!projects.some((project) => project.id === id && canManage(project))) { setError('Tylko właściciel może zakończyć projekt.'); return Promise.resolve(false); }
      return persist(projects.map((project) => project.id === id && !project.completedAt ? { ...project, completedAt: new Date().toISOString() } : project));
    },
    removeProject: (id) => {
      if (!projects.some((project) => project.id === id && canManage(project))) { setError('Tylko właściciel może usunąć projekt.'); return Promise.resolve(false); }
      return persist(projects.filter((project) => project.id !== id));
    },
  }}>{children}</ProjectsContext.Provider>;
}
export function useProjects() {
  const value = useContext(ProjectsContext);
  if (!value) throw new Error('useProjects musi być użyty wewnątrz ProjectsProvider');
  return value;
}
