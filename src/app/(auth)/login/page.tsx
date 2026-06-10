import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { loginAction } from "@/features/auth/actions";
import { redirectIfAuthenticated } from "@/features/auth/queries";

const roleOptions = [
  {
    key: "student",
    label: "學生看板",
    description: "看今日任務、更新心情氣象與目前狀態，完成後自主亮燈。",
    badge: "今日任務",
  },
  {
    key: "parent",
    label: "家長看板",
    description: "安靜查看孩子今天的狀態、任務進度與需要收到了解的事項。",
    badge: "孩子狀態",
  },
  {
    key: "teacher",
    label: "教師工作台",
    description: "發布今日任務、查看班級紅綠燈、追蹤未完成學生名單。",
    badge: "班級同步",
  },
];

const errorMessages: Record<string, string> = {
  auth_required: "請先登入才能進入看板。",
  missing_fields: "請輸入 Email 與密碼。",
  login_failed: "登入失敗，請確認 Email、密碼，或是否已完成信箱驗證。",
  profile_not_found: "找不到使用者資料，請重新註冊或聯絡管理員。",
  invalid_role: "角色資料異常，請聯絡管理員。",
};

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    registered?: string;
    logged_out?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated();

  const params = await searchParams;
  const error = params?.error ? errorMessages[params.error] : null;
  const registered = params?.registered === "1";
  const loggedOut = params?.logged_out === "1";

  return (
    <AuthPageShell
      eyebrow="KADO"
      title="登入今日自律同步看板。"
      description="Kado 把學生、家長、教師每天需要同步的任務、狀態與提醒，整理成清楚的今日看板。不用訊息轟炸，也不用反覆追問進度。"
      cardEyebrow="LOGIN"
      cardTitle="帳號登入"
      footerNote="登入後會依照你的角色，自動進入學生、家長或教師工作台。"
      sideContent={
        <div className="grid gap-2">
          <div className="border border-[var(--kado-border)] bg-zinc-950 px-4 py-3 text-white">
            <p className="kado-mono text-xs tracking-[0.2em] text-zinc-400">
              TODAY BOARD
            </p>
            <p className="mt-2 text-sm font-semibold">
              今日任務、孩子狀態、班級進度，一次同步。
            </p>
          </div>

          {roleOptions.map((role) => (
            <div
              key={role.key}
              className="border border-[var(--kado-border)] bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{role.label}</p>
                <span className="kado-mono shrink-0 border border-[var(--kado-border)] px-2 py-1 text-[10px] text-[var(--kado-muted)]">
                  {role.badge}
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-[var(--kado-muted)]">
                {role.description}
              </p>
            </div>
          ))}
        </div>
      }
    >
      <form action={loginAction}>
        {registered ? (
          <div className="mb-4 border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700">
            註冊成功，請使用剛剛建立的帳號登入。
          </div>
        ) : null}

        {loggedOut ? (
          <div className="mb-4 border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700">
            已登出。
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <AuthTextField
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
        />

        <div className="mt-4">
          <AuthTextField
            id="password"
            name="password"
            type="password"
            label="密碼"
            placeholder="輸入密碼"
          />
        </div>

        <button
          type="submit"
          className="kado-transition mt-5 w-full bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          進入今日看板
        </button>

        <div className="mt-4 flex items-center justify-between text-xs">
          <a
            href="/register"
            className="text-[var(--kado-muted)] hover:text-zinc-950"
          >
            還沒有帳號？
          </a>

          <a href="/" className="text-[var(--kado-muted)] hover:text-zinc-950">
            返回首頁
          </a>
        </div>
      </form>
    </AuthPageShell>
  );
}