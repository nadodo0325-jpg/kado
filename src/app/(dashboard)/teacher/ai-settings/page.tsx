import { LogoutButton } from "@/components/auth/logout-button";
import { SectionCard } from "@/components/common/section-card";
import { PageHeader } from "@/components/layout/page-header";
import { updateTeacherAiPreferencesAction } from "@/features/ai/teacher-ai-actions";
import { getTeacherAiPreferences } from "@/features/ai/teacher-ai-queries";

const errorMessages: Record<string, string> = {
  invalid_parse_mode: "拆解模式不正確。",
  invalid_ocr_mode: "OCR 模式不正確。",
  save_failed: "設定儲存失敗，請稍後再試。",
};

type TeacherAiSettingsPageProps = {
  searchParams?: Promise<{
    saved?: string;
    error?: string;
  }>;
};

export default async function TeacherAiSettingsPage({
  searchParams,
}: TeacherAiSettingsPageProps) {
  const params = await searchParams;
  const saved = params?.saved === "1";
  const error = params?.error ? errorMessages[params.error] : null;

  const preferences = await getTeacherAiPreferences();

  return (
    <main className="teacher-shell">
      <section className="mx-auto min-h-screen w-full max-w-5xl px-4 py-5">
        <PageHeader
          eyebrow="TEACHER AI"
          title="AI / OCR 設定"
          right={
            <div className="flex items-center gap-2">
              <a
                href="/teacher"
                className="kado-transition border border-[var(--kado-border)] px-3 py-2 text-xs font-semibold hover:bg-zinc-50"
              >
                返回教師端
              </a>

              <LogoutButton />
            </div>
          }
        />

        <SectionCard className="mt-5">
          <div className="border-b border-[var(--kado-border)] px-4 py-3">
            <p className="text-sm font-semibold">免費優先策略</p>
            <p className="mt-1 text-xs leading-5 text-[var(--kado-muted)]">
              目前預設使用免費規則拆解，不調用付費 API。BYOK 與 OCR 只先建立設定入口。
            </p>
          </div>

          <form action={updateTeacherAiPreferencesAction} className="p-4">
            {saved ? (
              <div className="mb-4 border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700">
                設定已儲存。
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <label className="text-sm font-medium" htmlFor="parse-mode">
              聯絡簿拆解模式
            </label>

            <select
              id="parse-mode"
              name="parseMode"
              defaultValue={preferences.parseMode}
              className="mt-2 w-full border border-[var(--kado-border)] bg-white px-3 py-3 text-sm outline-none focus:border-zinc-500"
            >
              <option value="free_rules">免費規則拆解｜目前建議</option>
              <option value="byok" disabled>
                教師自備 API｜之後開放
              </option>
            </select>

            <label className="mt-4 block text-sm font-medium" htmlFor="ocr-mode">
              OCR 模式
            </label>

            <select
              id="ocr-mode"
              name="ocrMode"
              defaultValue={preferences.ocrMode}
              className="mt-2 w-full border border-[var(--kado-border)] bg-white px-3 py-3 text-sm outline-none focus:border-zinc-500"
            >
              <option value="manual_text">手動貼文字｜目前最穩</option>
              <option value="browser_ocr" disabled>
                瀏覽器端免費 OCR｜之後開放
              </option>
              <option value="byok_vision" disabled>
                自備 Vision API｜之後開放
              </option>
            </select>

            <button
              type="submit"
              className="kado-transition mt-5 w-full bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              儲存設定
            </button>
          </form>
        </SectionCard>

        <SectionCard className="mt-4">
          <div className="border-b border-[var(--kado-border)] px-4 py-3">
            <p className="text-sm font-semibold">目前啟用狀態</p>
          </div>

          <div className="grid gap-3 p-4 text-sm md:grid-cols-2">
            <div className="border border-[var(--kado-border)] p-3">
              <p className="kado-mono text-xs text-[var(--kado-muted)]">
                PARSE MODE
              </p>
              <p className="mt-2 font-semibold">{preferences.parseMode}</p>
            </div>

            <div className="border border-[var(--kado-border)] p-3">
              <p className="kado-mono text-xs text-[var(--kado-muted)]">
                OCR MODE
              </p>
              <p className="mt-2 font-semibold">{preferences.ocrMode}</p>
            </div>
          </div>
        </SectionCard>
      </section>
    </main>
  );
}