'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
      <div
        className="crt-screen p-8 max-w-md w-full mx-4 rounded-lg border"
        style={{ borderColor: 'var(--terminal-border)' }}
      >
        <p className="terminal-text crt-chromatic">
          <span className="text-red-400">[error]</span> {error.message || 'Wystąpił nieoczekiwany błąd.'}
        </p>
        <button
          onClick={reset}
          className="mt-6 px-4 py-2 text-sm terminal-text border border-current hover:bg-[var(--terminal-glow)] transition-colors"
        >
          $ retry
        </button>
      </div>
    </div>
  );
}
