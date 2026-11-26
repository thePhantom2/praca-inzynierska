import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import SettingsScreen from '@/app/(tabs)/profil';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('@/context/session', () => ({ useSession: () => ({ user: { uid: 'owner', name: 'Anna Nowak', nickname: 'Ania', email: 'anna@example.test' }, profileWarning: '', signOut: jest.fn() }) }));
jest.mock('@/components/LocalDataImport', () => ({ LocalDataImport: () => null }));

describe('Tryb ciemny w ustawieniach', () => {
  beforeEach(async () => { await AsyncStorage.clear(); });
  afterEach(() => jest.restoreAllMocks());
  test('odtwarza zapisany motyw i zapamiętuje zmianę przełącznika', async () => {
    await AsyncStorage.setItem('app-theme', 'dark');
    await render(<ThemeProvider><SettingsScreen /></ThemeProvider>);
    const toggle = await screen.findByRole('switch', { name: 'Tryb ciemny' });
    expect(toggle).toHaveProp('value', true);
    await fireEvent(toggle, 'valueChange', false);
    expect(screen.getByRole('switch', { name: 'Tryb ciemny' })).toHaveProp('value', false);
    expect(await AsyncStorage.getItem('app-theme')).toBe('light');
  });
  test('nie pozoruje zapisania motywu, gdy pamięć urządzenia zgłasza błąd', async () => {
    await render(<ThemeProvider><SettingsScreen /></ThemeProvider>);
    const toggle = await screen.findByRole('switch', { name: 'Tryb ciemny' });
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk unavailable'));
    await fireEvent(toggle, 'valueChange', true);
    expect(await screen.findByText('Nie udało się zapisać motywu. Spróbuj ponownie.')).toBeVisible();
    expect(screen.getByRole('switch', { name: 'Tryb ciemny' })).toHaveProp('value', false);
  });
});
