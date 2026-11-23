import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProjectsProvider } from '@/context/projects';
import { EventsProvider } from '@/context/events';
import { SessionProvider, useSession } from '@/context/session';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <EventsProvider>
          <ProjectsProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </ProjectsProvider>
        </EventsProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
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
        <Stack.Screen name="ustawienia-konta" options={{ title: 'Ustawienia konta' }} />
        <Stack.Screen name="projekt/[id]" options={{ title: 'Projekt' }} />
        <Stack.Screen name="szczegoly/[id]" options={{ title: 'Wpis' }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  status: { flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.background },
  error: { fontSize: 16, lineHeight: 22, color: colors.danger },
});
