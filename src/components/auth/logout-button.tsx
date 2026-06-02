import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils/cn";

type LogoutButtonProps = {
  tone?: "light" | "dark";
};

export function LogoutButton({ tone = "light" }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={cn(
          "kado-transition border px-3 py-2 text-xs font-semibold",
          tone === "light" &&
            "border-[var(--kado-border)] text-zinc-700 hover:bg-zinc-50",
          tone === "dark" &&
            "border-[var(--student-border)] text-[var(--student-muted)] hover:bg-[var(--student-card)] hover:text-white"
        )}
      >
        登出
      </button>
    </form>
  );
}