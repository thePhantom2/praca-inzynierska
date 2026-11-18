import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { TextField } from '@/components/TextField';
import { useSession } from '@/context/session';
import { colors } from '@/theme/colors';

export default function AccountSettingsScreen() {
  const { user, updateAccount } = useSession();
  const [firstName, setFirstName] = useState(user?.firstName ?? user?.name.trim().split(/\s+/)[0] ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? user?.name.trim().split(/\s+/).slice(1).join(' ') ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  async function save() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      await updateAccount({ firstName, lastName, email, nickname });
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nie udało się zapisać danych. Spróbuj ponownie.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenScaffold title="Ustawienia konta" topInset={false}>
        <TextField label="Nick" value={nickname} onChangeText={setNickname} maxLength={50} />
        <TextField label="Imię" value={firstName} onChangeText={setFirstName} autoCapitalize="words" autoComplete="given-name" maxLength={100} />
        <TextField label="Nazwisko" value={lastName} onChangeText={setLastName} autoCapitalize="words" autoComplete="family-name" maxLength={100} />
        <TextField label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" maxLength={254} />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <PrimaryButton label={saving ? 'Zapisywanie…' : 'Zapisz zmiany'} disabled={saving} onPress={() => { void save(); }} />
        <PrimaryButton label="Anuluj" variant="outline" disabled={saving} onPress={() => router.back()} />
      </ScreenScaffold>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  error: { color: colors.danger, fontSize: 14 },
});
