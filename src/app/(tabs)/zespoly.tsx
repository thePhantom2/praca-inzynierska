import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { TeamFormModal } from '@/components/TeamFormModal';
import { TextField } from '@/components/TextField';
import { useSession } from '@/context/session';
import { useTeams } from '@/context/teams';
import { cloudErrorMessage } from '@/storage/cloudStorage';
import { acceptInvitation, createTeam } from '@/storage/teamsStorage';
import { useTheme, createThemedStyles } from '@/theme/ThemeProvider';

export default function TeamsScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { user } = useSession();
  const { teams, ready, loadError, error: readError, reload } = useTeams();
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const busy = useRef(false);
  async function join() {
    if (!user || busy.current) return;
    busy.current = true; setJoining(true); setError('');
    try {
      const id = await acceptInvitation(code, user);
      setCode(''); router.push({ pathname: '/zespol/[id]', params: { id } });
    } catch (cause) { setError(cloudErrorMessage(cause)); }
    finally { busy.current = false; setJoining(false); }
  }
  return <ScreenScaffold title="Zespoły" subtitle="Współpracuj nad projektami z innymi osobami.">
    <PrimaryButton label="Utwórz zespół" disabled={joining} onPress={() => setCreating(true)} />
    <View style={styles.card}>
      <Text style={styles.section}>Dołącz do zespołu</Text>
      <Text style={styles.meta}>Poproś właściciela o jednorazowy kod zaproszenia.</Text>
      <TextField label="Kod zaproszenia" value={code} onChangeText={setCode} maxLength={20} placeholder="Wklej 20-znakowy kod" autoCapitalize="none" autoCorrect={false} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={joining ? 'Dołączanie…' : 'Dołącz do zespołu'} variant="outline" disabled={joining || !code.trim()} onPress={() => { void join(); }} />
    </View>
    <Text style={styles.section}>Moje zespoły</Text>
    {!ready ? <ActivityIndicator color={colors.primary} /> : loadError ? <View style={styles.card}>
      <Text accessibilityRole="alert" style={styles.error}>{readError}</Text><PrimaryButton label="Spróbuj ponownie" onPress={reload} />
    </View> : teams.length ? teams.map((team) => <Pressable key={team.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/zespol/[id]', params: { id: team.id } })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Text style={styles.name}>{team.name}</Text>
      {team.description ? <Text style={styles.meta}>{team.description}</Text> : null}
      <Text style={styles.role}>{team.ownerId === user?.uid ? 'Właściciel' : 'Uczestnik'} • Liczba osób: {team.memberIds.length}</Text>
      <Text style={styles.link}>Otwórz zespół ›</Text>
    </Pressable>) : <View style={styles.card}><Text style={styles.name}>Nie należysz jeszcze do żadnego zespołu</Text><Text style={styles.meta}>Utwórz zespół albo dołącz przez kod zaproszenia.</Text></View>}
    {creating ? <TeamFormModal onCancel={() => setCreating(false)} onSave={async (name, description) => {
      if (!user) throw new Error('Zaloguj się ponownie.');
      const id = await createTeam(user, name, description);
      setCreating(false); router.push({ pathname: '/zespol/[id]', params: { id } });
    }} /> : null}
  </ScreenScaffold>;
}
const useStyles = createThemedStyles((colors) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 16, gap: 12 },
  section: { color: colors.text, fontSize: 17, fontWeight: '700' }, name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 21 }, role: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '600' }, error: { color: colors.danger, fontSize: 14, lineHeight: 21 }, pressed: { opacity: 0.75 },
}));
