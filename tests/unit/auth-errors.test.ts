import { FirebaseError } from 'firebase/app';
import { authErrorMessage } from '@/utils/authErrors';

describe('Komunikaty uwierzytelniania', () => {
  test.each(['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'])('nie ujawnia, czy konto istnieje (%s)', (code) => {
    expect(authErrorMessage(new FirebaseError(code, 'Technical details'))).toBe('Nieprawidłowy e-mail lub hasło.');
  });
  test('informuje o wyłączonym koncie', () => expect(authErrorMessage(new FirebaseError('auth/user-disabled', 'Disabled'))).toBe('To konto zostało wyłączone.'));
  test('zachowuje komunikat lokalnej walidacji', () => expect(authErrorMessage(new Error('Podaj nazwisko.'))).toBe('Podaj nazwisko.'));
});
