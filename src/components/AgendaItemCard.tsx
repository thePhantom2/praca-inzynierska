import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, createThemedStyles } from '@/theme/ThemeProvider';
import { type AgendaItem } from '@/utils/agenda';
import { relativeDateLabel } from '@/utils/calendar';

const TYPE_LABELS = {
  reminder: 'Przypomnienie',
  event: 'Wydarzenie',
  task: 'Zadanie',
  deadline: 'Termin projektu',
};

type AgendaItemCardProps = {
  item: AgendaItem;
  onPress?: () => void;
};

export function AgendaItemCard({ item, onPress }: AgendaItemCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const appearances = {
    reminder: { color: colors.reminder, background: colors.reminderContainer, icon: 'notifications-outline' },
    event: { color: colors.event, background: colors.eventContainer, icon: 'calendar-outline' },
    task: { color: colors.primary, background: colors.primaryContainer, icon: 'checkbox-outline' },
    deadline: { color: colors.danger, background: colors.dangerContainer, icon: 'flag-outline' },
  } as const;
  const appearance = appearances[item.type];
  const isDeadline = item.type === 'deadline';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress ?? (() => router.push(item.href))}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.marker, { backgroundColor: appearance.background }]}>
        <Ionicons name={appearance.icon} size={20} color={appearance.color} accessible={false} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, isDeadline && styles.deadline, item.completed && styles.completed]}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, isDeadline && styles.deadline]}>
            {item.dateKey ? relativeDateLabel(item.dateKey) : 'Bez daty'}
            {item.time ? ` • ${item.time}` : ''}
          </Text>
          <View style={[styles.category, { backgroundColor: appearance.background }]}>
            <Text style={[styles.categoryLabel, { color: appearance.color }]}>{TYPE_LABELS[item.type]}</Text>
          </View>
        </View>
        {item.projectName ? (
          <Text style={styles.meta}>
            {item.projectName}
            {item.archived ? ' • Archiwum' : ''}
          </Text>
        ) : null}
        {item.completed ? <Text style={styles.done}>Ukończone</Text> : null}
        {item.description ? <Text style={styles.notes} numberOfLines={2}>{item.description}</Text> : null}
      </View>
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  marker: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  body: { flex: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6 },
  category: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7 },
  categoryLabel: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { marginTop: 4, fontSize: 13, lineHeight: 19, color: colors.muted },
  notes: { marginTop: 6, fontSize: 14, lineHeight: 20, color: colors.text },
  deadline: { color: colors.danger },
  completed: { textDecorationLine: 'line-through', color: colors.muted },
  done: { color: colors.success, fontSize: 13, fontWeight: '600', marginTop: 4 },
  pressed: { opacity: 0.75 },
}));
