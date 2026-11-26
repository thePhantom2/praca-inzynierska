import { mergeProject } from '@/storage/cloudStorage';
import { project } from '../helpers/fixtures';

describe('Równoczesne zmiany projektu', () => {
  test('zmiana nazwy zachowuje opis i zadanie dopisane na innym urządzeniu', () => {
    const before = project();
    const remote = project({ description: 'Nowy opis', tasks: [...before.tasks, { id: 'b', title: 'Inne zadanie', completed: false }] });
    const result = mergeProject(before, { ...before, name: 'Nowa nazwa' }, remote);
    expect(result.name).toBe('Nowa nazwa');
    expect(result.description).toBe('Nowy opis');
    expect(result.tasks).toHaveLength(2);
  });
  test('odznaczenie zadania nie nadpisuje zmiany innego zadania', () => {
    const before = project({ tasks: [{ id: 'a', title: 'A', completed: false }, { id: 'b', title: 'B', completed: false }] });
    const next = { ...before, tasks: [{ ...before.tasks[0], completed: true }, before.tasks[1]] };
    const remote = { ...before, tasks: [before.tasks[0], { ...before.tasks[1], title: 'Zmienione B' }] };
    expect(mergeProject(before, next, remote).tasks).toEqual([{ id: 'a', title: 'A', completed: true }, { id: 'b', title: 'Zmienione B', completed: false }]);
  });
  test('nie przywraca zadania usuniętego przed zapisem', () => {
    const before = project();
    expect(() => mergeProject(before, { ...before, tasks: [{ ...before.tasks[0], completed: true }] }, { ...before, tasks: [] })).toThrow('usunięte');
  });
  test('archiwizacja zachowuje zadania i ich postęp', () => {
    const before = project();
    const remote = { ...before, tasks: [{ ...before.tasks[0], completed: true }] };
    const result = mergeProject(before, { ...before, completedAt: '2030-11-25T12:00:00Z' }, remote);
    expect(result.completedAt).toBeDefined();
    expect(result.tasks[0].completed).toBe(true);
  });
});
