import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { cloudErrorMessage } from '@/storage/cloudStorage';
import { createThemedStyles } from '@/theme/ThemeProvider';
import type { Team } from '@/storage/teamsStorage';

type Props = { initial?: Team; onCancel: () => void; onSave: (name: string, description: string) => Promise<void> };
export function TeamFormModal({ initial, onCancel, onSave }: Props) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const cancel = () => { if (!busy.current) onCancel(); };
  async function save() {
    if (busy.current) return;
    if (!name.trim()) { setError('Podaj nazwę zespołu.'); return; }
    busy.current = true; setSaving(true); setError('');
    try { await onSave(name, description); }
    catch (cause) { setError(cloudErrorMessage(cause)); }
    finally { busy.current = false; setSaving(false); }
  }
  return <Modal visible transparent animationType="fade" onRequestClose={cancel}>
    <KeyboardAvoidingView style={[styles.backdrop, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
        <Text style={styles.title}>{initial ? 'Edytuj zespół' : 'Nowy zespół'}</Text>
        <TextField label="Nazwa zespołu" value={name} onChangeText={setName} autoCapitalize="sentences" maxLength={100} />
        <TextField label="Opis (opcjonalnie)" value={description} onChangeText={setDescription} autoCapitalize="sentences" maxLength={500} multiline />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <PrimaryButton label={saving ? 'Zapisywanie…' : 'Zapisz zespół'} disabled={saving} onPress={() => { void save(); }} />
        <PrimaryButton label="Anuluj" variant="outline" disabled={saving} onPress={cancel} />
      </ScrollView></View>
    </KeyboardAvoidingView>
  </Modal>;
}
const useStyles = createThemedStyles((colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', paddingHorizontal: 20 },
  card: { backgroundColor: colors.surface, borderRadius: 16, maxHeight: '100%', width: '100%', maxWidth: 560, alignSelf: 'center' },
  form: { padding: 20, gap: 16 }, title: { fontSize: 20, fontWeight: '700', color: colors.text },
  error: { color: colors.danger, fontSize: 14, lineHeight: 21 },
}));
