const MONTH_NAMES = [
  'styczeń',
  'luty',
  'marzec',
  'kwiecień',
  'maj',
  'czerwiec',
  'lipiec',
  'sierpień',
  'wrzesień',
  'październik',
  'listopad',
  'grudzień',
];

export const WEEKDAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function formatDateKey(dateKey: string) {
  const date = parseDateKey(dateKey);
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function relativeDateLabel(dateKey: string, today = new Date()) {
  const todayKey = toDateKey(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (dateKey === todayKey) {
    return 'Dziś';
  }
  if (dateKey === toDateKey(tomorrow)) {
    return 'Jutro';
  }
  return formatDateKey(dateKey);
}

export function monthTitle(year: number, month: number) {
  const name = MONTH_NAMES[month] ?? '';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

export function getMonthCells(year: number, month: number) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: firstWeekday }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function shiftMonth(year: number, month: number, offset: number) {
  const next = new Date(year, month + offset, 1);
  return { year: next.getFullYear(), month: next.getMonth() };
}
