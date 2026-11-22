import { createContext, useContext, type PropsWithChildren } from 'react';
import { doc } from 'firebase/firestore';
import { useUserCollection } from '@/hooks/useUserCollection';
import { useSession } from '@/context/session';
import { userCollection } from '@/storage/cloudStorage';
import { parseEntry, type CalendarEntry, type CalendarEntryType } from '@/storage/eventsStorage';

export type CalendarEntryInput = { title: string; notes: string; dateKey: string; time: string; type: CalendarEntryType };
type EventsContextValue = {
  entries: CalendarEntry[]; isReady: boolean; loadError: boolean; error: string; saving: boolean;
  load: () => Promise<void>;
  addEntry: (input: CalendarEntryInput) => Promise<CalendarEntry>;
  updateEntry: (id: string, input: CalendarEntryInput) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  getEntry: (id: string) => CalendarEntry | undefined;
  entriesOnDate: (dateKey: string) => CalendarEntry[];
};
const EventsContext = createContext<EventsContextValue | null>(null);
export function EventsProvider({ children }: PropsWithChildren) {
  const { user } = useSession();
  const data = useUserCollection('events', parseEntry);
  const entries = [...data.items].sort((a, b) => a.dateKey.localeCompare(b.dateKey) || (a.time || '99:99').localeCompare(b.time || '99:99'));
  const normalize = (input: CalendarEntryInput) => ({ ...input, title: input.title.trim() || 'Bez tytułu', notes: input.notes.trim(), time: input.time.trim() });
  return <EventsContext.Provider value={{
    entries, isReady: data.ready, loadError: data.loadError, error: data.error, saving: data.saving, load: data.load,
    addEntry: async (input) => {
      if (!user) throw new Error('Zaloguj się ponownie.');
      const entry = { ...normalize(input), id: doc(userCollection(user.uid, 'events')).id };
      await data.persist([...entries, entry]); return entry;
    },
    updateEntry: async (id, input) => {
      if (!entries.some((entry) => entry.id === id)) throw new Error('Nie znaleziono wpisu.');
      await data.persist(entries.map((entry) => entry.id === id ? { ...entry, ...normalize(input) } : entry));
    },
    removeEntry: async (id) => { await data.persist(entries.filter((entry) => entry.id !== id)); },
    getEntry: (id) => entries.find((entry) => entry.id === id),
    entriesOnDate: (dateKey) => entries.filter((entry) => entry.dateKey === dateKey),
  }}>{children}</EventsContext.Provider>;
}
export function useEvents() {
  const value = useContext(EventsContext);
  if (!value) throw new Error('useEvents musi być użyty wewnątrz EventsProvider');
  return value;
}
