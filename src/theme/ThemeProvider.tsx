import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, Appearance, View } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from '@/theme/colors';
import { loadTheme, saveTheme, type ThemeMode } from '@/storage/themeStorage';

type ThemeValue = {
  colors: ThemeColors;
  isDark: boolean;
  saving: boolean;
  error: string;
  setDarkMode: (enabled: boolean) => Promise<void>;
};
const ThemeContext = createContext<ThemeValue | null>(null);
export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  useEffect(() => {
    let active = true;
    loadTheme().then((saved) => { if (active) setMode(saved); })
      .catch(() => { if (active) setError('Nie udało się odczytać ustawień wyglądu. Wybierz motyw ponownie.'); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (ready) Appearance.setColorScheme(mode);
  }, [mode, ready]);
  useEffect(() => () => Appearance.setColorScheme('unspecified'), []);
  const colors = mode === 'dark' ? darkColors : lightColors;
  async function setDarkMode(enabled: boolean) {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError('');
    const next = enabled ? 'dark' : 'light';
    try { await saveTheme(next); setMode(next); }
    catch { setError('Nie udało się zapisać motywu. Spróbuj ponownie.'); }
    finally { busy.current = false; setSaving(false); }
  }
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  return <ThemeContext.Provider value={{ colors, isDark: mode === 'dark', saving, error, setDarkMode }}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme musi być użyty wewnątrz ThemeProvider');
  return theme;
}
export function createThemedStyles<T>(factory: (colors: ThemeColors) => T) {
  return function useThemedStyles() {
    const { colors } = useTheme();
    return useMemo(() => factory(colors), [colors]);
  };
}
