import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AgendaItemCard } from '@/components/AgendaItemCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useEvents } from '@/context/events';
import { useProjects } from '@/context/projects';
import { useSession } from '@/context/session';
import { colors } from '@/theme/colors';
import { buildAgenda, getUpcomingAgenda } from '@/utils/agenda';
import { formatDateKey, toDateKey } from '@/utils/calendar';

export default function HomeScreen() {
  const { user } = useSession();
  const { entries, isReady, loadError: eventsLoadError, error: eventsError, load: reloadEvents } = useEvents();
  const { projects, ready, loadError, load } = useProjects();
  const [todayKey, setTodayKey] = useState(() => toDateKey(new Date()));

  useFocusEffect(useCallback(() => {
    setTodayKey(toDateKey(new Date()));
  }, []));

  const upcoming = useMemo(
    () => getUpcomingAgenda(buildAgenda(entries, projects), todayKey),
    [entries, projects, todayKey]
  );
  const activeProjects = useMemo(
    () => projects.filter((project) => !project.completedAt)
      .sort((left, right) => left.deadline.localeCompare(right.deadline)),
    [projects]
  );
  const displayName = user?.nickname || user?.name.split(' ')[0];

  return (
    <ScreenScaffold
      title={displayName ? `Cześć, ${displayName}` : 'Start'}
      subtitle="Aktywne projekty i plany na najbliższy tydzień."
    >
      {!isReady || !ready ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : (
        <>
          <Text style={styles.sectionTitle}>Aktywne projekty</Text>
          {loadError ? (
            <View style={styles.card}>
              <Text style={styles.error}>Nie udało się wczytać projektów oraz ich zadań i terminów.</Text>
              <PrimaryButton label="Spróbuj ponownie" onPress={() => { void load(); }} />
            </View>
          ) : null}
          {!loadError && activeProjects.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>Brak aktywnych projektów.</Text>
              <PrimaryButton label="Otwórz projekty" variant="outline" onPress={() => router.push('/projekty')} />
            </View>
          ) : !loadError ? activeProjects.map((project) => {
            const completedTasks = project.tasks.filter((task) => task.completed).length;
            const totalTasks = project.tasks.length;
            const progress = totalTasks ? (completedTasks / totalTasks) * 100 : 0;

            return (
              <Pressable
                key={project.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/projekt/[id]', params: { id: project.id } })}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.emptyText} numberOfLines={3}>{project.description || 'Brak opisu'}</Text>
                <Text style={styles.deadline}>Termin zakończenia: {formatDateKey(project.deadline)}</Text>
                <Text style={styles.progressLabel}>Ukończone zadania: {completedTasks}/{totalTasks}</Text>
                <View
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: totalTasks || 1,
                    now: completedTasks,
                    text: `${completedTasks} z ${totalTasks} zadań ukończonych`,
                  }}
                  style={styles.progressTrack}
                >
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              </Pressable>
            );
          }) : null}
          <Text style={styles.sectionTitle}>Najbliższy tydzień</Text>
          {eventsLoadError ? <View style={{ gap: 10 }}><Text style={{ color: colors.danger }}>{eventsError}</Text><PrimaryButton label="Ponów wczytywanie kalendarza" onPress={() => { void reloadEvents(); }} /></View> : null}
          {upcoming.length === 0 && !loadError && !eventsLoadError ? (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>Brak planów na najbliższy tydzień</Text>
              <Text style={styles.emptyText}>Dodaj zadanie w projekcie albo wpis w prywatnym kalendarzu.</Text>
            </View>
          ) : upcoming.map((item) => <AgendaItemCard key={item.id} item={item} />)}
          <PrimaryButton label="Zobacz cały kalendarz" variant="outline" onPress={() => router.push('/kalendarz')} />
        </>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { marginTop: 8, fontSize: 20, fontWeight: '700', color: colors.text },
  projectName: { fontSize: 18, fontWeight: '700', color: colors.text },
  deadline: { fontSize: 14, lineHeight: 20, color: colors.danger },
  progressLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  pressed: { opacity: 0.75 },
  loader: { marginTop: 24 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 14, lineHeight: 20, color: colors.muted },
  error: { fontSize: 14, lineHeight: 20, color: colors.danger },
});
