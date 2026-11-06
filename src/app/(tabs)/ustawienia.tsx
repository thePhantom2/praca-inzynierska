import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useSession } from '@/context/session';

export default function SettingsScreen() {
  const { signOut } = useSession();

  return (
    <ScreenScaffold
      title="Ustawienia"
      subtitle="Miejsce na opcje aplikacji (powiadomienia, język, motyw)."
    >
      <Card title="Powiadomienia" description="Wyłączone (placeholder)" />
      <Card title="Język" description="Polski" />
      <Card title="Wersja" description="1.0.0 — szkielet Expo SDK 58" />
      <PrimaryButton label="Wyloguj się" variant="outline" onPress={signOut} />
    </ScreenScaffold>
  );
}
