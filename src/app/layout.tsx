import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
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
  const gaTrackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

  return (
    <html
      lang="en"
      className={cn(inter.className, 'dark')}
      suppressHydrationWarning
    >
      {gaTrackingId && (
        <>
          <Script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaTrackingId}');
            `}
          </Script>
        </>
      )}
      <body className="antialiased" suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
