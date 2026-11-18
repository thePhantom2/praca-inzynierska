import { createContext, useContext, useRef, useState, type PropsWithChildren } from 'react';

import {
  loadAccountProfiles,
  saveAccountProfiles,
  type AccountProfile,
} from '@/storage/accountStorage';

export type SessionUser = AccountProfile;
export type AccountInput = Omit<SessionUser, 'name'>;

type SessionContextValue = {
  user: SessionUser | null;
  signIn: (user: Pick<SessionUser, 'name' | 'email'>) => Promise<void>;
  signOut: () => void;
  updateAccount: (input: AccountInput) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const sessionVersion = useRef(0);
  const busy = useRef(false);

  async function signIn(nextUser: Pick<SessionUser, 'name' | 'email'>) {
    if (busy.current) throw new Error('Trwa zapisywanie danych. Spróbuj ponownie za chwilę.');
    busy.current = true;
    const version = ++sessionVersion.current;
    try {
      const profiles = await loadAccountProfiles();
      const email = nextUser.email.trim().toLowerCase();
      const saved = profiles.find((profile) => profile.email === email);
      const [firstName = '', ...lastNameParts] = nextUser.name.trim().split(/\s+/);
      if (version === sessionVersion.current) {
        setUser(saved ?? {
          name: nextUser.name.trim(),
          firstName,
          lastName: lastNameParts.join(' '),
          email,
          nickname: '',
        });
      }
    } finally {
      busy.current = false;
    }
  }

  function signOut() {
    sessionVersion.current += 1;
    setUser(null);
  }

  async function updateAccount(input: AccountInput) {
    if (!user) throw new Error('Zaloguj się, aby zmienić dane konta.');
    if (busy.current) throw new Error('Trwa zapisywanie danych. Spróbuj ponownie za chwilę.');
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const email = input.email.trim().toLowerCase();
    const nickname = input.nickname.trim();
    if (!firstName || !lastName) throw new Error('Podaj imię i nazwisko.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Podaj poprawny adres e-mail.');
    const updated: SessionUser = { firstName, lastName, name: `${firstName} ${lastName}`, email, nickname };
    const version = sessionVersion.current;
    busy.current = true;
    try {
      const profiles = await loadAccountProfiles();
      if (profiles.some((profile) => profile.email === email && profile.email !== user.email)) {
        throw new Error('Ten adres e-mail jest już przypisany do innego lokalnego konta.');
      }
      const next = profiles.filter((profile) => profile.email !== user.email);
      await saveAccountProfiles([...next, updated]);
      if (version === sessionVersion.current) setUser(updated);
    } finally {
      busy.current = false;
    }
  }

  return (
    <SessionContext.Provider value={{ user, signIn, signOut, updateAccount }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession musi być użyty wewnątrz SessionProvider');
  return value;
}
