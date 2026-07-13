import type { MetadataRoute } from 'next';

/**
 * manifest describes investModel as a mobile-first PWA shell for mock-only investment model workflows.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'investModel',
    short_name: 'investModel',
    description:
      'Mobile-first AI investment model marketplace prototype with mock-only model discovery, signals, and portfolio flows.',
    start_url: '/invest-model',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F5F7FB',
    theme_color: '#246BFE',
    categories: ['finance', 'productivity'],
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      }
    ]
  };
}
