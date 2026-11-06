import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

export type SessionUser = {
  name: string;
  email: string;
};

type SessionContextValue = {
  user: SessionUser | null;
  signIn: (user: SessionUser) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null);

  const value = useMemo(
    () => ({
      user,
      signIn: (nextUser: SessionUser) => setUser(nextUser),
      signOut: () => setUser(null),
    }),
    [user]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession musi być użyty wewnątrz SessionProvider');
  }
  return value;
}
