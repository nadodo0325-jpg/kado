import { LogoutButton } from "@/components/auth/logout-button";
import { PageHeader } from "@/components/layout/page-header";
import { StudentCategoryBoard } from "@/components/student/student-category-board";
import { MoodCheckinPanel } from "@/components/student/mood-checkin-panel";
import { StudentStatusPanel } from "@/components/student/student-status-panel";
import { StudentLiveSummary } from "@/components/student/student-live-summary";
import { getStudentDashboardData } from "@/features/tasks/queries";
import { joinClassByCodeAction } from "@/features/tasks/student-actions";
import {
  getMyJoinedClasses,
  type JoinedClass,
} from "@/features/tasks/student-queries";
import {
  getStudentRecentInteractions,
  type StudentInteraction,
} from "@/features/interactions/student-queries";
import { getTodayMoodCheckin } from "@/features/status/queries";
import { TASK_CATEGORIES, type TaskCategory } from "@/lib/constants/categories";
import { MOOD_STATUS } from "@/lib/constants/status";
import type { MoodStatus } from "@/lib/constants/status";

type StudentPageProps = {
  searchParams?: Promise<{
    category?: string;
    mood?: string;
    student_status?: string;
    joined?: string;
    join_error?: string;
  }>;
};

type DisplayInteraction = StudentInteraction & {
  created_at?: string | null;
};

const joinClassErrorMessages: Record<string, string> = {
  missing_code: "請輸入老師提供的班級代碼。",
  invalid_code: "找不到這組班級代碼，請確認老師提供的代碼是否正確。",
  student_only: "只有學生帳號可以加入班級。",
  not_authenticated: "請先登入後再加入班級。",
  join_failed: "加入班級失敗，請稍後再試。",
};

function isTaskCategory(value: string | undefined): value is TaskCategory {
  return TASK_CATEGORIES.some((category) => category.key === value);
}

function formatStudentSystemTime() {
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";

  return `${year} 年 ${month} 月 ${day} 日 ${weekday} ${hour}:${minute}`;
}

function getTaipeiDateKey(dateString: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(dateString));

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function getTodayTaipeiDateKey() {
  return getTaipeiDateKey(new Date().toISOString());
}

function formatTaipeiTime(dateString?: string | null) {
  if (!dateString) {
    return "今日";
  }

  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateString));
}

function formatJoinedAt(dateString: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateString));
}

export default async function StudentPage({ searchParams }: StudentPageProps) {
  const params = await searchParams;
  const selectedCategory = isTaskCategory(params?.category)
    ? params.category
    : "todo";

  const { profile, groups, summaries } = await getStudentDashboardData();
  const joinedClasses = await getMyJoinedClasses();
  const interactions = await getStudentRecentInteractions();
  const todayMood = await getTodayMoodCheckin();
  const systemTime = formatStudentSystemTime();

  const initialMood = (todayMood ?? profile.aura_color) as MoodStatus;
  const mood = MOOD_STATUS[initialMood];
  const hasJoinedClass = joinedClasses.length > 0;

  return (
    <main className="student-shell">
      <section className="mx-auto min-h-screen w-full max-w-5xl px-4 py-5">
        <PageHeader
          eyebrow="STUDENT"
          title={`${profile.display_name} 的今日自律看板`}
          borderColor="var(--student-border)"
          mutedColor="var(--student-muted)"
          right={
            <div className="flex items-center gap-2">
              <StudentLiveSummary
                initialMood={initialMood}
                initialStatus={profile.current_status}
              />

              <LogoutButton tone="dark" />
            </div>
          }
        />

        <section className="mt-3 border border-[var(--student-border)] bg-[var(--student-card)] px-3 py-3">
          <p className="kado-mono text-xs text-[var(--student-muted)]">
            SYSTEM TIME
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {systemTime}
          </p>
        </section>

        <StudentClassJoinPanel
          joinedClasses={joinedClasses}
          joined={params?.joined === "1"}
          errorCode={params?.join_error}
        />

        <MoodCheckinPanel
          currentMood={todayMood}
          selectedCategory={selectedCategory}
          result={params?.mood}
        />

        <StudentStatusPanel
          currentStatus={profile.current_status}
          selectedCategory={selectedCategory}
          result={params?.student_status}
        />

        {hasJoinedClass ? (
          <StudentCategoryBoard
            initialCategory={selectedCategory}
            groups={groups}
            summaries={summaries}
          />
        ) : (
          <NoClassTaskPlaceholder />
        )}

        <StudentInteractionPanel interactions={interactions} />
      </section>
    </main>
  );
}

function StudentClassJoinPanel({
  joinedClasses,
  joined,
  errorCode,
}: {
  joinedClasses: JoinedClass[];
  joined: boolean;
  errorCode?: string;
}) {
  const errorMessage = errorCode ? joinClassErrorMessages[errorCode] : null;

  return (
    <section className="mt-5 border border-[var(--student-border)] bg-[var(--student-card)]">
      <div className="border-b border-[var(--student-border)] px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">我的班級</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--student-muted)]">
              輸入老師提供的班級代碼，加入後就能看到老師發布的任務。
            </p>
          </div>

          <p className="kado-mono text-xs text-[var(--student-muted)]">
            CLASS {joinedClasses.length}
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-3 lg:grid-cols-[1fr_1fr]">
        <form action={joinClassByCodeAction} className="border border-[var(--student-border)] p-3">
          <label className="block">
            <span className="text-xs font-semibold text-[var(--student-muted)]">
              班級代碼
            </span>

            <input
              name="classCode"
              placeholder="例如：KADO-7F3A"
              className="mt-2 w-full border border-[var(--student-border)] bg-transparent px-3 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white outline-none placeholder:text-[var(--student-muted)]"
            />
          </label>

          {joined ? (
            <p className="mt-3 border border-green-500/40 bg-green-500/10 px-3 py-2 text-xs text-green-300">
              已成功加入班級。
            </p>
          ) : null}

          {errorMessage ? (
            <p className="mt-3 border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="kado-transition mt-3 w-full border border-[var(--student-border)] px-3 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            加入班級
          </button>
        </form>

        <div className="border border-[var(--student-border)]">
          <div className="flex items-center justify-between border-b border-[var(--student-border)] px-3 py-2">
            <p className="text-sm font-semibold text-white">已加入</p>
            <p className="kado-mono text-xs text-[var(--student-muted)]">
              ACTIVE
            </p>
          </div>

          {joinedClasses.length > 0 ? (
            <div className="divide-y divide-[var(--student-border)]">
              {joinedClasses.map((joinedClass) => (
                <div key={joinedClass.classId} className="px-3 py-3">
                  <p className="text-sm font-semibold text-white">
                    {joinedClass.className}
                  </p>

                  <p className="mt-1 text-xs text-[var(--student-muted)]">
                    老師：{joinedClass.teacherName}
                  </p>

                  <p className="kado-mono mt-1 text-xs text-[var(--student-muted)]">
                    {joinedClass.classCode} / {formatJoinedAt(joinedClass.joinedAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-6">
              <p className="text-sm text-[var(--student-muted)]">
                目前尚未加入任何班級。
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function NoClassTaskPlaceholder() {
  return (
    <section className="mt-5 border border-[var(--student-border)] bg-[var(--student-card)] px-3 py-8">
      <p className="text-sm font-semibold text-white">尚未加入班級</p>
      <p className="mt-2 text-sm leading-6 text-[var(--student-muted)]">
        請先輸入老師提供的班級代碼。加入班級後，這裡會顯示老師發布的作業、小考、待辦事項與其他提醒。
      </p>
    </section>
  );
}

function StudentInteractionPanel({
  interactions,
}: {
  interactions: StudentInteraction[];
}) {
  const labels = {
    pat: {
      icon: "🤝",
      title: "拍拍肩膀",
      message: "家長送來一個無聲支持。",
    },
    energy: {
      icon: "🍵",
      title: "補充能量",
      message: "家長提醒你休息一下、補充能量。",
    },
    ok: {
      icon: "👌",
      title: "收到了解",
      message: "家長已經收到這件事了。",
    },
    praise: {
      icon: "👍",
      title: "表現很好",
      message: "家長看見你的努力，送來一個肯定。",
    },
  };

  const todayKey = getTodayTaipeiDateKey();

  const todayInteractions = (interactions as DisplayInteraction[])
    .filter((interaction) => {
      if (!interaction.created_at) {
        return true;
      }

      return getTaipeiDateKey(interaction.created_at) === todayKey;
    })
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;

      return bTime - aTime;
    });

  const latestInteractions = todayInteractions.slice(0, 3);
  const hiddenInteractions = todayInteractions.slice(3);

  function renderInteraction(interaction: DisplayInteraction) {
    const item =
      labels[interaction.interaction_type as keyof typeof labels] ?? {
        icon: "•",
        title: "新的無聲關懷",
        message: "家長送來了一則新的互動。",
      };

    return (
      <div key={interaction.id} className="px-3 py-3">
        <div className="flex items-start gap-3">
          <span className="text-lg">{item.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="kado-mono shrink-0 text-xs text-[var(--student-muted)]">
                {formatTaipeiTime(interaction.created_at)}
              </p>
            </div>

            <p className="mt-1 text-xs text-[var(--student-muted)]">
              {interaction.parent_name}：{item.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-5 border border-[var(--student-border)]">
      <div className="flex items-center justify-between border-b border-[var(--student-border)] px-3 py-2">
        <h2 className="text-sm font-semibold">家長無聲關懷</h2>
        <p className="kado-mono text-xs text-[var(--student-muted)]">
          TODAY {todayInteractions.length}
        </p>
      </div>

      {latestInteractions.length > 0 ? (
        <div className="divide-y divide-[var(--student-border)]">
          {latestInteractions.map((interaction) => renderInteraction(interaction))}
        </div>
      ) : (
        <div className="px-3 py-6">
          <p className="text-sm text-[var(--student-muted)]">
            今日目前沒有新的無聲關懷。
          </p>
        </div>
      )}

      {hiddenInteractions.length > 0 ? (
        <details className="border-t border-[var(--student-border)]">
          <summary className="cursor-pointer px-3 py-2 text-xs text-[var(--student-muted)]">
            查看較早的今日關懷 {hiddenInteractions.length} 筆
          </summary>

          <div className="divide-y divide-[var(--student-border)]">
            {hiddenInteractions.map((interaction) =>
              renderInteraction(interaction)
            )}
          </div>
        </details>
      ) : null}
    </section>
  );
}