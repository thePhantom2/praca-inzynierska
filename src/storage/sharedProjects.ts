import { deleteField, doc, runTransaction } from 'firebase/firestore';
import { getFirestoreDatabase } from '@/lib/firebase';
import { commitChanges, mergeProject } from '@/storage/cloudStorage';
import { parseProject, type Project } from '@/storage/projectsStorage';

export function isProjectOwner(project: Project, uid?: string): boolean {
  return !!uid && !project.sourceId && (!project.ownerId || project.ownerId === uid);
}
export async function setProjectTeam(uid: string, projectId: string, teamId: string | null) {
  const db = getFirestoreDatabase();
  const ref = doc(db, 'users', uid, 'projects', projectId);
  await runTransaction(db, async (transaction) => {
    const project = await transaction.get(ref);
    if (!project.exists()) throw new Error('Nie znaleziono projektu.');
    if (teamId) {
      const team = await transaction.get(doc(db, 'teams', teamId));
      if (!team.exists() || !team.data().memberIds.includes(uid)) throw new Error('Nie należysz do wybranego zespołu.');
      transaction.update(ref, { teamId, ownerId: uid });
    } else {
      transaction.update(ref, { teamId: deleteField(), ownerId: deleteField() });
    }
  });
}
export async function persistProjectChanges(uid: string, before: Project[], next: Project[]) {
  const previous = new Map(before.map((project) => [project.id, project]));
  const intended = new Map(next.map((project) => [project.id, project]));
  if (intended.size !== next.length) throw new Error('Powtórzone identyfikatory projektów.');
  const changed = [...new Set([...previous.keys(), ...intended.keys()])].filter((id) => JSON.stringify(previous.get(id)) !== JSON.stringify(intended.get(id)));
  if (!changed.length) return;
  for (const id of changed) {
    const old = previous.get(id), value = intended.get(id);
    if (old && value && ['ownerId', 'sourceId', 'teamId'].some((key) => old[key as keyof Project] !== value[key as keyof Project])) throw new Error('Zmień udostępnianie w sekcji zespołu projektu.');
    if (!old && value && !isProjectOwner(value, uid)) throw new Error('Nie możesz tworzyć projektu na cudzym koncie.');
  }
  const shared = changed.filter((id) => !isProjectOwner(previous.get(id) ?? intended.get(id)!, uid));
  if (!shared.length) {
    await commitChanges(uid, 'projects', before.filter((project) => isProjectOwner(project, uid)), next.filter((project) => isProjectOwner(project, uid)), parseProject, mergeProject);
    return;
  }
  if (shared.length !== 1 || changed.length !== 1) throw new Error('Zapisz zmiany wspólnego projektu osobno.');
  const old = previous.get(shared[0]);
  const updated = intended.get(shared[0]);
  if (!old || !updated || !old.ownerId || !old.sourceId) throw new Error('Tylko właściciel może usuwać projekt.');
  const fields = new Set([...Object.keys(old), ...Object.keys(updated)]) as Set<keyof Project>;
  if ([...fields].some((key) => key !== 'tasks' && JSON.stringify(old[key]) !== JSON.stringify(updated[key]))) throw new Error('Możesz zmieniać zadania. Ustawieniami projektu zarządza jego właściciel.');
  const ref = doc(getFirestoreDatabase(), 'users', old.ownerId, 'projects', old.sourceId);
  const raw = (project: Project): Project => {
    const { sourceId, ...value } = project;
    return { ...value, id: sourceId! };
  };
  await runTransaction(getFirestoreDatabase(), async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Projekt nie jest już dostępny.');
    const remote = parseProject({ ...snapshot.data(), id: snapshot.id });
    transaction.set(ref, JSON.parse(JSON.stringify(mergeProject(raw(old), raw(updated), remote))));
  });
}
