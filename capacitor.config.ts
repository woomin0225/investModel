import type { CapacitorConfig } from '@capacitor/cli';

const devServerUrl = process.env.CAPACITOR_DEV_SERVER_URL;

/**
 * Capacitor scaffold for the investModel mobile shell.
 * This config does not add native platforms, permissions, payments, brokerage,
 * push delivery, or secure-storage behavior. The WebView source strategy is
 * documented in docs/mobile/native-webview-source-strategy.md.
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
