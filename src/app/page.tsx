import Link from "next/link";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";

type PreviewStatus = "red" | "green" | "yellow";

const taskCards: {
  icon: string;
  title: string;
  status: PreviewStatus;
  label: string;
}[] = [
  { icon: "✏️", title: "作業", status: "green", label: "3 / 3" },
  { icon: "💯", title: "小考", status: "green", label: "1 / 1" },
  { icon: "📝", title: "待辦", status: "red", label: "2 / 4" },
  { icon: "💡", title: "其他", status: "green", label: "2 / 2" },
];

const parentActions = [
  { icon: "🤝", label: "拍拍肩膀" },
  { icon: "🍵", label: "補充能量" },
  { icon: "👍", label: "表現很好" },
];

const studentStatusItems = ["🚌 返家中", "🏠 到家了", "📖 開始唸書"];

const moodItems = ["⚡ 精神好", "🌤️ 穩定", "😴 有點累", "🌧️ 低氣壓"];

function StatusDot({ status }: { status: PreviewStatus }) {
  const className =
    status === "green"
      ? "inline-block h-2.5 w-2.5 rounded-full bg-green-500"
      : status === "yellow"
        ? "inline-block h-2.5 w-2.5 rounded-full bg-yellow-400"
        : "inline-block h-2.5 w-2.5 rounded-full bg-red-500";

  return <span className={className} />;
}

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
              <StatusDot status="green" />
              用今日看板同步狀態，減少日常追問
            </div>

            <h2 className="mt-6 max-w-xl text-[2.15rem] font-semibold leading-tight tracking-[-0.04em] sm:text-5xl md:text-6xl">
              把家庭群組裡的焦慮，整理成今日任務與安靜燈號。
            </h2>

            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--kado-muted)]">
              Kado 不鼓勵訊息轟炸，也不硬性防堵手機。學生自主亮燈，
              家長安靜查看，老師快速發布，讓今天真正需要同步的事情一眼看懂。
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-row">
              <Link
                href="/register"
                className="kado-transition bg-zinc-950 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800"
              >
                開始今日同步
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
                  TODAY / 2026.06
                </p>
                <h3 className="text-sm font-semibold">今日同步看板</h3>
              </div>
              <span className="kado-mono text-xs text-[var(--kado-muted)]">
                返家後更新
              </span>
            </div>

            <div className="grid grid-cols-3 border-b border-[var(--kado-border)]">
              {studentStatusItems.map((item) => (
                <div
                  key={item}
                  className="border-r border-[var(--kado-border)] px-3 py-3 text-center last:border-r-0"
                >
                  <p className="text-xs font-semibold">{item}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 border-b border-[var(--kado-border)]">
              {taskCards.map((card) => (
                <div
                  key={card.title}
                  className="border-r border-[var(--kado-border)] px-2 py-3 text-center last:border-r-0"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-base">{card.icon}</span>
                    <StatusDot status={card.status} />
                  </div>
                  <p className="mt-2 text-[11px] font-semibold leading-tight">
                    {card.title}
                  </p>
                  <p className="kado-mono mt-1 text-[10px] text-[var(--kado-muted)]">
                    {card.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4">
              <div className="border border-[var(--kado-border)]">
                <div className="flex items-center justify-between border-b border-[var(--kado-border)] px-3 py-2">
                  <p className="text-sm font-semibold">📝 待辦</p>
                  <p className="kado-mono text-xs text-red-500">2 未完成</p>
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
          className="grid gap-4 border-t border-[var(--kado-border)] pt-5 sm:pt-6 lg:grid-cols-3"
        >
          <StudentPreview />
          <ParentPreview />
          <TeacherPreview />
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
      <StatusDot status={status} />
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
            STUDENT BOARD
          </p>
          <h3 className="mt-1 text-sm font-semibold">學生端：今日自律看板</h3>
        </div>
        <div className="h-8 w-8 border border-green-500" />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {moodItems.map((item) => (
          <button
            key={item}
            className="border border-[var(--student-border)] px-2 py-2 text-[10px] text-[var(--student-muted)]"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {studentStatusItems.map((item) => (
          <button
            key={item}
            className="border border-[var(--student-border)] px-2 py-2 text-xs text-[var(--student-muted)]"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 border border-[var(--student-border)]">
        <TaskRowDark status="green" title="數學講義 P.45" />
        <TaskRowDark status="red" title="明天交回條" />
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
        <StatusDot status={status} />
        <p className="text-sm">{title}</p>
      </div>
      <span className="kado-mono text-xs text-[var(--student-muted)]">
        {status === "green" ? "DONE" : "完成"}
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
            PARENT BOARD
          </p>
          <h3 className="mt-1 text-sm font-semibold">家長端：孩子今日狀態</h3>
        </div>
        <p className="text-xs text-[var(--parent-muted)]">穩定 🌤️</p>
      </div>

      <div className="mt-4 grid grid-cols-2 border border-[var(--parent-border)]">
        <div className="border-r border-b border-[var(--parent-border)] px-3 py-3">
          <p className="kado-mono text-xs text-[var(--parent-muted)]">狀態</p>
          <p className="mt-1 text-sm">📖 開始唸書</p>
        </div>

        <div className="border-b border-[var(--parent-border)] px-3 py-3">
          <p className="kado-mono text-xs text-[var(--parent-muted)]">任務</p>
          <p className="mt-1 text-sm">6 / 8 完成</p>
        </div>

        <div className="col-span-2 px-3 py-3">
          <p className="text-sm font-semibold">今日避雷指南</p>
          <p className="mt-2 text-sm leading-6 text-[var(--parent-muted)]">
            孩子已開始唸書，還有 2 個項目未完成。先用無聲關懷支持，不用一直追問。
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {parentActions.map((action) => (
          <button
            key={action.label}
            className="border border-[var(--parent-border)] px-3 py-3 text-xs hover:bg-slate-50"
          >
            <span className="block text-lg">{action.icon}</span>
            <span className="mt-1 block">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TeacherPreview() {
  return (
    <div className="min-h-0 border border-[var(--kado-border)] bg-white p-4">
      <div className="flex items-center justify-between border-b border-[var(--kado-border)] pb-3">
        <div>
          <p className="kado-mono text-xs text-[var(--kado-muted)]">
            TEACHER BOARD
          </p>
          <h3 className="mt-1 text-sm font-semibold">教師端：今日班級工作台</h3>
        </div>
        <p className="kado-mono text-xs text-[var(--kado-muted)]">09:30</p>
      </div>

      <div className="mt-4 border border-[var(--kado-border)]">
        <div className="border-b border-[var(--kado-border)] px-3 py-2">
          <p className="text-sm font-semibold">今日已發布任務</p>
        </div>

        <div className="divide-y divide-[var(--kado-border)]">
          <TeacherTaskRow title="5/20 作業看板" red={2} green={18} />
          <TeacherTaskRow title="回條確認" red={4} green={16} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="border border-[var(--kado-border)] px-3 py-3 text-center">
          <p className="kado-mono text-xs text-red-500">RED</p>
          <p className="mt-1 text-sm font-semibold">6</p>
        </div>

        <div className="border border-[var(--kado-border)] px-3 py-3 text-center">
          <p className="kado-mono text-xs text-yellow-600">PENDING</p>
          <p className="mt-1 text-sm font-semibold">3</p>
        </div>

        <div className="border border-[var(--kado-border)] px-3 py-3 text-center">
          <p className="kado-mono text-xs text-green-600">GREEN</p>
          <p className="mt-1 text-sm font-semibold">34</p>
        </div>
      </div>
    </div>
  );
}

function TeacherTaskRow({
  title,
  red,
  green,
}: {
  title: string;
  red: number;
  green: number;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-3">
      <p className="text-sm">{title}</p>
      <div className="flex items-center gap-2">
        <span className="kado-mono text-xs text-red-500">RED {red}</span>
        <span className="kado-mono text-xs text-green-600">
          GREEN {green}
        </span>
      </div>
    </div>
  );
}