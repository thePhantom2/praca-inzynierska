const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const fb=require('firebase/app'),auth=require('firebase/auth'),db=require('firebase/firestore');
const apps=['sync-owner','sync-member'].map(name=>fb.initializeApp({apiKey:'fake',projectId:'demo-praca-cloud',appId:'1:123:web:abc'},name));
const auths=apps.map(app=>{const a=auth.getAuth(app);auth.connectAuthEmulator(a,'http://127.0.0.1:9299',{disableWarnings:true});return a;});
const dbs=apps.map(app=>{const d=db.getFirestore(app);db.connectFirestoreEmulator(d,'127.0.0.1',8188);return d;});
let currentDb=dbs[0],user,cursor=0,active;
const contexts=new Map(),cache={};
const teamScope={hooks:[],effects:[]},projectScope={hooks:[],effects:[]};
const react={
 createContext:()=>{const c={};c.Provider={context:c};return c;},useContext:c=>contexts.get(c),
 useState:initial=>{const scope=active,i=cursor++;if(!(i in scope.hooks))scope.hooks[i]=initial;return[scope.hooks[i],value=>{scope.hooks[i]=typeof value==='function'?value(scope.hooks[i]):value;}];},
 useRef:initial=>{const scope=active,i=cursor++;return scope.hooks[i]??={current:initial};},
 useEffect:(fn,deps)=>{const scope=active,i=cursor++,old=scope.hooks[i];if(!old||deps.some((v,n)=>v!==old.deps[n]))scope.effects.push(()=>{old?.cleanup?.();scope.hooks[i]={deps,cleanup:fn()};});},
};
function load(file){if(cache[file])return cache[file];const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const resolve=name=>{
  if(name==='react')return react;if(name==='react/jsx-runtime')return{jsx:(type,props)=>{contexts.set(type.context,props.value);return props;}};
  if(name==='@/context/session')return{useSession:()=>({user})};if(name==='@/lib/firebase')return{getFirestoreDatabase:()=>currentDb};
  if(name==='@react-native-async-storage/async-storage')return{__esModule:true,default:{getItem:async()=>null}};
  if(name.startsWith('@/')){const base=`src/${name.slice(2)}`;return load(fs.existsSync(base+'.ts')?base+'.ts':base+'.tsx');}return require(name);
 };new Function('require','module','exports',code)(resolve,m,m.exports);return cache[file]=m.exports;}
const teamContext=load('src/context/teams.tsx'),projectContext=load('src/context/projects.tsx');
const teamApi=load('src/storage/teamsStorage.ts'),projectApi=load('src/storage/sharedProjects.ts'),cloud=load('src/storage/cloudStorage.ts'),{parseProject}=load('src/storage/projectsStorage.ts');
function renderScope(scope,fn){active=scope;cursor=0;fn({children:null});for(const effect of scope.effects.splice(0))effect();}
function render(){renderScope(teamScope,teamContext.TeamsProvider);renderScope(projectScope,projectContext.ProjectsProvider);return projectContext.useProjects();}
async function until(predicate){const end=Date.now()+7000;while(true){const value=render();if(predicate(value))return value;if(Date.now()>end)throw new Error('Synchronization timed out: '+JSON.stringify({ready:value.ready,error:value.error,count:value.projects.length}));await new Promise(r=>setTimeout(r,15));}}
(async()=>{
 const users=[];for(let i=0;i<2;i++){const result=await auth.createUserWithEmailAndPassword(auths[i],`team-sync-${i}@example.test`,'test12345');users.push({uid:result.user.uid,name:`Osoba ${i}`,nickname:`Nick${i}`});}
 user=users[0];currentDb=dbs[0];const tid=await teamApi.createTeam(user,'Synchronizacja','');const team=teamApi.parseTeam({...((await db.getDoc(db.doc(dbs[0],'teams',tid))).data()),id:tid});
 const original={id:'identical-id',name:'Projekt właściciela',description:'Opis',deadline:'2026-12-01',tasks:[{id:'a',title:'Zadanie',completed:false}]};
 await cloud.commitChanges(user.uid,'projects',[],[original],parseProject,cloud.mergeProject);await projectApi.setProjectTeam(user.uid,original.id,tid);
 let value=await until(v=>v.ready&&v.projects.length===1);assert.equal(value.projects[0].id,original.id);assert.equal(value.canManage(value.projects[0]),true);
 const code=await teamApi.createInvitation(team,user.uid);
 currentDb=dbs[1];await teamApi.acceptInvitation(code,users[1]);
 await cloud.commitChanges(users[1].uid,'projects',[],[{...original,name:'Prywatny projekt uczestnika'}],parseProject,cloud.mergeProject);
 user=users[1];value=render();assert.equal(value.projects.length,0,'Account switch hides old owner immediately');
 value=await until(v=>v.ready&&v.projects.length===2);
 const shared=value.projects.find(p=>p.sourceId);assert.ok(shared);assert.equal(shared.id,`${users[0].uid}:${original.id}`);assert.equal(value.canManage(shared),false);
 assert.equal(new Set(value.projects.map(p=>p.id)).size,2,'Colliding source IDs remain distinct');
 assert.equal(await value.persist(value.projects.map(p=>p.id===shared.id?{...p,tasks:p.tasks.map(t=>({...t,completed:true}))}:p)),true);
 await until(v=>v.projects.some(p=>p.sourceId&&p.tasks[0].completed));
 assert.equal((await db.getDoc(db.doc(dbs[0],'users',users[0].uid,'projects',original.id))).data().tasks[0].completed,true);
 console.log('PASS: actual team/project providers synchronize shared tasks; owner keeps one project; colliding IDs route independently');
 assert.equal(await value.removeProject(shared.id),false);assert.equal(await value.archiveProject(shared.id),false);
 currentDb=dbs[0];await teamApi.removeTeamMember(tid,users[1].uid);currentDb=dbs[1];
 value=await until(v=>v.ready&&v.projects.length===1&&!v.projects[0].sourceId);assert.equal(value.projects[0].name,'Prywatny projekt uczestnika');
 user=null;value=render();assert.equal(value.projects.length,0);
 console.log('PASS: removed member loses shared data but keeps private projects; signout clears project state');
 for(const scope of [projectScope,teamScope])for(const entry of scope.hooks)entry?.cleanup?.();
 for(const d of dbs)await db.terminate(d);for(const app of apps)await fb.deleteApp(app);console.log('ALL TEAM SYNC CHECKS PASSED');
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
