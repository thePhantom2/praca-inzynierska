import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useEvents } from '@/context/events';
import { useSession } from '@/context/session';
import { colors } from '@/theme/colors';
import { relativeDateLabel, toDateKey } from '@/utils/calendar';

export default function HomeScreen() {
  const { user } = useSession();
  const { entries, isReady } = useEvents();
  const todayKey = toDateKey(new Date());

  const upcoming = useMemo(
    () => entries.filter((entry) => entry.dateKey >= todayKey).slice(0, 8),
    [entries, todayKey]
  );

  const firstName = user?.name.split(' ')[0];

  return (
    <ScreenScaffold
      title={firstName ? `Cześć, ${firstName}` : 'Start'}
      subtitle="Najbliższe przypomnienia i wydarzenia."
    >
      {!isReady ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : upcoming.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Brak zbliżających się wydarzeń</Text>
          <Text style={styles.emptyText}>
            Dodaj przypomnienie albo wydarzenie w kalendarzu — pojawi się tutaj.
          </Text>
          <PrimaryButton label="Otwórz kalendarz" onPress={() => router.push('/kalendarz')} />
        </View>
      ) : (
        <>
          {upcoming.map((entry) => (
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
                  {relativeDateLabel(entry.dateKey)}
                  {entry.time ? ` • ${entry.time}` : ''}
                  {' • '}
                  {entry.type === 'reminder' ? 'Przypomnienie' : 'Wydarzenie'}
                </Text>
                {entry.notes ? (
                  <Text style={styles.itemNotes} numberOfLines={2}>
                    {entry.notes}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
          <PrimaryButton
            label="Zobacz kalendarz"
            variant="outline"
            onPress={() => router.push('/kalendarz')}
          />
        </>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 24,
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyText: {
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
    alignSelf: 'stretch',
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
  itemNotes: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
});
