import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { AgendaItemCard } from '@/components/AgendaItemCard';
import { ThemeProvider } from '@/theme/ThemeProvider';
import type { AgendaItem } from '@/utils/agenda';

const task: AgendaItem = { id: 'task', type: 'task', title: 'Prezentacja', description: 'Rozdział 1', dateKey: '2030-11-26', time: '', completed: false, archived: false, projectName: 'Projekt semestralny', href: { pathname: '/projekt/[id]', params: { id: 'project-a' } } };

describe('Pozycja agendy', () => {
  beforeEach(async () => { await AsyncStorage.clear(); });
  test('pokazuje rodzaj, nazwę projektu i ukończone zadanie', async () => {
    await render(<ThemeProvider><AgendaItemCard item={{ ...task, completed: true }} /></ThemeProvider>);
    expect(await screen.findByText('Prezentacja')).toBeVisible();
    expect(screen.getByText('Zadanie')).toBeVisible();
    expect(screen.getByText('Projekt semestralny')).toBeVisible();
    expect(screen.getByText('Ukończone')).toBeVisible();
  });
  test('domyślnie otwiera szczegóły właściwego projektu', async () => {
    await render(<ThemeProvider><AgendaItemCard item={task} /></ThemeProvider>);
    await screen.findByText(task.title);
    await fireEvent.press(screen.getByRole('button'));
    expect(router.push).toHaveBeenCalledWith(task.href);
  });
  test('wybór dnia w kalendarzu korzysta z przekazanego callbacku', async () => {
    const showDay = jest.fn();
    await render(<ThemeProvider><AgendaItemCard item={task} onPress={showDay} /></ThemeProvider>);
    await screen.findByText(task.title);
    await fireEvent.press(screen.getByRole('button'));
    expect(showDay).toHaveBeenCalledTimes(1);
    expect(router.push).not.toHaveBeenCalled();
  });
});
