import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { SectionCard } from "@/components/common/section-card";
import { StatusDot } from "@/components/common/status-dot";
import { TaipeiClock } from "@/components/common/taipei-clock";
import { PageHeader } from "@/components/layout/page-header";
import { getParentDashboardData } from "@/features/tasks/parent-queries";
import type { DashboardTaskGroup } from "@/features/tasks/types";
import {
  acknowledgeParentTaskItemAction,
  sendParentInteractionAction,
} from "@/features/interactions/actions";
import { TASK_CATEGORIES, type TaskCategory } from "@/lib/constants/categories";
import {
  MOOD_STATUS,
  STUDENT_STATUS,
  type StudentStatus,
  type TaskStatus,
} from "@/lib/constants/status";

const parentActions = [
  { id: "pat", icon: "🤝", label: "拍拍肩膀" },
  { id: "energy", icon: "🍵", label: "補充能量" },
  { id: "praise", icon: "👍", label: "表現很好" },
];

const studentStatusLabels: Record<StudentStatus, string> = {
  moving: "返家中",
  home: "到家了",
  flow: "開始唸書",
};

const taskStatusLabels: Record<TaskStatus, string> = {
  red: "未完成",
  processing: "已收到",
  green: "已完成",
};

type ParentPageProps = {
  searchParams?: Promise<{
    category?: string;
    interaction?: string;
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
  const interactionSent = params?.interaction === "sent";
  const interactionFailed = params?.interaction === "failed";

  const selectedGroups = groups.filter(
    (group) => group.category === selectedCategory
  );

  const taskTotals = getTodayTaskTotals(summaries);

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

        {interactionSent ? (
          <div className="mt-3 border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700">
            已送出無聲關懷。
          </div>
        ) : null}

        {interactionFailed ? (
          <div className="mt-3 border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
            無聲關懷送出失敗，請確認已綁定孩子。
          </div>
        ) : null}

        <ParentActionPanel
          childId={childId}
          selectedCategory={selectedCategory}
        />

        <section className="mt-5 grid grid-cols-4 border border-[var(--parent-border)] bg-white">
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
                href={`/parent?category=${category.key}`}
                className={
                  isSelected
                    ? "border-r border-b border-[var(--parent-border)] bg-slate-50 px-2 py-2 text-center"
                    : "border-r border-b border-[var(--parent-border)] px-2 py-2 text-center hover:bg-slate-50"
                }
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-base">{category.icon}</span>
                  <StatusDot status={toDotStatus(status)} />
                </div>

                <p className="mt-2 text-[11px] font-semibold leading-tight">
                  {category.label}
                </p>
                <p className="kado-mono mt-1 text-[10px] text-[var(--parent-muted)]">
                  {completed}/{total}
                </p>
              </Link>
            );
          })}
        </section>

        <ParentCategoryTaskPanel
          category={selectedCategory}
          groups={selectedGroups}
          childId={childId}
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

function ParentActionPanel({
  childId,
  selectedCategory,
}: {
  childId: string | null;
  selectedCategory: TaskCategory;
}) {
  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">無聲關懷</p>
        <p className="kado-mono text-xs text-[var(--parent-muted)]">
          QUIET SUPPORT
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {parentActions.map((action) => (
          <form key={action.id} action={sendParentInteractionAction}>
            <input type="hidden" name="studentId" value={childId ?? ""} />
            <input type="hidden" name="interactionType" value={action.id} />
            <input type="hidden" name="category" value={selectedCategory} />

            <button
              type="submit"
              disabled={!childId}
              className="w-full border border-[var(--parent-border)] bg-white px-3 py-3 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="block text-lg">{action.icon}</span>
              <span className="mt-2 block">{action.label}</span>
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}

function getTaskItemKind(item: DashboardTaskGroup["items"][number]) {
  const maybeItem = item as DashboardTaskGroup["items"][number] & {
    itemKind?: string | null;
    item_kind?: string | null;
  };

  return maybeItem.itemKind ?? maybeItem.item_kind ?? null;
}

function canShowParentOkButton(item: DashboardTaskGroup["items"][number]) {
  const itemKind = getTaskItemKind(item);

  return (
    (itemKind === "payment" || itemKind === "form") &&
    item.status !== "green"
  );
}

function ParentCategoryTaskPanel({
  category,
  groups,
  childId,
}: {
  category: TaskCategory;
  groups: DashboardTaskGroup[];
  childId: string | null;
}) {
  const categoryMeta = getCategoryLabel(category);

  if (groups.length === 0) {
    return (
      <section className="mt-5 border border-[var(--parent-border)] bg-white">
        <div className="border-b border-[var(--parent-border)] px-3 py-2">
          <h2 className="text-sm font-semibold">
            {categoryMeta?.icon} {categoryMeta?.label}
          </h2>
        </div>

        <div className="px-3 py-6">
          <p className="text-sm text-[var(--parent-muted)]">
            這個分類目前沒有任務資料。
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
          className="border border-[var(--parent-border)] bg-white"
        >
          <div className="flex items-center justify-between border-b border-[var(--parent-border)] px-3 py-2">
            <h2 className="text-sm font-semibold">
              {categoryMeta?.icon} {group.title}
            </h2>
            <p className="kado-mono text-xs text-[var(--parent-muted)]">
              TODAY
            </p>
          </div>

          {group.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 border-b border-[var(--parent-border)] px-3 py-3 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <StatusDot status={toDotStatus(item.status)} />
                  <p className="truncate text-sm">{item.title}</p>
                </div>

                <p className="mt-1 pl-6 text-xs text-[var(--parent-muted)]">
                  {taskStatusLabels[item.status]}
                </p>
              </div>

              {canShowParentOkButton(item) ? (
                <form action={acknowledgeParentTaskItemAction} className="shrink-0">
                  <input type="hidden" name="studentId" value={childId ?? ""} />
                  <input type="hidden" name="taskItemId" value={item.id} />
                  <input type="hidden" name="category" value={category} />
                  <button
                    type="submit"
                    disabled={!childId}
                    className="border border-[var(--parent-border)] bg-white px-3 py-2 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    收到了解
                  </button>
                </form>
              ) : (
                <span className="kado-mono shrink-0 text-xs text-[var(--parent-muted)]">
                  READ
                </span>
              )}
            </div>
          ))}
        </section>
      ))}
    </section>
  );
}