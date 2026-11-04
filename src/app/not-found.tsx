import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[color:var(--harbor)] px-6 text-center text-white">
      <div>
        <p className="font-mono text-[12px] tracking-[0.2em] uppercase">Error 404 · container not found</p>
        <h1 className="font-display mt-4 text-6xl text-[color:var(--cream)] md:text-8xl">Lost at sea</h1>
        <p className="mt-4 text-white/90">This page isn&apos;t in the depot.</p>
        <Link href="/" className="mt-8 inline-block rounded-full bg-white px-5 py-2.5 font-semibold text-[color:var(--harbor)]">
          Back to the depot
        </Link>
      </div>
    </main>
  );
}
