import { collection, doc, runTransaction } from 'firebase/firestore';
import { getFirestoreDatabase } from '@/lib/firebase';
import type { Project, ProjectTask } from '@/storage/projectsStorage';

type RecordWithId = { id: string };
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export function userCollection(uid: string, name: string) {
  return collection(getFirestoreDatabase(), 'users', uid, name);
}

// Apply only the fields the user changed to the latest server version.
export function mergeFields<T extends RecordWithId>(before: T, next: T, remote: T): T {
  const result = { ...remote };
  for (const key of new Set([...Object.keys(before), ...Object.keys(next)]) as Set<keyof T>) {
    if (!equal(before[key], next[key])) {
      if (next[key] === undefined) delete result[key];
      else result[key] = next[key];
    }
  }
  return result;
}
export function mergeProject(before: Project, next: Project, remote: Project): Project {
  const result = mergeFields(before, next, remote);
  if (equal(before.tasks, next.tasks)) return result;
  const previous = new Map(before.tasks.map((task) => [task.id, task]));
  const intended = new Map(next.tasks.map((task) => [task.id, task]));
  const tasks = new Map(remote.tasks.map((task) => [task.id, task]));
  for (const task of before.tasks) if (!intended.has(task.id)) tasks.delete(task.id);
  for (const task of next.tasks) {
    const old = previous.get(task.id);
    if (old && equal(old, task)) continue;
    const current = tasks.get(task.id);
    if (old && !current) throw new Error('To zadanie zostało już usunięte. Odśwież projekt.');
    if (!old && current) throw new Error('Zadanie o tym identyfikatorze już istnieje.');
    tasks.set(task.id, old && current ? mergeFields<ProjectTask>(old, task, current) : task);
  }
  return { ...result, tasks: [...tasks.values()] };
}

export async function commitChanges<T extends RecordWithId>(
  uid: string, name: string, before: T[], next: T[],
  decode: (value: unknown) => T,
  merge: (old: T, next: T, remote: T) => T = mergeFields,
) {
  const oldMap = new Map(before.map((item) => [item.id, item]));
  const nextMap = new Map(next.map((item) => [item.id, item]));
  if (nextMap.size !== next.length) throw new Error('Powtórzone identyfikatory danych.');
  const ids = [...new Set([...oldMap.keys(), ...nextMap.keys()])]
    .filter((id) => !equal(oldMap.get(id), nextMap.get(id)));
  if (!ids.length) return;
  if (ids.length > 400) throw new Error('Zapisz mniej zmian jednocześnie.');
  const refs = ids.map((id) => doc(userCollection(uid, name), id));
  await runTransaction(getFirestoreDatabase(), async (transaction) => {
    const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
    snapshots.forEach((snapshot, index) => {
      const id = ids[index];
      const old = oldMap.get(id);
      const value = nextMap.get(id);
      if (!value) { transaction.delete(refs[index]); return; }
      if (old && !snapshot.exists()) throw new Error('Ten wpis został już usunięty. Odśwież dane.');
      if (!old && snapshot.exists()) throw new Error('Wpis o tym identyfikatorze już istnieje.');
      const updated = old ? merge(old, value, decode({ ...snapshot.data(), id })) : value;
      transaction.set(refs[index], clean(decode(updated)));
    });
  });
}

export function cloudErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'permission-denied') return 'Brak dostępu do danych. Sprawdź członkostwo w zespole lub opublikuj aktualne reguły Firestore i spróbuj ponownie.';
  if (code === 'failed-precondition') return 'Nie udało się wykonać zapytania. Sprawdź, czy indeksy Firestore są wdrożone.';
  if (code === 'unavailable' || code === 'deadline-exceeded') return 'Nie można połączyć się z bazą. Sprawdź internet i spróbuj ponownie.';
  return error instanceof Error ? error.message : 'Nie udało się zapisać danych. Spróbuj ponownie.';
}
