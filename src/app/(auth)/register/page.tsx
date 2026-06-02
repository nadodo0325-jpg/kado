import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { registerAction } from "@/features/auth/actions";
import { redirectIfAuthenticated } from "@/features/auth/queries";

const roleOptions = [
  {
    key: "student",
    label: "學生",
    description: "我想管理自己的任務與狀態",
  },
  {
    key: "parent",
    label: "家長",
    description: "我想安靜查看孩子的狀態",
  },
  {
    key: "teacher",
    label: "教師",
    description: "我想發布任務給班級",
  },
];

const errorMessages: Record<string, string> = {
  missing_fields: "請完整填寫顯示名稱、Email、密碼與角色。",
  password_too_short: "密碼至少需要 6 個字元。",
  signup_failed: "註冊失敗，請確認 Email 是否已被使用。",
  profile_failed: "帳號已建立，但使用者資料寫入失敗，請稍後再試。",
};

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  await redirectIfAuthenticated();

  const params = await searchParams;
  const error = params?.error ? errorMessages[params.error] : null;

  return (
    <AuthPageShell
      eyebrow="KADO"
      title="建立你的 Kado 身分。"
      description="先選擇你在 Kado 裡的角色。學生負責自主亮燈，家長負責安靜查看，教師負責發布任務與掌握班級狀態。"
      cardEyebrow="REGISTER"
      cardTitle="註冊帳號"
      footerNote="目前已接上 Supabase Auth 註冊。"
      sideContent={
        <div className="border border-[var(--kado-border)] bg-white p-4">
          <p className="text-sm font-semibold">目前規則</p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-[var(--kado-muted)]">
            <li>・不開放文字聊天作為主要功能</li>
            <li>・不做 LINE 訊息轟炸</li>
            <li>・不做強制手機鎖定</li>
            <li>・任務狀態以紅燈、綠燈、黃燈呈現</li>
          </ul>
        </div>
      }
    >
      <form action={registerAction}>
        {error ? (
          <div className="mb-4 border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <AuthTextField
          id="display-name"
          name="displayName"
          label="顯示名稱"
          placeholder="例如：Na"
        />

        <div className="mt-4">
          <AuthTextField
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
          />
        </div>

        <div className="mt-4">
          <AuthTextField
            id="password"
            name="password"
            type="password"
            label="密碼"
            placeholder="至少 6 個字元"
          />
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium">選擇角色</p>

          <div className="mt-2 grid gap-2">
            {roleOptions.map((role) => (
              <label
                key={role.key}
                className="kado-transition flex cursor-pointer items-start gap-3 border border-[var(--kado-border)] px-3 py-3 hover:bg-zinc-50"
              >
                <input
                  type="radio"
                  name="role"
                  value={role.key}
                  className="mt-1"
                />

                <span>
                  <span className="block text-sm font-semibold">
                    {role.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--kado-muted)]">
                    {role.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="kado-transition mt-5 w-full bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          建立帳號
        </button>

        <div className="mt-4 flex items-center justify-between text-xs">
          <a
            href="/login"
            className="text-[var(--kado-muted)] hover:text-zinc-950"
          >
            已經有帳號？
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