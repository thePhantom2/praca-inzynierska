const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const local = new Map([['app-theme', 'dark']]);
let failStorage = false, active, cursor = 0, colorScheme;
const contextValues = new Map(), cache = new Map();
const provider = { hooks: [], effects: [] }, settings = { hooks: [], effects: [] }, appSettings = { hooks: [], effects: [] };
const react = {
 createContext: () => { const context = {}; context.Provider = { context }; return context; },
 useContext: context => contextValues.get(context),
 useState: initial => { const scope = active, i = cursor++; if (!(i in scope.hooks)) scope.hooks[i] = initial; return [scope.hooks[i], value => { scope.hooks[i] = typeof value === 'function' ? value(scope.hooks[i]) : value; }]; },
 useRef: initial => { const scope = active, i = cursor++; return scope.hooks[i] ??= { current: initial }; },
 useMemo: fn => { cursor++; return fn(); },
 useEffect: (fn, deps) => {
  const scope = active, i = cursor++, old = scope.hooks[i];
  if (!old || deps.some((value, index) => value !== old.deps[index])) scope.effects.push(() => { old?.cleanup?.(); scope.hooks[i] = { deps, cleanup: fn() }; });
 },
};
function jsx(type, props) { if (type?.context) contextValues.set(type.context, props.value); return { type, props }; }
const rn = { StyleSheet: { create: styles => styles }, Appearance: { setColorScheme: value => { colorScheme = value; } }, Platform: { OS: 'ios' }, View: 'View', Text: 'Text', Switch: 'Switch', KeyboardAvoidingView: 'KeyboardAvoidingView', ActivityIndicator: 'ActivityIndicator' };
function load(file) {
 if (cache.has(file)) return cache.get(file);
 const module = { exports: {} };
 const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
 const resolve = name => {
  if (name === 'react') return react;
  if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
  if (name === 'react-native') return rn;
  if (name === 'expo-router') return { router: { back() {} } };
  if (name === '@react-native-async-storage/async-storage') return { __esModule: true, default: { getItem: async key => local.get(key) ?? null, setItem: async (key, value) => { if (failStorage) throw new Error('Disk unavailable'); local.set(key, value); } } };
  if (name === '@/context/session') return { useSession: () => ({ user: { firstName: 'Jan', lastName: 'Nowak', name: 'Jan Nowak', email: 'jan@example.test', nickname: 'Janek' }, profileWarning: '', updateAccount: async () => ({}), disableAccount: async () => {} }) };
  if (name.startsWith('@/components/')) { const component = name.split('/').pop(); return { [component]: component }; }
  if (name.startsWith('@/')) { const base = `src/${name.slice(2)}`; return load(fs.existsSync(`${base}.ts`) ? `${base}.ts` : `${base}.tsx`); }
  return require(name);
 };
 new Function('require', 'module', 'exports', code)(resolve, module, module.exports);
 cache.set(file, module.exports); return module.exports;
}
const theme = load('src/theme/ThemeProvider.tsx');
const screen = load('src/app/ustawienia-konta.tsx').default;
const settingsScreen = load('src/app/(tabs)/profil.tsx').default;
function render(scope, fn) { active = scope; cursor = 0; const result = fn(); for (const effect of scope.effects.splice(0)) effect(); return result; }
function mountTheme() { render(provider, () => theme.ThemeProvider({ children: 'app' })); }
function nodes(tree) { if (!tree || typeof tree !== 'object') return []; return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)]; }
const find = (tree, predicate) => nodes(tree).find(predicate);
(async () => {
 mountTheme(); await new Promise(setImmediate); mountTheme();
 let currentTheme = [...contextValues.values()][0];
 assert.equal(currentTheme.isDark, true); assert.equal(colorScheme, 'dark');
 let tree = render(settings, screen);
 assert.equal(tree.props.style.backgroundColor, currentTheme.colors.background);
 assert.equal(find(tree, n => n.type === 'Switch'), undefined);
 let settingsTree = render(appSettings, settingsScreen);
 assert.equal(settingsTree.props.title, 'Ustawienia');
 assert.equal(find(settingsTree, n => n.type === 'Switch').props.value, true);
 find(tree, n => n.props?.label === 'Imię').props.onChangeText('Ewa');
 find(tree, n => n.props?.label === 'Usuń konto').props.onPress();
 tree = render(settings, screen);
 find(tree, n => n.props?.label === 'Aktualne hasło').props.onChangeText('private-test-value');
 await find(settingsTree, n => n.type === 'Switch').props.onValueChange(false);
 await new Promise(setImmediate); mountTheme();
 currentTheme = [...contextValues.values()][0];
 tree = render(settings, screen);
 settingsTree = render(appSettings, settingsScreen);
 assert.equal(find(settingsTree, n => n.type === 'Switch').props.value, false);
 assert.equal(find(tree, n => n.props?.label === 'Imię').props.value, 'Ewa');
 assert.equal(find(tree, n => n.props?.label === 'Aktualne hasło').props.value, 'private-test-value');
 assert.equal(tree.props.style.backgroundColor, currentTheme.colors.background);
 assert.equal(local.get('app-theme'), 'light'); assert.equal(local.size, 1);
 provider.hooks = []; provider.effects = []; mountTheme(); await new Promise(setImmediate); mountTheme();
 currentTheme = [...contextValues.values()][0]; assert.equal(currentTheme.isDark, false);
 failStorage = true; await currentTheme.setDarkMode(true); mountTheme();
 currentTheme = [...contextValues.values()][0]; assert.equal(currentTheme.isDark, false); assert.ok(currentTheme.error);
 assert.equal(local.get('app-theme'), 'light');
 console.log('PASS: saved theme restored; toggle updates screen and native appearance; form values retained; failed storage keeps prior preference and reports error');
})().catch(error => { console.error(error); process.exitCode = 1; });
