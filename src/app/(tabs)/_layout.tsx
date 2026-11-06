import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { colors } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleStyle: { fontWeight: '600' },
        headerTintColor: colors.primaryDark,
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
        name="lista"
        options={{
          title: 'Lista',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="list-outline"
              color={focused ? colors.primary : colors.tabInactive}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="person-outline"
              color={focused ? colors.primary : colors.tabInactive}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ustawienia"
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
