import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProjectModal } from '@/components/ProjectModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { type Project } from '@/storage/projectsStorage';
import { useProjects } from '@/context/projects';
import { useTheme, createThemedStyles } from '@/theme/ThemeProvider';
import { formatDateKey, toDateKey } from '@/utils/calendar';

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { projects, ready, loadError, error, saving, load, persist, setError, canManage } = useProjects();
  const [editor, setEditor] = useState<{ project?: Project } | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const activeCount = projects.filter((project) => !project.completedAt).length;
  const archivedCount = projects.length - activeCount;
  const visibleProjects = projects.filter((project) => Boolean(project.completedAt) === showArchived);

  return (
    <ScreenScaffold title="Projekty" subtitle="Wszystkie projekty, terminy i postęp zadań w jednym miejscu.">
      {!ready ? <ActivityIndicator color={colors.primary} /> : loadError ? (
        <View style={styles.card}>
          <Text style={styles.error}>{error || 'Nie udało się wczytać projektów.'}</Text>
          <PrimaryButton label="Spróbuj ponownie" onPress={() => { void load(); }} />
        </View>
      ) : (
        <>
          <PrimaryButton label="Dodaj projekt" onPress={() => { setError(''); setEditor({}); }} />
          <View style={styles.filters}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: !showArchived }}
              onPress={() => setShowArchived(false)}
              style={[styles.filter, !showArchived && styles.selectedFilter]}
            >
              <Text style={[styles.filterLabel, !showArchived && styles.selectedLabel]}>Aktualne ({activeCount})</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: showArchived }}
              onPress={() => setShowArchived(true)}
              style={[styles.filter, showArchived && styles.selectedFilter]}
            >
              <Text style={[styles.filterLabel, showArchived && styles.selectedLabel]}>Archiwum ({archivedCount})</Text>
            </Pressable>
          </View>
          {error && !editor ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {visibleProjects.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.name}>{showArchived ? 'Archiwum jest puste' : 'Brak aktualnych projektów'}</Text>
              <Text style={styles.muted}>
                {showArchived
                  ? 'Zakończone projekty znajdziesz tutaj.'
                  : 'Dodaj projekt, określ termin i wpisz zadania do wykonania.'}
              </Text>
            </View>
          ) : [...visibleProjects].sort((a, b) => a.deadline.localeCompare(b.deadline)).map((project) => {
            const done = project.tasks.filter((task) => task.completed).length;
            const total = project.tasks.length;
            const overdue = !project.completedAt && project.deadline < toDateKey(new Date()) && (total === 0 || done < total);
            return (
              <View key={project.id} style={styles.card}>
                <View style={styles.heading}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Otwórz projekt ${project.name}`} style={styles.grow}
                    onPress={() => router.push({ pathname: '/projekt/[id]', params: { id: project.id } })}>
                    <Text style={styles.name}>{project.name}</Text>
                    <Text style={styles.editLabel}>Otwórz projekt ›</Text>
                  </Pressable>
                  {canManage(project) ? <Pressable accessibilityRole="button" accessibilityLabel={`Edytuj nazwę lub opis projektu ${project.name}`}
                    disabled={saving} onPress={() => { setError(''); setEditor({ project }); }}
                    style={({ pressed }) => [styles.edit, pressed && styles.pressed]}>
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                    <Text style={styles.editLabel}>Edytuj</Text>
                  </Pressable> : null}
                </View>
                {project.teamId ? <Text style={styles.editLabel}>Projekt zespołowy{canManage(project) ? ' • Właściciel' : ' • Uczestnik'}</Text> : null}
                {project.completedAt ? (
                  <Text style={styles.archived}>Zakończono {formatDateKey(toDateKey(new Date(project.completedAt)))}</Text>
                ) : null}
                <Pressable accessibilityRole="button" accessibilityLabel={`Kalendarz projektu ${project.name}`}
                  style={{ gap: 12 }} onPress={() => router.push({ pathname: '/projekt/[id]', params: { id: project.id } })}>
                <Text numberOfLines={3} style={styles.muted}>{project.description || 'Brak opisu'}</Text>
                <Text style={styles.deadline}>Termin: {formatDateKey(project.deadline)}{overdue ? ' • Po terminie' : ''}</Text>
                <Text style={styles.count}>Zadania: {done}/{total}</Text>
                <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total || 1, now: done, text: `${done} z ${total} zadań ukończonych` }}>
                  <View style={[styles.fill, { width: `${total ? (done / total) * 100 : 0}%` }]} />
                </View>
                </Pressable>
                {project.tasks.map((task) => (
                  <View key={task.id} style={styles.task}>
                    <Text style={[styles.taskTitle, task.completed && styles.completed]}>{task.title}</Text>
                    <View style={[styles.taskStatus, task.completed && styles.taskStatusDone]}>
                      <Text style={[styles.taskStatusLabel, task.completed && styles.taskStatusDoneLabel]}>{task.completed ? 'Ukończone' : 'Do wykonania'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </>
      )}
      {editor ? <ProjectModal initial={editor.project} saving={saving} error={error}
        onCancel={() => { if (!saving) { setEditor(null); setError(''); } }}
        onSave={async (project) => {
          const next = editor.project ? projects.map((item) => item.id === project.id ? { ...item, name: project.name, description: project.description, deadline: project.deadline } : item) : [...projects, project];
          if (await persist(next)) {
            if (!editor.project) setShowArchived(false);
            setEditor(null);
          }
        }} /> : null}
    </ScreenScaffold>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filter: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  selectedFilter: { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
  filterLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  selectedLabel: { color: colors.primaryDark },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grow: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, lineHeight: 21, color: colors.muted },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 8 },
  editLabel: { color: colors.primary, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  count: { fontSize: 14, fontWeight: '600', color: colors.success },
  archived: { fontSize: 14, fontWeight: '600', color: colors.success },
  deadline: { fontSize: 14, lineHeight: 21, color: colors.danger },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.successContainer, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.success, borderRadius: 3 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  taskTitle: { flex: 1, fontSize: 14, color: colors.text },
  taskStatus: { backgroundColor: colors.primaryContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  taskStatusDone: { backgroundColor: colors.successContainer },
  taskStatusLabel: { color: colors.primaryDark, fontSize: 12, fontWeight: '600' },
  taskStatusDoneLabel: { color: colors.success },
  completed: { color: colors.muted, textDecorationLine: 'line-through' },
  error: { color: colors.danger, fontSize: 14 },
}));
