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
    id: '/invest-model',
    lang: 'ko-KR',
    dir: 'ltr',
    start_url: '/invest-model',
    scope: '/invest-model',
    display: 'standalone',
    display_override: ['standalone', 'browser'],
    orientation: 'portrait',
    background_color: '#F5F7FB',
    theme_color: '#246BFE',
    categories: ['finance', 'productivity'],
    prefer_related_applications: false,
    related_applications: [],
    launch_handler: {
      client_mode: 'navigate-existing'
    },
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    shortcuts: [
      {
        name: 'Search',
        short_name: 'Search',
        description: 'Find mock models, signals, and feed items.',
        url: '/invest-model/search',
        icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }]
      },
      {
        name: 'Signals',
        short_name: 'Signals',
        description: 'Open the mock-only signal dashboard.',
        url: '/invest-model/signals',
        icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }]
      },
      {
        name: 'Feed',
        short_name: 'Feed',
        description: 'Open the investment model community feed.',
        url: '/invest-model/feed',
        icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }]
      },
      {
        name: 'Portfolio',
        short_name: 'Portfolio',
        description: 'Review mock portfolio performance and holdings.',
        url: '/invest-model/portfolio',
        icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }]
      }
    ]
  };
}
