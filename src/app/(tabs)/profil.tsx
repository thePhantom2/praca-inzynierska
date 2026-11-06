import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useSession } from '@/context/session';

export default function ProfileScreen() {
  const { user, signOut } = useSession();

  return (
    <ScreenScaffold title="Profil" subtitle="Dane z formularza logowania lub rejestracji.">
      <Card title="Imię i nazwisko" description={user?.name ?? '—'} />
      <Card title="E-mail" description={user?.email ?? '—'} />
      <PrimaryButton label="Wyloguj się" variant="outline" onPress={signOut} />
    </ScreenScaffold>
  );
}
