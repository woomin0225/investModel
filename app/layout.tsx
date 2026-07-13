import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: {
    default: 'investModel',
    template: '%s | investModel'
  },
  description:
    'Mobile-first AI investment model marketplace prototype using mock-only portfolios, signals, and model discovery.',
  applicationName: 'investModel',
  appleWebApp: {
    capable: true,
    title: 'investModel',
    statusBarStyle: 'default'
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: '/icon',
    apple: '/apple-icon'
  },
  manifest: '/manifest.webmanifest'
};

export const viewport: Viewport = {
  themeColor: '#246BFE',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover'
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <SWRConfig
          value={{
            fallback: {
              // 여기서는 await하지 않는다.
              // 이 데이터를 읽는 컴포넌트만 suspend된다.
              '/api/user': getUser(),
              '/api/team': getTeamForUser()
            }
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
