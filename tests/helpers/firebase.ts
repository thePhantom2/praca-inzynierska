import { readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, terminate, type Firestore } from 'firebase/firestore';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import type { SessionUser } from '@/context/session';

export const TEST_PROJECT_ID = 'demo-praca-tests';
const FIRESTORE_HOST = '127.0.0.1:8788';
const AUTH_HOST = '127.0.0.1:9799';
let environment: RulesTestEnvironment | undefined;
let selectedDatabase: Firestore | undefined;
const apps: Array<{ app: FirebaseApp; database: Firestore }> = [];

export function currentDatabase(): Firestore {
  if (!selectedDatabase) throw new Error('Wybierz użytkownika testowego przez useActor().');
  return selectedDatabase;
}
export type Actor = { database: Firestore; user: SessionUser };
export function useActor(actor: Actor) { selectedDatabase = actor.database; }
export async function startFirebaseTests() {
  if (process.env.FIRESTORE_EMULATOR_HOST !== FIRESTORE_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST !== AUTH_HOST) {
    throw new Error('Testy integracyjne wymagają lokalnych emulatorów. Uruchom npm run test:integration.');
  }
  environment = await initializeTestEnvironment({
    projectId: TEST_PROJECT_ID,
    firestore: { host: '127.0.0.1', port: 8788, rules: readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8') },
  });
}
export async function resetFirebaseTests() {
  await closeActors();
  if (!environment) throw new Error('Środowisko testowe nie zostało uruchomione. Użyj npm run test:integration.');
  await environment.clearFirestore();
  const response = await fetch(`http://${AUTH_HOST}/emulator/v1/projects/${TEST_PROJECT_ID}/accounts`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Nie można wyczyścić kont emulatora: ${response.status}`);
}
export async function createActor(name: string): Promise<Actor> {
  const id = randomUUID();
  const app = initializeApp({ apiKey: 'fake-test-key', projectId: TEST_PROJECT_ID, appId: '1:123:web:tests' }, `tests-${id}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${AUTH_HOST}`, { disableWarnings: true });
  const database = getFirestore(app);
  connectFirestoreEmulator(database, '127.0.0.1', 8788);
  apps.push({ app, database });
  const result = await createUserWithEmailAndPassword(auth, `${id}@example.test`, 'Test12345!');
  return { database, user: { uid: result.user.uid, name, firstName: name, lastName: 'Test', nickname: name, email: result.user.email! } };
}
export async function adminSet(documentPath: string, value: Record<string, unknown>) {
  if (!environment) throw new Error('Brak środowiska emulatorów.');
  await environment.withSecurityRulesDisabled(async (context) => { await context.firestore().doc(documentPath).set(value); });
}
export async function closeActors() {
  selectedDatabase = undefined;
  for (const { app, database } of apps.splice(0)) { await terminate(database); await deleteApp(app); }
}
export async function stopFirebaseTests() {
  if (!environment) return;
  await resetFirebaseTests();
  await environment.cleanup();
  environment = undefined;
}
