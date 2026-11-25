import { useEffect, useRef, useState } from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { collection, query, where } from 'firebase/firestore';
import { subscribeToQuery } from '@/lib/subscribeToQuery';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { TeamFormModal } from '@/components/TeamFormModal';
import { TeamMembers } from '@/components/TeamMembers';
import { useSession } from '@/context/session';
import { useTeams } from '@/context/teams';
import { useProjects } from '@/context/projects';
import { getFirestoreDatabase } from '@/lib/firebase';
import { cloudErrorMessage } from '@/storage/cloudStorage';
import { createInvitation, deleteTeam, editTeam, parseInvitation, removeTeamMember, revokeInvitation, type TeamInvitation } from '@/storage/teamsStorage';
import { createThemedStyles, useTheme } from '@/theme/ThemeProvider';

export default function TeamScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const { teams, ready, error: readError, reload } = useTeams();
  const { projects, ready: projectsReady, loadError: projectsError, error: projectError, load, canManage } = useProjects();
  const team = teams.find((item) => item.id === id);
  const owner = !!team && team.ownerId === user?.uid;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [invitations, setInvitations] = useState<{ scope: string; items: TeamInvitation[]; error: string }>({ scope: '', items: [], error: '' });
  const busy = useRef(false);
  const scope = `${user?.uid}:${id}`;
  const currentScope = useRef(scope); currentScope.current = scope;
  const [inviteAttempt, setInviteAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setInvitations({ scope, items: [], error: '' });
    if (!owner || !id) return;
    const fail = (cause: unknown) => { if (active && currentScope.current === scope) setInvitations({ scope, items: [], error: cloudErrorMessage(cause) }); };
    let stop: (() => void) | undefined;
    try {
      stop = subscribeToQuery(query(collection(getFirestoreDatabase(), 'teamInvitations'), where('teamId', '==', id)), (snapshot) => {
      if (!active || currentScope.current !== scope) return;
      try { setInvitations({ scope, items: snapshot.docs.map((doc) => parseInvitation({ ...doc.data(), id: doc.id })), error: '' }); }
      catch (cause) { fail(cause); }
      }, fail);
    } catch (cause) { fail(cause); }
    return () => { active = false; stop?.(); };
  }, [owner, id, scope, inviteAttempt]);
  async function run(action: () => Promise<unknown>) {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try { await action(); }
    catch (cause) { if (currentScope.current === scope) setError(cloudErrorMessage(cause)); }
    finally { busy.current = false; setSaving(false); }
  }
  if (!ready) return <ScreenScaffold title="Zespół" topInset={false}><ActivityIndicator color={colors.primary} /></ScreenScaffold>;
  if (readError) return <ScreenScaffold title="Zespół" topInset={false}><Text style={styles.error}>{readError}</Text><PrimaryButton label="Spróbuj ponownie" onPress={reload} /></ScreenScaffold>;
  if (!team) return <ScreenScaffold title="Zespół niedostępny" topInset={false}><Text style={styles.meta}>Zespół został usunięty albo nie należysz już do jego uczestników.</Text><PrimaryButton label="Wróć do zespołów" onPress={() => router.replace('/zespoly')} /></ScreenScaffold>;
  const teamProjects = projects.filter((project) => project.teamId === team.id);
  const pendingInvites = invitations.scope === scope ? invitations.items.filter((invite) => invite.status === 'pending') : [];
  return <ScreenScaffold title={team.name} topInset={false} subtitle={team.description || undefined}>
    <Stack.Screen options={{ title: team.name }} />
    <Text style={styles.role}>{owner ? 'Właściciel zespołu' : 'Uczestnik'}</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {owner ? <PrimaryButton label="Edytuj zespół" variant="outline" disabled={saving} onPress={() => setEditing(true)} /> : null}
    <View style={styles.card}>
      <Text style={styles.section}>Uczestnicy ({team.memberIds.length})</Text>
      <TeamMembers team={team} disabled={saving} onRemove={owner ? (uid) => {
        Alert.alert('Usuń uczestnika', 'Ta osoba straci dostęp do projektów zespołu. Jej własne projekty pozostaną na jej koncie.', [
          { text: 'Anuluj', style: 'cancel' }, { text: 'Usuń', style: 'destructive', onPress: () => { void run(() => removeTeamMember(team.id, uid)); } },
        ]);
      } : undefined} />
    </View>
    <Text style={styles.section}>Projekty zespołu</Text>
    {!projectsReady ? <ActivityIndicator color={colors.primary} /> : projectsError ? <View style={styles.card}><Text style={styles.error}>{projectError}</Text><PrimaryButton label="Ponów odczyt projektów" onPress={() => { void load(); }} /></View> : teamProjects.length ? teamProjects.map((project) => <Pressable key={project.id} accessibilityRole="button" style={styles.card} onPress={() => router.push({ pathname: '/projekt/[id]', params: { id: project.id } })}>
      <Text style={styles.name}>{project.name}</Text>
      <Text style={styles.meta}>{project.completedAt ? 'Archiwum' : 'Aktywny projekt'} • {project.tasks.filter((task) => task.completed).length}/{project.tasks.length} zadań</Text>
      <Text style={styles.link}>Otwórz projekt ›</Text>
    </Pressable>) : <Text style={styles.meta}>Brak wspólnych projektów. Otwórz swój projekt i wybierz zespół w sekcji „Zespół projektu”.</Text>}
    {owner ? <View style={styles.card}>
      <Text style={styles.section}>Zaproszenia</Text>
      <Text style={styles.meta}>Każdy kod działa raz i jest ważny 7 dni. Przekaż go osobie, którą chcesz zaprosić.</Text>
      <PrimaryButton label={saving ? 'Zapisywanie…' : 'Utwórz kod zaproszenia'} disabled={saving || team.memberIds.length >= 50} onPress={() => { void run(() => createInvitation(team, user!.uid)); }} />
      {team.memberIds.length >= 50 ? <Text style={styles.meta}>Zespół osiągnął limit 50 osób.</Text> : null}
      {invitations.scope === scope && invitations.error ? <><Text style={styles.error}>{invitations.error}</Text><PrimaryButton label="Ponów odczyt zaproszeń" onPress={() => setInviteAttempt((value) => value + 1)} /></> : null}
      {pendingInvites.map((invite) => <View key={invite.id} style={styles.invite}>
        <Text selectable style={styles.code}>{invite.id}</Text>
        <Text style={styles.meta}>{invite.expiresAt.toMillis() <= Date.now() ? 'Wygasło: ' : 'Ważny do: '}{new Date(invite.expiresAt.toMillis()).toLocaleDateString('pl-PL')}</Text>
        <PrimaryButton label="Anuluj zaproszenie" variant="outline" disabled={saving} onPress={() => { void run(() => revokeInvitation(invite.id)); }} />
      </View>)}
    </View> : null}
    {owner ? <PrimaryButton label="Usuń zespół" variant="danger" disabled={saving} onPress={() => {
      Alert.alert('Usuń zespół', 'Uczestnicy stracą dostęp do zespołu. Udostępnione projekty pozostaną na kontach ich właścicieli.', [
        { text: 'Anuluj', style: 'cancel' }, { text: 'Usuń zespół', style: 'destructive', onPress: () => { void run(async () => { await deleteTeam(team.id); router.replace('/zespoly'); }); } },
      ]);
    }} /> : <PrimaryButton label="Opuść zespół" variant="danger" disabled={saving || !projectsReady || projectsError} onPress={() => {
      if (teamProjects.some(canManage)) { setError('Najpierw zakończ udostępnianie swoich projektów temu zespołowi.'); return; }
      Alert.alert('Opuść zespół', 'Stracisz dostęp do projektów tego zespołu.', [
        { text: 'Anuluj', style: 'cancel' }, { text: 'Opuść', style: 'destructive', onPress: () => { void run(async () => { await removeTeamMember(team.id, user!.uid); router.replace('/zespoly'); }); } },
      ]);
    }} />}
    {editing ? <TeamFormModal initial={team} onCancel={() => setEditing(false)} onSave={async (name, description) => { await editTeam(team.id, name, description); setEditing(false); }} /> : null}
  </ScreenScaffold>;
}
const useStyles = createThemedStyles((colors) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 16, gap: 12 },
  section: { color: colors.text, fontSize: 17, fontWeight: '700' }, name: { color: colors.text, fontSize: 17, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 21 }, role: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '600' }, error: { color: colors.danger, fontSize: 14, lineHeight: 21 },
  invite: { gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }, code: { color: colors.primaryDark, fontSize: 16, fontWeight: '600' },
}));
