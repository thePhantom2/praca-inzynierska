import AsyncStorage from '@react-native-async-storage/async-storage';

export type CalendarEntryType = 'reminder' | 'event';

export type CalendarEntry = {
  id: string;
  title: string;
  notes: string;
  dateKey: string;
  time: string;
  type: CalendarEntryType;
};

const STORAGE_KEY = 'calendar-entries';

export async function loadEntries(): Promise<CalendarEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Nieprawidłowe dane kalendarza');
  return parsed.map(parseEntry);
}

export function parseEntry(value: unknown): CalendarEntry {
  const entry = value as CalendarEntry | null;
  if (!entry || !['id', 'title', 'notes', 'dateKey', 'time'].every((key) => typeof entry[key as keyof CalendarEntry] === 'string') || !['event', 'reminder'].includes(entry.type)) throw new Error('Nieprawidłowy wpis kalendarza');
  return entry;
}

export async function saveEntries(entries: CalendarEntry[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
