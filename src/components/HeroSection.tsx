'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { heroContent } from '@/lib/content';

gsap.registerPlugin(ScrollTrigger);

// First frame vignette approximation:
// center rgb(238,236,236) → corners rgb(161,159,160)
// This matches frame_001.webp so the cut to canvas is invisible
const HERO_GRADIENT =
  'radial-gradient(ellipse at 50% 35%, #EEECEC 0%, #C0BEBE 60%, #A19FA0 100%)';

// This same edge color bridges the gap between Hero and FrameSequence section bg
export const HERO_EDGE_COLOR = '#A19FA0';

export default function HeroSection() {
  // Extended section height gives the sticky inner time to crossfade with canvas
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      // Hero content fades out over the last ~55vh of the 120vh section,
      // overlapping with the canvas fade-in that starts at section end.
      gsap.to(content, {
        opacity: 0,
        y: -30,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: section,
          start: 'center bottom', // starts fading when we're halfway through section
          end: 'bottom top',      // fully gone when section scrolls off
          scrub: 0.8,
        },
      });
    }, section);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    // 120vh = 100vh visible + 20vh "overlap zone" for crossfade with canvas
    <section
      ref={sectionRef}
      style={{ height: '120vh' }}
      aria-label="Sekcja powitalna"
    >
      <div
        ref={stickyRef}
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          background: HERO_GRADIENT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <div
          ref={contentRef}
          className="flex flex-col items-center gap-6 px-4 text-center"
        >
          {/* Name */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-none"
            style={{
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
              color: '#2A2828',
            }}
          >
            {heroContent.name}
          </h1>

          {/* Title */}
          <p
            className="text-lg sm:text-xl md:text-2xl font-light tracking-widest uppercase"
            style={{
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
              color: '#6B6666',
            }}
          >
            {heroContent.title}
          </p>

          {/* Divider */}
          <div className="w-16 h-px my-2" style={{ backgroundColor: '#C0BEBE' }} aria-hidden="true" />

          {/* Scroll indicator */}
          <div
            className="bounce-arrow flex flex-col items-center gap-1 mt-4"
            aria-label="Przewiń w dół"
            role="img"
          >
            <span
              className="text-xs tracking-widest uppercase font-light"
              style={{ color: '#8A8484' }}
            >
              Scroll
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 3v14M4 11l6 6 6-6"
                stroke="#8A8484"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
