import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  loadEntries,
  saveEntries,
  type CalendarEntry,
  type CalendarEntryType,
} from '@/storage/eventsStorage';

export type CalendarEntryInput = {
  title: string;
  notes: string;
  dateKey: string;
  time: string;
  type: CalendarEntryType;
};

type EventsContextValue = {
  entries: CalendarEntry[];
  isReady: boolean;
  addEntry: (input: CalendarEntryInput) => Promise<CalendarEntry>;
  updateEntry: (id: string, input: CalendarEntryInput) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  getEntry: (id: string) => CalendarEntry | undefined;
  entriesOnDate: (dateKey: string) => CalendarEntry[];
};

const EventsContext = createContext<EventsContextValue | null>(null);

function sortEntries(entries: CalendarEntry[]) {
  return [...entries].sort((left, right) => {
    const dateCompare = left.dateKey.localeCompare(right.dateKey);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return (left.time || '99:99').localeCompare(right.time || '99:99');
  });
}

export function EventsProvider({ children }: PropsWithChildren) {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadEntries()
      .then((loaded) => setEntries(sortEntries(loaded)))
      .finally(() => setIsReady(true));
  }, []);

  const persist = useCallback(async (next: CalendarEntry[]) => {
    const sorted = sortEntries(next);
    setEntries(sorted);
    await saveEntries(sorted);
  }, []);

  const addEntry = useCallback(
    async (input: CalendarEntryInput) => {
      const entry: CalendarEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: input.title.trim() || 'Bez tytułu',
        notes: input.notes.trim(),
        dateKey: input.dateKey,
        time: input.time.trim(),
        type: input.type,
      };
      await persist([entry, ...entries]);
      return entry;
    },
    [entries, persist]
  );

  const updateEntry = useCallback(
    async (id: string, input: CalendarEntryInput) => {
      await persist(
        entries.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                title: input.title.trim() || 'Bez tytułu',
                notes: input.notes.trim(),
                dateKey: input.dateKey,
                time: input.time.trim(),
                type: input.type,
              }
            : entry
        )
      );
    },
    [entries, persist]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      await persist(entries.filter((entry) => entry.id !== id));
    },
    [entries, persist]
  );

  const getEntry = useCallback(
    (id: string) => entries.find((entry) => entry.id === id),
    [entries]
  );

  const entriesOnDate = useCallback(
    (dateKey: string) => entries.filter((entry) => entry.dateKey === dateKey),
    [entries]
  );

  const value = useMemo(
    () => ({
      entries,
      isReady,
      addEntry,
      updateEntry,
      removeEntry,
      getEntry,
      entriesOnDate,
    }),
    [addEntry, entries, entriesOnDate, getEntry, isReady, removeEntry, updateEntry]
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const value = useContext(EventsContext);
  if (!value) {
    throw new Error('useEvents musi być użyty wewnątrz EventsProvider');
  }
  return value;
}
