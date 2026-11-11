import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProjectTask = { id: string; title: string; completed: boolean; dateKey?: string; description?: string };
export type Project = {
  id: string;
  name: string;
  description: string;
  deadline: string;
  tasks: ProjectTask[];
};

const STORAGE_KEY = 'projects';

export async function loadProjects(): Promise<Project[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const projects: unknown = JSON.parse(raw);
  if (!Array.isArray(projects) || !projects.every((project) =>
    project && typeof project.id === 'string' && typeof project.name === 'string' &&
    typeof project.description === 'string' && typeof project.deadline === 'string' &&
    Array.isArray(project.tasks) && project.tasks.every((task: ProjectTask) =>
      task && typeof task.id === 'string' && typeof task.title === 'string' &&
      typeof task.completed === 'boolean' &&
      (task.dateKey === undefined || typeof task.dateKey === 'string') &&
      (task.description === undefined || typeof task.description === 'string'))
  )) throw new Error('Nieprawidłowe dane projektów');
  return projects as Project[];
}

export async function saveProjects(projects: Project[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}
