"use client";

import { useMemo, useState, useTransition } from "react";
import { StatusDot } from "@/components/common/status-dot";
import {
  acknowledgeParentTaskItemSilentAction,
  sendParentInteractionSilentAction,
} from "@/features/interactions/actions";
import type {
  CategorySummary,
  DashboardTaskGroup,
} from "@/features/tasks/types";
import {
  TASK_CATEGORIES,
  type TaskCategory,
} from "@/lib/constants/categories";
import type { TaskStatus } from "@/lib/constants/status";

const parentActions = [
  { id: "pat", icon: "🤝", label: "拍拍肩膀" },
  { id: "energy", icon: "🍵", label: "補充能量" },
  { id: "praise", icon: "👍", label: "表現很好" },
];

const taskStatusLabels: Record<TaskStatus, string> = {
  red: "未完成",
  processing: "已收到",
  green: "已完成",
};

type ParentDashboardClientProps = {
  childId: string | null;
  initialCategory: TaskCategory;
  groups: DashboardTaskGroup[];
  summaries: CategorySummary[];
  initialMessage?: "sent" | "failed" | null;
};

function toDotStatus(status: TaskStatus): "red" | "green" | "yellow" {
  if (status === "green") return "green";
  if (status === "processing") return "yellow";
  return "red";
}

function getCategoryLabel(categoryKey: TaskCategory) {
  return TASK_CATEGORIES.find((category) => category.key === categoryKey);
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

function getGroupStatus(items: DashboardTaskGroup["items"]): TaskStatus {
  if (items.some((item) => item.status === "red")) {
    return "red";
  }

  if (items.some((item) => item.status === "processing")) {
    return "processing";
  }

  return "green";
}

function buildCategorySummaries(
  groups: DashboardTaskGroup[],
  fallbackSummaries: CategorySummary[]
): CategorySummary[] {
  return TASK_CATEGORIES.map((category) => {
    const items = groups
      .filter((group) => group.category === category.key)
      .flatMap((group) => group.items);

    if (items.length === 0) {
      const fallback = fallbackSummaries.find(
        (summary) => summary.category === category.key
      );

      return {
        category: category.key,
        status: fallback?.status ?? "green",
        completed: fallback?.completed ?? 0,
        total: fallback?.total ?? 0,
      };
    }

    const total = items.length;
    const completed = items.filter((item) => item.status === "green").length;
    const hasRed = items.some((item) => item.status === "red");
    const hasProcessing = items.some((item) => item.status === "processing");

    return {
      category: category.key,
      status: hasRed ? "red" : hasProcessing ? "processing" : "green",
      completed,
      total,
    };
  });
}

export function ParentDashboardClient({
  childId,
  initialCategory,
  groups,
  summaries,
  initialMessage = null,
}: ParentDashboardClientProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<TaskCategory>(initialCategory);

  const [localGroups, setLocalGroups] = useState<DashboardTaskGroup[]>(groups);

  const [message, setMessage] = useState<"sent" | "failed" | null>(
    initialMessage
  );

  const localSummaries = useMemo(() => {
    return buildCategorySummaries(localGroups, summaries);
  }, [localGroups, summaries]);

  const selectedGroups = useMemo(() => {
    return localGroups.filter((group) => group.category === selectedCategory);
  }, [localGroups, selectedCategory]);

  function updateLocalItemStatus(taskItemId: string, nextStatus: TaskStatus) {
    setLocalGroups((currentGroups) =>
      currentGroups.map((group) => {
        const updatedItems = group.items.map((item) =>
          item.id === taskItemId ? { ...item, status: nextStatus } : item
        );

        return {
          ...group,
          items: updatedItems,
          status: getGroupStatus(updatedItems),
        };
      })
    );
  }

  return (
    <>
      {message === "sent" ? (
        <div className="mt-3 border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700">
          已送出。
        </div>
      ) : null}

      {message === "failed" ? (
        <div className="mt-3 border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
          操作失敗，請確認已綁定孩子。
        </div>
      ) : null}

      <ParentActionPanel
        childId={childId}
        selectedCategory={selectedCategory}
        onMessageChange={setMessage}
      />

      <section className="mt-5 grid grid-cols-4 border border-[var(--parent-border)] bg-white">
        {TASK_CATEGORIES.map((category) => {
          const summary = localSummaries.find(
            (item) => item.category === category.key
          );

          const status = summary?.status ?? "green";
          const completed = summary?.completed ?? 0;
          const total = summary?.total ?? 0;
          const isSelected = selectedCategory === category.key;

          return (
            <button
              key={category.key}
              type="button"
              onPointerDown={() => {
                if (selectedCategory !== category.key) {
                  setSelectedCategory(category.key);
                }
              }}
              className={
                isSelected
                  ? "border-r border-b border-[var(--parent-border)] bg-slate-50 px-2 py-2 text-center touch-manipulation"
                  : "border-r border-b border-[var(--parent-border)] px-2 py-2 text-center touch-manipulation"
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
            </button>
          );
        })}
      </section>

      <ParentCategoryTaskPanel
        category={selectedCategory}
        groups={selectedGroups}
        childId={childId}
        onLocalStatusChange={updateLocalItemStatus}
        onMessageChange={setMessage}
      />
    </>
  );
}

function ParentActionPanel({
  childId,
  selectedCategory,
  onMessageChange,
}: {
  childId: string | null;
  selectedCategory: TaskCategory;
  onMessageChange: (message: "sent" | "failed" | null) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleInteraction(interactionType: string) {
    if (!childId || isPending) {
      onMessageChange("failed");
      return;
    }

    onMessageChange("sent");

    startTransition(async () => {
      const formData = new FormData();
      formData.set("studentId", childId);
      formData.set("interactionType", interactionType);
      formData.set("category", selectedCategory);

      const result = await sendParentInteractionSilentAction(formData);

      if (!result.ok) {
        onMessageChange("failed");
      }
    });
  }

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
          <button
            key={action.id}
            type="button"
            onClick={() => handleInteraction(action.id)}
            disabled={!childId || isPending}
            className="w-full border border-[var(--parent-border)] bg-white px-3 py-3 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="block text-lg">{action.icon}</span>
            <span className="mt-2 block">{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ParentCategoryTaskPanel({
  category,
  groups,
  childId,
  onLocalStatusChange,
  onMessageChange,
}: {
  category: TaskCategory;
  groups: DashboardTaskGroup[];
  childId: string | null;
  onLocalStatusChange: (taskItemId: string, nextStatus: TaskStatus) => void;
  onMessageChange: (message: "sent" | "failed" | null) => void;
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
            <ParentTaskItemRow
              key={item.id}
              item={item}
              childId={childId}
              category={category}
              onLocalStatusChange={onLocalStatusChange}
              onMessageChange={onMessageChange}
            />
          ))}
        </section>
      ))}
    </section>
  );
}

function ParentTaskItemRow({
  item,
  childId,
  category,
  onLocalStatusChange,
  onMessageChange,
}: {
  item: DashboardTaskGroup["items"][number];
  childId: string | null;
  category: TaskCategory;
  onLocalStatusChange: (taskItemId: string, nextStatus: TaskStatus) => void;
  onMessageChange: (message: "sent" | "failed" | null) => void;
}) {
  const [localStatus, setLocalStatus] = useState<TaskStatus>(item.status);
  const [isPending, startTransition] = useTransition();

  function handleAcknowledge() {
    if (!childId || isPending) {
      onMessageChange("failed");
      return;
    }

    const previousStatus = localStatus;

    setLocalStatus("processing");
    onLocalStatusChange(item.id, "processing");
    onMessageChange("sent");

    startTransition(async () => {
      const formData = new FormData();
      formData.set("studentId", childId);
      formData.set("taskItemId", item.id);
      formData.set("category", category);

      const result = await acknowledgeParentTaskItemSilentAction(formData);

      if (!result.ok) {
        setLocalStatus(previousStatus);
        onLocalStatusChange(item.id, previousStatus);
        onMessageChange("failed");
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--parent-border)] px-3 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <StatusDot status={toDotStatus(localStatus)} />
          <p className="truncate text-sm">{item.title}</p>
        </div>

        <p className="mt-1 pl-6 text-xs text-[var(--parent-muted)]">
          {taskStatusLabels[localStatus]}
        </p>
      </div>

      {canShowParentOkButton({ ...item, status: localStatus }) ? (
        <button
          type="button"
          onClick={handleAcknowledge}
          disabled={!childId || isPending}
          className="shrink-0 border border-[var(--parent-border)] bg-white px-3 py-2 text-xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "..." : "收到了解"}
        </button>
      ) : (
        <span className="kado-mono shrink-0 text-xs text-[var(--parent-muted)]">
          READ
        </span>
      )}
    </div>
  );
}