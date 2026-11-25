import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';

import { MonthCalendar } from '@/components/MonthCalendar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProjectTaskModal } from '@/components/ProjectTaskModal';
import { ProjectTeamPanel } from '@/components/ProjectTeamPanel';
import { ProjectModal } from '@/components/ProjectModal';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useProjects } from '@/context/projects';
import { type ProjectTask } from '@/storage/projectsStorage';
import { useTheme, createThemedStyles } from '@/theme/ThemeProvider';
import { buildAgenda } from '@/utils/agenda';
import { formatDateKey, parseDateKey, toDateKey } from '@/utils/calendar';

export default function ProjectScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, ready, loadError, load, persist, saving, error, setError, canManage } = useProjects();
  const project = projects.find((item) => item.id === id);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const bodyOffset = useRef(0);
  const calendarOffset = useRef(0);
  const markedDates = useMemo(() => new Set(project ? [
    project.deadline,
    ...project.tasks.flatMap((task) => task.dateKey ? [task.dateKey] : []),
  ] : []), [project]);
  const deadlineDates = useMemo(() => new Set(project ? [project.deadline] : []), [project]);

  function showDate(dateKey: string) {
    const date = parseDateKey(dateKey);
    setSelectedDate(dateKey);
    setYear(date.getFullYear());
    setMonth(date.getMonth());
    scrollRef.current?.scrollTo({
      y: Math.max(0, bodyOffset.current + calendarOffset.current - 12),
      animated: true,
    });
  }

  async function updateTasks(tasks: ProjectTask[]) {
    return persist(projects.map((item) => item.id === id ? { ...item, tasks } : item));
  }

  function taskRow(task: ProjectTask) {
    return (
      <View key={task.id} style={styles.card}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={task.title}
          accessibilityState={{ checked: task.completed, disabled: saving }}
          disabled={saving}
          style={styles.task}
          onPress={() => {
            if (!project) return;
            void updateTasks(project.tasks.map((item) =>
              item.id === task.id ? { ...item, completed: !item.completed } : item
            ));
          }}
        >
          <Ionicons name={task.completed ? 'checkbox' : 'square-outline'} color={task.completed ? colors.success : colors.primary} size={26} />
          <Text style={[styles.taskTitle, task.completed && styles.completed]}>{task.title}</Text>
        </Pressable>
        <Text style={[styles.muted, task.completed && styles.done]}>{task.completed ? 'Ukończone' : 'Do wykonania'}</Text>
        {task.description ? <Text style={styles.muted}>{task.description}</Text> : null}
      </View>
    );
  }

  if (!ready) return <ScreenScaffold title="Projekt" topInset={false}><ActivityIndicator color={colors.primary} /></ScreenScaffold>;
  if (loadError) return <ScreenScaffold title="Projekt" topInset={false}>
    <Text style={styles.error}>{error || 'Nie udało się wczytać projektu.'}</Text>
    <PrimaryButton label="Spróbuj ponownie" onPress={() => { void load(); }} />
  </ScreenScaffold>;
  if (!project) return <ScreenScaffold title="Nie znaleziono projektu" topInset={false} />;

  const dayTasks = project.tasks.filter((task) => task.dateKey === selectedDate);
  const undatedTasks = project.tasks.filter((task) => !task.dateKey);
  const completed = project.tasks.filter((task) => task.completed).length;
  const allDates = buildAgenda([], [project]).filter((item) => item.dateKey);

  return (
    <ScreenScaffold
      title={project.name}
      subtitle={`Termin: ${formatDateKey(project.deadline)}`}
      subtitleStyle={styles.error}
      topInset={false}
      scrollRef={scrollRef}
      onBodyLayout={(event) => { bodyOffset.current = event.nativeEvent.layout.y; }}
    >
      <Stack.Screen options={{ title: project.name }} />
      {project.completedAt ? (
        <Text style={styles.section}>Archiwum • Zakończono {formatDateKey(toDateKey(new Date(project.completedAt)))}</Text>
      ) : null}
      {project.description ? <Text style={styles.muted}>{project.description}</Text> : null}
      {canManage(project) ? <PrimaryButton
        label="Edytuj projekt"
        variant="outline"
        disabled={saving}
        onPress={() => { setError(''); setEditing(true); }}
      /> : null}
      <ProjectTeamPanel key={project.id} project={project} />
      <Text style={styles.section}>Ukończone zadania: {completed}/{project.tasks.length}</Text>
      <View onLayout={(event) => { calendarOffset.current = event.nativeEvent.layout.y; }}>
        <MonthCalendar year={year} month={month} selectedDateKey={selectedDate} markedDateKeys={markedDates} deadlineDateKeys={deadlineDates}
          onChangeMonth={(nextYear, nextMonth) => { setYear(nextYear); setMonth(nextMonth); }}
          onSelectDate={setSelectedDate} />
      </View>
      <Text style={styles.muted}>Kropki oznaczają terminy projektu i jego zadań.</Text>
      <PrimaryButton label="Dodaj zadanie" onPress={() => { setError(''); setAdding(true); }} />
      {error && !adding && !editing ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Text style={styles.section}>Zadania — {formatDateKey(selectedDate)}</Text>
      {dayTasks.length ? dayTasks.map(taskRow) : <View style={styles.card}><Text style={styles.muted}>Brak zadań na wybrany dzień.</Text></View>}
      {undatedTasks.length ? <>
        <Text style={styles.section}>Wcześniejsze zadania bez daty</Text>
        {undatedTasks.map(taskRow)}
      </> : null}
      <Text style={styles.section}>Wszystkie terminy</Text>
      {allDates.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={`Pokaż dzień ${formatDateKey(item.dateKey)} — ${item.type === 'deadline' ? 'zakończenie projektu' : item.title}`}
          onPress={() => showDate(item.dateKey)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <Text style={item.type === 'deadline' ? styles.error : styles.muted}>
            {formatDateKey(item.dateKey)}
          </Text>
          <Text style={styles.taskTitle}>
            {item.type === 'deadline' ? 'Zakończenie projektu' : item.title}
          </Text>
          {item.type === 'task' ? (
            <Text style={styles.muted}>{item.completed ? 'Ukończone' : 'Do wykonania'}</Text>
          ) : null}
        </Pressable>
      ))}
      {editing && canManage(project) ? (
        <ProjectModal
          initial={project}
          saving={saving}
          error={error}
          onCancel={() => {
            if (!saving) { setEditing(false); setError(''); }
          }}
          onSave={async (updatedProject) => {
            const next = projects.map((item) => item.id === id ? { ...item, name: updatedProject.name, description: updatedProject.description, deadline: updatedProject.deadline } : item);
            if (await persist(next)) setEditing(false);
          }}
          onDeleted={() => {
            setEditing(false);
            router.replace('/projekty');
          }}
        />
      ) : null}
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

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 8 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  task: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 12 },
  taskTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  completed: { color: colors.muted, textDecorationLine: 'line-through' },
  done: { color: colors.success, fontWeight: '600' },
  error: { color: colors.danger },
  pressed: { opacity: 0.75 },
}));
