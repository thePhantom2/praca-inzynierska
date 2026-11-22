import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, runTransaction } from 'firebase/firestore';
import { getFirestoreDatabase } from '@/lib/firebase';
import { userCollection } from '@/storage/cloudStorage';
import { loadProjects } from '@/storage/projectsStorage';
import { loadEntries } from '@/storage/eventsStorage';

// Local backups stay untouched. Completed chunks are never imported again,
// even when an imported project has subsequently been deleted in the cloud.
export async function importLocalData(uid: string) {
  const [projects, events] = await Promise.all([loadProjects(), loadEntries()]);
  let deviceId = await AsyncStorage.getItem('firestore-import-device');
  if (!deviceId) {
    deviceId = doc(userCollection(uid, 'migrations')).id;
    await AsyncStorage.setItem('firestore-import-device', deviceId);
  }
  for (const [name, records] of [['projects', projects], ['events', events]] as const) {
    const sorted = [...records].sort((a, b) => a.id.localeCompare(b.id));
    for (let offset = 0; offset < sorted.length; offset += 150) {
      const chunk = sorted.slice(offset, offset + 150);
      const marker = doc(userCollection(uid, 'migrations'), `${deviceId}-${name}-${offset}`);
      await runTransaction(getFirestoreDatabase(), async (transaction) => {
        if ((await transaction.get(marker)).exists()) return;
        const refs = chunk.map((item) => doc(userCollection(uid, name), item.id));
        const existing = await Promise.all(refs.map((ref) => transaction.get(ref)));
        chunk.forEach((item, index) => {
          if (!existing[index].exists()) transaction.set(refs[index], JSON.parse(JSON.stringify(item)));
        });
        transaction.set(marker, { completedAt: new Date().toISOString(), count: chunk.length });
      });
    }
  }
  return projects.length + events.length;
}
