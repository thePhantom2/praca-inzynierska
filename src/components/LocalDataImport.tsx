import { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useSession } from '@/context/session';
import { importLocalData } from '@/storage/importLocalData';
import { cloudErrorMessage } from '@/storage/cloudStorage';
import { colors } from '@/theme/colors';

export function LocalDataImport() {
  const { user } = useSession();
  const owner = useRef(user?.uid);
  owner.current = user?.uid;
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  async function run(uid: string) {
    if (busy.current || owner.current !== uid) return;
    busy.current = true; setSaving(true); setMessage('');
    try {
      const count = await importLocalData(uid);
      if (owner.current === uid) setMessage(count ? 'Import zakończony. Wcześniej zaimportowane wpisy zostały pominięte.' : 'Brak lokalnych danych do importu.');
    } catch (error) {
      if (owner.current === uid) setMessage(cloudErrorMessage(error));
    } finally { busy.current = false; setSaving(false); }
  }
  return <View style={{ gap: 10 }}>
    <Text style={{ color: colors.muted, lineHeight: 20 }}>Wcześniejsze projekty i wpisy zapisane na tym urządzeniu możesz dodać do obecnego konta. Lokalna kopia zostanie zachowana.</Text>
    <PrimaryButton label={saving ? 'Importowanie…' : 'Importuj lokalne projekty i kalendarz'} variant="outline" disabled={saving || !user} onPress={() => {
      if (!user) return;
      const uid = user.uid;
      Alert.alert('Import danych', `Dodać lokalne dane do konta ${user.email}?`, [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Importuj', onPress: () => { void run(uid); } },
      ]);
    }} />
    {message ? <Text accessibilityRole="alert" style={{ color: colors.text, lineHeight: 20 }}>{message}</Text> : null}
  </View>;
}
