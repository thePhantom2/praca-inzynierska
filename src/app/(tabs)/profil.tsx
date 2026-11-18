import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useSession } from '@/context/session';
import { colors } from '@/theme/colors';

export default function ProfileScreen() {
  const { user, signOut } = useSession();

  return (
    <ScreenScaffold title="Konto">
      <View style={styles.identity}>
        <Text style={styles.nickname}>{user?.nickname || 'Ustaw nick'}</Text>
        <Text style={styles.fullName}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      <PrimaryButton label="Ustawienia konta" onPress={() => router.push('/ustawienia-konta')} />
      <Card title="Język" description="Polski" />
      <Card title="Wersja" description="1.0.0" />
      <PrimaryButton label="Wyloguj się" variant="outline" onPress={signOut} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
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
