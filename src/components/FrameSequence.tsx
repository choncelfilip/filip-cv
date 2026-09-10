'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { FrameLoadingState } from '@/types';

gsap.registerPlugin(ScrollTrigger);

const LOW_PERFORMANCE_CORES = 4;

function isMobileOrLowPerf(): boolean {
  if (typeof window === 'undefined') return false;
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const lowCores =
    'hardwareConcurrency' in navigator && navigator.hardwareConcurrency < LOW_PERFORMANCE_CORES;
  return isMobile || lowCores;
}

// Matches HeroSection's gradient edge color → bridges the color gap
// between Hero leaving and first canvas frame appearing
const BRIDGE_COLOR = '#A19FA0';

export default function FrameSequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [loadingState, setLoadingState] = useState<FrameLoadingState>({ status: 'idle' });

  const prefersReduced = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )[0];

  const isMobile = useState(() => isMobileOrLowPerf())[0];

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const frames = framesRef.current;
    const safeIndex = Math.max(0, Math.min(index, frames.length - 1));
    const img = frames[safeIndex];
    if (!img?.complete) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  const scheduleFrame = useCallback(
    (targetIndex: number) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (currentFrameRef.current !== targetIndex) {
          currentFrameRef.current = targetIndex;
          drawFrame(targetIndex);
        }
        rafRef.current = null;
      });
    },
    [drawFrame],
  );

  // Load frames
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    async function loadFrames() {
      try {
        const res = await fetch('/api/frame-count', { signal: controller.signal });
        if (!res.ok) throw new Error('Failed to fetch frame count');
        const data = (await res.json()) as { count: number };
        const totalFrames = data.count;

        const step = isMobile ? 2 : 1;
        const indices: number[] = [];
        for (let i = 1; i <= totalFrames; i += step) indices.push(i);

        setLoadingState({ status: 'loading', progress: 0 });

        if (prefersReduced) {
          const lastImg = new Image();
          lastImg.src = `/frames/frame_${String(totalFrames).padStart(3, '0')}.webp`;
          await new Promise<void>((resolve) => {
            lastImg.onload = () => resolve();
            lastImg.onerror = () => resolve();
          });
          if (controller.signal.aborted) return;
          framesRef.current = [lastImg];
          setLoadingState({ status: 'loaded', frames: [lastImg], count: 1 });
          drawFrame(0);
          return;
        }

        let loaded = 0;
        const images = new Array<HTMLImageElement>(indices.length);

        await Promise.all(
          indices.map((frameNum, i) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.src = `/frames/frame_${String(frameNum).padStart(3, '0')}.webp`;
              img.onload = () => {
                images[i] = img;
                loaded++;
                if (!controller.signal.aborted)
                  setLoadingState({ status: 'loading', progress: Math.round((loaded / indices.length) * 100) });
                resolve();
              };
              img.onerror = () => { images[i] = img; loaded++; resolve(); };
            }),
          ),
        );

        if (controller.signal.aborted) return;
        framesRef.current = images;
        setLoadingState({ status: 'loaded', frames: images, count: images.length });
        drawFrame(0);
      } catch (err) {
        if (controller.signal.aborted) return;
        setLoadingState({ status: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    void loadFrames();
    return () => controller.abort();
  }, [drawFrame, isMobile, prefersReduced]);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(currentFrameRef.current);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    return () => window.removeEventListener('resize', resize);
  }, [drawFrame]);

  // GSAP: canvas fade-in crossfade + scroll-scrubbing
  useEffect(() => {
    if (loadingState.status !== 'loaded') return;

    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    const ctx = gsap.context(() => {
      if (!prefersReduced) {
        // Fade-in canvas during first 12% of section scroll.
        // This overlaps with Hero fading out → seamless crossfade.
        gsap.fromTo(
          sticky,
          { opacity: 0 },
          {
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: '12% top',
              scrub: true,
            },
          },
        );

        // Scroll-scrubbing frame selection
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          pin: sticky,
          pinSpacing: false,
          onUpdate: (self) => {
            const frames = framesRef.current;
            if (!frames.length) return;
            const target = Math.min(
              Math.round(self.progress * (frames.length - 1)),
              frames.length - 1,
            );
            scheduleFrame(target);
          },
          onLeave: () => scheduleFrame(framesRef.current.length - 1),
        });
      } else {
        // Reduced motion: pin and show last frame immediately
        sticky.style.opacity = '1';
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          pin: sticky,
          pinSpacing: false,
        });
        scheduleFrame(framesRef.current.length - 1);
      }
    }, section);

    return () => {
      ctx.revert();
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [loadingState.status, scheduleFrame, prefersReduced]);

  const skipToTerminal = () =>
    document.getElementById('terminal')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      // Bridge color matches Hero gradient edge AND first frame corner vignette
      style={{ height: '300vh', backgroundColor: BRIDGE_COLOR }}
      aria-label="Animacja komputera CRT"
    >
      {/* Skip button */}
      <button
        onClick={skipToTerminal}
        className="fixed top-4 right-4 z-50 px-3 py-1.5 text-xs border text-white border-white/20 bg-black/40 hover:bg-black/70 backdrop-blur-sm transition-all duration-200 rounded-sm"
        style={{ fontFamily: 'var(--font-mono)' }}
        aria-label="Pomiń animację i przejdź do terminala"
      >
        Pomiń animację ↓
      </button>

      {/* Sticky canvas container — starts invisible, fades in */}
      <div
        ref={stickyRef}
        className="relative w-full overflow-hidden"
        style={{ height: '100vh', backgroundColor: '#000', opacity: 0 }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />

        {loadingState.status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
            <p className="text-sm mb-4" style={{ color: 'var(--terminal-color)', fontFamily: 'var(--font-mono)' }}>
              Inicjalizacja sekwencji... {loadingState.progress}%
            </p>
            <div
              className="w-64 h-1 bg-white/10 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={loadingState.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="loading-bar-fill" style={{ width: `${loadingState.progress}%` }} />
            </div>
          </div>
        )}

        {loadingState.status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <p className="text-sm text-red-400" style={{ fontFamily: 'var(--font-mono)' }}>
              [error] {loadingState.message}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
