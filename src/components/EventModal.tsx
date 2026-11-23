import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { type CalendarEntryInput } from '@/context/events';
import { type CalendarEntryType } from '@/storage/eventsStorage';
import { cloudErrorMessage } from '@/storage/cloudStorage';
import { useTheme, createThemedStyles } from '@/theme/ThemeProvider';
import { formatDateKey } from '@/utils/calendar';

type EventModalProps = {
  visible: boolean;
  title: string;
  dateKey: string;
  initial?: CalendarEntryInput;
  onCancel: () => void;
  onConfirm: (input: CalendarEntryInput) => void | Promise<unknown>;
};

export function EventModal({ visible, title, dateKey, initial, onCancel, onConfirm }: EventModalProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const busy = useRef(false);
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<CalendarEntryType>('reminder');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) {
      return;
    }
    const initial = initialRef.current;
    setError('');
    setEntryTitle(initial?.title ?? '');
    setNotes(initial?.notes ?? '');
    setTime(initial?.time ?? '');
    setType(initial?.type ?? 'reminder');
  }, [visible]);

  const cancel = () => { if (!busy.current) onCancel(); };
  async function save() {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try { await onConfirm({ title: entryTitle, notes, dateKey, time, type }); }
    catch (cause) { setError(cloudErrorMessage(cause)); }
    finally { busy.current = false; setSaving(false); }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
      <Pressable
        style={[styles.backdrop, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
        onPress={cancel}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.card} onPress={() => undefined}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.date}>{formatDateKey(dateKey)}</Text>

              <View style={styles.types}>
                <TypeChip
                  label="Przypomnienie"
                  selected={type === 'reminder'}
                  color={colors.reminder}
                  containerColor={colors.reminderContainer}
                  onPress={() => setType('reminder')}
                />
                <TypeChip
                  label="Wydarzenie"
                  selected={type === 'event'}
                  color={colors.event}
                  containerColor={colors.eventContainer}
                  onPress={() => setType('event')}
                />
              </View>

              <View style={styles.form}>
                <TextField
                  label="Tytuł"
                  value={entryTitle}
                  onChangeText={setEntryTitle}
                  autoCapitalize="sentences"
                  placeholder="Np. Deadline projektu"
                />
                <TextField
                  label="Godzina (opcjonalnie)"
                  value={time}
                  onChangeText={setTime}
                  placeholder="14:00"
                />
                <TextField
                  label="Notatka"
                  value={notes}
                  onChangeText={setNotes}
                  autoCapitalize="sentences"
                  placeholder="Szczegóły, miejsce, co zabrać…"
                  multiline
                  style={styles.notes}
                />
              </View>

              {error ? <Text accessibilityRole="alert" style={{ color: colors.danger, marginTop: 12 }}>{error}</Text> : null}
              <View style={styles.actions}>
                <View style={styles.action}>
                  <PrimaryButton label="Anuluj" variant="outline" onPress={cancel} />
                </View>
                <View style={styles.action}>
                  <PrimaryButton
                    label={saving ? 'Zapisywanie…' : 'Zapisz'}
                    disabled={saving}
                    onPress={() => { void save(); }}
                  />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function TypeChip({
  label,
  selected,
  color,
  containerColor,
  onPress,
}: {
  label: string;
  selected: boolean;
  color: string;
  containerColor: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && { borderColor: color, backgroundColor: containerColor }]}
    >
      <Text style={[styles.chipLabel, selected && { color, fontWeight: '700' }]}>{selected ? '✓ ' : ''}{label}</Text>
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    maxHeight: '85%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  date: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 14,
    color: colors.muted,
  },
  types: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  form: {
    gap: 12,
  },
  notes: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  action: {
    flex: 1,
  },
}));
