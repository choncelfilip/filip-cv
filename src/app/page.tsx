'use client';

import dynamic from 'next/dynamic';
import HeroSection from '@/components/HeroSection';

const FrameSequence = dynamic(() => import('@/components/FrameSequence'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '300vh', backgroundColor: '#A19FA0' }} aria-label="Ładowanie animacji" />
  ),
});

const TerminalSection = dynamic(() => import('@/components/TerminalSection'), {
  ssr: false,
  loading: () => <div style={{ height: '380vh', backgroundColor: '#000' }} />,
});

const ChatSection = dynamic(() => import('@/components/ChatSection'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '100vh', backgroundColor: '#000' }} />,
});

export default function Home() {
  return (
    <main>
      {/* Section 1 — Hero (light radial gradient → crossfade into canvas) */}
      <HeroSection />

      {/* Section 2 — Frame sequence scroll-scrubbing */}
      <FrameSequence />

      {/*
        Sections 3 + 4 — Single continuous terminal screen.
        Flat #000000 background, single subtle scanline overlay.
      */}
      <div className="crt-terminal-wrapper">
        <TerminalSection />
        <ChatSection />

        <footer
          style={{
            position: 'relative',
            zIndex: 20,
            padding: 'clamp(1.5rem, 3vw, 2.5rem) clamp(2.5rem, 5vw, 5rem)',
            borderTop: '1px solid rgba(51,255,51,0.06)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--terminal-color)',
              opacity: 0.2,
            }}
          >
            © 2025 Filip Choncel — AI / Automation Developer
          </p>
        </footer>
      </div>
    </main>
  );
}
