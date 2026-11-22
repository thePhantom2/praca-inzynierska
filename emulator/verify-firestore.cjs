const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const fb = require('firebase/app');
const authApi = require('firebase/auth');
const dbApi = require('firebase/firestore');
const local = new Map();
const storage = { getItem: async key => local.get(key) ?? null, setItem: async (key, val) => local.set(key, val) };
const apps = ['owner', 'stranger', 'guest'].map(name => fb.initializeApp({ apiKey: 'fake-key', projectId: 'demo-praca-cloud', appId: '1:123:web:abc' }, name));
const auths = apps.map(app => { const auth = authApi.getAuth(app); authApi.connectAuthEmulator(auth, 'http://127.0.0.1:9299', { disableWarnings: true }); return auth; });
const dbs = apps.map(app => { const db = dbApi.getFirestore(app); dbApi.connectFirestoreEmulator(db, '127.0.0.1', 8188); return db; });
let currentDb = dbs[0];
let sessionUser;
let hooks = [], cursor = 0, effects = [];
const react = {
 useState: initial => { const i = cursor++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value; }]; },
 useRef: initial => { const i = cursor++; return hooks[i] ??= { current: initial }; },
 useEffect: (callback, deps) => {
  const i = cursor++, old = hooks[i];
  if (!old || deps.some((value, index) => value !== old.deps[index])) {
   effects.push(() => { old?.cleanup?.(); hooks[i] = { deps, cleanup: callback() }; });
  }
 },
};
const cache = {};
function load(file) {
 if(cache[file]) return cache[file];
 const module = { exports: {} };
 const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }}).outputText;
 const resolve = name => {
  if(name === 'react') return react;
  if(name === '@/context/session') return { useSession: () => ({ user: sessionUser }) };
  if(name === '@/lib/firebase') return { getFirestoreDatabase: () => currentDb };
  if(name === '@react-native-async-storage/async-storage') return { __esModule: true, default: storage };
  if(name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`);
  return require(name);
 };
 new Function('require', 'module', 'exports', code)(resolve, module, module.exports);
 return cache[file] = module.exports;
}
const cloud = load('src/storage/cloudStorage.ts');
const {parseProject} = load('src/storage/projectsStorage.ts');
const {parseEntry} = load('src/storage/eventsStorage.ts');
const {importLocalData} = load('src/storage/importLocalData.ts');
const project = { id: 'project-a', name: 'Projekt', description: 'Opis', deadline: '2026-12-10', tasks: [{ id: 'task-a', title: 'Zadanie A', completed: false, dateKey: '2026-12-01' }] };
(async () => {
 const a = await authApi.createUserWithEmailAndPassword(auths[0], 'owner@example.test', 'test12345');
 const b = await authApi.createUserWithEmailAndPassword(auths[1], 'stranger@example.test', 'test12345');
 const uid = a.user.uid;
 const ref = dbApi.doc(dbs[0], 'users', uid, 'projects', project.id);
 await cloud.commitChanges(uid, 'projects', [], [project], parseProject, cloud.mergeProject);
 assert.equal((await dbApi.getDoc(ref)).data().name, 'Projekt');
 for (const db of [dbs[1], dbs[2]]) {
  const other = dbApi.doc(db, 'users', uid, 'projects', project.id);
  await assert.rejects(dbApi.getDoc(other), e => e.code === 'permission-denied');
  await assert.rejects(dbApi.setDoc(other, project), e => e.code === 'permission-denied');
  await assert.rejects(dbApi.deleteDoc(other), e => e.code === 'permission-denied');
  await assert.rejects(dbApi.getDocs(dbApi.collection(db, 'users', uid, 'projects')), e => e.code === 'permission-denied');
 }
 console.log('PASS: owner CRUD and cross-user/guest read, list, update and delete denied');
 const changed = { ...project, name: 'Nowa nazwa' };
 const concurrent = { ...project, description: 'Inne urządzenie', tasks: [...project.tasks, { id: 'task-b', title: 'Zadanie B', completed: false }] };
 await dbApi.setDoc(ref, concurrent);
 await cloud.commitChanges(uid, 'projects', [project], [changed], parseProject, cloud.mergeProject);
 let latest = (await dbApi.getDoc(ref)).data();
 assert.equal(latest.name, 'Nowa nazwa'); assert.equal(latest.description, 'Inne urządzenie'); assert.equal(latest.tasks.length, 2);
 const toggle = { ...latest, tasks: latest.tasks.map(t => t.id === 'task-a' ? { ...t, completed: true } : t) };
 await dbApi.setDoc(ref, { ...latest, tasks: latest.tasks.map(t => t.id === 'task-b' ? { ...t, title: 'Zmienione B' } : t) });
 await cloud.commitChanges(uid, 'projects', [latest], [toggle], parseProject, cloud.mergeProject);
 latest = (await dbApi.getDoc(ref)).data();
 assert.equal(latest.tasks[0].completed, true); assert.equal(latest.tasks[1].title, 'Zmienione B');
 const archived = { ...latest, completedAt: new Date().toISOString() };
 await cloud.commitChanges(uid, 'projects', [latest], [archived], parseProject, cloud.mergeProject);
 assert.equal((await dbApi.getDoc(ref)).data().tasks.length, 2);
 await cloud.commitChanges(uid, 'projects', [archived], [], parseProject, cloud.mergeProject);
 await assert.rejects(cloud.commitChanges(uid, 'projects', [archived], [{ ...archived, name: 'Stale' }], parseProject, cloud.mergeProject), /usunięty/);
 assert.equal((await dbApi.getDoc(ref)).exists(), false);
 console.log('PASS: concurrent project/task edits preserved; archive keeps tasks; stale update cannot resurrect deleted project');
 const entry = { id: 'event-a', title: 'Termin', notes: 'Opis', dateKey: '2026-12-01', time: '12:00', type: 'event' };
 await cloud.commitChanges(uid, 'events', [], [entry], parseEntry);
 const eventRef = dbApi.doc(dbs[0], 'users', uid, 'events', entry.id);
 assert.equal((await dbApi.getDoc(eventRef)).data().title, 'Termin');
 await cloud.commitChanges(uid, 'events', [entry], [{...entry,title:'Edytowany'}], parseEntry);
 assert.equal((await dbApi.getDoc(eventRef)).data().title, 'Edytowany');
 await cloud.commitChanges(uid, 'events', [{...entry,title:'Edytowany'}], [], parseEntry);
 local.set('projects', JSON.stringify([project])); local.set('calendar-entries', JSON.stringify([entry]));
 await importLocalData(uid);
 assert.equal((await dbApi.getDoc(ref)).exists(), true); assert.equal((await dbApi.getDoc(eventRef)).exists(), true);
 await dbApi.deleteDoc(ref);
 await dbApi.updateDoc(eventRef, {title:'Edycja po imporcie'});
 await importLocalData(uid);
 assert.equal((await dbApi.getDoc(ref)).exists(), false); assert.equal((await dbApi.getDoc(eventRef)).data().title, 'Edycja po imporcie');
 assert.equal(JSON.parse(local.get('projects')).length, 1);
 currentDb = dbs[1];
 await importLocalData(b.user.uid);
 assert.equal((await dbApi.getDoc(dbApi.doc(dbs[1], 'users', b.user.uid, 'projects', project.id))).exists(), true);
 console.log('PASS: calendar CRUD; per-account import idempotent; local backup retained; imported deletions and later edits preserved');
 const { useUserCollection } = load('src/hooks/useUserCollection.ts');
 const render = () => { cursor = 0; return useUserCollection('events', parseEntry); };
 const flush = () => { for (const effect of effects.splice(0)) effect(); };
 const until = async predicate => {
  const end = Date.now() + 5000;
  while (!predicate()) { if (Date.now() > end) throw new Error('Listener timed out'); await new Promise(resolve => setTimeout(resolve, 10)); }
 };
 currentDb = dbs[0]; sessionUser = { uid };
 render(); flush();
 await until(() => render().ready);
 assert.equal(render().items[0].title, 'Edycja po imporcie');
 currentDb = dbs[1]; sessionUser = { uid: b.user.uid };
 assert.equal(render().items.length, 0, 'No previous owner data even before effect cleanup');
 flush(); await until(() => render().ready);
 assert.equal(render().items[0].title, 'Termin');
 sessionUser = undefined;
 assert.equal(render().items.length, 0); assert.equal(render().ready, true);
 flush();
 sessionUser = { uid }; // Signed-in stranger cannot use another UID even through the hook.
 render(); flush(); await until(() => render().loadError);
 assert.equal(render().items.length, 0);
 assert.match(render().error, /reguły Firestore/);
 currentDb = dbs[0]; await render().load(); render(); flush();
 await until(() => render().ready && !render().loadError);
 assert.equal(render().items[0].title, 'Edycja po imporcie');
 sessionUser = undefined; render(); flush();
 console.log('PASS: live listener reload, permissions error and retry; account switch/signout hide previous user data immediately');
 for(const db of dbs) await dbApi.terminate(db);
 for(const app of apps) await fb.deleteApp(app);
 console.log('ALL FIRESTORE CHECKS PASSED');
})().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
