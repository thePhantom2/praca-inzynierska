import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { commitChanges, mergeProject } from '@/storage/cloudStorage';
import { parseProject } from '@/storage/projectsStorage';
import { parseEntry } from '@/storage/eventsStorage';
import { importLocalData } from '@/storage/importLocalData';
import { project, entry } from '../helpers/fixtures';
import { closeActors, createActor, currentDatabase, resetFirebaseTests, startFirebaseTests, stopFirebaseTests, useActor } from '../helpers/firebase';

jest.mock('@/lib/firebase', () => ({ getFirestoreDatabase: () => require('../helpers/firebase').currentDatabase() }));

beforeAll(startFirebaseTests);
beforeEach(async () => { await resetFirebaseTests(); await AsyncStorage.clear(); });
afterEach(closeActors);
afterAll(stopFirebaseTests);

describe('Prywatne projekty — rzeczywisty SDK i reguły Firestore', () => {
  test('właściciel odczytuje projekt, inne konto nie odczytuje, nie listuje i nie usuwa', async () => {
    const owner = await createActor('Właściciel'), stranger = await createActor('Obca osoba');
    useActor(owner); const value = project();
    await commitChanges(owner.user.uid, 'projects', [], [value], parseProject, mergeProject);
    expect((await getDoc(doc(owner.database, 'users', owner.user.uid, 'projects', value.id))).data()?.name).toBe(value.name);
    const foreign = doc(stranger.database, 'users', owner.user.uid, 'projects', value.id);
    await expect(getDoc(foreign)).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(getDocs(collection(stranger.database, 'users', owner.user.uid, 'projects'))).rejects.toMatchObject({ code: 'permission-denied' });
    await expect(deleteDoc(foreign)).rejects.toMatchObject({ code: 'permission-denied' });
  });
  test('transakcja zachowuje równoczesną zmianę innego urządzenia', async () => {
    const owner = await createActor('Właściciel'); useActor(owner); const value = project();
    await commitChanges(owner.user.uid, 'projects', [], [value], parseProject, mergeProject);
    const ref = doc(currentDatabase(), 'users', owner.user.uid, 'projects', value.id);
    await updateDoc(ref, { description: 'Opis z drugiego urządzenia', tasks: [...value.tasks, { id: 'b', title: 'Dopisane', completed: false }] });
    await commitChanges(owner.user.uid, 'projects', [value], [{ ...value, name: 'Nowa nazwa' }], parseProject, mergeProject);
    expect((await getDoc(ref)).data()).toMatchObject({ name: 'Nowa nazwa', description: 'Opis z drugiego urządzenia' });
    expect((await getDoc(ref)).data()?.tasks).toHaveLength(2);
  });
  test('archiwizuje bez usuwania zadań, a późniejsze usunięcie nie pozwala na przywrócenie starym zapisem', async () => {
    const owner = await createActor('Właściciel'); useActor(owner); const value = project();
    await commitChanges(owner.user.uid, 'projects', [], [value], parseProject, mergeProject);
    const archived = { ...value, completedAt: '2030-11-25T12:00:00Z' };
    await commitChanges(owner.user.uid, 'projects', [value], [archived], parseProject, mergeProject);
    const ref = doc(currentDatabase(), 'users', owner.user.uid, 'projects', value.id);
    expect((await getDoc(ref)).data()?.tasks).toHaveLength(1);
    await commitChanges(owner.user.uid, 'projects', [archived], [], parseProject, mergeProject);
    await expect(commitChanges(owner.user.uid, 'projects', [archived], [{ ...archived, name: 'Stary zapis' }], parseProject, mergeProject)).rejects.toThrow('usunięty');
    expect((await getDoc(ref)).exists()).toBe(false);
  });
  test('prywatny kalendarz obsługuje utworzenie, zmianę i usunięcie wpisu', async () => {
    const owner = await createActor('Właściciel'), stranger = await createActor('Obca osoba'); useActor(owner); const value = entry();
    await commitChanges(owner.user.uid, 'events', [], [value], parseEntry);
    const ref = doc(currentDatabase(), 'users', owner.user.uid, 'events', value.id);
    await expect(getDoc(doc(stranger.database, ref.path))).rejects.toMatchObject({ code: 'permission-denied' });
    await commitChanges(owner.user.uid, 'events', [value], [{ ...value, title: 'Zmieniony wpis' }], parseEntry);
    expect((await getDoc(ref)).data()?.title).toBe('Zmieniony wpis');
    await commitChanges(owner.user.uid, 'events', [{ ...value, title: 'Zmieniony wpis' }], [], parseEntry);
    expect((await getDoc(ref)).exists()).toBe(false);
  });
  test('ponowny import nie odtwarza usuniętego projektu i zachowuje lokalną kopię', async () => {
    const owner = await createActor('Właściciel'); useActor(owner);
    await AsyncStorage.setItem('projects', JSON.stringify([project()]));
    await AsyncStorage.setItem('calendar-entries', JSON.stringify([entry()]));
    await importLocalData(owner.user.uid);
    const ref = doc(currentDatabase(), 'users', owner.user.uid, 'projects', project().id);
    await deleteDoc(ref); await importLocalData(owner.user.uid);
    expect((await getDoc(ref)).exists()).toBe(false);
    expect(JSON.parse((await AsyncStorage.getItem('projects'))!)).toHaveLength(1);
  });
});
