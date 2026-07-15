import type { CapacitorConfig } from '@capacitor/cli';

const devServerUrl = process.env.CAPACITOR_DEV_SERVER_URL;

/**
 * Capacitor scaffold for the investModel mobile shell.
 * This config does not add native platforms, permissions, payments, brokerage,
 * push delivery, or secure-storage behavior. BK-411 will decide the final
 * WebView source strategy before any Android/iOS project is generated.
 */
const config: CapacitorConfig = {
  appId: 'com.investmodel.app',
  appName: 'investModel',
  webDir: 'out',
  server: devServerUrl
    ? {
        url: devServerUrl,
        cleartext: devServerUrl.startsWith('http://')
      }
    : undefined
};

export default config;
