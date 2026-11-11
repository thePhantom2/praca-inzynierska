import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextField } from '@/components/TextField';
import { type ProjectTask } from '@/storage/projectsStorage';
import { colors } from '@/theme/colors';
import { parseDateKey, toDateKey } from '@/utils/calendar';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type Props = {
  dateKey: string;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onSave: (task: ProjectTask) => Promise<void>;
};

export function ProjectTaskModal({ dateKey, saving, error, onCancel, onSave }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(dateKey);
  const [validation, setValidation] = useState('');
  const insets = useSafeAreaInsets();

  function submit() {
    if (saving) return;
    if (!name.trim()) { setValidation('Podaj tytuł zadania.'); return; }
    const date = deadline.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || toDateKey(parseDateKey(date)) !== date) {
      setValidation('Podaj poprawny termin w formacie RRRR-MM-DD.'); return;
    }
    setValidation('');
    void onSave({
      id: makeId(), title: name.trim(), description: description.trim(), dateKey: date, completed: false,
    });
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={[styles.backdrop, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            <Text style={styles.title}>Nowe zadanie</Text>
            <TextField label="Tytuł zadania" value={name} onChangeText={setName} autoCapitalize="sentences" maxLength={120} editable={!saving} />
            <TextField label="Krótki opis" value={description} onChangeText={setDescription} autoCapitalize="sentences" multiline maxLength={500} style={styles.multiline} editable={!saving} />
            <TextField label="Data zadania (RRRR-MM-DD)" placeholder="2026-12-20" value={deadline} onChangeText={setDeadline} maxLength={10} editable={!saving} />
            {validation || error ? <Text accessibilityRole="alert" style={styles.error}>{validation || error}</Text> : null}
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={onCancel} style={[styles.button, styles.cancel]}>
                <Text style={styles.cancelLabel}>Anuluj</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={submit} style={[styles.button, styles.save, saving && styles.disabled]}>
                <Text style={styles.saveLabel}>{saving ? 'Zapisywanie…' : 'Zapisz'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.45)', justifyContent: 'center', paddingHorizontal: 20 },
  card: { backgroundColor: colors.surface, borderRadius: 16, maxHeight: '100%', width: '100%', maxWidth: 560, alignSelf: 'center' },
  form: { padding: 20, gap: 16 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  error: { color: colors.danger, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  cancel: { borderWidth: 1, borderColor: colors.border },
  save: { backgroundColor: colors.primary },
  cancelLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  saveLabel: { color: colors.surface, fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});
