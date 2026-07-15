import manifest from '../../app/manifest';

const appManifest = manifest();

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

console.log('PWA manifest smoke passed');
