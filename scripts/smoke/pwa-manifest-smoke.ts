import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import manifest from '../../app/manifest';
import capacitorConfig from '../../capacitor.config';

const appManifest = manifest();
const repoRoot = process.cwd();
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(appManifest.id === '/invest-model', 'manifest id should identify the investModel app shell');
assert(appManifest.start_url === '/invest-model', 'manifest start_url should open the investModel shell');
assert(appManifest.scope === '/invest-model', 'manifest scope should stay inside investModel routes');
assert(appManifest.display === 'standalone', 'manifest display should keep standalone PWA mode');
assert(appManifest.orientation === 'portrait', 'manifest orientation should prefer portrait mobile use');
assert(appManifest.background_color === '#F5F7FB', 'manifest background_color should match the mobile app shell');
assert(appManifest.theme_color === '#246BFE', 'manifest theme_color should match the app chrome color');
assert(appManifest.categories?.includes('finance'), 'manifest should keep the finance category');
assert(appManifest.categories?.includes('productivity'), 'manifest should keep the productivity category');
assert(appManifest.prefer_related_applications === false, 'manifest should prefer the web PWA over related native apps');
assert(appManifest.related_applications?.length === 0, 'manifest should not point users to native broker or store apps');
assert(appManifest.launch_handler?.client_mode === 'navigate-existing', 'manifest should reuse the installed app window');
assert(appManifest.icons?.some((icon) => icon.src === '/icon' && icon.sizes === '512x512'), 'manifest should expose a 512px app icon');
assert(
  appManifest.icons?.some((icon) => icon.src === '/icon' && icon.sizes === '512x512' && icon.purpose === 'maskable'),
  'manifest should expose a 512px maskable app icon'
);

const shortcutUrls = new Set(appManifest.shortcuts?.map((shortcut) => shortcut.url));

for (const expectedUrl of [
  '/invest-model/search',
  '/invest-model/models',
  '/invest-model/signals',
  '/invest-model/feed',
  '/invest-model/portfolio',
  '/invest-model/notifications',
  '/invest-model/my'
]) {
  assert(shortcutUrls.has(expectedUrl), `manifest shortcut missing ${expectedUrl}`);
}

for (const shortcut of appManifest.shortcuts ?? []) {
  assert(shortcut.url.startsWith('/invest-model/'), `shortcut ${shortcut.name} should stay inside investModel scope`);
  assert(shortcut.icons?.some((icon) => icon.src === '/icon'), `shortcut ${shortcut.name} should include the app icon`);
}

assert(capacitorConfig.appId === 'com.investmodel.app', 'Capacitor appId should stay scoped to investModel');
assert(capacitorConfig.appName === 'investModel', 'Capacitor appName should stay investModel');
assert(capacitorConfig.webDir === 'out', 'Capacitor webDir should remain a placeholder until static export is approved');
assert(capacitorConfig.server === undefined, 'Capacitor server should be undefined unless CAPACITOR_DEV_SERVER_URL is set');
assert(!('plugins' in capacitorConfig), 'Capacitor config should not enable native plugins in the PWA manifest smoke');
assert(
  !packageJson.dependencies?.['@capacitor/android'] && !packageJson.devDependencies?.['@capacitor/android'],
  '@capacitor/android should stay absent until IS-007 is resolved'
);
assert(
  !packageJson.dependencies?.['@capacitor/ios'] && !packageJson.devDependencies?.['@capacitor/ios'],
  '@capacitor/ios should stay absent until Mac/Xcode scaffold work is selected'
);
assert(!existsSync(join(repoRoot, 'android')), 'android/ platform folder should not exist while native scaffold is deferred');
assert(!existsSync(join(repoRoot, 'ios')), 'ios/ platform folder should not exist while native scaffold is deferred');

console.log('PWA manifest smoke passed');
