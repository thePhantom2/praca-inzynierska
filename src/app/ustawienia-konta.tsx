import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { TextField } from '@/components/TextField';
import { useSession } from '@/context/session';
import { createThemedStyles } from '@/theme/ThemeProvider';
import { authErrorMessage } from '@/utils/authErrors';

export default function AccountSettingsScreen() {
  const styles = useStyles();
  const { user, updateAccount, disableAccount, profileWarning } = useSession();
  const [firstName, setFirstName] = useState(user?.firstName ?? user?.name.trim().split(/\s+/)[0] ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? user?.name.trim().split(/\s+/).slice(1).join(' ') ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [deletionPassword, setDeletionPassword] = useState('');
  const [deletionError, setDeletionError] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function save() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await updateAccount({ firstName, lastName, email, nickname, currentPassword });
      setCurrentPassword('');
      if (result.emailVerificationSent) {
        setNotice(`Link potwierdzający został wysłany na ${email.trim()}. Otwórz go, a następnie zaloguj się nowym adresem. Do potwierdzenia aktywny pozostaje dotychczasowy e-mail.`);
        setEmail(user?.email ?? '');
      } else {
        router.back();
      }
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  async function confirmDeletion() {
    if (busy.current) return;
    busy.current = true; setDeleting(true); setDeletionError('');
    try {
      await disableAccount(deletionPassword);
    } catch (cause) { setDeletionError(authErrorMessage(cause)); }
    finally { busy.current = false; setDeleting(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenScaffold title="Ustawienia konta" topInset={false}>
        <Text style={styles.sectionTitle}>Dane konta</Text>
        <TextField label="Nick" value={nickname} onChangeText={setNickname} maxLength={50} />
        <TextField label="Imię" value={firstName} onChangeText={setFirstName} autoCapitalize="words" autoComplete="given-name" maxLength={100} />
        <TextField label="Nazwisko" value={lastName} onChangeText={setLastName} autoCapitalize="words" autoComplete="family-name" maxLength={100} />
        <TextField label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" maxLength={254} />
        {email.trim().toLowerCase() !== user?.email.toLowerCase() ? (
          <TextField label="Aktualne hasło (opcjonalnie)" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoComplete="current-password" />
        ) : null}
        {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
        {profileWarning ? <Text accessibilityRole="alert" style={styles.warning}>{profileWarning}</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <PrimaryButton label={saving ? 'Zapisywanie…' : 'Zapisz zmiany'} disabled={saving || deleting} onPress={() => { void save(); }} />
        <PrimaryButton label="Anuluj" variant="outline" disabled={saving || deleting} onPress={() => router.back()} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usunięcie konta</Text>
          {confirmingDeletion ? <>
            <Text style={styles.description}>Konto zostanie wyłączone i nastąpi wylogowanie. Logowanie na to konto będzie zablokowane. Twoje projekty i terminy zostaną zachowane.</Text>
            <TextField label="Aktualne hasło" value={deletionPassword} onChangeText={setDeletionPassword} secureTextEntry autoComplete="current-password" editable={!deleting} />
            {deletionError ? <Text accessibilityRole="alert" style={styles.error}>{deletionError}</Text> : null}
            <PrimaryButton label={deleting ? 'Wyłączanie konta…' : 'Potwierdzam — wyłącz konto'} variant="danger" disabled={saving || deleting || !deletionPassword} onPress={() => { void confirmDeletion(); }} />
            <PrimaryButton label="Zachowaj konto" variant="outline" disabled={deleting} onPress={() => { setConfirmingDeletion(false); setDeletionPassword(''); setDeletionError(''); }} />
          </> : <PrimaryButton label="Usuń konto" variant="danger" disabled={saving} onPress={() => setConfirmingDeletion(true)} />}
        </View>
      </ScreenScaffold>
    </KeyboardAvoidingView>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  section: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20, marginTop: 8, gap: 14 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  notice: { fontSize: 14, lineHeight: 20, color: colors.primary },
  warning: { fontSize: 14, lineHeight: 20, color: colors.reminder },
  flex: { flex: 1, backgroundColor: colors.background },
  error: { color: colors.danger, fontSize: 14 },
}));
