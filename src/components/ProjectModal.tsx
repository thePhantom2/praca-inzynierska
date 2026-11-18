import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextField } from '@/components/TextField';
import { ProjectActions } from '@/components/ProjectActions';
import { type Project } from '@/storage/projectsStorage';
import { colors } from '@/theme/colors';
import { parseDateKey, toDateKey } from '@/utils/calendar';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type Props = {
  initial?: Project;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onSave: (project: Project) => Promise<void>;
  onDeleted?: () => void;
};

export function ProjectModal({ initial, saving, error, onCancel, onSave, onDeleted }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [deadline, setDeadline] = useState(initial?.deadline ?? '');
  const [validation, setValidation] = useState('');
  const insets = useSafeAreaInsets();

  function submit() {
    if (saving) return;
    if (!name.trim()) { setValidation('Podaj nazwę projektu.'); return; }
    const date = deadline.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || toDateKey(parseDateKey(date)) !== date) {
      setValidation('Podaj poprawny termin w formacie RRRR-MM-DD.'); return;
    }
    setValidation('');
    void onSave({
      ...initial,
      id: initial?.id ?? makeId(), name: name.trim(), description: description.trim(), deadline: date,
      tasks: initial?.tasks ?? [],
    });
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={[styles.backdrop, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            <Text style={styles.title}>{initial ? 'Edytuj projekt' : 'Nowy projekt'}</Text>
            <TextField label="Nazwa projektu" value={name} onChangeText={setName} autoCapitalize="sentences" maxLength={120} />
            <TextField label="Krótki opis" value={description} onChangeText={setDescription} autoCapitalize="sentences" multiline maxLength={500} style={styles.multiline} />
            <TextField label="Termin (RRRR-MM-DD)" placeholder="2026-12-20" value={deadline} onChangeText={setDeadline} maxLength={10} />
            {error || validation ? <Text accessibilityRole="alert" style={styles.error}>{error || validation}</Text> : null}
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={onCancel} style={[styles.button, styles.cancel]}>
                <Text style={styles.cancelLabel}>Anuluj</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: saving }} disabled={saving} onPress={submit} style={[styles.button, styles.save, saving && styles.disabled]}>
                <Text style={styles.saveLabel}>{saving ? 'Zapisywanie…' : 'Zapisz'}</Text>
              </Pressable>
            </View>
            {initial ? (
              <View style={styles.projectActions}>
                <ProjectActions
                  project={initial}
                  onArchived={onCancel}
                  onDeleted={onDeleted ?? onCancel}
                />
              </View>
            ) : null}
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
  projectActions: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
  button: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  cancel: { borderWidth: 1, borderColor: colors.border },
  save: { backgroundColor: colors.primary },
  cancelLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  saveLabel: { color: colors.surface, fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});
