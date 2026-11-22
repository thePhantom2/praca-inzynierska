import { createContext, useContext, type PropsWithChildren } from 'react';
import { useUserCollection } from '@/hooks/useUserCollection';
import { cloudErrorMessage, mergeProject } from '@/storage/cloudStorage';
import { parseProject, type Project } from '@/storage/projectsStorage';

type ProjectsContextValue = {
  projects: Project[];
  ready: boolean;
  loadError: boolean;
  error: string;
  saving: boolean;
  load: () => Promise<void>;
  persist: (projects: Project[]) => Promise<boolean>;
  archiveProject: (id: string) => Promise<boolean>;
  removeProject: (id: string) => Promise<boolean>;
  setError: (error: string) => void;
};
const ProjectsContext = createContext<ProjectsContextValue | null>(null);
export function ProjectsProvider({ children }: PropsWithChildren) {
  const data = useUserCollection('projects', parseProject, mergeProject);
  const projects = data.items;
  async function persist(next: Project[]) {
    try { await data.persist(next); return true; }
    catch (error) { data.setError(cloudErrorMessage(error)); return false; }
  }
  return <ProjectsContext.Provider value={{
    projects, ready: data.ready, loadError: data.loadError, error: data.error,
    saving: data.saving, load: data.load, setError: data.setError, persist,
    archiveProject: (id) => persist(projects.map((project) => project.id === id && !project.completedAt ? { ...project, completedAt: new Date().toISOString() } : project)),
    removeProject: (id) => persist(projects.filter((project) => project.id !== id)),
  }}>{children}</ProjectsContext.Provider>;
}
export function useProjects() {
  const value = useContext(ProjectsContext);
  if (!value) throw new Error('useProjects musi być użyty wewnątrz ProjectsProvider');
  return value;
}
