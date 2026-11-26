import { buildAgenda, getUpcomingAgenda } from '@/utils/agenda';
import { entry, project } from '../helpers/fixtures';

describe('Wspólna agenda', () => {
  test('łączy prywatne wydarzenia, zadania i termin projektu', () => {
    const items = buildAgenda([entry()], [project()]);
    expect(items.map((item) => item.type)).toEqual(['task', 'event', 'deadline']);
    expect(items.find((item) => item.type === 'task')?.href).toEqual({ pathname: '/projekt/[id]', params: { id: 'project-a' } });
  });
  test('oddziela identyfikatory wydarzeń, zadań i projektów', () => {
    const items = buildAgenda([entry({ id: 'same' })], [project({ id: 'same', tasks: [{ id: 'same', title: 'Zadanie', completed: false }] })]);
    expect(new Set(items.map((item) => item.id)).size).toBe(3);
    expect(items.at(-1)?.dateKey).toBe('');
  });
  test('Home uwzględnia dziś i siódmy dzień, pomija późniejsze, wykonane i archiwalne', () => {
    const items = buildAgenda([
      entry({ id: 'today', dateKey: '2030-11-25' }),
      entry({ id: 'last', dateKey: '2030-12-02' }),
      entry({ id: 'later', dateKey: '2030-12-03' }),
      entry({ id: 'past', dateKey: '2030-11-24' }),
    ], [
      project({ id: 'active', tasks: [{ id: 'done', title: 'Gotowe', completed: true, dateKey: '2030-11-26' }] }),
      project({ id: 'archived', completedAt: '2030-11-24T12:00:00Z' }),
    ]);
    const upcoming = getUpcomingAgenda(items, '2030-11-25');
    expect(upcoming.map((item) => item.title)).not.toContain('Gotowe');
    expect(upcoming.some((item) => item.archived)).toBe(false);
    expect(upcoming.filter((item) => item.type === 'event')).toHaveLength(2);
    expect(upcoming.map((item) => item.dateKey)).toContain('2030-12-02');
    expect(upcoming.map((item) => item.dateKey)).not.toContain('2030-12-03');
  });
  test('kalendarz zachowuje zakończone zadania i archiwalne projekty', () => {
    const items = buildAgenda([], [project({ completedAt: '2030-11-24T12:00:00Z', tasks: [{ id: 'done', title: 'Gotowe', completed: true, dateKey: '2030-11-26' }] })]);
    expect(items).toHaveLength(2);
    expect(items.every((item) => item.archived)).toBe(true);
    expect(items.find((item) => item.type === 'task')?.completed).toBe(true);
  });
});
