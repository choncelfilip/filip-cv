'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { terminalCommands } from '@/lib/content';
import type { TerminalCommand } from '@/types';

gsap.registerPlugin(ScrollTrigger);

const SECTION_HEIGHT = '380vh';
// CLI padding — generous left margin like a real terminal
const CLI_PADDING = 'clamp(2.5rem, 5vw, 5rem)';

interface Segment {
  text: string;
  isCmd: boolean;
  cumStart: number;
  cumEnd: number;
}

function buildSegments(commands: readonly TerminalCommand[]): Segment[] {
  const segs: Segment[] = [];
  let pos = 0;
  for (const cmd of commands) {
    const t = `$ ${cmd.cmd}\n`;
    segs.push({ text: t, isCmd: true, cumStart: pos, cumEnd: pos + t.length });
    pos += t.length;
    for (const line of cmd.output) {
      const t2 = `${line}\n`;
      segs.push({ text: t2, isCmd: false, cumStart: pos, cumEnd: pos + t2.length });
      pos += t2.length;
    }
    segs.push({ text: '\n', isCmd: false, cumStart: pos, cumEnd: pos + 1 });
    pos += 1;
  }
  return segs;
}

export default function TerminalSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const scrollDivRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const prefersReduced = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )[0];

  const segments = useMemo(() => buildSegments(terminalCommands), []);
  const totalChars = useMemo(() => segments.at(-1)?.cumEnd ?? 0, [segments]);

  const [visibleChars, setVisibleChars] = useState(() => prefersReduced ? totalChars : 0);

  // Pure scroll-driven reveal — GSAP pin + onUpdate, NO timers
  useEffect(() => {
    if (prefersReduced) return;
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    // Ignoruj resize od klawiatury mobilnej — klawiatura zmienia innerHeight
    // co powoduje przeliczenie pinów i scroll jump.
    ScrollTrigger.config({ ignoreMobileResize: true });

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        pin: sticky,
        pinSpacing: false,
        onUpdate: (self) => {
          const target = Math.floor(self.progress * totalChars);
          if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
            setVisibleChars(target);
            rafRef.current = null;
          });
        },
        onLeave: () => setVisibleChars(totalChars),
        onLeaveBack: () => setVisibleChars(0),
      });
    }, section);

    return () => {
      ctx.revert();
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [prefersReduced, totalChars]);

  // Auto-scroll the inner div to always show latest text
  useEffect(() => {
    const div = scrollDivRef.current;
    if (div) div.scrollTop = div.scrollHeight;
  }, [visibleChars]);

  const visibleSegments = useMemo(() => {
    return segments
      .map((seg) => {
        if (visibleChars <= seg.cumStart) return null;
        const endPos = Math.min(visibleChars, seg.cumEnd);
        return { ...seg, visible: seg.text.slice(0, endPos - seg.cumStart) };
      })
      .filter(Boolean) as Array<Segment & { visible: string }>;
  }, [visibleChars, segments]);

  const isFullyRevealed = visibleChars >= totalChars;

  return (
    <section
      ref={sectionRef}
      id="terminal"
      style={{ height: SECTION_HEIGHT }}
      aria-label="Terminal CV"
    >
      {/* Accessible content */}
      <div className="sr-only">
        <h2>CV — Filip Choncel</h2>
        {terminalCommands.map((cmd) => (
          <div key={cmd.cmd}>
            <h3>{cmd.cmd}</h3>
            <p>{cmd.output.join(' ')}</p>
          </div>
        ))}
      </div>

      {/* GSAP-pinned viewport — no CSS sticky, no mac chrome, full-screen CLI */}
      <div
        ref={stickyRef}
        aria-hidden="true"
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: CLI_PADDING,
          paddingRight: CLI_PADDING,
          paddingTop: '4rem',
          paddingBottom: '4rem',
        }}
      >
        <div
          ref={scrollDivRef}
          className="terminal-scrollbar"
          style={{ maxHeight: '82vh', overflowY: 'auto', overflowX: 'hidden' }}
        >
          <pre
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'clamp(0.78rem, 1.3vw, 0.92rem)',
              lineHeight: '1.75',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
            }}
          >
            {visibleSegments.map((seg, i) => (
              <span
                key={i}
                style={{
                  color: seg.isCmd ? 'var(--terminal-color-bright)' : 'var(--terminal-color)',
                  textShadow: seg.isCmd
                    ? '-1px 0 rgba(255,0,0,0.10), 1px 0 rgba(0,255,255,0.10), 0 0 6px var(--terminal-color)'
                    : '0 0 4px var(--terminal-color)',
                  opacity: seg.isCmd ? 1 : 0.88,
                }}
              >
                {seg.visible}
              </span>
            ))}
            {/* Block cursor — solid during reveal, blinking when idle */}
            <span
              style={{
                display: 'inline-block',
                width: '0.6em',
                height: '1.1em',
                background: 'var(--terminal-color)',
                verticalAlign: 'text-bottom',
                boxShadow: '0 0 6px var(--terminal-color)',
                animation: isFullyRevealed ? 'cursor-blink 1s step-end infinite' : 'none',
              }}
            />
          </pre>
        </div>
      </div>
    </section>
  );
}
