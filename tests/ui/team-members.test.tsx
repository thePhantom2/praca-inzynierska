import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TeamMembers } from '@/components/TeamMembers';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { team } from '../helpers/fixtures';

jest.mock('@/context/session', () => ({ useSession: () => ({ user: { uid: 'owner' } }) }));

describe('Lista osób w zespole', () => {
  beforeEach(async () => { await AsyncStorage.clear(); });
  test('pokazuje nick, pełną nazwę i rolę', async () => {
    await render(<ThemeProvider><TeamMembers team={team()} /></ThemeProvider>);
    expect(await screen.findByText('Ania (Ty)')).toBeVisible();
    expect(screen.getByText('Anna Nowak')).toBeVisible();
    expect(screen.getByText('Właściciel zespołu')).toBeVisible();
    expect(screen.getByText('Uczestnik')).toBeVisible();
  });
  test('lista w projekcie nie udostępnia usuwania członków', async () => {
    await render(<ThemeProvider><TeamMembers team={team()} /></ThemeProvider>);
    await screen.findByText('Janek');
    expect(screen.queryByRole('button', { name: /Usuń/ })).toBeNull();
  });
  test('zarządzanie zespołem pozwala wybrać uczestnika, ale nie właściciela', async () => {
    const remove = jest.fn();
    await render(<ThemeProvider><TeamMembers team={team()} onRemove={remove} /></ThemeProvider>);
    await screen.findByText('Janek');
    expect(screen.queryByRole('button', { name: 'Usuń z zespołu: Anna Nowak' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Usuń z zespołu: Jan Kowalski' }));
    expect(remove).toHaveBeenCalledWith('member');
  });
});
