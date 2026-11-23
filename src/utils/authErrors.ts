import { FirebaseError } from 'firebase/app';

const MESSAGES: Record<string, string> = {
  'functions/not-found': 'Wyłączanie kont nie zostało jeszcze uruchomione na serwerze.',
  'functions/unavailable': 'Nie można połączyć się z serwerem. Sprawdź internet i spróbuj ponownie.',
  'functions/unauthenticated': 'Sesja wygasła. Zaloguj się ponownie.',
  'functions/failed-precondition': 'Potwierdź operację aktualnym hasłem i spróbuj ponownie.',
  'functions/internal': 'Nie udało się wyłączyć konta. Spróbuj ponownie. Jeśli funkcja nie została wdrożona, uruchom ją w Firebase.',
  'auth/invalid-credential': 'Nieprawidłowy e-mail lub hasło.',
  'auth/wrong-password': 'Nieprawidłowy e-mail lub hasło.',
  'auth/user-not-found': 'Nieprawidłowy e-mail lub hasło.',
  'auth/invalid-login-credentials': 'Nieprawidłowy e-mail lub hasło.',
  'auth/email-already-in-use': 'Konto z tym adresem e-mail już istnieje.',
  'auth/invalid-email': 'Podaj poprawny adres e-mail.',
  'auth/missing-password': 'Podaj hasło.',
  'auth/weak-password': 'Hasło jest za słabe. Użyj co najmniej 6 znaków.',
  'auth/password-does-not-meet-requirements': 'Hasło nie spełnia wymagań ustawionych dla kont.',
  'auth/too-many-requests': 'Zbyt wiele prób. Spróbuj ponownie za chwilę.',
  'auth/network-request-failed': 'Sprawdź połączenie z internetem i spróbuj ponownie.',
  'auth/user-disabled': 'To konto zostało wyłączone.',
  'auth/operation-not-allowed': 'Logowanie e-mailem i hasłem nie jest włączone w Firebase.',
  'auth/requires-recent-login': 'Podaj aktualne hasło lub zaloguj się ponownie, aby zmienić e-mail.',
  'auth/invalid-api-key': 'Konfiguracja Firebase jest nieprawidłowa.',
  'auth/user-token-expired': 'Sesja wygasła. Zaloguj się ponownie.',
};

export function authErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return MESSAGES[error.code] ?? 'Nie udało się wykonać operacji w Firebase. Spróbuj ponownie.';
  }
  return error instanceof Error ? error.message : 'Nie udało się wykonać operacji. Spróbuj ponownie.';
}
