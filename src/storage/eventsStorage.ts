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

  try {
    const parsed = JSON.parse(raw) as CalendarEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveEntries(entries: CalendarEntry[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
