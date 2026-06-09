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
import { MOOD_STATUS, STUDENT_STATUS, type TaskStatus } from "@/lib/constants/status";

const parentActions = [
  { id: "pat", icon: "🤝", label: "拍拍肩膀" },
  { id: "energy", icon: "🍵", label: "補充能量" },
  { id: "praise", icon: "👍", label: "表現很好" },
];

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

export default async function ParentPage({ searchParams }: ParentPageProps) {
  const params = await searchParams;
  const selectedCategory = isTaskCategory(params?.category)
    ? params.category
    : "todo";

 const { profile, childId, childName, childStatus, childMood, groups, summaries } =
  await getParentDashboardData();

const childStatusMeta = childStatus ? STUDENT_STATUS[childStatus] : null;
const childMoodMeta = childMood ? MOOD_STATUS[childMood] : null;

const interactionSent = params?.interaction === "sent";
const interactionFailed = params?.interaction === "failed";

  const selectedGroups = groups.filter(
    (group) => group.category === selectedCategory
  );

  return (
    <main className="parent-shell">
      <section className="mx-auto min-h-screen w-full max-w-5xl px-4 py-5">
        <PageHeader
          eyebrow="PARENT"
          title={`${profile.display_name} 的家長看板`}
          borderColor="var(--parent-border)"
          mutedColor="var(--parent-muted)"
          right={
            <div className="flex items-center gap-2">
              <TaipeiClock />
              
              <div className="border border-[var(--parent-border)] bg-white px-3 py-2 text-right">
                <p className="kado-mono text-xs text-[var(--parent-muted)]">
                  CHILD
                </p>
                <p className="text-sm">{childName ?? "尚未綁定"}</p>
                <p className="mt-1 text-xs text-[var(--parent-muted)]">
                  {childStatusMeta
                  ? `${childStatusMeta.icon} ${childStatusMeta.label}`
                  : "尚無狀態"}
                </p>
              </div>

              <LogoutButton />
            </div>
          }
        />

        <SectionCard className="mt-5 border-[var(--parent-border)] p-4">
          <p className="text-sm font-semibold">避雷指南</p>
          <p className="mt-2 text-sm leading-6 text-[var(--parent-muted)]">
            {childStatusMeta
              ? `孩子目前是「${childStatusMeta.label}」狀態，今日能量為「${childMoodMeta?.label ?? "尚未 Check-in"}」。若 21:30 後仍有紅燈，系統會再提醒。`
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

        <section className="mt-5 grid grid-cols-2 border border-[var(--parent-border)] bg-white">
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
                    ? "kado-transition border-r border-b border-[var(--parent-border)] bg-slate-50 p-4"
                    : "kado-transition border-r border-b border-[var(--parent-border)] p-4 hover:bg-slate-50"
                }
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{category.icon}</span>
                  <StatusDot status={toDotStatus(status)} />
                </div>

                <p className="mt-5 text-sm font-semibold">{category.label}</p>
                <p className="kado-mono mt-1 text-xs text-[var(--parent-muted)]">
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

        <section className="mt-5 grid grid-cols-3 gap-2">
  {parentActions.map((action) => (
    <form key={action.id} action={sendParentInteractionAction}>
      <input type="hidden" name="studentId" value={childId ?? ""} />
      <input type="hidden" name="interactionType" value={action.id} />
      <input type="hidden" name="category" value={selectedCategory} />

      <button
        type="submit"
        disabled={!childId}
        className="kado-transition w-full border border-[var(--parent-border)] bg-white px-3 py-4 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="block text-lg">{action.icon}</span>
        <span className="mt-2 block">{action.label}</span>
      </button>
    </form>
  ))}
</section>
      </section>
    </main>
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
              READ ONLY
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

      <p className="kado-mono mt-1 pl-6 text-xs text-[var(--parent-muted)]">
        {item.status.toUpperCase()}
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
          className="kado-transition border border-[var(--parent-border)] bg-white px-3 py-2 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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