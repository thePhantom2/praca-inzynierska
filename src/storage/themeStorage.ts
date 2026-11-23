import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';
const KEY = 'app-theme';
export async function loadTheme(): Promise<ThemeMode> {
  return await AsyncStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
}
export async function saveTheme(mode: ThemeMode) {
  await AsyncStorage.setItem(KEY, mode);
}
