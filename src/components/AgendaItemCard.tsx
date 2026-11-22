import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { type AgendaItem } from '@/utils/agenda';
import { relativeDateLabel } from '@/utils/calendar';

const TYPE_LABELS = {
  reminder: 'Przypomnienie',
  event: 'Wydarzenie',
  task: 'Zadanie',
  deadline: 'Termin projektu',
};
const TYPE_COLORS = {
  reminder: colors.reminder,
  event: colors.event,
  task: colors.primary,
  deadline: colors.danger,
};

type AgendaItemCardProps = {
  item: AgendaItem;
  onPress?: () => void;
};

export function AgendaItemCard({ item, onPress }: AgendaItemCardProps) {
  const isDeadline = item.type === 'deadline';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress ?? (() => router.push(item.href))}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.badge, { backgroundColor: TYPE_COLORS[item.type] }]} />
      <View style={styles.body}>
        <Text style={[styles.title, isDeadline && styles.deadline, item.completed && styles.completed]}>
          {item.title}
        </Text>
        <Text style={[styles.meta, isDeadline && styles.deadline]}>
          {item.dateKey ? relativeDateLabel(item.dateKey) : 'Bez daty'}
          {item.time ? ` • ${item.time}` : ''}
          {' • '}{TYPE_LABELS[item.type]}
        </Text>
        {item.projectName ? (
          <Text style={styles.meta}>
            {item.projectName}
            {item.completed ? ' • Ukończone' : ''}
            {item.archived ? ' • Archiwum' : ''}
          </Text>
        ) : null}
        {item.description ? <Text style={styles.notes} numberOfLines={2}>{item.description}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  badge: { width: 6, alignSelf: 'stretch', borderRadius: 3 },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  meta: { marginTop: 4, fontSize: 13, lineHeight: 19, color: colors.muted },
  notes: { marginTop: 6, fontSize: 14, lineHeight: 20, color: colors.text },
  deadline: { color: colors.danger },
  completed: { textDecorationLine: 'line-through', color: colors.muted },
  pressed: { opacity: 0.75 },
});
