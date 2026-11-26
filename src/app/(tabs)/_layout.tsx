import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarActiveBackgroundColor: colors.primaryContainer,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
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
        name="zespoly"
        options={{
          title: 'Zespoły',
          tabBarIcon: ({ focused, size }) => <Ionicons name="people-outline" color={focused ? colors.primary : colors.tabInactive} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Ustawienia',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="settings-outline"
              color={focused ? colors.primary : colors.tabInactive}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
