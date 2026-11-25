import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '@/context/session';
import { createThemedStyles } from '@/theme/ThemeProvider';
import type { Team } from '@/storage/teamsStorage';

export function TeamMembers({ team, onRemove, disabled = false }: { team: Team; onRemove?: (uid: string) => void; disabled?: boolean }) {
  const styles = useStyles();
  const { user } = useSession();
  const ids = [...team.memberIds].sort((a, b) => Number(b === team.ownerId) - Number(a === team.ownerId));
  return <View style={styles.list}>{ids.map((uid) => {
    const member = team.members[uid];
    return <View key={uid} style={styles.row}>
      <View style={styles.identity}>
        <Text style={styles.name}>{member.nickname || member.name}{uid === user?.uid ? ' (Ty)' : ''}</Text>
        {member.nickname ? <Text style={styles.meta}>{member.name}</Text> : null}
        <Text style={styles.role}>{uid === team.ownerId ? 'Właściciel zespołu' : 'Uczestnik'}</Text>
      </View>
      {onRemove && uid !== team.ownerId ? <Pressable accessibilityRole="button" accessibilityLabel={`Usuń z zespołu: ${member.name}`} disabled={disabled} onPress={() => onRemove(uid)} style={styles.remove}>
        <Text style={styles.removeLabel}>Usuń</Text>
      </Pressable> : null}
    </View>;
  })}</View>;
}
const useStyles = createThemedStyles((colors) => StyleSheet.create({
  list: { gap: 10 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  identity: { flex: 1, gap: 3 }, name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 13 }, role: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  remove: { padding: 10, minHeight: 44, justifyContent: 'center' }, removeLabel: { color: colors.danger, fontWeight: '600' },
}));
