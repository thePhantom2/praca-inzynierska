const { spawnSync } = require('node:child_process');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const config = require('../app.json');
const root = path.resolve(__dirname, '..');
const appId = process.env.E2E_APP_ID || config.expo.ios.bundleIdentifier;
const appUrl = process.env.E2E_APP_URL || `exp+${config.expo.slug}://?__expo_url=${encodeURIComponent('http://127.0.0.1:8081')}`;
mkdirSync(path.join(root, 'reports'), { recursive: true });
const args = [];
if (process.env.E2E_DEVICE_ID) args.push('--device', process.env.E2E_DEVICE_ID);
args.push('test', '.maestro', '--format', 'junit', '--output', 'reports/maestro.xml', '-e', `APP_ID=${appId}`, '-e', `APP_URL=${appUrl}`);
const result = spawnSync('maestro', args, { cwd: root, stdio: 'inherit' });
if (result.error?.code === 'ENOENT') {
  console.error('Nie znaleziono Maestro CLI. Instalacja: https://docs.maestro.dev/maestro-cli');
  process.exit(1);
}
if (result.error) { console.error(result.error.message); process.exit(1); }
process.exit(result.status ?? 1);
