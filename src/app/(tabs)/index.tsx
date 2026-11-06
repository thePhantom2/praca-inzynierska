import { router } from 'expo-router';

import { Card } from '@/components/Card';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { sampleItems } from '@/data/sampleItems';

export default function HomeScreen() {
  return (
    <ScreenScaffold
      title="Ekran startowy"
      subtitle="Szkielet aplikacji hybrydowej React Native (Expo). Poniżej skrót do pozostałych ekranów."
    >
      <Card
        title="Lista elementów"
        description="Przejdź do listy przykładowych rekordów."
        onPress={() => router.push('/lista')}
      />
      <Card
        title="Podgląd szczegółów"
        description={`Otwórz szczegóły: ${sampleItems[0].title}.`}
        onPress={() => router.push(`/szczegoly/${sampleItems[0].id}`)}
      />
      <Card
        title="Profil użytkownika"
        description="Placeholder danych konta."
        onPress={() => router.push('/profil')}
      />
      <Card
        title="Ustawienia"
        description="Ekran konfiguracji aplikacji."
        onPress={() => router.push('/ustawienia')}
      />
    </ScreenScaffold>
  );
}
