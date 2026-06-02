import Link from "next/link";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
const taskCards = [
  { icon: "✏️", title: "作業", status: "green", label: "3 / 3" },
  { icon: "💯", title: "小考", status: "green", label: "1 / 1" },
  { icon: "📝", title: "待辦事項", status: "red", label: "2 / 4" },
  { icon: "💡", title: "其他", status: "green", label: "2 / 2" },
];

const parentActions = [
  { icon: "🤝", label: "拍拍肩膀" },
  { icon: "🍵", label: "補充能量" },
  { icon: "👌", label: "收到了解" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--kado-bg)] text-[var(--kado-text)]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-5 sm:py-6 md:px-8">
        <header className="flex flex-col gap-4 border-b border-[var(--kado-border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="kado-mono text-xs tracking-[0.28em] text-[var(--kado-muted)]">
              KADO
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">
              親師生自律同步平台
            </h1>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
  <Link
    href="/login"
    className="kado-transition border border-[var(--kado-border)] px-4 py-2 text-center text-sm font-medium hover:bg-white"
  >
    登入
  </Link>

  <Link
    href="/register"
    className="kado-transition bg-zinc-950 px-4 py-2 text-center text-sm font-medium text-white hover:bg-zinc-800"
  >
    開始體驗
  </Link>
</div>
        </header>

        <div className="grid flex-1 items-center gap-8 py-8 sm:gap-10 sm:py-10 lg:grid-cols-[0.95fr_1.05fr]">
          <section>
            <div className="inline-flex items-center gap-2 border border-[var(--kado-border)] bg-white px-3 py-1.5 text-xs text-[var(--kado-muted)]">
              <span className="status-dot status-dot-green" />
              用顏色、符號、時間差，降低日常碎念
            </div>

            <h2 className="mt-6 max-w-xl text-[2.15rem] font-semibold leading-tight tracking-[-0.04em] sm:text-5xl md:text-6xl">
              把家庭群組裡的焦慮，壓縮成四個安靜燈號。
            </h2>

            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--kado-muted)]">
              Kado 不鼓勵訊息轟炸，也不硬性防堵手機。學生自主亮燈，家長靜態查看，
              老師快速發布，讓真正需要溝通的事情浮出水面。
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-row">
  <Link
    href="/register"
    className="kado-transition bg-zinc-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
  >
    消滅焦慮
  </Link>

  <a
    href="#role-preview"
    className="kado-transition border border-[var(--kado-border)] bg-white px-5 py-3 text-center text-sm font-semibold hover:bg-zinc-50"
  >
    查看三端預覽
  </a>
</div>

<PwaInstallPrompt />
          </section>

          <section className="overflow-hidden border border-[var(--kado-border)] bg-white">
            <div className="flex flex-col gap-2 border-b border-[var(--kado-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="kado-mono text-xs text-[var(--kado-muted)]">
                  TODAY / 2026.05
                </p>
                <h3 className="text-sm font-semibold">今日狀態看板</h3>
              </div>
              <span className="kado-mono text-xs text-[var(--kado-muted)]">
                07:30 檢查前
              </span>
            </div>

            <div className="grid grid-cols-2 border-b border-[var(--kado-border)]">
              {taskCards.map((card) => (
                <div
                  key={card.title}
                  className="kado-transition border-r border-b border-[var(--kado-border)] p-4 last:border-r-0 hover:bg-zinc-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{card.icon}</span>
                    <span
                      className={
                        card.status === "green"
                          ? "status-dot status-dot-green"
                          : "status-dot status-dot-red"
                      }
                    />
                  </div>
                  <p className="mt-5 text-sm font-semibold">{card.title}</p>
                  <p className="kado-mono mt-1 text-xs text-[var(--kado-muted)]">
                    {card.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4">
              <div className="border border-[var(--kado-border)]">
                <div className="flex items-center justify-between border-b border-[var(--kado-border)] px-3 py-2">
                  <p className="text-sm font-semibold">📝 待辦事項</p>
                  <p className="kado-mono text-xs text-red-500">2 RED</p>
                </div>

                <div className="divide-y divide-[var(--kado-border)]">
                  <TaskRow status="red" title="明天交回條" />
                  <TaskRow status="green" title="整理書包" />
                  <TaskRow status="red" title="書費 120 元" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <section
  id="role-preview"
  className="grid gap-4 border-t border-[var(--kado-border)] pt-5 sm:pt-6 lg:grid-cols-2"
>
          <StudentPreview />
          <ParentPreview />
        </section>
      </section>
    </main>
  );
}

function TaskRow({
  status,
  title,
}: {
  status: "red" | "green";
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <span
        className={
          status === "green"
            ? "status-dot status-dot-green"
            : "status-dot status-dot-red"
        }
      />
      <p className="text-sm">{title}</p>
    </div>
  );
}

function StudentPreview() {
  return (
    <div className="student-shell min-h-0 border border-[var(--student-border)] p-4">
      <div className="flex items-center justify-between border-b border-[var(--student-border)] pb-3">
        <div>
          <p className="kado-mono text-xs text-[var(--student-muted)]">
            STUDENT TERMINAL
          </p>
          <h3 className="mt-1 text-sm font-semibold">學生端：暗色專案模式</h3>
        </div>
        <div className="h-8 w-8 border border-green-500" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {["🚌 移動中", "🏠 已歸位", "🌙 心流"].map((item) => (
          <button
            key={item}
            className="kado-transition border border-[var(--student-border)] px-3 py-2 text-xs text-[var(--student-muted)] hover:text-white"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 border border-[var(--student-border)]">
        <TaskRowDark status="green" title="數學講義 P.45" />
        <TaskRowDark status="red" title="歷史雙向溝通 CH2" />
        <TaskRowDark status="green" title="英文雜誌 L3" />
      </div>
    </div>
  );
}

function TaskRowDark({
  status,
  title,
}: {
  status: "red" | "green";
  title: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--student-border)] px-3 py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <span
          className={
            status === "green"
              ? "status-dot status-dot-green"
              : "status-dot status-dot-red"
          }
        />
        <p className="text-sm">{title}</p>
      </div>
      <span className="kado-mono text-xs text-[var(--student-muted)]">
        SWIPE
      </span>
    </div>
  );
}

function ParentPreview() {
  return (
    <div className="parent-shell min-h-0 border border-[var(--parent-border)] bg-[var(--parent-card)] p-4">
      <div className="flex items-center justify-between border-b border-[var(--parent-border)] pb-3">
        <div>
          <p className="kado-mono text-xs text-[var(--parent-muted)]">
            PARENT TERMINAL
          </p>
          <h3 className="mt-1 text-sm font-semibold">家長端：亮色紙質面板</h3>
        </div>
        <p className="text-xs text-[var(--parent-muted)]">低氣壓 🌧️</p>
      </div>

      <div className="mt-4 border border-[var(--parent-border)] p-3">
        <p className="text-sm font-semibold">避雷指南</p>
        <p className="mt-2 text-sm leading-6 text-[var(--parent-muted)]">
          目前狀態為心流模式。建議先不要追問進度，等待 21:30 後由系統更新。
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {parentActions.map((action) => (
          <button
            key={action.label}
            className="kado-transition border border-[var(--parent-border)] px-3 py-3 text-xs hover:bg-slate-50"
          >
            <span className="block text-lg">{action.icon}</span>
            <span className="mt-1 block">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}