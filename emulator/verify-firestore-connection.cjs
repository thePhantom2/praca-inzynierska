const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const {FirebaseError}=require('firebase/app');
function load(file,imports,globals={}){
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('require','module','exports',...Object.keys(globals),code)(name=>imports[name],module,module.exports,...Object.values(globals));
 return module.exports;
}
const timers=new Map();let timerId=0,watcher,throwOnListen=false;
const firestore={onSnapshot:(query,options,next,error)=>{
 if(throwOnListen)throw new Error('Cannot initialize');
 watcher={query,options,next,error,closed:false};return()=>{watcher.closed=true;};
}};
const {subscribeToQuery}=load('src/lib/subscribeToQuery.ts',{'firebase/app':{FirebaseError},'firebase/firestore':firestore},{setTimeout:(callback,ms)=>{assert.equal(ms,15000);timers.set(++timerId,callback);return timerId;},clearTimeout:id=>timers.delete(id)});
const snapshots=[],errors=[];
let stop=subscribeToQuery({},snapshot=>snapshots.push(snapshot),error=>errors.push(error));
assert.equal(watcher.options.includeMetadataChanges,true);
watcher.next({metadata:{fromCache:true},docs:[]});assert.equal(snapshots.length,0);assert.equal(timers.size,1);
for(const callback of [...timers.values()])callback();
assert.equal(errors[0].code,'unavailable');assert.equal(watcher.closed,false,'Timed-out listener stays alive for recovery');
watcher.next({metadata:{fromCache:false},docs:[{id:'recovered'}]});assert.equal(snapshots.length,1);assert.equal(timers.size,0);
stop();watcher.next({metadata:{fromCache:false},docs:[]});assert.equal(snapshots.length,1);
stop=subscribeToQuery({},snapshot=>snapshots.push(snapshot),error=>errors.push(error));
watcher.error(new FirebaseError('permission-denied','Denied'));assert.equal(timers.size,0);assert.equal(errors.at(-1).code,'permission-denied');stop();
stop=subscribeToQuery({},snapshot=>snapshots.push(snapshot),error=>errors.push(error));
watcher.next({metadata:{fromCache:false},docs:[]});assert.equal(snapshots.at(-1).docs.length,0);assert.equal(timers.size,0);stop();
stop=subscribeToQuery({},()=>assert.fail('Unsubscribed callback'),()=>assert.fail('Unsubscribed timeout'));stop();assert.equal(timers.size,0);
throwOnListen=true;assert.throws(()=>subscribeToQuery({},()=>{},()=>{}),/Cannot initialize/);assert.equal(timers.size,0);
console.log('PASS: empty cache is not treated as server data; startup timeout reports error; live recovery, permission errors and unsubscribe cancel timers');
let initializations=0,settings;
const native=load('src/lib/firestore.native.ts',{'firebase/app':{FirebaseError},'firebase/firestore':{initializeFirestore:(app,options)=>{initializations++;settings=options;return{app};}}});
const app={};assert.equal(native.getPlatformFirestore(app),native.getPlatformFirestore(app));assert.equal(initializations,1);assert.equal(settings.experimentalForceLongPolling,true);assert.equal(settings.experimentalAutoDetectLongPolling,false);
const failed=load('src/lib/firestore.native.ts',{'firebase/app':{FirebaseError},'firebase/firestore':{initializeFirestore:()=>{throw new FirebaseError('failed-precondition','Already initialized');}}});
assert.throws(()=>failed.getPlatformFirestore({}),/Przeładuj całą aplikację/);
const web=load('src/lib/firestore.ts',{'firebase/firestore':{getFirestore:value=>value}});assert.equal(web.getPlatformFirestore(app),app);
console.log('PASS: native transport uses forced long polling and a singleton; changed running settings require reload; web keeps default transport');
