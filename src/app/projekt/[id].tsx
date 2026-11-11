import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { MonthCalendar } from '@/components/MonthCalendar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProjectTaskModal } from '@/components/ProjectTaskModal';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useProjects } from '@/context/projects';
import { type ProjectTask } from '@/storage/projectsStorage';
import { colors } from '@/theme/colors';
import { formatDateKey, toDateKey } from '@/utils/calendar';

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, ready, loadError, load, persist, saving, error, setError } = useProjects();
  const project = projects.find((item) => item.id === id);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [adding, setAdding] = useState(false);
  const markedDates = useMemo(() => new Set(project?.tasks.flatMap((task) => task.dateKey ? [task.dateKey] : []) ?? []), [project]);

  async function updateTasks(tasks: ProjectTask[]) {
    return persist(projects.map((item) => item.id === id ? { ...item, tasks } : item));
  }

  function taskRow(task: ProjectTask) {
    return (
      <View key={task.id} style={styles.card}>
        <Pressable accessibilityRole="checkbox" accessibilityLabel={task.title}
          accessibilityState={{ checked: task.completed, disabled: saving }} disabled={saving}
          style={styles.task} onPress={() => { if (project) void updateTasks(project.tasks.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item)); }}>
          <Ionicons name={task.completed ? 'checkbox' : 'square-outline'} color={colors.primary} size={26} />
          <Text style={[styles.taskTitle, task.completed && styles.completed]}>{task.title}</Text>
        </Pressable>
        {task.description ? <Text style={styles.muted}>{task.description}</Text> : null}
      </View>
    );
  }

  if (!ready) return <ScreenScaffold title="Projekt" topInset={false}><ActivityIndicator color={colors.primary} /></ScreenScaffold>;
  if (loadError) return <ScreenScaffold title="Projekt" topInset={false}>
    <Text style={styles.error}>Nie udało się wczytać projektu.</Text>
    <PrimaryButton label="Spróbuj ponownie" onPress={() => { void load(); }} />
  </ScreenScaffold>;
  if (!project) return <ScreenScaffold title="Nie znaleziono projektu" topInset={false} />;

  const dayTasks = project.tasks.filter((task) => task.dateKey === selectedDate);
  const undatedTasks = project.tasks.filter((task) => !task.dateKey);
  const completed = project.tasks.filter((task) => task.completed).length;

  return (
    <ScreenScaffold title={project.name} subtitle={`Termin: ${formatDateKey(project.deadline)}`} subtitleStyle={styles.error} topInset={false}>
      <Stack.Screen options={{ title: project.name }} />
      {project.description ? <Text style={styles.muted}>{project.description}</Text> : null}
      <Text style={styles.section}>Ukończone zadania: {completed}/{project.tasks.length}</Text>
      <MonthCalendar year={year} month={month} selectedDateKey={selectedDate} markedDateKeys={markedDates}
        onChangeMonth={(nextYear, nextMonth) => { setYear(nextYear); setMonth(nextMonth); }}
        onSelectDate={setSelectedDate} />
      <Text style={styles.muted}>Kropki oznaczają dni z zadaniami tego projektu.</Text>
      <PrimaryButton label="Dodaj zadanie" onPress={() => { setError(''); setAdding(true); }} />
      {error && !adding ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Text style={styles.section}>Zadania — {formatDateKey(selectedDate)}</Text>
      {dayTasks.length ? dayTasks.map(taskRow) : <View style={styles.card}><Text style={styles.muted}>Brak zadań na wybrany dzień.</Text></View>}
      {undatedTasks.length ? <>
        <Text style={styles.section}>Wcześniejsze zadania bez daty</Text>
        {undatedTasks.map(taskRow)}
      </> : null}
      {adding ? <ProjectTaskModal dateKey={selectedDate} saving={saving} error={error}
        onCancel={() => { if (!saving) { setAdding(false); setError(''); } }}
        onSave={async (task) => {
          if (await updateTasks([...project.tasks, task])) {
            setSelectedDate(task.dateKey!);
            const [nextYear, nextMonth] = task.dateKey!.split('-').map(Number);
            setYear(nextYear); setMonth(nextMonth - 1);
            setAdding(false);
          }
        }} /> : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 8 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  task: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 12 },
  taskTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  completed: { color: colors.muted, textDecorationLine: 'line-through' },
  error: { color: colors.danger },
});
