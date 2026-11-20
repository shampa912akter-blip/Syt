import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShortsFlow — YouTube Shorts Auto-Scheduler',
  description:
    'YouTube Shorts auto-scheduler with multi-video queue ordering, Vercel Blob storage, OAuth2 YouTube publishing, daily cron automation, and Bengali & English UI.',
  openGraph: {
    title: 'ShortsFlow — YouTube Shorts Auto-Scheduler',
    description:
      'Batch upload vertical videos, drag to set publishing order, and automate daily YouTube Shorts drops.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-rose-100 selection:text-rose-900">
        {children}
      </body>
    </html>
  );
}
