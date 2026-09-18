'use client';

import { useEffect, useRef, useState, useCallback, FormEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ChatMessage } from '@/types';
import { chatWelcomeMessage } from '@/lib/content';

gsap.registerPlugin(ScrollTrigger);

const WEBHOOK_URL = process.env.NEXT_PUBLIC_CHAT_WEBHOOK_URL ?? '';
const TYPEWRITER_DELAY = 14;
const CLI_PADDING = 'clamp(1rem, 4vw, 4rem)';
const INTRO_HEIGHT = '280vh'; // More scroll space for the matrix reveal

const TIPS_TEXT = `
Tips for getting started:

1. Zapytaj o doświadczenie, umiejętności lub realizowane projekty.
2. Zadawaj konkretne pytania dla najlepszych rezultatów.
3. Zapytaj o dostępność i warunki współpracy.
4. Wpisz pytanie w polu poniżej i naciśnij Enter.
`.trimStart();

function generateId(): string {
  return crypto.randomUUID();
}

function parseAIResponse(body: unknown): string {
  if (typeof body === 'string') return body;
  if (typeof body === 'object' && body !== null) {
    const obj = body as Record<string, unknown>;
    for (const key of ['reply', 'output', 'text', 'message']) {
      if (typeof obj[key] === 'string') return obj[key] as string;
    }
  }
  return JSON.stringify(body);
}

function getReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ChatSection() {
  // ── Intro (scroll-driven canvas & text reveal) ──
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const prefersReduced = useState(getReducedMotion)[0];

  const [introDone, setIntroDone] = useState(() => prefersReduced);
  const [visibleTipsChars, setVisibleTipsChars] = useState(
    () => (prefersReduced ? TIPS_TEXT.length : 0)
  );
  
  // Matrix data for Canvas
  const matrixData = useRef({
    cols: 0,
    rows: 0,
    matrix: [] as number[][],
    cell: 7,
  });

  const [rowCountText, setRowCountText] = useState('');

  // ── Canvas Setup Logic ──
  const buildMatrix = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const TEXT = 'GEMINI';
    // Match the user's logic
    const cssWidth = Math.max(280, Math.min(920, Math.floor(window.innerWidth * 0.88)));
    const cssHeight = Math.round(cssWidth * 0.30);
    const CELL = cssWidth < 480 ? 5 : 7;
    matrixData.current.cell = CELL;

    const sample = document.createElement('canvas');
    sample.width = cssWidth;
    sample.height = cssHeight;
    const sctx = sample.getContext('2d', { willReadFrequently: true });
    if (!sctx) return;

    sctx.clearRect(0, 0, sample.width, sample.height);
    sctx.fillStyle = '#000';
    sctx.textBaseline = 'middle';
    sctx.textAlign = 'center';

    let fontSize = cssHeight * 0.88;
    sctx.font = `900 ${fontSize}px "Arial Black", Arial, sans-serif`;
    const measured = sctx.measureText(TEXT).width;
    const targetWidth = cssWidth * 0.94;
    if (measured > 0) {
      fontSize = fontSize * (targetWidth / measured);
    }
    sctx.font = `900 ${fontSize}px "Arial Black", Arial, sans-serif`;
    sctx.fillText(TEXT, sample.width / 2, sample.height / 2 + fontSize * 0.03);

    const img = sctx.getImageData(0, 0, sample.width, sample.height).data;
    const cols = Math.floor(sample.width / CELL);
    const rows = Math.floor(sample.height / CELL);
    
    matrixData.current.cols = cols;
    matrixData.current.rows = rows;
    matrixData.current.matrix = [];

    for (let r = 0; r < rows; r++) {
      const rowArr = new Array(cols).fill(0);
      for (let c = 0; c < cols; c++) {
        let alphaSum = 0, count = 0;
        for (let y = 0; y < CELL; y += 2) {
          for (let x = 0; x < CELL; x += 2) {
            const px = c * CELL + x, py = r * CELL + y;
            if (px < sample.width && py < sample.height) {
              const idx = (py * sample.width + px) * 4;
              alphaSum += img[idx + 3] ?? 0;
              count++;
            }
          }
        }
        const avg = count ? alphaSum / count : 0;
        rowArr[c] = avg > 200 ? 2 : (avg > 25 ? 1 : 0);
      }
      matrixData.current.matrix.push(rowArr);
    }

    canvas.width = cols * CELL;
    canvas.height = rows * CELL;
    canvas.style.width = (cols * CELL) + 'px';
    canvas.style.height = (rows * CELL) + 'px';
  }, []);

  const renderCanvas = useCallback((progress: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { cols, rows, matrix, cell: CELL } = matrixData.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // We want the canvas render to finish at 60% of the total scroll
    const canvasProgress = Math.min(1, Math.max(0, progress / 0.6));
    const revealFloat = canvasProgress * rows;

    const drawCell = (r: number, c: number, opacity: number) => {
      if (opacity <= 0) return;
      const v = matrix[r]?.[c] ?? 0;
      if (v === 0) return;
      const x = c * CELL, y = r * CELL;
      if (v === 2) {
        ctx.fillStyle = `rgba(57,255,106,${opacity})`;
        ctx.fillRect(x, y, CELL, CELL);
      } else {
        ctx.fillStyle = `rgba(15,107,44,${opacity * 0.85})`;
        if ((r + c) % 2 === 0) {
          ctx.fillRect(x, y, CELL, CELL);
        } else {
          const inset = CELL * 0.32;
          ctx.fillRect(x + inset, y + inset, CELL - inset * 2, CELL - inset * 2);
        }
      }
    };

    const fullRows = Math.floor(revealFloat);
    const rowPartial = revealFloat - fullRows;

    // Fully drawn rows
    for (let r = 0; r < Math.min(fullRows, rows); r++) {
      for (let c = 0; c < cols; c++) drawCell(r, c, 1);
    }

    // Row currently being "typed"
    if (fullRows < rows) {
      const colsFloat = rowPartial * cols;
      const colsFull = Math.floor(colsFloat);
      const colPartial = colsFloat - colsFull;

      for (let c = 0; c < colsFull; c++) drawCell(fullRows, c, 1);
      if (colsFull < cols) drawCell(fullRows, colsFull, colPartial);
    }

    const currentRow = Math.min(rows, fullRows + (rowPartial > 0 ? 1 : 0));
    if (fullRows >= rows && rows > 0) {
      setRowCountText(`[ render zakończony — ${rows} wierszy ]`);
    } else if (currentRow > 0 && rows > 0) {
      setRowCountText(`[ wiersz ${currentRow} / ${rows} ]`);
    } else {
      setRowCountText('');
    }
  }, []);

  // Set up GSAP and Canvas on mount
  useEffect(() => {
    // Ignoruj resize od klawiatury mobilnej — zapobiega przeliczaniu pinów ScrollTriggera
    // gdy klawiatura pojawia się/znika, co powodowałoby utratę focusu na inpucie.
    ScrollTrigger.config({ ignoreMobileResize: true });

    buildMatrix();
    
    // Handle resize re-building the matrix
    let resizeTimer: NodeJS.Timeout;
    let lastWidth = window.innerWidth;
    const onResize = () => {
      const newWidth = window.innerWidth;
      // Klawiatura mobilna zmienia tylko wysokość — pomiń budowanie matrycy i refresh
      if (newWidth === lastWidth && 'ontouchstart' in window) return;
      lastWidth = newWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildMatrix();
        ScrollTrigger.refresh();
      }, 150);
    };
    window.addEventListener('resize', onResize);

    if (prefersReduced) {
      renderCanvas(1);
      return () => window.removeEventListener('resize', onResize);
    }
    
    // GSAP ScrollTrigger
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    let raf: number | null = null;
    
    if (section && sticky) {
      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          pin: sticky,
          pinSpacing: false,
          onUpdate: (self) => {
            if (raf !== null) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
              // 0.0 -> 0.6: Canvas render
              renderCanvas(self.progress);
              
              // 0.5 -> 1.0: Tips typing out
              const tipsProgress = Math.max(0, Math.min(1, (self.progress - 0.5) * 2));
              setVisibleTipsChars(Math.floor(tipsProgress * TIPS_TEXT.length));
              
              raf = null;
            });
          },
          onLeave: () => {
            renderCanvas(1);
            setVisibleTipsChars(TIPS_TEXT.length);
            setIntroDone(true);
          },
          onLeaveBack: () => {
            // Nie resetuj introDone gdy użytkownik aktualnie pisze w chacie
            // (klawiatura mobilna zmienia viewport → fałszywy "leave back")
            const chatInput = document.getElementById('chat-input');
            if (chatInput && document.activeElement === chatInput) return;
            setIntroDone(false);
          },
        });
      }, section);
      
      return () => {
        ctx.revert();
        window.removeEventListener('resize', onResize);
        if (raf !== null) cancelAnimationFrame(raf);
      };
    }
    return () => window.removeEventListener('resize', onResize);
  }, [buildMatrix, prefersReduced, renderCanvas]);


  // ── Interactive Chat Logic ──
  const sessionIdRef = useRef<string>(generateId());
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: generateId(), role: 'system', content: chatWelcomeMessage, timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Scrolluj wewnętrzny kontener wiadomości, NIE cały dokument.
    // scrollIntoView() przesuwa główny scroll → psuje piny ScrollTriggera na mobilce.
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, typingText]);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const typewriteMessage = useCallback((content: string, finalMsg: ChatMessage) => {
    setIsTyping(true);
    setTypingText('');
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTypingText(content.slice(0, i));
      if (i >= content.length) {
        clearInterval(timer);
        setIsTyping(false);
        setTypingText('');
        setMessages((prev) => [...prev, finalMsg]);
      }
    }, TYPEWRITER_DELAY);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || isTyping) return;

    setMessages((prev) => [
      ...prev,
      { id: generateId(), role: 'user', content: trimmed, timestamp: Date.now() },
    ]);
    setInput('');
    setIsLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ message: trimmed, sessionId: sessionIdRef.current }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const ct = res.headers.get('content-type') ?? '';
      const responseText = ct.includes('application/json')
        ? parseAIResponse(await res.json())
        : await res.text();

      const aiMsg: ChatMessage = { id: generateId(), role: 'ai', content: responseText, timestamp: Date.now() };
      setIsLoading(false);
      typewriteMessage(responseText, aiMsg);
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg =
        err instanceof Error && err.message.includes('HTTP')
          ? `[error] server returned ${err.message} — spróbuj ponownie`
          : '[error] brak połączenia — sprawdź sieć i spróbuj ponownie';
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: 'error', content: msg, timestamp: Date.now() },
      ]);
    }
  }, [input, isLoading, isTyping, typewriteMessage]);

  const textStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(0.82rem, 1.3vw, 0.95rem)',
    lineHeight: '1.75',
    color: 'var(--terminal-color)',
    textShadow: '0 0 4px var(--terminal-color)',
  };

  const Cursor = ({ isBlinking }: { isBlinking?: boolean }) => (
    <span
      style={{
        display: 'inline-block',
        width: '0.6em',
        height: '1.1em',
        background: 'var(--terminal-color)',
        verticalAlign: 'text-bottom',
        boxShadow: '0 0 6px var(--terminal-color)',
        animation: isBlinking ? 'cursor-blink 1s step-end infinite' : 'none',
        marginLeft: '2px',
      }}
    />
  );

  return (
    <section
      ref={sectionRef}
      id="chat-ai"
      style={{ height: INTRO_HEIGHT }}
      aria-label="Sekcja AI Chat Terminal"
    >
      <div
        ref={stickyRef}
        aria-hidden="true"
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '4rem clamp(1rem, 4vw, 4rem)',
          maxWidth: '64rem',
          margin: '0 auto',
        }}
      >
        {/* ── Typewriter Canvas Banner & Tips ── */}
        <div style={{ flexShrink: 0, position: 'relative' }}>
          
          <div style={{ fontSize: '13px', letterSpacing: '0.02em', color: 'rgba(57,255,106,0.5)', minHeight: '18px', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>
            &gt; render --font=block GEMINI
          </div>
          
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              filter: 'drop-shadow(0 0 10px rgba(57,255,106,0.3))',
              marginBottom: '12px'
            }}
          />
          
          <div style={{ fontSize: '12px', color: 'rgba(57,255,106,0.5)', fontFamily: 'var(--font-mono)' }}>
            {rowCountText}
          </div>

          <div style={{ marginTop: '2.5rem' }}>
            <pre
              style={{
                ...textStyle,
                color: 'var(--terminal-color)',
                margin: 0,
                whiteSpace: 'pre-wrap',
                minHeight: '8rem'
              }}
            >
              {visibleTipsChars > 0 ? TIPS_TEXT.slice(0, visibleTipsChars) : ''}
              {visibleTipsChars > 0 && <Cursor isBlinking={visibleTipsChars >= TIPS_TEXT.length && !introDone} />}
            </pre>
          </div>
        </div>

        {/* ── Interactive Chat Area ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            opacity: introDone ? 1 : 0,
            pointerEvents: introDone ? 'auto' : 'none',
            transition: 'opacity 0.6s ease-in-out',
            marginTop: '1rem',
            overflow: 'hidden',
          }}
        >
          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="terminal-scrollbar"
            style={{ overflowY: 'auto', paddingBottom: '1rem' }}
          >
            {messages.map((msg) => (
              <div key={msg.id} style={{ ...textStyle, marginBottom: '0.85rem' }}>
                {msg.role === 'user' && (
                  <div>
                    <span style={{ color: 'var(--terminal-color-bright)', fontWeight: 'bold' }}>&gt; </span>
                    <span>{msg.content}</span>
                  </div>
                )}
                {msg.role === 'ai' && (
                  <div style={{ opacity: 0.95, paddingLeft: '1rem', borderLeft: '2px solid var(--terminal-border)', marginTop: '0.3rem' }}>
                    <span style={{ opacity: 0.5, fontSize: '0.75em', display: 'block', marginBottom: '0.2rem' }}>[CHAT AI]</span>
                    {msg.content}
                  </div>
                )}
                {msg.role === 'system' && (
                  <div style={{ opacity: 0.45, fontStyle: 'italic' }}>{msg.content}</div>
                )}
                {msg.role === 'error' && (
                  <div style={{ color: '#ff5555' }}>{msg.content}</div>
                )}
              </div>
            ))}

            {isTyping && typingText && (
              <div style={{ ...textStyle, opacity: 0.95, paddingLeft: '1rem', borderLeft: '2px solid var(--terminal-border)', marginTop: '0.3rem', marginBottom: '0.85rem' }}>
                <span style={{ opacity: 0.5, fontSize: '0.75em', display: 'block', marginBottom: '0.2rem' }}>[CHAT AI]</span>
                {typingText}
                <span style={{
                  display: 'inline-block', width: '0.6em', height: '1em',
                  background: 'var(--terminal-color)', verticalAlign: 'text-bottom',
                }} />
              </div>
            )}

            {isLoading && !isTyping && (
              <div style={{ ...textStyle, opacity: 0.5, marginBottom: '0.85rem' }}>
                Łączę się z modelem...
                <Cursor isBlinking />
                {'  '}
                <span style={{ fontSize: '0.8em', opacity: 0.6 }}>(esc aby anulować)</span>
              </div>
            )}
          </div>

          {/* Gemini CLI Boxed Input Bar */}
          <form
            onSubmit={handleSubmit}
            style={{
              touchAction: 'manipulation',
              border: '1.5px solid var(--terminal-color)',
              borderRadius: '8px',
              padding: '0.8rem 1.25rem',
              background: 'rgba(0, 0, 0, 0.75)',
              boxShadow: '0 0 14px rgba(51, 255, 51, 0.2), inset 0 0 10px rgba(51, 255, 51, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              marginTop: '1rem',
              marginBottom: '1rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.1rem',
                color: 'var(--terminal-color-bright)',
                fontWeight: 'bold',
                userSelect: 'none',
                textShadow: '0 0 6px var(--terminal-color)',
              }}
            >
              &gt;
            </span>
            <input
              id="chat-input"
              ref={inputRef}
              type="text"
              inputMode="text"
              enterKeyHint="send"
              className="terminal-input"
              placeholder={introDone ? 'Wpisz pytanie do AI...' : 'Przewiń w dół, aby odblokować chat...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading || isTyping || !introDone}
              autoComplete="off"
              aria-label="Wiadomość do AI"
              style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem',
                color: 'var(--terminal-color-bright)',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && isLoading) {
                  abortRef.current?.abort();
                  setIsLoading(false);
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || isTyping || !input.trim() || !introDone}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--terminal-color-bright)',
                opacity: !introDone || isLoading || isTyping || !input.trim() ? 0.25 : 0.9,
                background: 'rgba(51, 255, 51, 0.12)',
                border: '1px solid var(--terminal-border)',
                borderRadius: '4px',
                padding: '0.3rem 0.75rem',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'opacity 0.15s, background 0.15s',
                textShadow: '0 0 4px var(--terminal-color)',
              }}
              aria-label="Wyślij"
            >
              [ENTER]
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
