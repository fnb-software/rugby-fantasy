import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import NavBar from './NavBarRenderer';
import './globals.css';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RWC 2023 stats & fantasy',
  description: 'Explore stats and fantasy insights',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavBar />
        <main className="flex min-h-screen flex-col items-center justify-between pt-20 p-4 lg:p-24 bg-gray-100">
          {children}
        </main>
        <div id="modal"></div>
      </body>
    </html>
  );
}
