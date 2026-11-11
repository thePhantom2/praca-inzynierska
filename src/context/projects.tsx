import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { loadProjects, saveProjects, type Project } from '@/storage/projectsStorage';

type ProjectsContextValue = {
  projects: Project[];
  ready: boolean;
  loadError: boolean;
  error: string;
  saving: boolean;
  load: () => Promise<void>;
  persist: (projects: Project[]) => Promise<boolean>;
  setError: (error: string) => void;
};
const ProjectsContext = createContext<ProjectsContextValue | null>(null);
export function ProjectsProvider({ children }: PropsWithChildren) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  async function load() {
    setReady(false);
    setLoadError(false);
    try {
      setProjects(await loadProjects());
    } catch {
      setLoadError(true);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => { void load(); }, []);

  async function persist(next: Project[]) {
    if (busy.current) return false;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      await saveProjects(next);
      setProjects(next);
      return true;
    } catch {
      setError('Nie udało się zapisać zmian. Spróbuj ponownie.');
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return <ProjectsContext.Provider value={{ projects, ready, loadError, error, saving, load, persist, setError }}>{children}</ProjectsContext.Provider>;
}
export function useProjects() {
  const value = useContext(ProjectsContext);
  if (!value) throw new Error('useProjects musi być użyty wewnątrz ProjectsProvider');
  return value;
}
