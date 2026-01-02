import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { config } from '@/config';
import { cn } from '@/utils/helpers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: config.app.name,
  description: config.app.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(inter.className, 'dark')}
      suppressHydrationWarning
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
