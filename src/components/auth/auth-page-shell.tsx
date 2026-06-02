import type { ReactNode } from "react";

type AuthPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  sideContent: ReactNode;
  cardEyebrow: string;
  cardTitle: string;
  children: ReactNode;
  footerNote?: string;
};

export function AuthPageShell({
  eyebrow,
  title,
  description,
  sideContent,
  cardEyebrow,
  cardTitle,
  children,
  footerNote,
}: AuthPageShellProps) {
  return (
    <main className="min-h-screen bg-[var(--kado-bg)] text-[var(--kado-text)]">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-5 sm:px-5 sm:py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-8">
        <div className="order-1">
          <a
            href="/"
            className="kado-mono text-xs tracking-[0.28em] text-[var(--kado-muted)]"
          >
            {eyebrow}
          </a>

          <h1 className="mt-5 max-w-xl text-[2rem] font-semibold leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--kado-muted)]">
            {description}
          </p>

          <div className="mt-5 sm:mt-8">{sideContent}</div>
        </div>

        <div className="order-2 border border-[var(--kado-border)] bg-white">
          <div className="border-b border-[var(--kado-border)] px-4 py-4 sm:px-5">
            <p className="kado-mono text-xs text-[var(--kado-muted)]">
              {cardEyebrow}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{cardTitle}</h2>
          </div>

          <div className="p-4 sm:p-5">{children}</div>

          {footerNote ? (
            <div className="border-t border-[var(--kado-border)] px-4 py-4 sm:px-5">
              <p className="text-xs leading-5 text-[var(--kado-muted)]">
                {footerNote}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}