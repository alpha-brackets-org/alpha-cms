import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import QueryProvider from '@/providers/QueryProvider';
import { PortfolioProvider } from '@/providers/PortfolioProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Alpha CMS | Custom Admin Panel',
  description: 'High-performance agency administrative engine',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthProvider>
            <PortfolioProvider>
              {children}
              <Toaster />
            </PortfolioProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
