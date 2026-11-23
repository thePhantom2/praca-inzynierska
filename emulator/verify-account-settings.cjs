const assert = require('node:assert/strict');
const fb = require('firebase/app');
const authApi = require('firebase/auth');
const dbApi = require('firebase/firestore');
const fnApi = require('firebase/functions');
const functionsRequire = require('node:module').createRequire(require('node:path').resolve(__dirname, '../functions/package.json'));
const { initializeApp } = functionsRequire('firebase-admin/app');
const { getAuth } = functionsRequire('firebase-admin/auth');
const { getFirestore } = functionsRequire('firebase-admin/firestore');
const projectId = 'demo-praca-cloud';
const adminApp = initializeApp({ projectId });
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);
const apps = ['owner-settings', 'stranger-settings', 'guest-settings'].map(name => fb.initializeApp({ apiKey: 'fake-key', projectId, appId: '1:123:web:abc' }, name));
const auths = apps.map(app => { const auth = authApi.getAuth(app); authApi.connectAuthEmulator(auth, 'http://127.0.0.1:9299', { disableWarnings: true }); return auth; });
const dbs = apps.map(app => { const db = dbApi.getFirestore(app); dbApi.connectFirestoreEmulator(db, '127.0.0.1', 8188); return db; });
const functions = apps.map(app => { const fn = fnApi.getFunctions(app, 'europe-west1'); fnApi.connectFunctionsEmulator(fn, '127.0.0.1', 5055); return fn; });
const call = (index, data = { confirmation: 'DISABLE_MY_ACCOUNT' }) => fnApi.httpsCallable(functions[index], 'disableMyAccount')(data);
(async () => {
 const owner = (await authApi.createUserWithEmailAndPassword(auths[0], 'settings-owner@example.test', 'test12345')).user;
 const stranger = (await authApi.createUserWithEmailAndPassword(auths[1], 'settings-stranger@example.test', 'test12345')).user;
 const project = { id: 'keep-project', name: 'Zachowany', description: 'Opis', deadline: '2026-12-10', tasks: [] };
 const ref = dbApi.doc(dbs[0], 'users', owner.uid, 'projects', project.id);
 await dbApi.setDoc(ref, project);
 await assert.rejects(call(2), error => error.code === 'functions/unauthenticated');
 await assert.rejects(call(0, { confirmation: 'DISABLE_MY_ACCOUNT', uid: stranger.uid }), error => error.code === 'functions/invalid-argument');
 await assert.rejects(call(0, { confirmation: 'NO' }), error => error.code === 'functions/invalid-argument');
 await assert.rejects(dbApi.setDoc(dbApi.doc(dbs[0], 'accountStatus', owner.uid), { disabled: true }), error => error.code === 'permission-denied');
 await assert.rejects(authApi.reauthenticateWithCredential(owner, authApi.EmailAuthProvider.credential(owner.email, 'wrong-password')));
 assert.equal((await adminAuth.getUser(owner.uid)).disabled, false);
 console.log('PASS: signed-out call, wrong password, forged target UID and client writes to account status denied');
 await authApi.reauthenticateWithCredential(owner, authApi.EmailAuthProvider.credential(owner.email, 'test12345'));
 const oldToken = await owner.getIdToken();
 const fs = require('node:fs');
 const ts = require('typescript');
 const localData = new Map();
 const storage = { getItem: async key => localData.get(key) ?? null, setItem: async (key, value) => localData.set(key, value) };
 let cursor = 0, hooks = [], effects = [], context, failService = false;
 const react = {
  createContext: () => ({ Provider: 'Provider' }),
  useContext: () => context,
  useState: value => { const i = cursor++; if (!(i in hooks)) hooks[i] = value; return [hooks[i], next => { hooks[i] = typeof next === 'function' ? next(hooks[i]) : next; }]; },
  useRef: value => { const i = cursor++; return hooks[i] ??= { current: value }; },
  useCallback: fn => { cursor++; return fn; },
  useEffect: fn => { const i = cursor++; if (!(i in hooks)) { hooks[i] = true; effects.push(fn); } },
 };
 const modules = {};
 function load(file) {
  if (modules[file]) return modules[file];
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const module = { exports: {} };
  const resolve = name => {
   if (name === 'react') return react;
   if (name === 'react/jsx-runtime') return { jsx: (_type, props) => { context = props.value; return props; } };
   if (name === '@/lib/firebase') return { getFirebaseApp: () => apps[0] };
   if (name === '@/lib/firebaseAuth') return { getFirebaseAuth: () => auths[0] };
   if (name === '@react-native-async-storage/async-storage') return { __esModule: true, default: storage };
   if (name === '@/lib/accountActions') return { disableCurrentAccount: async () => {
    if (failService) throw new fb.FirebaseError('functions/unavailable', 'Offline');
    await load('src/lib/accountActions.ts').disableCurrentAccount();
   } };
   if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
   return require(name);
  };
  new Function('require', 'module', 'exports', code)(resolve, module, module.exports);
  return modules[file] = module.exports;
 }
 const { SessionProvider } = load('src/context/session.tsx');
 const cleanups = [];
 const render = () => { cursor = 0; SessionProvider({ children: null }); for (const effect of effects.splice(0)) cleanups.push(effect()); return context; };
 render(); await new Promise(setImmediate); render();
 assert.equal(context.user.uid, owner.uid);
 await assert.rejects(context.disableAccount('wrong-password'));
 assert.equal(render().user.uid, owner.uid);
 failService = true;
 await assert.rejects(context.disableAccount('test12345'), error => error.code === 'functions/unavailable');
 assert.equal(render().user.uid, owner.uid);
 assert.equal((await adminAuth.getUser(owner.uid)).disabled, false);
 failService = false;
 await context.disableAccount('test12345');
 assert.equal(render().user, null);
 assert.equal(auths[0].currentUser, null);
 for (const cleanup of cleanups) cleanup?.();
 console.log('PASS: actual session provider keeps login after wrong password or failed service; successful disable signs out');
 assert.equal((await adminAuth.getUser(owner.uid)).disabled, true);
 assert.equal((await adminAuth.getUser(stranger.uid)).disabled, false);
 assert.equal((await adminDb.doc(`users/${owner.uid}/projects/${project.id}`).get()).data().name, 'Zachowany');
 assert.equal((await adminDb.doc(`accountStatus/${owner.uid}`).get()).data().disabled, true);
 console.log('PASS: real callable sets Firebase Authentication disabled; other user and project data retained');
 const rest = await fetch(`http://127.0.0.1:8188/v1/projects/${projectId}/databases/(default)/documents/users/${owner.uid}/projects/${project.id}`, { headers: { Authorization: `Bearer ${oldToken}` } });
 assert.equal(rest.status, 403);
 await authApi.signOut(auths[0]);
 await assert.rejects(authApi.signInWithEmailAndPassword(auths[0], owner.email, 'test12345'), error => error.code === 'auth/user-disabled');
 console.log('PASS: old ID token cannot read Firestore; disabled user cannot sign in');
 // Verify stale and missing auth_time cannot invoke privileged deletion.
 const stale = await adminAuth.createCustomToken(stranger.uid);
 const staleResult = await authApi.signInWithCustomToken(auths[1], stale);
 const tokenResult = await staleResult.user.getIdTokenResult();
 const tokenPayload = JSON.parse(Buffer.from(tokenResult.token.split('.')[1], 'base64url'));
 tokenPayload.auth_time = Math.floor(Date.now() / 1000) - 600;
 const staleToken = [Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify(tokenPayload)).toString('base64url'),''].join('.');
 const staleResponse = await fetch(`http://127.0.0.1:5055/${projectId}/europe-west1/disableMyAccount`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staleToken}` }, body: JSON.stringify({data:{confirmation:'DISABLE_MY_ACCOUNT'}}) });
 assert.equal((await staleResponse.json()).error.status, 'FAILED_PRECONDITION');
 assert.equal((await adminAuth.getUser(stranger.uid)).disabled, false);
 console.log('PASS: callable requires recent authentication');
 for(const db of dbs) await dbApi.terminate(db);
 for(const app of apps) await fb.deleteApp(app);
 await adminDb.terminate();
 console.log('ALL ACCOUNT DISABLING CHECKS PASSED');
})().then(()=>process.exit(0)).catch(error=>{console.error(error);process.exit(1);});
