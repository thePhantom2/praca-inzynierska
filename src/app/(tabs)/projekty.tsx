import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProjectModal } from '@/components/ProjectModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { type Project } from '@/storage/projectsStorage';
import { useProjects } from '@/context/projects';
import { colors } from '@/theme/colors';
import { formatDateKey, toDateKey } from '@/utils/calendar';

export default function ProjectsScreen() {
  const { projects, ready, loadError, error, saving, load, persist, setError } = useProjects();
  const [editor, setEditor] = useState<{ project?: Project } | null>(null);

  return (
    <ScreenScaffold title="Projekty" subtitle="Wszystkie projekty, terminy i postęp zadań w jednym miejscu.">
      {!ready ? <ActivityIndicator color={colors.primary} /> : loadError ? (
        <View style={styles.card}>
          <Text style={styles.error}>Nie udało się wczytać projektów.</Text>
          <PrimaryButton label="Spróbuj ponownie" onPress={() => { void load(); }} />
        </View>
      ) : (
        <>
          <PrimaryButton label="Dodaj projekt" onPress={() => { setError(''); setEditor({}); }} />
          {error && !editor ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {projects.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.name}>Nie masz jeszcze projektów</Text>
              <Text style={styles.muted}>Dodaj pierwszy projekt, określ termin i wpisz zadania do wykonania.</Text>
            </View>
          ) : [...projects].sort((a, b) => a.deadline.localeCompare(b.deadline)).map((project) => {
            const done = project.tasks.filter((task) => task.completed).length;
            const total = project.tasks.length;
            const overdue = project.deadline < toDateKey(new Date()) && (total === 0 || done < total);
            return (
              <View key={project.id} style={styles.card}>
                <View style={styles.heading}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Otwórz projekt ${project.name}`} style={styles.grow}
                    onPress={() => router.push({ pathname: '/projekt/[id]', params: { id: project.id } })}>
                    <Text style={styles.name}>{project.name}</Text>
                    <Text style={styles.editLabel}>Otwórz projekt ›</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Edytuj nazwę lub opis projektu ${project.name}`}
                    disabled={saving} onPress={() => { setError(''); setEditor({ project }); }}
                    style={({ pressed }) => [styles.edit, pressed && styles.pressed]}>
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                    <Text style={styles.editLabel}>Edytuj</Text>
                  </Pressable>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={`Kalendarz projektu ${project.name}`}
                  style={{ gap: 12 }} onPress={() => router.push({ pathname: '/projekt/[id]', params: { id: project.id } })}>
                <Text numberOfLines={3} style={styles.muted}>{project.description || 'Brak opisu'}</Text>
                <Text style={[styles.muted, overdue && styles.error]}>Termin: {formatDateKey(project.deadline)}{overdue ? ' • Po terminie' : ''}</Text>
                <Text style={styles.count}>Zadania: {done}/{total}</Text>
                <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total || 1, now: done, text: `${done} z ${total} zadań ukończonych` }}>
                  <View style={[styles.fill, { width: `${total ? (done / total) * 100 : 0}%` }]} />
                </View>
                </Pressable>
                {project.tasks.map((task) => (
                  <Pressable key={task.id} accessibilityRole="checkbox" accessibilityState={{ checked: task.completed, disabled: saving }}
                    accessibilityLabel={task.title} disabled={saving} style={styles.task}
                    onPress={() => { void persist(projects.map((item) => item.id === project.id ? {
                      ...item, tasks: item.tasks.map((entry) => entry.id === task.id ? { ...entry, completed: !entry.completed } : entry),
                    } : item)); }}>
                    <Ionicons name={task.completed ? 'checkbox' : 'square-outline'} size={24} color={task.completed ? colors.primary : colors.muted} />
                    <Text style={[styles.taskTitle, task.completed && styles.completed]}>{task.title}</Text>
                  </Pressable>
                ))}
              </View>
            );
          })}
        </>
      )}
      {editor ? <ProjectModal initial={editor.project} saving={saving} error={error}
        onCancel={() => { if (!saving) { setEditor(null); setError(''); } }}
        onSave={async (project) => {
          const next = editor.project ? projects.map((item) => item.id === project.id ? project : item) : [...projects, project];
          if (await persist(next)) setEditor(null);
        }} /> : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grow: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, lineHeight: 21, color: colors.muted },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 8 },
  editLabel: { color: colors.primary, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  count: { fontSize: 14, fontWeight: '600', color: colors.text },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  taskTitle: { flex: 1, fontSize: 14, color: colors.text },
  completed: { color: colors.muted, textDecorationLine: 'line-through' },
  error: { color: colors.danger, fontSize: 14 },
});
