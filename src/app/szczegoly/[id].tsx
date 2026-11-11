import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { EventModal } from '@/components/EventModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useEvents } from '@/context/events';
import { colors } from '@/theme/colors';
import { formatDateKey } from '@/utils/calendar';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getEntry, updateEntry, removeEntry } = useEvents();
  const [editVisible, setEditVisible] = useState(false);

  const entry = typeof id === 'string' ? getEntry(id) : undefined;

  if (!entry) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Nie znaleziono wpisu.</Text>
        <PrimaryButton label="Wróć do kalendarza" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  const confirmDelete = () => {
    Alert.alert('Usuń wpis', `Czy na pewno chcesz usunąć „${entry.title}”?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          void removeEntry(entry.id).then(() => router.back());
        },
      },
    ]);
  };

  return (
    <ScreenScaffold title={entry.title} subtitle={formatDateKey(entry.dateKey)} topInset={false}>
      <Card
        title={entry.type === 'reminder' ? 'Przypomnienie' : 'Wydarzenie'}
        description={entry.time ? `Godzina: ${entry.time}` : 'Bez konkretnej godziny'}
      />
      <Card title="Notatka" description={entry.notes || 'Brak dodatkowych informacji.'} />
      <PrimaryButton label="Edytuj" variant="outline" onPress={() => setEditVisible(true)} />
      <PrimaryButton label="Usuń" variant="danger" onPress={confirmDelete} />

      <EventModal
        visible={editVisible}
        title="Edytuj wpis"
        dateKey={entry.dateKey}
        initial={{
          title: entry.title,
          notes: entry.notes,
          dateKey: entry.dateKey,
          time: entry.time,
          type: entry.type,
        }}
        onCancel={() => setEditVisible(false)}
        onConfirm={(input) => {
          void updateEntry(entry.id, input);
          setEditVisible(false);
        }}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
    gap: 16,
  },
  fallbackText: {
    fontSize: 16,
    color: colors.muted,
  },
});
