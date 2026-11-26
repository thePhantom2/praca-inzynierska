import { collection, collectionGroup, doc, getDoc, getDocs, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { commitChanges, mergeProject } from '@/storage/cloudStorage';
import { parseProject } from '@/storage/projectsStorage';
import { acceptInvitation, createInvitation, createTeam, deleteTeam, parseTeam, removeTeamMember, revokeInvitation } from '@/storage/teamsStorage';
import { persistProjectChanges, setProjectTeam } from '@/storage/sharedProjects';
import { project } from '../helpers/fixtures';
import { adminSet, closeActors, createActor, resetFirebaseTests, startFirebaseTests, stopFirebaseTests, useActor, type Actor } from '../helpers/firebase';

jest.mock('@/lib/firebase', () => ({ getFirestoreDatabase: () => require('../helpers/firebase').currentDatabase() }));
beforeAll(startFirebaseTests); beforeEach(resetFirebaseTests); afterEach(closeActors); afterAll(stopFirebaseTests);

async function prepare() {
  const owner = await createActor('Właściciel'), member = await createActor('Uczestnik');
  useActor(owner);
  const id = await createTeam(owner.user, 'Zespół semestralny', 'Wspólny projekt');
  const team = parseTeam({ ...(await getDoc(doc(owner.database, 'teams', id))).data(), id });
  const code = await createInvitation(team, owner.user.uid);
  return { owner, member, team, code };
}
async function join(code: string, actor: Actor) { useActor(actor); await acceptInvitation(code, actor.user); }

describe('Zespoły i udostępnianie projektów', () => {
  test('kod pozwala dołączyć, ale nie daje możliwości listowania zaproszeń ani zmiany właściciela', async () => {
    const { owner, member, team, code } = await prepare();
    await expect(getDoc(doc(member.database, 'teams', team.id))).rejects.toMatchObject({ code: 'permission-denied' });
    await join(code, member);
    expect((await getDoc(doc(member.database, 'teams', team.id))).data()?.memberIds).toContain(member.user.uid);
    await expect(getDocs(query(collection(member.database, 'teamInvitations'), where('teamId', '==', team.id)))).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(updateDoc(doc(member.database, 'teams', team.id), { ownerId: member.user.uid })).rejects.toMatchObject({ code: 'permission-denied' });
    expect((await getDoc(doc(owner.database, 'teams', team.id))).data()?.ownerId).toBe(owner.user.uid);
  });
  test('w wyścigu o jeden kod dołącza dokładnie jedna osoba', async () => {
    const { owner, member, team, code } = await prepare(); const other = await createActor('Drugi uczestnik');
    useActor(member); const first = acceptInvitation(code, member.user);
    useActor(other); const second = acceptInvitation(code, other.user);
    const results = await Promise.allSettled([first, second]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect((await getDoc(doc(owner.database, 'teams', team.id))).data()?.memberIds).toHaveLength(2);
  });
  test('anulowane i wygasłe zaproszenia nie dodają uczestnika', async () => {
    const { owner, member, team, code } = await prepare(); useActor(owner); await revokeInvitation(code);
    await expect(join(code, member)).rejects.toThrow(/kod|Zaproszenie/);
    useActor(owner); const expired = await createInvitation(team, owner.user.uid);
    await adminSet(`teamInvitations/${expired}`, { teamId: team.id, teamName: team.name, ownerId: owner.user.uid, status: 'pending', acceptedBy: null, expiresAt: Timestamp.fromMillis(Date.now() - 10000) });
    await expect(join(expired, member)).rejects.toThrow(/kod|Zaproszenie/);
    expect((await getDoc(doc(owner.database, 'teams', team.id))).data()?.memberIds).toHaveLength(1);
  });
  test('uczestnik pracuje nad zadaniami, lecz nie zmienia terminu ani nazwy projektu', async () => {
    const { owner, member, team, code } = await prepare(); await join(code, member); useActor(owner);
    const value = project(); await commitChanges(owner.user.uid, 'projects', [], [value], parseProject, mergeProject);
    await setProjectTeam(owner.user.uid, value.id, team.id);
    const found = await getDocs(query(collectionGroup(member.database, 'projects'), where('teamId', '==', team.id)));
    expect(found.size).toBe(1);
    const raw = parseProject({ ...found.docs[0].data(), id: value.id });
    const view = { ...raw, id: `${owner.user.uid}:${value.id}`, sourceId: value.id };
    useActor(member); await persistProjectChanges(member.user.uid, [view], [{ ...view, tasks: view.tasks.map((task) => ({ ...task, completed: true })) }]);
    const ref = doc(member.database, 'users', owner.user.uid, 'projects', value.id);
    expect((await getDoc(ref)).data()?.tasks[0].completed).toBe(true);
    await expect(updateDoc(ref, { deadline: '2031-01-01' })).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(updateDoc(ref, { name: 'Zmieniona nazwa' })).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(persistProjectChanges(member.user.uid, [view], [])).rejects.toThrow(/właściciel/);
  });
  test('usunięcie uczestnika odcina dostęp, a usunięcie zespołu zachowuje oryginalny projekt', async () => {
    const { owner, member, team, code } = await prepare(); await join(code, member); useActor(owner);
    const value = project(); await commitChanges(owner.user.uid, 'projects', [], [value], parseProject, mergeProject); await setProjectTeam(owner.user.uid, value.id, team.id);
    await removeTeamMember(team.id, member.user.uid);
    await expect(getDoc(doc(member.database, 'users', owner.user.uid, 'projects', value.id))).rejects.toMatchObject({ code: 'permission-denied' });
    await deleteTeam(team.id);
    expect((await getDoc(doc(owner.database, 'users', owner.user.uid, 'projects', value.id))).exists()).toBe(true);
    await setProjectTeam(owner.user.uid, value.id, null);
    expect((await getDoc(doc(owner.database, 'users', owner.user.uid, 'projects', value.id))).data()?.teamId).toBeUndefined();
  });
  test('wyłączone konto nie odczytuje zespołu nawet ze starym tokenem', async () => {
    const { member, team, code } = await prepare(); await join(code, member);
    await adminSet(`accountStatus/${member.user.uid}`, { disabled: true });
    await expect(getDoc(doc(member.database, 'teams', team.id))).rejects.toMatchObject({ code: 'permission-denied' });
  });
});
