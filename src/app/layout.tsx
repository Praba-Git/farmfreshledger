import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-grotesk',
});

export const metadata: Metadata = {
  title: 'Farm Fresh Ledger',
  description: 'A simple app for tracking farm expenses.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const originalFetch = window.fetch;
                Object.defineProperty(window, 'fetch', {
                  get: () => originalFetch,
                  set: (v) => { console.warn('An external script tried to override window.fetch. This is usually caused by browser extensions like Buster or network interceptors. The override was ignored to prevent a crash.'); },
                  configurable: true
                });
              } catch (e) {
                // If we can't redefine it, it might already be protected or restricted by the environment
              }
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          spaceGrotesk.variable
        )}
      >
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
