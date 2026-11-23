const { randomUUID } = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

initializeApp();

exports.disableMyAccount = onCall({ region: 'europe-west1', maxInstances: 3 }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Zaloguj się ponownie.');
  const authTime = Number(request.auth.token.auth_time);
  const age = Date.now() / 1000 - authTime;
  if (!Number.isFinite(authTime) || age > 300 || age < -30) {
    throw new HttpsError('failed-precondition', 'Potwierdź operację aktualnym hasłem.');
  }
  if (!request.data || request.data.confirmation !== 'DISABLE_MY_ACCOUNT' || Object.keys(request.data).length !== 1) {
    throw new HttpsError('invalid-argument', 'Potwierdź wyłączenie konta.');
  }
  // The caller can disable only their own account. No target UID is accepted.
  const uid = request.auth.uid;
  const auth = getAuth();
  const db = getFirestore();
  const status = db.collection('accountStatus').doc(uid);
  const previous = await status.get();
  const operationId = randomUUID();
  // Deny existing sessions access to Firestore before disabling Authentication.
  await status.set({ disabled: true, disabledAt: FieldValue.serverTimestamp(), operationId });
  try {
    await auth.updateUser(uid, { disabled: true });
  } catch (error) {
    // A lost response may still mean the update was committed.
    let isDisabled;
    try { isDisabled = (await auth.getUser(uid)).disabled; } catch { /* Keep the access block if Auth is unavailable. */ }
    if (isDisabled !== true) {
      if (isDisabled === false) {
        await db.runTransaction(async (transaction) => {
          const current = await transaction.get(status);
          if (current.data()?.operationId !== operationId) return;
          if (previous.exists) transaction.set(status, previous.data());
          else transaction.delete(status);
        });
      }
      logger.error('Account disable failed', { uid, code: error.code });
      throw new HttpsError('internal', 'Nie udało się wyłączyć konta. Spróbuj ponownie.');
    }
  }
  // Disabled Auth rejects token refresh; Firestore rules also block old ID tokens.
  try { await auth.revokeRefreshTokens(uid); }
  catch (error) { logger.error('Refresh token revocation failed for disabled account', { uid, code: error.code }); }
  return { disabled: true };
});
