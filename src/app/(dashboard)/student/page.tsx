import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { StatusDot } from "@/components/common/status-dot";
import { PageHeader } from "@/components/layout/page-header";
import { SwipeTaskItem } from "@/components/student/swipe-task-item";
import { getStudentDashboardData } from "@/features/tasks/queries";
import type { DashboardTaskGroup } from "@/features/tasks/types";
import { TASK_CATEGORIES, type TaskCategory } from "@/lib/constants/categories";
import { MOOD_STATUS, STUDENT_STATUS } from "@/lib/constants/status";
import type { TaskStatus } from "@/lib/constants/status";
import {
  getStudentRecentInteractions,
  type StudentInteraction,
} from "@/features/interactions/student-queries";
import { MoodCheckinPanel } from "@/components/student/mood-checkin-panel";
import { getTodayMoodCheckin } from "@/features/status/queries";
import { setStudentStatusAction } from "@/features/status/actions";

type StudentPageProps = {
  searchParams?: Promise<{
    category?: string;
    mood?: string;
    student_status?: string;
  }>;
};

function toDotStatus(status: TaskStatus): "red" | "green" | "yellow" {
  if (status === "green") {
    return "green";
  }

  if (status === "processing") {
    return "yellow";
  }

  return "red";
}

function isTaskCategory(value: string | undefined): value is TaskCategory {
  return TASK_CATEGORIES.some((category) => category.key === value);
}

function getCategoryLabel(categoryKey: TaskCategory) {
  return TASK_CATEGORIES.find((category) => category.key === categoryKey);
}

export default async function StudentPage({ searchParams }: StudentPageProps) {
  const params = await searchParams;
  const selectedCategory = isTaskCategory(params?.category)
    ? params.category
    : "todo";

  const { profile, groups, summaries } = await getStudentDashboardData();
  const interactions = await getStudentRecentInteractions();
  const todayMood = await getTodayMoodCheckin();
  const mood = MOOD_STATUS[profile.aura_color];

  const selectedGroups = groups.filter(
    (group) => group.category === selectedCategory
  );

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
              <div className="border border-[var(--student-border)] px-3 py-2 text-right">
                <p className="kado-mono text-xs text-[var(--student-muted)]">
                  AURA
                </p>
                <p className="text-sm">
                  {mood.icon} {mood.label}
                </p>
              </div>

              <LogoutButton tone="dark" />
            </div>
          }
        />
        <MoodCheckinPanel
           currentMood={todayMood}
           selectedCategory={selectedCategory}
           result={params?.mood}
        />
        <section className="mt-5 grid grid-cols-3 gap-2">
  {Object.entries(STUDENT_STATUS).map(([key, item]) => {
    const isSelected = profile.current_status === key;

    return (
      <form key={key} action={setStudentStatusAction}>
        <input type="hidden" name="studentStatus" value={key} />
        <input type="hidden" name="category" value={selectedCategory} />

        <button
          type="submit"
          className={
            isSelected
              ? "kado-transition w-full border border-green-500 bg-[var(--green-soft)] px-3 py-3 text-left"
              : "kado-transition w-full border border-[var(--student-border)] px-3 py-3 text-left hover:bg-[var(--student-card)]"
          }
        >
          <span className="block text-lg">{item.icon}</span>
          <span className="mt-2 block text-xs text-[var(--student-muted)]">
            {item.label}
          </span>
        </button>
      </form>
    );
  })}
</section>
{params?.student_status === "updated" ? (
  <div className="mt-3 border border-green-500/40 bg-[var(--green-soft)] px-3 py-2 text-xs text-green-400">
    目前狀態已更新。
  </div>
) : null}

{params?.student_status === "failed" ? (
  <div className="mt-3 border border-red-500/40 bg-[var(--red-soft)] px-3 py-2 text-xs text-red-400">
    狀態更新失敗，請稍後再試。
  </div>
) : null}

        <section className="mt-5 grid grid-cols-2 border border-[var(--student-border)]">
          {TASK_CATEGORIES.map((category) => {
            const summary = summaries.find(
              (item) => item.category === category.key
            );

            const status = summary?.status ?? "green";
            const completed = summary?.completed ?? 0;
            const total = summary?.total ?? 0;
            const isSelected = selectedCategory === category.key;

            return (
              <Link
                key={category.key}
                href={`/student?category=${category.key}`}
                className={
                  isSelected
                    ? "kado-transition border-r border-b border-[var(--student-border)] bg-[var(--student-card)] p-4 text-left"
                    : "kado-transition border-r border-b border-[var(--student-border)] p-4 text-left hover:bg-[var(--student-card)]"
                }
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{category.icon}</span>
                  <StatusDot status={toDotStatus(status)} />
                </div>

                <p className="mt-5 text-sm font-semibold">{category.label}</p>
                <p className="kado-mono mt-1 text-xs text-[var(--student-muted)]">
                  {completed}/{total}
                </p>
              </Link>
            );
          })}
        </section>

        <CategoryTaskPanel
          category={selectedCategory}
          groups={selectedGroups}
        />
        <StudentInteractionPanel interactions={interactions} />
      </section>
    </main>
  );
}

function CategoryTaskPanel({
  category,
  groups,
}: {
  category: TaskCategory;
  groups: DashboardTaskGroup[];
}) {
  const categoryMeta = getCategoryLabel(category);

  if (groups.length === 0) {
    return (
      <section className="mt-5 border border-[var(--student-border)]">
        <div className="border-b border-[var(--student-border)] px-3 py-2">
          <h2 className="text-sm font-semibold">
            {categoryMeta?.icon} {categoryMeta?.label}
          </h2>
        </div>

        <div className="px-3 py-6">
          <p className="text-sm text-[var(--student-muted)]">
            這個分類目前沒有任務。
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-5 space-y-3">
      {groups.map((group) => (
        <section
          key={group.taskId}
          className="border border-[var(--student-border)]"
        >
          <div className="flex items-center justify-between border-b border-[var(--student-border)] px-3 py-2">
            <h2 className="text-sm font-semibold">
              {categoryMeta?.icon} {group.title}
            </h2>
            <p className="kado-mono text-xs text-red-500">SWIPE RIGHT</p>
          </div>

          {group.items.map((item) => (
            <SwipeTaskItem
              key={item.id}
              taskItemId={item.id}
              status={item.status}
              title={item.title}
            />
          ))}
        </section>
      ))}
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

  return (
    <section className="mt-5 border border-[var(--student-border)]">
      <div className="flex items-center justify-between border-b border-[var(--student-border)] px-3 py-2">
        <h2 className="text-sm font-semibold">家長無聲關懷</h2>
        <p className="kado-mono text-xs text-[var(--student-muted)]">
          RECENT {interactions.length}
        </p>
      </div>

      {interactions.length > 0 ? (
        <div className="divide-y divide-[var(--student-border)]">
          {interactions.map((interaction) => {
           const item =
             labels[interaction.interaction_type as keyof typeof labels] ?? {
               icon: "•",
               title: "新的無聲關懷",
               message: "家長送來了一則新的互動。",
            };

            return (
              <div key={interaction.id} className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-[var(--student-muted)]">
                      {interaction.parent_name}：{item.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-3 py-6">
          <p className="text-sm text-[var(--student-muted)]">
            目前沒有新的無聲關懷。
          </p>
        </div>
      )}
    </section>
  );
}