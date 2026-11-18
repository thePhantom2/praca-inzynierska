import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AgendaItemCard } from '@/components/AgendaItemCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useEvents } from '@/context/events';
import { useProjects } from '@/context/projects';
import { useSession } from '@/context/session';
import { colors } from '@/theme/colors';
import { buildAgenda, getUpcomingAgenda } from '@/utils/agenda';
import { toDateKey } from '@/utils/calendar';

export default function HomeScreen() {
  const { user } = useSession();
  const { entries, isReady } = useEvents();
  const { projects, ready, loadError, load } = useProjects();
  const [todayKey, setTodayKey] = useState(() => toDateKey(new Date()));

  useFocusEffect(useCallback(() => {
    setTodayKey(toDateKey(new Date()));
  }, []));

  const upcoming = useMemo(
    () => getUpcomingAgenda(buildAgenda(entries, projects), todayKey),
    [entries, projects, todayKey]
  );
  const displayName = user?.nickname || user?.name.split(' ')[0];

  return (
    <ScreenScaffold
      title={displayName ? `Cześć, ${displayName}` : 'Start'}
      subtitle="Zadania, wydarzenia i terminy od dziś do 7 dni do przodu."
    >
      {!isReady || !ready ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : (
        <>
          {loadError ? (
            <View style={styles.card}>
              <Text style={styles.error}>Nie udało się wczytać zadań i terminów projektów.</Text>
              <PrimaryButton label="Spróbuj ponownie" onPress={() => { void load(); }} />
            </View>
          ) : null}
          {upcoming.length === 0 && !loadError ? (
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
  loader: { marginTop: 24 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 14, lineHeight: 20, color: colors.muted },
  error: { fontSize: 14, lineHeight: 20, color: colors.danger },
});
