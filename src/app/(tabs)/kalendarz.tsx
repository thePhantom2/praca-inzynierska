import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgendaItemCard } from '@/components/AgendaItemCard';
import { EventModal } from '@/components/EventModal';
import { MonthCalendar } from '@/components/MonthCalendar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useEvents } from '@/context/events';
import { useProjects } from '@/context/projects';
import { colors } from '@/theme/colors';
import { buildAgenda, type AgendaItem } from '@/utils/agenda';
import { formatDateKey, parseDateKey, toDateKey } from '@/utils/calendar';

export default function CalendarScreen() {
  const today = new Date();
  const insets = useSafeAreaInsets();
  const { entries, isReady, addEntry } = useEvents();
  const { projects, ready, loadError, load } = useProjects();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(today));
  const [showAll, setShowAll] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const listRef = useRef<FlatList<AgendaItem>>(null);

  function showDate(dateKey: string) {
    const date = parseDateKey(dateKey);
    setSelectedDateKey(dateKey);
    setYear(date.getFullYear());
    setMonth(date.getMonth());
    setShowAll(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }

  const agenda = useMemo(() => buildAgenda(entries, projects), [entries, projects]);
  const markedDateKeys = useMemo(
    () => new Set(agenda.flatMap((item) => item.dateKey ? [item.dateKey] : [])),
    [agenda]
  );
  const deadlineDateKeys = useMemo(
    () => new Set(projects.map((project) => project.deadline)),
    [projects]
  );
  const visibleItems = useMemo(
    () => showAll ? agenda : agenda.filter((item) => item.dateKey === selectedDateKey),
    [agenda, selectedDateKey, showAll]
  );
  const loading = !isReady || !ready;

  return (
    <View style={styles.screen}>
      <FlatList
        ref={listRef}
        data={visibleItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AgendaItemCard
            item={item}
            onPress={showAll && item.dateKey ? () => showDate(item.dateKey) : undefined}
          />
        )}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Moje terminy</Text>
            <MonthCalendar
              year={year}
              month={month}
              selectedDateKey={selectedDateKey}
              markedDateKeys={markedDateKeys}
              deadlineDateKeys={deadlineDateKeys}
              onChangeMonth={(nextYear, nextMonth) => { setYear(nextYear); setMonth(nextMonth); }}
              onSelectDate={(dateKey) => { setSelectedDateKey(dateKey); setShowAll(false); }}
            />
            <Text style={styles.meta}>Czerwone kropki oznaczają terminy projektów.</Text>
            <PrimaryButton
              label={`Dodaj wpis na ${formatDateKey(selectedDateKey)}`}
              onPress={() => setModalVisible(true)}
            />
            <View style={styles.filters}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: showAll }}
                onPress={() => setShowAll(true)}
                style={[styles.filter, showAll && styles.selectedFilter]}
              >
                <Text style={[styles.filterLabel, showAll && styles.selectedLabel]}>Wszystkie</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: !showAll }}
                onPress={() => setShowAll(false)}
                style={[styles.filter, !showAll && styles.selectedFilter]}
              >
                <Text style={[styles.filterLabel, !showAll && styles.selectedLabel]}>Wybrany dzień</Text>
              </Pressable>
            </View>
            {loading ? <ActivityIndicator color={colors.primary} /> : null}
            {loadError ? (
              <View style={styles.empty}>
                <Text style={styles.error}>Nie udało się wczytać zadań i terminów projektów.</Text>
                <PrimaryButton label="Spróbuj ponownie" onPress={() => { void load(); }} />
              </View>
            ) : null}
            <Text style={styles.section}>
              {showAll ? 'Wszystkie wydarzenia, terminy i zadania' : formatDateKey(selectedDateKey)}
            </Text>
          </View>
        }
        ListEmptyComponent={!loading && !loadError ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Brak wpisów</Text>
            <Text style={styles.meta}>
              {showAll
                ? 'Dodaj wpis w kalendarzu lub zadanie w projekcie.'
                : 'Na wybrany dzień nie ma wydarzeń, terminów projektów ani zadań.'}
            </Text>
          </View>
        ) : undefined}
      />
      <EventModal
        visible={modalVisible}
        title="Nowy wpis"
        dateKey={selectedDateKey}
        onCancel={() => setModalVisible(false)}
        onConfirm={(input) => {
          void addEntry(input);
          setModalVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, gap: 12 },
  header: { gap: 16 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, lineHeight: 20, color: colors.muted },
  section: { fontSize: 16, fontWeight: '700', color: colors.text },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filter: {
    flexGrow: 1,
    minHeight: 44,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  selectedFilter: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  selectedLabel: { color: colors.surface },
  empty: {
    backgroundColor: colors.surface,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  error: { fontSize: 14, lineHeight: 20, color: colors.danger },
});
