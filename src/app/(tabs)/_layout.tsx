import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { colors } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.surface },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Start',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="home-outline"
              color={focused ? colors.primary : colors.tabInactive}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="projekty"
        options={{
          title: 'Projekty',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="folder-open-outline" color={focused ? colors.primary : colors.tabInactive} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="kalendarz"
        options={{
          title: 'Kalendarz',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="calendar-outline"
              color={focused ? colors.primary : colors.tabInactive}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Konto',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="person-outline"
              color={focused ? colors.primary : colors.tabInactive}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen name="ustawienia" options={{ href: null }} />
    </Tabs>
  );
}
