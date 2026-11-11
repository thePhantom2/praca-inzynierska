import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { EventModal } from '@/components/EventModal';
import { MonthCalendar } from '@/components/MonthCalendar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useProjects } from '@/context/projects';
import { useEvents } from '@/context/events';
import { colors } from '@/theme/colors';
import { formatDateKey, parseDateKey, toDateKey } from '@/utils/calendar';

export default function CalendarScreen() {
  const today = new Date();
  const { entries, entriesOnDate, addEntry } = useEvents();
  const { projects, ready, loadError, load } = useProjects();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(today));
  const [modalVisible, setModalVisible] = useState(false);

  const projectTasks = useMemo(() => projects.flatMap((project) =>
    project.tasks.map((task) => ({ ...task, projectId: project.id, projectName: project.name }))
  ), [projects]);
  const deadlineDateKeys = useMemo(() => new Set(projects.map((project) => project.deadline)), [projects]);
  const markedDateKeys = useMemo(() => new Set([
    ...entries.map((entry) => entry.dateKey),
    ...projectTasks.flatMap((task) => task.dateKey ? [task.dateKey] : []),
    ...deadlineDateKeys,
  ]), [entries, projectTasks, deadlineDateKeys]);
  const dayTasks = projectTasks.filter((task) => task.dateKey === selectedDateKey);
  const dayDeadlines = projects.filter((project) => project.deadline === selectedDateKey);
  const undatedTasks = projectTasks.filter((task) => !task.dateKey);
  const dayEntries = entriesOnDate(selectedDateKey);

  return (
    <ScreenScaffold
      title="Kalendarz"
      subtitle="Zadania wszystkich projektów, terminy końcowe i Twoje wydarzenia."
    >
      <MonthCalendar
        year={year}
        month={month}
        selectedDateKey={selectedDateKey}
        markedDateKeys={markedDateKeys}
        deadlineDateKeys={deadlineDateKeys}
        onChangeMonth={(nextYear, nextMonth) => {
          setYear(nextYear);
          setMonth(nextMonth);
        }}
        onSelectDate={(dateKey) => {
          setSelectedDateKey(dateKey);
          const date = parseDateKey(dateKey);
          setYear(date.getFullYear());
          setMonth(date.getMonth());
        }}
      />

      <Text style={styles.itemMeta}>Czerwone kropki: terminy projektów. Niebieskie: zadania i wydarzenia.</Text>
      {!ready ? <ActivityIndicator color={colors.primary} /> : loadError ? (
        <View style={styles.empty}>
          <Text style={styles.deadline}>Nie udało się wczytać zadań i terminów projektów.</Text>
          <PrimaryButton label="Spróbuj ponownie" onPress={() => { void load(); }} />
        </View>
      ) : null}
      <PrimaryButton label="Dodaj na ten dzień" onPress={() => setModalVisible(true)} />

      <Text style={styles.section}>{formatDateKey(selectedDateKey)}</Text>

      {dayDeadlines.map((project) => (
        <Pressable key={`deadline-${project.id}`} accessibilityRole="button"
          onPress={() => router.push({ pathname: '/projekt/[id]', params: { id: project.id } })}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
          <View style={[styles.badge, { backgroundColor: colors.danger }]} />
          <View style={styles.itemBody}>
            <Text style={[styles.itemTitle, styles.deadline]}>Termin projektu: {project.name}</Text>
            <Text style={[styles.itemMeta, styles.deadline]}>{formatDateKey(project.deadline)}</Text>
          </View>
        </Pressable>
      ))}
      {dayTasks.map((task) => (
        <Pressable key={`task-${task.projectId}-${task.id}`} accessibilityRole="button"
          onPress={() => router.push({ pathname: '/projekt/[id]', params: { id: task.projectId } })}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
          <View style={[styles.badge, { backgroundColor: colors.primary }]} />
          <View style={styles.itemBody}>
            <Text style={[styles.itemTitle, task.completed && styles.completed]}>{task.title}</Text>
            <Text style={styles.itemMeta}>{task.projectName} • {task.completed ? 'Ukończone' : 'Do wykonania'}</Text>
            {task.description ? <Text style={styles.itemMeta}>{task.description}</Text> : null}
          </View>
        </Pressable>
      ))}
      {dayEntries.length === 0 && dayTasks.length === 0 && dayDeadlines.length === 0 && ready && !loadError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Brak wpisów</Text>
          <Text style={styles.emptyText}>Na ten dzień nie ma zadań, terminów projektów ani wydarzeń.</Text>
        </View>
      ) : (
        dayEntries.map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => router.push(`/szczegoly/${entry.id}`)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View
              style={[
                styles.badge,
                { backgroundColor: entry.type === 'reminder' ? colors.reminder : colors.event },
              ]}
            />
            <View style={styles.itemBody}>
              <Text style={styles.itemTitle}>{entry.title}</Text>
              <Text style={styles.itemMeta}>
                {entry.type === 'reminder' ? 'Przypomnienie' : 'Wydarzenie'}
                {entry.time ? ` • ${entry.time}` : ''}
              </Text>
            </View>
          </Pressable>
        ))
      )}

      {undatedTasks.length > 0 ? <>
        <Text style={styles.section}>Zadania bez daty</Text>
        {undatedTasks.map((task) => (
          <Pressable key={`undated-${task.projectId}-${task.id}`} accessibilityRole="button"
            onPress={() => router.push({ pathname: '/projekt/[id]', params: { id: task.projectId } })}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            <View style={styles.itemBody}>
              <Text style={[styles.itemTitle, task.completed && styles.completed]}>{task.title}</Text>
              <Text style={styles.itemMeta}>{task.projectName} • {task.completed ? 'Ukończone' : 'Do wykonania'}</Text>
            </View>
          </Pressable>
        ))}
      </> : null}

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
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  deadline: { color: colors.danger },
  completed: { textDecorationLine: 'line-through', color: colors.muted },
  section: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  badge: {
    width: 8,
    height: 36,
    borderRadius: 4,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 13,
    color: colors.muted,
  },
  pressed: {
    opacity: 0.75,
  },
});
