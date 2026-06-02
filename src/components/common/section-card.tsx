import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <section className={cn("border border-[var(--kado-border)] bg-white", className)}>
      {children}
    </section>
  );
}