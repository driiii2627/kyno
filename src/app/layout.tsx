import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Kyno+',
  description: 'Filmes, Séries e TV ao Vivo',
};

import { ToastProvider } from '@/components/ui/ToastContext';

// ... (Metadata stays same)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased text-white`}>
        <ToastProvider>
          <Navbar />
          <main className="min-h-screen relative">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
