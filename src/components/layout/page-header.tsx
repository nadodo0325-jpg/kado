import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  right?: ReactNode;
  borderColor?: string;
  mutedColor?: string;
};

export function PageHeader({
  eyebrow,
  title,
  right,
  borderColor = "var(--kado-border)",
  mutedColor = "var(--kado-muted)",
}: PageHeaderProps) {
  return (
    <header
      className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor }}
    >
      <div className="min-w-0">
        <p
          className="kado-mono text-xs tracking-[0.25em]"
          style={{ color: mutedColor }}
        >
          {eyebrow}
        </p>

        <h1 className="mt-1 text-lg font-semibold leading-snug sm:text-xl">
          {title}
        </h1>
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}