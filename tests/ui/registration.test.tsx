import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import RegisterScreen from '@/app/(auth)/rejestracja';
import { SessionProvider } from '@/context/session';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@/lib/firebaseAuth', () => ({ getFirebaseAuth: () => ({ currentUser: null }) }));
jest.mock('@/lib/accountActions', () => ({ disableCurrentAccount: jest.fn() }));
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((_auth, callback) => { callback(null); return jest.fn(); }),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(async () => {}),
  EmailAuthProvider: { credential: jest.fn() },
}));

async function openRegistration() {
  await render(<ThemeProvider><SessionProvider><RegisterScreen /></SessionProvider></ThemeProvider>);
  await screen.findByLabelText('Imię');
}
async function fillCredentials() {
  await fireEvent.changeText(screen.getByLabelText('E-mail'), ' ANNA@EXAMPLE.TEST ');
  await fireEvent.changeText(screen.getByLabelText('Hasło'), 'Test12345!');
  await fireEvent.changeText(screen.getByLabelText('Powtórz hasło'), 'Test12345!');
}

describe('Formularz rejestracji z prawdziwym SessionProvider', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.mocked(createUserWithEmailAndPassword).mockResolvedValue({ user: { uid: 'new-user', email: 'anna@example.test', displayName: null } } as never);
  });
  test('imię i nazwisko są osobnymi, edytowalnymi polami', async () => {
    await openRegistration();
    await fireEvent.changeText(screen.getByLabelText('Imię'), 'Anna Maria');
    await fireEvent.changeText(screen.getByLabelText('Nazwisko'), 'Kowalska Nowak');
    expect(screen.getByLabelText('Imię')).toHaveDisplayValue('Anna Maria');
    expect(screen.getByLabelText('Nazwisko')).toHaveDisplayValue('Kowalska Nowak');
  });
  test('wymaga nazwiska i nie tworzy niepełnego konta', async () => {
    await openRegistration(); await fillCredentials();
    await fireEvent.changeText(screen.getByLabelText('Imię'), 'Anna');
    await fireEvent.press(screen.getByRole('button', { name: 'Zarejestruj się' }));
    expect(await screen.findByText('Podaj nazwisko.')).toBeVisible();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });
  test('różne hasła zatrzymują rejestrację przed wywołaniem Firebase', async () => {
    await openRegistration(); await fillCredentials();
    await fireEvent.changeText(screen.getByLabelText('Imię'), 'Anna');
    await fireEvent.changeText(screen.getByLabelText('Nazwisko'), 'Nowak');
    await fireEvent.changeText(screen.getByLabelText('Powtórz hasło'), 'Inne12345!');
    await fireEvent.press(screen.getByRole('button', { name: 'Zarejestruj się' }));
    expect(await screen.findByText('Podane hasła różnią się.')).toBeVisible();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });
  test('zachowuje wieloczłonowe imię i nazwisko przy tworzeniu profilu', async () => {
    await openRegistration(); await fillCredentials();
    await fireEvent.changeText(screen.getByLabelText('Imię'), ' Anna  Maria ');
    await fireEvent.changeText(screen.getByLabelText('Nazwisko'), ' Kowalska  Nowak ');
    await fireEvent.press(screen.getByRole('button', { name: 'Zarejestruj się' }));
    await waitFor(() => expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'anna@example.test', 'Test12345!'));
    expect(updateProfile).toHaveBeenCalledWith(expect.anything(), { displayName: 'Anna Maria Kowalska Nowak' });
    const profiles = JSON.parse((await AsyncStorage.getItem('account-profiles'))!);
    expect(profiles[0]).toMatchObject({ uid: 'new-user', firstName: 'Anna Maria', lastName: 'Kowalska Nowak' });
    expect(JSON.stringify(profiles)).not.toContain('Test12345!');
  });
});
