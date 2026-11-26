import { startFirebaseTests } from '../helpers/firebase';

describe('Zabezpieczenie testów integracyjnych', () => {
  afterEach(() => jest.restoreAllMocks());
  test('odmawia startu z adresem produkcyjnym zamiast lokalnego emulatora', async () => {
    jest.replaceProperty(process, 'env', { ...process.env, FIRESTORE_EMULATOR_HOST: 'firestore.googleapis.com:443', FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9799' });
    await expect(startFirebaseTests()).rejects.toThrow('lokalnych emulatorów');
  });
});
