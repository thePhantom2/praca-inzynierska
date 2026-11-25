import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TeamMembers } from '@/components/TeamMembers';
import { useSession } from '@/context/session';
import { useTeams } from '@/context/teams';
import { cloudErrorMessage } from '@/storage/cloudStorage';
import { isProjectOwner, setProjectTeam } from '@/storage/sharedProjects';
import type { Project } from '@/storage/projectsStorage';
import { createThemedStyles } from '@/theme/ThemeProvider';

export function ProjectTeamPanel({ project }: { project: Project }) {
  const styles = useStyles();
  const { user } = useSession();
  const { teams, ready, error: readError, reload } = useTeams();
  const [choosing, setChoosing] = useState(false);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const team = teams.find((item) => item.id === project.teamId);
  const owner = isProjectOwner(project, user?.uid);
  async function share(teamId: string | null) {
    if (!user || !owner || busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try { await setProjectTeam(user.uid, project.id, teamId); setChoosing(false); setSelected(''); }
    catch (cause) { setError(cloudErrorMessage(cause)); }
    finally { busy.current = false; setSaving(false); }
  }
  return <View style={styles.card}>
    <Text style={styles.heading}>Zespół projektu</Text>
    {readError ? <><Text style={styles.error}>{readError}</Text><PrimaryButton label="Ponów odczyt zespołów" onPress={reload} /></> : !ready ? <Text style={styles.meta}>Wczytywanie zespołów…</Text> : team ? <>
      <Text style={styles.teamName}>{team.name}</Text>
      <Text style={styles.meta}>Wszyscy uczestnicy mogą dodawać i wykonywać zadania. Ustawieniami projektu zarządza jego właściciel.</Text>
      {project.ownerId && team.members[project.ownerId] ? <Text style={styles.meta}>Właściciel projektu: {team.members[project.ownerId].nickname || team.members[project.ownerId].name}</Text> : null}
      <TeamMembers team={team} />
      <PrimaryButton label="Otwórz zespół" variant="outline" onPress={() => router.push({ pathname: '/zespol/[id]', params: { id: team.id } })} />
    </> : <Text style={styles.meta}>{project.teamId ? 'Zespół nie jest już dostępny na Twoim koncie. Możesz zakończyć udostępnianie projektu.' : 'Projekt jest prywatny. Możesz udostępnić go jednemu ze swoich zespołów.'}</Text>}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {owner && ready && !readError ? <>
      {choosing ? <>
        <Text style={styles.meta}>Wybierz zespół. Jego uczestnicy uzyskają dostęp do całego projektu i wszystkich zadań.</Text>
        {teams.map((item) => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: selected === item.id }} onPress={() => setSelected(item.id)} disabled={saving} style={[styles.choice, selected === item.id && styles.selected]}>
          <Text style={styles.choiceName}>{selected === item.id ? '● ' : '○ '}{item.name}</Text>
          <Text style={styles.meta}>Liczba osób: {item.memberIds.length}</Text>
        </Pressable>)}
        <PrimaryButton label={saving ? 'Udostępnianie…' : 'Udostępnij wybranemu zespołowi'} disabled={saving || !selected} onPress={() => { void share(selected); }} />
        <PrimaryButton label="Anuluj" variant="outline" disabled={saving} onPress={() => setChoosing(false)} />
      </> : teams.length ? <PrimaryButton label={project.teamId ? 'Zmień zespół projektu' : 'Udostępnij zespołowi'} variant="outline" disabled={saving} onPress={() => { setSelected(project.teamId ?? ''); setChoosing(true); }} /> : <PrimaryButton label="Przejdź do zespołów" variant="outline" onPress={() => router.push('/zespoly')} />}
      {project.teamId ? <PrimaryButton label="Zakończ udostępnianie" variant="outline" disabled={saving} onPress={() => Alert.alert('Zakończ udostępnianie', 'Pozostali uczestnicy stracą dostęp. Projekt i zadania pozostaną na Twoim koncie.', [
        { text: 'Anuluj', style: 'cancel' }, { text: 'Zakończ udostępnianie', onPress: () => { void share(null); } },
      ])} /> : null}
    </> : null}
  </View>;
}
const useStyles = createThemedStyles((colors) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 12 },
  heading: { color: colors.text, fontSize: 17, fontWeight: '700' }, teamName: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 21 }, error: { color: colors.danger, fontSize: 14, lineHeight: 21 },
  choice: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 4 }, selected: { backgroundColor: colors.primaryContainer, borderColor: colors.primary },
  choiceName: { color: colors.text, fontSize: 15, fontWeight: '600' },
}));
