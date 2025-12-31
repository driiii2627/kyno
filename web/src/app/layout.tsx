import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import MobileNavbar from '@/components/layout/MobileNavbar';
import AmbientBackground from '@/components/layout/AmbientBackground';
import { ToastProvider } from '@/components/ui/ToastContext';
import { NotificationProvider } from '@/context/NotificationContext';
import GlobalNotificationOverlay from '@/components/notifications/GlobalNotificationOverlay';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Kyno+',
  description: 'Filmes, Séries e TV ao Vivo',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased text-white`}>
        <AmbientBackground />
        <ToastProvider>
          <NotificationProvider>
            <Navbar />
            <MobileNavbar />
            <GlobalNotificationOverlay />
            <main className="min-h-screen relative">{children}</main>
          </NotificationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
