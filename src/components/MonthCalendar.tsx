import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, createThemedStyles } from '@/theme/ThemeProvider';
import { WEEKDAY_LABELS, getMonthCells, monthTitle, shiftMonth, toDateKey } from '@/utils/calendar';

type MonthCalendarProps = {
  year: number;
  month: number;
  selectedDateKey: string;
  markedDateKeys: Set<string>;
  deadlineDateKeys?: Set<string>;
  onChangeMonth: (year: number, month: number) => void;
  onSelectDate: (dateKey: string) => void;
};

export function MonthCalendar({
  year,
  month,
  selectedDateKey,
  markedDateKeys,
  deadlineDateKeys,
  onChangeMonth,
  onSelectDate,
}: MonthCalendarProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const todayKey = toDateKey(new Date());
  const cells = getMonthCells(year, month);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            const next = shiftMonth(year, month, -1);
            onChangeMonth(next.year, next.month);
          }}
          style={styles.nav}
        >
          <Text style={styles.navLabel}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{monthTitle(year, month)}</Text>
        <Pressable
          onPress={() => {
            const next = shiftMonth(year, month, 1);
            onChangeMonth(next.year, next.month);
          }}
          style={styles.nav}
        >
          <Text style={styles.navLabel}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.cell} />;
          }

          const dateKey = toDateKey(new Date(year, month, day));
          const selected = dateKey === selectedDateKey;
          const isToday = dateKey === todayKey;

          return (
            <Pressable key={dateKey} style={styles.cell} onPress={() => onSelectDate(dateKey)}>
              <View
                style={[
                  styles.day,
                  isToday && styles.today,
                  selected && styles.selected,
                ]}
              >
                <Text style={[styles.dayLabel, selected && styles.selectedLabel]}>{day}</Text>
              </View>
              {markedDateKeys.has(dateKey) ? <View style={[styles.dot, deadlineDateKeys?.has(dateKey) && { backgroundColor: colors.danger }]} /> : <View style={styles.dotPlaceholder} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  month: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  nav: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 10,
  },
  navLabel: {
    fontSize: 28,
    color: colors.primary,
    lineHeight: 32,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  day: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    backgroundColor: colors.primaryContainer,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  selected: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  dayLabel: {
    fontSize: 14,
    color: colors.text,
  },
  selectedLabel: {
    color: colors.onAccent,
    fontWeight: '700',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
    marginTop: 3,
  },
}));
