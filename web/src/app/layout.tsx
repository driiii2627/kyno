import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import MobileNavbar from '@/components/layout/MobileNavbar';
import AmbientBackground from '@/components/layout/AmbientBackground';
import { ToastProvider } from '@/components/ui/ToastContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Kyno+',
  description: 'Filmes, Séries e TV ao Vivo',
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

import SmoothScrolling from '@/components/ui/SmoothScrolling';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
      </head>
      <body className={`${inter.variable} font-sans antialiased text-white`}>
        <SmoothScrolling>
          <AmbientBackground />
          <ToastProvider>
            <Navbar />
            <MobileNavbar />
            <main className="min-h-screen relative">{children}</main>
          </ToastProvider>
        </SmoothScrolling>
      </body>
    </html>
  );
}
