import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProjectsProvider } from '@/context/projects';
import { TeamsProvider } from '@/context/teams';
import { EventsProvider } from '@/context/events';
import { SessionProvider, useSession } from '@/context/session';
import { ThemeProvider, useTheme, createThemedStyles } from '@/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider><ThemedApp /></ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const { colors, isDark } = useTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, primary: colors.primary, background: colors.background, card: colors.surface, text: colors.text, border: colors.border, notification: colors.danger } };
  return <NavigationThemeProvider value={theme}>
    <SessionProvider><TeamsProvider><EventsProvider><ProjectsProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </ProjectsProvider></EventsProvider></TeamsProvider></SessionProvider>
  </NavigationThemeProvider>;
}

function RootNavigator() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { user, isReady, initializationError, retryInitialization } = useSession();

  if (!isReady) {
    return <View style={styles.status}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (initializationError) {
    return (
      <View style={styles.status}>
        <Text style={styles.error}>{initializationError}</Text>
        <PrimaryButton label="Spróbuj ponownie" onPress={retryInitialization} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primaryDark,
        headerTitleStyle: { fontWeight: '600' },
        headerTransparent: false,
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ustawienia" options={{ headerShown: false }} />
        <Stack.Screen name="ustawienia-konta" options={{ title: 'Ustawienia konta' }} />
        <Stack.Screen name="zespol/[id]" options={{ title: 'Zespół' }} />
        <Stack.Screen name="projekt/[id]" options={{ title: 'Projekt' }} />
        <Stack.Screen name="szczegoly/[id]" options={{ title: 'Wpis' }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  status: { flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.background },
  error: { fontSize: 16, lineHeight: 22, color: colors.danger },
}));
