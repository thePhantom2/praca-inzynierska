import { Stack } from 'expo-router';

import { colors } from '@/theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primaryDark,
        headerTitleStyle: { fontWeight: '600' },
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="rejestracja" options={{ headerShown: false }} />
    </Stack>
  );
}
