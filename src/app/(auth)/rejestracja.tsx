import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { useSession } from '@/context/session';
import { useTheme, createThemedStyles } from '@/theme/ThemeProvider';
import { authErrorMessage } from '@/utils/authErrors';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { signUp } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [repeatPassword, setRepeatPassword] = useState('');

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={styles.title}>Utwórz konto</Text>
        <Text style={styles.subtitle}>
          Utwórz konto, podając imię i nazwisko, e-mail oraz hasło.
        </Text>

        <View style={styles.form}>
          <TextField
            label="Imię i nazwisko"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholder="Jan Kowalski"
          />
          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="jan.kowalski@example.com"
          />
          <TextField
            label="Hasło"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="••••••••"
          />
          <TextField
            label="Powtórz hasło"
            value={repeatPassword}
            onChangeText={setRepeatPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="••••••••"
          />
          {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
          <PrimaryButton
            label={signingIn ? 'Wczytywanie…' : 'Zarejestruj się'}
            disabled={signingIn}
            onPress={async () => {
              if (signingIn) return;
              setSigningIn(true);
              setError('');
              try {
                await signUp({
                  name, email, password, repeatPassword,
                });
              } catch (cause) {
                setError(authErrorMessage(cause));
              } finally {
                setSigningIn(false);
              }
            }}
          />
        </View>

        <Text style={styles.footer}>
          Masz już konto?{' '}
          <Link href="/" style={styles.link}>
            Zaloguj się
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 24,
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
}));
