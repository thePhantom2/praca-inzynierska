import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProjectTaskModal } from '@/components/ProjectTaskModal';
import { ThemeProvider } from '@/theme/ThemeProvider';

async function openForm(saving = false) {
  const onSave = jest.fn(async () => {}), onCancel = jest.fn();
  await render(<ThemeProvider><ProjectTaskModal dateKey="2030-11-25" saving={saving} error="" onSave={onSave} onCancel={onCancel} /></ThemeProvider>);
  await screen.findByLabelText('Tytuł zadania');
  return { onSave, onCancel };
}

describe('Dodawanie zadania', () => {
  beforeEach(async () => { await AsyncStorage.clear(); });
  test('pusty tytuł pokazuje błąd, bez zapisu', async () => {
    const { onSave } = await openForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Zapisz' }));
    expect(screen.getByText('Podaj tytuł zadania.')).toBeVisible();
    expect(onSave).not.toHaveBeenCalled();
  });
  test('odrzuca nieistniejący dzień zamiast przesuwać go na kolejny miesiąc', async () => {
    const { onSave } = await openForm();
    await fireEvent.changeText(screen.getByLabelText('Tytuł zadania'), 'Slajdy');
    await fireEvent.changeText(screen.getByLabelText('Data zadania (RRRR-MM-DD)'), '2030-02-30');
    await fireEvent.press(screen.getByRole('button', { name: 'Zapisz' }));
    expect(screen.getByText('Podaj poprawny termin w formacie RRRR-MM-DD.')).toBeVisible();
    expect(onSave).not.toHaveBeenCalled();
  });
  test('przekazuje tytuł, opis i datę nowego zadania', async () => {
    const { onSave } = await openForm();
    await fireEvent.changeText(screen.getByLabelText('Tytuł zadania'), ' Slajdy ');
    await fireEvent.changeText(screen.getByLabelText('Krótki opis'), ' Rozdział 1 ');
    await fireEvent.press(screen.getByRole('button', { name: 'Zapisz' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'Slajdy', description: 'Rozdział 1', dateKey: '2030-11-25', completed: false }));
  });
  test('podczas zapisu blokuje ponowne wysłanie', async () => {
    const { onSave } = await openForm(true);
    expect(screen.getByRole('button', { name: 'Zapisywanie…' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Zapisywanie…' }));
    expect(onSave).not.toHaveBeenCalled();
  });
});
