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
    'Interactive CV of Filip Choncel — AI and automation specialist. Integrations with Claude, GPT, Gemini, n8n, Supabase.',
  keywords: ['AI Developer', 'Automation Developer', 'n8n', 'Supabase', 'ChatBot', 'Filip Choncel'],
  openGraph: {
    title: 'Filip Choncel — AI / Automation Developer',
    description: 'Interactive CV — AI integrations and business automation',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
