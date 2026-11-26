import {
  arrayRemove, arrayUnion, collection, deleteDoc, deleteField, doc, FieldPath,
  runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc,
} from 'firebase/firestore';
import { getFirestoreDatabase } from '@/lib/firebase';
import type { SessionUser } from '@/context/session';

export const MAX_TEAM_MEMBERS = 50;
export type TeamMember = { name: string; nickname: string };
export type Team = {
  id: string; name: string; description: string; ownerId: string;
  memberIds: string[]; members: Record<string, TeamMember>;
};
export type TeamInvitation = {
  id: string; teamId: string; teamName: string; ownerId: string;
  status: 'pending' | 'accepted' | 'revoked'; expiresAt: Timestamp; acceptedBy: string | null;
};
export function memberProfile(user: SessionUser): TeamMember {
  return { name: user.name.trim().slice(0, 201) || 'Użytkownik', nickname: user.nickname.trim().slice(0, 50) };
}
export function parseTeam(value: unknown): Team {
  const team = value as Team | null;
  if (!team || !['id', 'name', 'description', 'ownerId'].every((key) => typeof team[key as keyof Team] === 'string') ||
    !Array.isArray(team.memberIds) || !team.memberIds.every((id) => typeof id === 'string') ||
    !team.memberIds.includes(team.ownerId) || new Set(team.memberIds).size !== team.memberIds.length ||
    !team.members || !team.memberIds.every((id) => typeof team.members[id]?.name === 'string' && typeof team.members[id]?.nickname === 'string')) {
    throw new Error('Nieprawidłowe dane zespołu.');
  }
  return team;
}
export function parseInvitation(value: unknown): TeamInvitation {
  const invite = value as TeamInvitation | null;
  if (!invite || !['id', 'teamId', 'teamName', 'ownerId'].every((key) => typeof invite[key as keyof TeamInvitation] === 'string') ||
    !['pending', 'accepted', 'revoked'].includes(invite.status) || typeof invite.expiresAt?.toMillis !== 'function' ||
    !(invite.acceptedBy === null || typeof invite.acceptedBy === 'string')) throw new Error('Nieprawidłowe zaproszenie.');
  return invite;
}
function teamFields(name: string, description: string) {
  const normalized = name.trim();
  if (!normalized || normalized.length > 100) throw new Error('Podaj nazwę zespołu (do 100 znaków).');
  if (description.trim().length > 500) throw new Error('Opis zespołu może mieć do 500 znaków.');
  return { name: normalized, description: description.trim() };
}
export async function createTeam(user: SessionUser, name: string, description: string): Promise<string> {
  const ref = doc(collection(getFirestoreDatabase(), 'teams'));
  await setDoc(ref, { ...teamFields(name, description), ownerId: user.uid, memberIds: [user.uid], members: { [user.uid]: memberProfile(user) }, createdAt: serverTimestamp() });
  return ref.id;
}
export async function editTeam(teamId: string, name: string, description: string) {
  await updateDoc(doc(getFirestoreDatabase(), 'teams', teamId), teamFields(name, description));
}
export async function removeTeamMember(teamId: string, uid: string) {
  await updateDoc(doc(getFirestoreDatabase(), 'teams', teamId), 'memberIds', arrayRemove(uid), new FieldPath('members', uid), deleteField());
}
export async function deleteTeam(teamId: string) {
  await deleteDoc(doc(getFirestoreDatabase(), 'teams', teamId));
}
export async function createInvitation(team: Team, uid: string): Promise<string> {
  if (team.ownerId !== uid) throw new Error('Tylko właściciel może zapraszać do zespołu.');
  if (team.memberIds.length >= MAX_TEAM_MEMBERS) throw new Error('Zespół może mieć maksymalnie 50 osób.');
  const ref = doc(collection(getFirestoreDatabase(), 'teamInvitations'));
  await setDoc(ref, {
    teamId: team.id, teamName: team.name, ownerId: uid, status: 'pending', acceptedBy: null,
    createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  return ref.id;
}
export async function revokeInvitation(id: string) {
  await updateDoc(doc(getFirestoreDatabase(), 'teamInvitations', id), { status: 'revoked' });
}
export async function acceptInvitation(code: string, user: SessionUser): Promise<string> {
  const normalized = code.trim();
  if (!/^[A-Za-z0-9]{20}$/.test(normalized)) throw new Error('Wklej pełny, 20-znakowy kod zaproszenia.');
  const database = getFirestoreDatabase();
  const inviteRef = doc(database, 'teamInvitations', normalized);
  try {
    return await runTransaction(database, async (transaction) => {
      const snapshot = await transaction.get(inviteRef);
      if (!snapshot.exists()) throw new Error('Nie znaleziono zaproszenia.');
      const invite = parseInvitation({ ...snapshot.data(), id: snapshot.id });
      if (invite.status !== 'pending' || invite.expiresAt.toMillis() <= Date.now()) throw new Error('Zaproszenie zostało wykorzystane, anulowane lub wygasło.');
      if (invite.ownerId === user.uid) throw new Error('Jesteś już właścicielem tego zespołu.');
      // A joining user cannot read the private team yet. Atomic field transforms
      // preserve concurrent joins; rules verify this invitation in the same commit.
      transaction.update(doc(database, 'teams', invite.teamId),
        'memberIds', arrayUnion(user.uid), new FieldPath('members', user.uid), memberProfile(user), 'lastJoinInvite', normalized);
      transaction.update(inviteRef, { status: 'accepted', acceptedBy: user.uid, acceptedAt: serverTimestamp() });
      return invite.teamId;
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'permission-denied') throw new Error('Nie można dołączyć. Sprawdź, czy kod jest aktualny, nie został wykorzystany i zespół ma mniej niż 50 osób.');
    throw error;
  }
}
