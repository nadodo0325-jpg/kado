import { LogoutButton } from "@/components/auth/logout-button";
import { SectionCard } from "@/components/common/section-card";
import { TaipeiClock } from "@/components/common/taipei-clock";
import { PageHeader } from "@/components/layout/page-header";
import { ParentDashboardClient } from "@/components/parent/parent-dashboard-client";
import { getParentDashboardData } from "@/features/tasks/parent-queries";
import { TASK_CATEGORIES, type TaskCategory } from "@/lib/constants/categories";
import {
  MOOD_STATUS,
  STUDENT_STATUS,
  type StudentStatus,
} from "@/lib/constants/status";

const studentStatusLabels: Record<StudentStatus, string> = {
  moving: "返家中",
  home: "到家了",
  flow: "開始唸書",
};

type ParentPageProps = {
  searchParams?: Promise<{
    category?: string;
    interaction?: string;
  }>;
};

function isTaskCategory(value: string | undefined): value is TaskCategory {
  return TASK_CATEGORIES.some((category) => category.key === value);
}

function getTodayTaskTotals(
  summaries: {
    completed: number;
    total: number;
  }[]
) {
  const total = summaries.reduce((count, summary) => count + summary.total, 0);
  const completed = summaries.reduce(
    (count, summary) => count + summary.completed,
    0
  );

  return {
    total,
    completed,
    remaining: Math.max(total - completed, 0),
  };
}

export default async function ParentPage({ searchParams }: ParentPageProps) {
  const params = await searchParams;
  const selectedCategory = isTaskCategory(params?.category)
    ? params.category
    : "todo";

  const {
    profile,
    childId,
    childName,
    childStatus,
    childMood,
    groups,
    summaries,
  } = await getParentDashboardData();

  const childStatusMeta = childStatus ? STUDENT_STATUS[childStatus] : null;
  const childMoodMeta = childMood ? MOOD_STATUS[childMood] : null;
  const childStatusLabel = childStatus
    ? studentStatusLabels[childStatus]
    : "尚無狀態";
  const childMoodLabel = childMoodMeta?.label ?? "尚未 Check-in";
  const taskTotals = getTodayTaskTotals(summaries);

  const initialMessage =
    params?.interaction === "sent"
      ? "sent"
      : params?.interaction === "failed"
        ? "failed"
        : null;

  return (
    <main className="parent-shell">
      <section className="mx-auto min-h-screen w-full max-w-5xl px-4 py-5">
        <PageHeader
          eyebrow="PARENT"
          title={`${profile.display_name} 的家長看板`}
          borderColor="var(--parent-border)"
          mutedColor="var(--parent-muted)"
          right={
            <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
              <TaipeiClock />

              <div className="shrink-0">
                <LogoutButton />
              </div>
            </div>
          }
        />

        <ChildTodayOverview
          childName={childName}
          childStatusIcon={childStatusMeta?.icon ?? "•"}
          childStatusLabel={childStatusLabel}
          childMoodIcon={childMoodMeta?.icon ?? "•"}
          childMoodLabel={childMoodLabel}
          completed={taskTotals.completed}
          total={taskTotals.total}
          remaining={taskTotals.remaining}
        />

        <SectionCard className="mt-5 border-[var(--parent-border)] p-4">
          <p className="text-sm font-semibold">今日避雷指南</p>
          <p className="mt-2 text-sm leading-6 text-[var(--parent-muted)]">
            {childStatusMeta
              ? `孩子目前是「${childStatusLabel}」，今日能量為「${childMoodLabel}」。如果還有紅燈，可以先用下方無聲關懷支持，不需要一直追問。`
              : "目前沒有可查看的孩子狀態。若尚未綁定孩子，請先建立親子關係。"}
          </p>
        </SectionCard>

        <ParentDashboardClient
          childId={childId}
          initialCategory={selectedCategory}
          groups={groups}
          summaries={summaries}
          initialMessage={initialMessage}
        />
      </section>
    </main>
  );
}

function ChildTodayOverview({
  childName,
  childStatusIcon,
  childStatusLabel,
  childMoodIcon,
  childMoodLabel,
  completed,
  total,
  remaining,
}: {
  childName: string | null;
  childStatusIcon: string;
  childStatusLabel: string;
  childMoodIcon: string;
  childMoodLabel: string;
  completed: number;
  total: number;
  remaining: number;
}) {
  return (
    <section className="mt-5 border border-[var(--parent-border)] bg-white">
      <div className="border-b border-[var(--parent-border)] px-4 py-3">
        <p className="text-sm font-semibold">孩子今日狀態</p>
        <p className="mt-1 text-xs text-[var(--parent-muted)]">
          先看今天，不翻舊帳。
        </p>
      </div>

      <div className="grid grid-cols-2 border-b border-[var(--parent-border)] md:grid-cols-4">
        <div className="border-r border-b border-[var(--parent-border)] px-3 py-3 md:border-b-0">
          <p className="kado-mono text-xs text-[var(--parent-muted)]">CHILD</p>
          <p className="mt-1 text-sm font-semibold">
            {childName ?? "尚未綁定"}
          </p>
        </div>

        <div className="border-r border-b border-[var(--parent-border)] px-3 py-3 md:border-b-0">
          <p className="kado-mono text-xs text-[var(--parent-muted)]">心情</p>
          <p className="mt-1 text-sm">
            {childMoodIcon} {childMoodLabel}
          </p>
        </div>

        <div className="border-r border-[var(--parent-border)] px-3 py-3">
          <p className="kado-mono text-xs text-[var(--parent-muted)]">狀態</p>
          <p className="mt-1 text-sm">
            {childStatusIcon} {childStatusLabel}
          </p>
        </div>

        <div className="px-3 py-3">
          <p className="kado-mono text-xs text-[var(--parent-muted)]">任務</p>
          <p className="mt-1 text-sm">
            {completed}/{total} 完成
          </p>
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs leading-5 text-[var(--parent-muted)]">
          {total === 0
            ? "今日目前沒有任務。"
            : remaining === 0
              ? "今日任務都已完成，可以給孩子一個肯定。"
              : `今日還有 ${remaining} 個項目未完成，建議先用無聲關懷提醒。`}
        </p>
      </div>
    </section>
  );
}