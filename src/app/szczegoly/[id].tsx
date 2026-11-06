import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { getSampleItem } from '@/data/sampleItems';
import { colors } from '@/theme/colors';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = typeof id === 'string' ? getSampleItem(id) : undefined;

  if (!item) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Nie znaleziono elementu.</Text>
      </View>
    );
  }

  return (
    <ScreenScaffold title={item.title} subtitle={`Identyfikator: ${item.id}`}>
      <Card title="Opis" description={item.description} />
      <Card
        title="Co dalej"
        description="Ten ekran jest poza belką zakładek — wróć strzałką wstecz albo gestem."
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
  },
  fallbackText: {
    fontSize: 16,
    color: colors.muted,
  },
});
