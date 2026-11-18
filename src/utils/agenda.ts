import { type Href } from 'expo-router';

import { type CalendarEntry } from '@/storage/eventsStorage';
import { type Project } from '@/storage/projectsStorage';
import { parseDateKey, toDateKey } from '@/utils/calendar';

export type AgendaItem = {
  id: string;
  type: 'reminder' | 'event' | 'task' | 'deadline';
  title: string;
  description: string;
  dateKey: string;
  time: string;
  completed: boolean;
  archived: boolean;
  projectName?: string;
  href: Href;
};

export function buildAgenda(entries: CalendarEntry[], projects: Project[]): AgendaItem[] {
  const items: AgendaItem[] = entries.map((entry) => ({
    id: JSON.stringify(['entry', entry.id]),
    type: entry.type,
    title: entry.title,
    description: entry.notes,
    dateKey: entry.dateKey,
    time: entry.time,
    completed: false,
    archived: false,
    href: { pathname: '/szczegoly/[id]', params: { id: entry.id } },
  }));

  for (const project of projects) {
    const projectDetails = {
      archived: Boolean(project.completedAt),
      projectName: project.name,
      href: { pathname: '/projekt/[id]', params: { id: project.id } } as const,
      time: '',
    };
    items.push({
      ...projectDetails,
      id: JSON.stringify(['deadline', project.id]),
      type: 'deadline',
      title: project.name,
      description: project.description,
      dateKey: project.deadline,
      completed: false,
    });
    for (const task of project.tasks) {
      items.push({
        ...projectDetails,
        id: JSON.stringify(['task', project.id, task.id]),
        type: 'task',
        title: task.title,
        description: task.description ?? '',
        dateKey: task.dateKey ?? '',
        completed: task.completed,
      });
    }
  }

  return items.sort((left, right) =>
    (left.dateKey || '9999-12-31').localeCompare(right.dateKey || '9999-12-31') ||
    (left.time || '00:00').localeCompare(right.time || '00:00') ||
    left.title.localeCompare(right.title, 'pl') ||
    left.id.localeCompare(right.id)
  );
}

export function getUpcomingAgenda(items: AgendaItem[], todayKey: string): AgendaItem[] {
  const lastDay = parseDateKey(todayKey);
  lastDay.setDate(lastDay.getDate() + 7);
  const lastDateKey = toDateKey(lastDay);
  return items.filter((item) =>
    item.dateKey >= todayKey && item.dateKey <= lastDateKey &&
    !item.completed && !item.archived
  );
}
