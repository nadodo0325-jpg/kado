import { cn } from "@/lib/utils/cn";

type StatusDotProps = {
  status: "red" | "green" | "yellow";
  className?: string;
};

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "h-2 w-2 shrink-0 rounded-full",
        status === "red" && "bg-[var(--red-light)]",
        status === "green" && "bg-[var(--green-light)]",
        status === "yellow" && "bg-[var(--yellow-light)]",
        className
      )}
    />
  );
}