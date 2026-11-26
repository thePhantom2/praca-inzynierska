import type { Project } from '@/storage/projectsStorage';
import type { CalendarEntry } from '@/storage/eventsStorage';
import type { Team } from '@/storage/teamsStorage';

export function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-a', name: 'Projekt semestralny', description: 'Prezentacja', deadline: '2030-11-30',
    tasks: [{ id: 'task-a', title: 'Przygotuj slajdy', completed: false, dateKey: '2030-11-26', description: 'Rozdział pierwszy' }],
    ...overrides,
  };
}
export function entry(overrides: Partial<CalendarEntry> = {}): CalendarEntry {
  return { id: 'event-a', title: 'Spotkanie', notes: 'Sala 12', dateKey: '2030-11-27', time: '15:00', type: 'event', ...overrides };
}
export function team(overrides: Partial<Team> = {}): Team {
  return {
    id: 'team-a', name: 'Zespół projektowy', description: 'Nauka', ownerId: 'owner', memberIds: ['owner', 'member'],
    members: { owner: { name: 'Anna Nowak', nickname: 'Ania' }, member: { name: 'Jan Kowalski', nickname: 'Janek' } }, ...overrides,
  };
}
