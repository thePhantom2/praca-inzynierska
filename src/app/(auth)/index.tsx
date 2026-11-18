import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { useSession } from '@/context/session';
import { colors } from '@/theme/colors';

export default function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Witaj ponownie</Text>
          <Text style={styles.subtitle}>
            Zaloguj się, aby wejść do aplikacji. Na tym etapie dane nie są weryfikowane.
          </Text>

          <View style={styles.form}>
            <TextField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="jan.kowalski@example.com"
            />
            <TextField
              label="Hasło"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
            <PrimaryButton
              label={signingIn ? 'Wczytywanie…' : 'Zaloguj się'}
              disabled={signingIn}
              onPress={async () => {
                if (signingIn) return;
                setSigningIn(true);
                setError('');
                try {
                  await signIn({
                    name: 'Jan Kowalski',
                    email: email.trim() || 'jan.kowalski@example.com',
                  });
                } catch {
                  setError('Nie udało się wczytać danych konta. Spróbuj ponownie.');
                } finally {
                  setSigningIn(false);
                }
              }}
            />
          </View>

          <Text style={styles.footer}>
            Nie masz konta?{' '}
            <Link href="/rejestracja" style={styles.link}>
              Zarejestruj się
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    color: colors.muted,
  },
  form: {
    marginTop: 28,
    gap: 16,
  },
  footer: {
    marginTop: 24,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
  },
});
