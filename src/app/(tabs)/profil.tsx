import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { LocalDataImport } from '@/components/LocalDataImport';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useSession } from '@/context/session';
import { useTheme, createThemedStyles } from '@/theme/ThemeProvider';
import { authErrorMessage } from '@/utils/authErrors';

export default function SettingsScreen() {
  const styles = useStyles();
  const { colors, isDark, saving: themeSaving, error: themeError, setDarkMode } = useTheme();
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
    <ScreenScaffold title="Ustawienia">
      <View style={styles.identity}>
        <Text style={styles.nickname}>{user?.nickname || 'Ustaw nick'}</Text>
        <Text style={styles.fullName}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      <PrimaryButton label="Ustawienia konta" onPress={() => router.push('/ustawienia-konta')} />
      <View style={styles.appearance}>
        <Text style={styles.sectionTitle}>Wygląd aplikacji</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Tryb ciemny</Text>
          <Switch
            accessibilityLabel="Tryb ciemny"
            value={isDark}
            disabled={themeSaving}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isDark ? colors.background : colors.surface}
            ios_backgroundColor={colors.border}
            onValueChange={(enabled) => { void setDarkMode(enabled); }}
          />
        </View>
        {themeError ? <Text accessibilityRole="alert" style={styles.error}>{themeError}</Text> : null}
      </View>
      <LocalDataImport key={user?.uid} />
      <Card title="Język" description="Polski" />
      {profileWarning ? <Text accessibilityRole="alert" style={styles.warning}>{profileWarning}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={signingOut ? 'Wylogowywanie…' : 'Wyloguj się'} variant="outline" disabled={signingOut} onPress={() => { void handleSignOut(); }} />
    </ScreenScaffold>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  appearance: { gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  settingLabel: { flex: 1, color: colors.text, fontSize: 16 },
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
}));
