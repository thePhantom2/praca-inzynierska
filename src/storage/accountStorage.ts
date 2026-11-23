import AsyncStorage from '@react-native-async-storage/async-storage';

export type AccountProfile = {
  uid?: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  nickname: string;
};

const STORAGE_KEY = 'account-profiles';

export async function loadAccountProfiles(): Promise<AccountProfile[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const profiles: unknown = JSON.parse(raw);
  if (!Array.isArray(profiles) || !profiles.every((profile) =>
    profile && (profile.uid === undefined || typeof profile.uid === 'string') && ['name', 'firstName', 'lastName', 'email', 'nickname'].every(
      (field) => typeof profile[field] === 'string'
    )
  )) {
    throw new Error('Nie udało się odczytać zapisanych danych konta.');
  }
  return profiles as AccountProfile[];
}

export async function saveAccountProfiles(profiles: AccountProfile[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}
