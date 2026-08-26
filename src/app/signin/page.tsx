import Link from "next/link";
import type { Metadata } from "next";
import { Mark } from "@/components/Mark";

export const metadata: Metadata = {
  title: "Sign in - Collage",
  description:
    "Collage is local-first. No account, no upload, nothing to sign into - your photos never leave your device.",
};

export default function SignIn() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-paper px-6">
      <div className="w-full max-w-sm rounded-3xl border hair bg-surface p-8 text-center shadow-[var(--shadow)] rise">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-surface-2">
          <Mark className="size-9 text-ink" />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Nothing to sign into
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Collage runs entirely on your device. No account, no sign-up, no
          servers - your photos never leave your phone. Just start making.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
        >
          Start creating
        </Link>
        <p className="mt-4 text-xs text-muted">Private by design.</p>
      </div>
    </main>
  );
}
