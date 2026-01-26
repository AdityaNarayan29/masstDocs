import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 min-h-[60vh]">
      <h1 className="text-6xl md:text-8xl font-bold text-fd-muted-foreground/30 mb-4">
        404
      </h1>
      <h2 className="text-2xl md:text-3xl font-semibold mb-4">
        Page Not Found
      </h2>
      <p className="text-fd-muted-foreground text-center max-w-md mb-8">
        The page you are looking for might have been moved or doesn&apos;t exist.
        Let&apos;s get you back on track.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="px-6 py-3 rounded-lg bg-fd-primary text-fd-primary-foreground hover:opacity-90 transition-opacity font-medium"
        >
          Go Home
        </Link>
        <Link
          href="/sd"
          className="px-6 py-3 rounded-lg border border-fd-border hover:bg-fd-accent transition-colors font-medium"
        >
          Browse System Design
        </Link>
        <Link
          href="/hld"
          className="px-6 py-3 rounded-lg border border-fd-border hover:bg-fd-accent transition-colors font-medium"
        >
          View HLD Case Studies
        </Link>
      </div>
    </main>
  );
}
