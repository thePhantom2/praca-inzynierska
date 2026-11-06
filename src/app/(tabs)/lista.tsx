import { router } from 'expo-router';

import { Card } from '@/components/Card';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { sampleItems } from '@/data/sampleItems';

export default function ListScreen() {
  return (
    <ScreenScaffold
      title="Lista"
      subtitle="Wybierz element, aby otworzyć piąty ekran — szczegóły."
    >
      {sampleItems.map((item) => (
        <Card
          key={item.id}
          title={item.title}
          description={item.description}
          onPress={() => router.push(`/szczegoly/${item.id}`)}
        />
      ))}
    </ScreenScaffold>
  );
}
