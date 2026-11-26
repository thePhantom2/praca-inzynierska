import { parseProject } from '@/storage/projectsStorage';
import { parseEntry } from '@/storage/eventsStorage';
import { parseTeam } from '@/storage/teamsStorage';
import { entry, project, team } from '../helpers/fixtures';

describe('Odczyt danych z bazy', () => {
  test('obsługuje wcześniejszy prywatny projekt bez informacji o zespole', () => expect(parseProject(project())).toEqual(project()));
  test('odrzuca powtórzone identyfikatory zadań', () => {
    const value = project();
    expect(() => parseProject({ ...value, tasks: [...value.tasks, value.tasks[0]] })).toThrow();
  });
  test.each([null, { tasks: [] }, project({ teamId: '' }), project({ completedAt: 'nie-data' })])('odrzuca uszkodzony projekt', (value) => expect(() => parseProject(value)).toThrow());
  test('przyjmuje oba rodzaje prywatnych wpisów', () => {
    expect(parseEntry(entry()).type).toBe('event');
    expect(parseEntry(entry({ type: 'reminder' })).type).toBe('reminder');
  });
  test('odrzuca nieobsługiwany rodzaj wpisu', () => expect(() => parseEntry({ ...entry(), type: 'unknown' })).toThrow());
  test('zespół musi zawierać właściciela i profile wszystkich członków', () => {
    expect(parseTeam(team()).memberIds).toHaveLength(2);
    expect(() => parseTeam(team({ memberIds: ['member'] }))).toThrow();
    expect(() => parseTeam(team({ members: {} }))).toThrow();
  });
});
