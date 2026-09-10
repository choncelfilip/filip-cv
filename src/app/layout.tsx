import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Filip Choncel — AI / Automation Developer',
  description:
    'Interaktywne CV Filipa Choncela — specjalista AI i automatyzacji. Integracje z Claude, GPT, Gemini, n8n, Supabase.',
  keywords: ['AI Developer', 'Automation Developer', 'n8n', 'Supabase', 'ChatBot', 'Filip Choncel'],
  openGraph: {
    title: 'Filip Choncel — AI / Automation Developer',
    description: 'Interaktywne CV — integracje AI i automatyzacji w biznesie',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
