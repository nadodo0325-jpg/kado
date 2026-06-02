import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { loginAction } from "@/features/auth/actions";
import { redirectIfAuthenticated } from "@/features/auth/queries";

const roleOptions = [
  {
    key: "student",
    label: "學生",
    description: "查看今日任務、切換狀態、自主亮燈",
  },
  {
    key: "parent",
    label: "家長",
    description: "安靜查看孩子狀態，不用追問進度",
  },
  {
    key: "teacher",
    label: "教師",
    description: "快速發布任務、查看班級紅綠燈",
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
      title="登入你的安靜同步看板。"
      description="這裡不做訊息轟炸，也不逼迫孩子被監控。Kado 只把每天真正需要知道的狀態，壓縮成清楚的顏色與符號。"
      cardEyebrow="LOGIN"
      cardTitle="帳號登入"
      footerNote="目前已接上 Supabase Auth 登入。"
      sideContent={
        <div className="grid gap-2">
          {roleOptions.map((role) => (
            <div
              key={role.key}
              className="border border-[var(--kado-border)] bg-white px-4 py-3"
            >
              <p className="text-sm font-semibold">{role.label}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--kado-muted)]">
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
          登入
        </button>

        <div className="mt-4 flex items-center justify-between text-xs">
          <a
            href="/register"
            className="text-[var(--kado-muted)] hover:text-zinc-950"
          >
            還沒有帳號？
          </a>

          <a
            href="/"
            className="text-[var(--kado-muted)] hover:text-zinc-950"
          >
            返回首頁
          </a>
        </div>
      </form>
    </AuthPageShell>
  );
}