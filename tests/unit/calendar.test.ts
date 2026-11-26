import { formatDateKey, getMonthCells, monthTitle, parseDateKey, relativeDateLabel, shiftMonth, toDateKey } from '@/utils/calendar';

describe('Daty kalendarza', () => {
  test('zachowuje lokalny dzień przy zapisie i odczycie daty', () => {
    const date = new Date(2030, 10, 25, 23, 59);
    expect(toDateKey(date)).toBe('2030-11-25');
    const parsed = parseDateKey('2030-11-25');
    expect([parsed.getFullYear(), parsed.getMonth(), parsed.getDate()]).toEqual([2030, 10, 25]);
  });
  test('formatuje polski miesiąc i pełną datę', () => {
    expect(formatDateKey('2030-11-25')).toBe('25 listopad 2030');
    expect(monthTitle(2030, 10)).toBe('Listopad 2030');
  });
  test('rozpoznaje jutro na granicy roku', () => {
    const today = new Date(2030, 11, 31, 12);
    expect(relativeDateLabel('2030-12-31', today)).toBe('Dziś');
    expect(relativeDateLabel('2031-01-01', today)).toBe('Jutro');
  });
  test.each([[2030, 11, 1, 2031, 0], [2030, 0, -1, 2029, 11]])('przesuwa miesiąc przez granicę roku', (year, month, offset, nextYear, nextMonth) => {
    expect(shiftMonth(year, month, offset)).toEqual({ year: nextYear, month: nextMonth });
  });
  test('układa tygodnie od poniedziałku i uwzględnia 29 lutego', () => {
    const cells = getMonthCells(2028, 1);
    expect(cells.length % 7).toBe(0);
    expect(cells.filter((day) => day !== null)).toHaveLength(29);
    expect(cells.indexOf(1)).toBe((new Date(2028, 1, 1).getDay() + 6) % 7);
    expect(getMonthCells(2029, 1).filter((day) => day !== null)).toHaveLength(28);
  });
});
