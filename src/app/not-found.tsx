import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div
        className="crt-screen p-8 max-w-md w-full mx-4 rounded-lg border"
        style={{ borderColor: 'var(--terminal-border)' }}
      >
        <p className="terminal-text crt-chromatic">
          <span className="terminal-prompt" aria-hidden="true" />
          ls -la
        </p>
        <p className="terminal-text mt-2">
          <span className="text-red-400">ls: cannot access &apos;[path]&apos;:</span> No such file or directory
        </p>
        <p className="terminal-text mt-4 opacity-60">Error 404 — strona nie istnieje.</p>
        <Link
          href="/"
          className="mt-6 inline-block px-4 py-2 text-sm terminal-text border border-current hover:bg-[var(--terminal-glow)] transition-colors"
        >
          $ cd /
        </Link>
      </div>
    </div>
  );
}
