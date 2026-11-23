import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  verifyBeforeUpdateEmail,
  type User,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';

import { disableCurrentAccount } from '@/lib/accountActions';
import { getFirebaseAuth } from '@/lib/firebaseAuth';
import { loadAccountProfiles, saveAccountProfiles, type AccountProfile } from '@/storage/accountStorage';
import { authErrorMessage } from '@/utils/authErrors';

export type SessionUser = AccountProfile & { uid: string };
export type AccountInput = Pick<AccountProfile, 'firstName' | 'lastName' | 'email' | 'nickname'> & {
  currentPassword?: string;
};
type Credentials = { email: string; password: string };
type RegistrationInput = Credentials & { firstName: string; lastName: string; repeatPassword: string };

type SessionContextValue = {
  user: SessionUser | null;
  isReady: boolean;
  initializationError: string;
  profileWarning: string;
  retryInitialization: () => void;
  signIn: (input: Credentials) => Promise<void>;
  signUp: (input: RegistrationInput) => Promise<void>;
  signOut: () => Promise<void>;
  disableAccount: (password: string) => Promise<void>;
  updateAccount: (input: AccountInput) => Promise<{ emailVerificationSent: boolean }>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

function normalizedEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Podaj poprawny adres e-mail.');
  return email;
}

function defaultProfile(firebaseUser: User): SessionUser {
  const name = firebaseUser.displayName?.trim() ?? '';
  const [firstName = '', ...lastNameParts] = name.split(/\s+/);
  return {
    uid: firebaseUser.uid,
    name,
    firstName,
    lastName: lastNameParts.join(' '),
    email: firebaseUser.email ?? '',
    nickname: '',
  };
}

async function loadProfile(firebaseUser: User): Promise<SessionUser> {
  const profiles = await loadAccountProfiles();
  const saved = profiles.find((item) => item.uid === firebaseUser.uid)
    ?? profiles.find((item) => !item.uid && item.email.toLowerCase() === firebaseUser.email?.toLowerCase());
  return { ...(saved ?? defaultProfile(firebaseUser)), uid: firebaseUser.uid, email: firebaseUser.email ?? '' };
}

async function storeProfile(profile: SessionUser) {
  const profiles = await loadAccountProfiles();
  const remaining = profiles.filter((saved) =>
    saved.uid !== profile.uid && (saved.uid !== undefined || saved.email !== profile.email)
  );
  await saveAccountProfiles([...remaining, profile]);
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [initializationError, setInitializationError] = useState('');
  const [profileWarning, setProfileWarning] = useState('');
  const [initializationAttempt, setInitializationAttempt] = useState(0);
  const currentProfile = useRef<SessionUser | null>(null);
  const revision = useRef(0);
  const busy = useRef(false);

  const applyUser = useCallback(async (firebaseUser: User | null, preferred?: SessionUser) => {
    const version = ++revision.current;
    if (!firebaseUser) {
      currentProfile.current = null;
      setUser(null);
      setProfileWarning('');
      setIsReady(true);
      return;
    }

    let profile = preferred ?? currentProfile.current;
    if (profile?.uid !== firebaseUser.uid) {
      profile = defaultProfile(firebaseUser);
      try {
        profile = await loadProfile(firebaseUser);
      } catch {
        if (version === revision.current) setProfileWarning('Nie udało się odczytać lokalnych danych profilu. Możesz je uzupełnić w ustawieniach konta.');
      }
    }
    if (version !== revision.current) return;
    const next = { ...profile, email: firebaseUser.email ?? '' };
    currentProfile.current = next;
    setUser(next);
    setIsReady(true);
  }, []);

  useEffect(() => {
    setIsReady(false);
    setInitializationError('');
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChanged(getFirebaseAuth(), (firebaseUser) => {
        if (!busy.current) void applyUser(firebaseUser);
      }, (error) => {
        setInitializationError(authErrorMessage(error));
        setIsReady(true);
      });
    } catch (error) {
      setInitializationError(authErrorMessage(error));
      setIsReady(true);
    }
    return () => { revision.current += 1; unsubscribe?.(); };
  }, [applyUser, initializationAttempt]);

  async function saveProfile(firebaseUser: User, profile: SessionUser) {
    const warnings: string[] = [];
    try {
      await updateProfile(firebaseUser, { displayName: profile.name });
    } catch {
      warnings.push('Nie udało się zapisać imienia i nazwiska w Firebase. Ponów zapis w ustawieniach konta.');
    }
    try {
      await storeProfile(profile);
    } catch {
      warnings.push('Nie udało się zapisać profilu na urządzeniu. Ponów zapis w ustawieniach konta.');
    }
    setProfileWarning(warnings.join(' '));
    await applyUser(firebaseUser, profile);
  }

  async function signIn(input: Credentials) {
    const email = normalizedEmail(input.email);
    if (!input.password) throw new Error('Podaj hasło.');
    if (busy.current) throw new Error('Trwa inna operacja konta. Spróbuj ponownie za chwilę.');
    busy.current = true;
    setProfileWarning('');
    try {
      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, input.password);
      await applyUser(credential.user);
    } finally {
      busy.current = false;
    }
  }

  async function signUp(input: RegistrationInput) {
    const email = normalizedEmail(input.email);
    const firstName = input.firstName.trim().replace(/\s+/g, ' ');
    const lastName = input.lastName.trim().replace(/\s+/g, ' ');
    if (!firstName) throw new Error('Podaj imię.');
    if (!lastName) throw new Error('Podaj nazwisko.');
    const name = `${firstName} ${lastName}`;
    if (input.password.length < 6) throw new Error('Hasło musi mieć co najmniej 6 znaków.');
    if (input.password !== input.repeatPassword) throw new Error('Podane hasła różnią się.');
    if (busy.current) throw new Error('Trwa inna operacja konta. Spróbuj ponownie za chwilę.');
    busy.current = true;
    setProfileWarning('');
    try {
      const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, input.password);
      let profile = defaultProfile(credential.user);
      try {
        profile = await loadProfile(credential.user);
      } catch {
        setProfileWarning('Nie udało się odczytać wcześniejszych danych profilu.');
      }
      await saveProfile(credential.user, {
        ...profile, name, firstName, lastName,
      });
    } finally {
      busy.current = false;
    }
  }

  async function signOut() {
    if (busy.current) throw new Error('Trwa inna operacja konta. Spróbuj ponownie za chwilę.');
    busy.current = true;
    try {
      await firebaseSignOut(getFirebaseAuth());
      await applyUser(null);
    } finally {
      busy.current = false;
    }
  }

  async function disableAccount(password: string) {
    if (!password) throw new Error('Podaj aktualne hasło.');
    const auth = getFirebaseAuth();
    const firebaseUser = auth.currentUser;
    if (!firebaseUser?.email || firebaseUser.uid !== currentProfile.current?.uid) throw new Error('Zaloguj się ponownie.');
    if (busy.current) throw new Error('Trwa inna operacja konta. Spróbuj ponownie za chwilę.');
    busy.current = true;
    try {
      try {
        await reauthenticateWithCredential(firebaseUser, EmailAuthProvider.credential(firebaseUser.email, password));
        await disableCurrentAccount();
      } catch (error) {
        // A prior attempt may have succeeded despite a lost network response.
        if ((error as { code?: string }).code !== 'auth/user-disabled') throw error;
      }
      try { await firebaseSignOut(auth); }
      finally { await applyUser(null); }
    } finally { busy.current = false; }
  }

  async function updateAccount(input: AccountInput) {
    const firebaseUser = getFirebaseAuth().currentUser;
    const profile = currentProfile.current;
    if (!firebaseUser || !profile || firebaseUser.uid !== profile.uid) throw new Error('Zaloguj się ponownie, aby zmienić dane konta.');
    const email = normalizedEmail(input.email);
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    if (!firstName || !lastName) throw new Error('Podaj imię i nazwisko.');
    if (busy.current) throw new Error('Trwa inna operacja konta. Spróbuj ponownie za chwilę.');
    busy.current = true;
    try {
      const emailVerificationSent = email !== firebaseUser.email?.toLowerCase();
      if (emailVerificationSent) {
        if (input.currentPassword) {
          await reauthenticateWithCredential(firebaseUser, EmailAuthProvider.credential(firebaseUser.email!, input.currentPassword));
        }
        await verifyBeforeUpdateEmail(firebaseUser, email);
      }
      await saveProfile(firebaseUser, {
        uid: firebaseUser.uid,
        name: `${firstName} ${lastName}`,
        firstName, lastName,
        email: firebaseUser.email ?? '',
        nickname: input.nickname.trim(),
      });
      return { emailVerificationSent };
    } finally {
      busy.current = false;
    }
  }

  return (
    <SessionContext.Provider value={{
      user, isReady, initializationError, profileWarning,
      retryInitialization: () => setInitializationAttempt((attempt) => attempt + 1),
      signIn, signUp, signOut, disableAccount, updateAccount,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession musi być użyty wewnątrz SessionProvider');
  return value;
}
