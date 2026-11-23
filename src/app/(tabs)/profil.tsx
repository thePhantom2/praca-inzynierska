import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { LocalDataImport } from '@/components/LocalDataImport';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useSession } from '@/context/session';
import { colors } from '@/theme/colors';
import { authErrorMessage } from '@/utils/authErrors';

export default function ProfileScreen() {
  const { user, signOut, profileWarning } = useSession();
  const [error, setError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError('');
    try {
      await signOut();
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <ScreenScaffold title="Konto">
      <View style={styles.identity}>
        <Text style={styles.nickname}>{user?.nickname || 'Ustaw nick'}</Text>
        <Text style={styles.fullName}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      <PrimaryButton label="Ustawienia konta" onPress={() => router.push('/ustawienia-konta')} />
      <LocalDataImport key={user?.uid} />
      <Card title="Język" description="Polski" />
      <Card title="Wersja" description="1.0.0" />
      {profileWarning ? <Text accessibilityRole="alert" style={styles.warning}>{profileWarning}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={signingOut ? 'Wylogowywanie…' : 'Wyloguj się'} variant="outline" disabled={signingOut} onPress={() => { void handleSignOut(); }} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  warning: { fontSize: 14, lineHeight: 20, color: colors.reminder },
  error: { fontSize: 14, lineHeight: 20, color: colors.danger },
  identity: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  nickname: { fontSize: 26, fontWeight: '700', color: colors.text },
  fullName: { fontSize: 16, color: colors.muted },
  email: { marginTop: 6, fontSize: 14, color: colors.muted },
});
