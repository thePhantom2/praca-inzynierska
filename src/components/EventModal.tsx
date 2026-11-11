import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { type CalendarEntryInput } from '@/context/events';
import { type CalendarEntryType } from '@/storage/eventsStorage';
import { colors } from '@/theme/colors';
import { formatDateKey } from '@/utils/calendar';

type EventModalProps = {
  visible: boolean;
  title: string;
  dateKey: string;
  initial?: CalendarEntryInput;
  onCancel: () => void;
  onConfirm: (input: CalendarEntryInput) => void;
};

export function EventModal({ visible, title, dateKey, initial, onCancel, onConfirm }: EventModalProps) {
  const [entryTitle, setEntryTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<CalendarEntryType>('reminder');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) {
      return;
    }
    setEntryTitle(initial?.title ?? '');
    setNotes(initial?.notes ?? '');
    setTime(initial?.time ?? '');
    setType(initial?.type ?? 'reminder');
  }, [initial, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={[styles.backdrop, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
        onPress={onCancel}
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
                  onPress={() => setType('reminder')}
                />
                <TypeChip
                  label="Wydarzenie"
                  selected={type === 'event'}
                  color={colors.event}
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

              <View style={styles.actions}>
                <View style={styles.action}>
                  <PrimaryButton label="Anuluj" variant="outline" onPress={onCancel} />
                </View>
                <View style={styles.action}>
                  <PrimaryButton
                    label="Zapisz"
                    onPress={() =>
                      onConfirm({
                        title: entryTitle,
                        notes,
                        dateKey,
                        time,
                        type,
                      })
                    }
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
  onPress,
}: {
  label: string;
  selected: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { borderColor: color }, selected && { backgroundColor: color }]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
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
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  chipLabelSelected: {
    color: colors.surface,
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
});
