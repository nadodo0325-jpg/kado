"use client";

import { useMemo, useState, useTransition } from "react";
import { StatusDot } from "@/components/common/status-dot";
import { completeTaskItemSilentAction } from "@/features/tasks/actions";
import type {
  CategorySummary,
  DashboardTaskGroup,
} from "@/features/tasks/types";
import {
  TASK_CATEGORIES,
  type TaskCategory,
} from "@/lib/constants/categories";
import type { TaskStatus } from "@/lib/constants/status";

function toDotStatus(status: TaskStatus): "red" | "green" | "yellow" {
  if (status === "green") return "green";
  if (status === "processing") return "yellow";
  return "red";
}

function getCategoryLabel(categoryKey: TaskCategory) {
  return TASK_CATEGORIES.find((category) => category.key === categoryKey);
}

function getTaskStatusText(status: TaskStatus) {
  if (status === "green") return "DONE";
  if (status === "processing") return "PENDING";
  return "TODO";
}

function getCategoryButtonClass(isSelected: boolean) {
  return isSelected
    ? "border-r border-b border-[var(--student-border)] bg-[var(--student-card)] px-2 py-2 text-center touch-manipulation"
    : "border-r border-b border-[var(--student-border)] px-2 py-2 text-center touch-manipulation";
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

export function StudentCategoryBoard({
  initialCategory,
  groups,
  summaries,
}: {
  initialCategory: TaskCategory;
  groups: DashboardTaskGroup[];
  summaries: CategorySummary[];
}) {
  const [selectedCategory, setSelectedCategory] =
    useState<TaskCategory>(initialCategory);

  const [localGroups, setLocalGroups] = useState<DashboardTaskGroup[]>(groups);

  const localSummaries = useMemo(() => {
    return buildCategorySummaries(localGroups, summaries);
  }, [localGroups, summaries]);

  const selectedGroups = useMemo(() => {
    return localGroups.filter((group) => group.category === selectedCategory);
  }, [localGroups, selectedCategory]);

  function handleCategoryChange(category: TaskCategory) {
    if (category === selectedCategory) return;
    setSelectedCategory(category);
  }

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
      <section className="mt-5 grid grid-cols-4 border border-[var(--student-border)]">
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
              onPointerDown={() => handleCategoryChange(category.key)}
              className={getCategoryButtonClass(isSelected)}
            >
              <div className="flex items-center justify-center gap-1">
                <span className="text-base">{category.icon}</span>
                <StatusDot status={toDotStatus(status)} />
              </div>

              <p className="mt-2 text-[11px] font-semibold leading-tight">
                {category.label}
              </p>
              <p className="kado-mono mt-1 text-[10px] text-[var(--student-muted)]">
                {completed}/{total}
              </p>
            </button>
          );
        })}
      </section>

      <CategoryTaskPanel
        category={selectedCategory}
        groups={selectedGroups}
        onLocalStatusChange={updateLocalItemStatus}
      />
    </>
  );
}

function CategoryTaskPanel({
  category,
  groups,
  onLocalStatusChange,
}: {
  category: TaskCategory;
  groups: DashboardTaskGroup[];
  onLocalStatusChange: (taskItemId: string, nextStatus: TaskStatus) => void;
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

            <p className="kado-mono text-xs text-[var(--student-muted)]">
              TODAY
            </p>
          </div>

          {group.items.map((item) => (
            <TaskCompleteRow
              key={item.id}
              taskItemId={item.id}
              title={item.title}
              status={item.status}
              onLocalStatusChange={onLocalStatusChange}
            />
          ))}
        </section>
      ))}
    </section>
  );
}

function TaskCompleteRow({
  taskItemId,
  title,
  status,
  onLocalStatusChange,
}: {
  taskItemId: string;
  title: string;
  status: TaskStatus;
  onLocalStatusChange: (taskItemId: string, nextStatus: TaskStatus) => void;
}) {
  const [localStatus, setLocalStatus] = useState<TaskStatus>(status);
  const [isPending, startTransition] = useTransition();

  const canComplete = localStatus === "red";

  function handleComplete() {
    if (!canComplete || isPending) return;

    const previousStatus = localStatus;

    setLocalStatus("green");
    onLocalStatusChange(taskItemId, "green");

    startTransition(async () => {
      const result = await completeTaskItemSilentAction(taskItemId);

      if (!result.ok) {
        setLocalStatus(previousStatus);
        onLocalStatusChange(taskItemId, previousStatus);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--student-border)] px-3 py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <StatusDot status={toDotStatus(localStatus)} />
        <p className="truncate text-sm">{title}</p>
      </div>

      {canComplete ? (
        <button
          type="button"
          onClick={handleComplete}
          disabled={isPending}
          className="kado-mono shrink-0 border border-[var(--student-border)] px-3 py-1.5 text-xs text-green-400 touch-manipulation disabled:opacity-50"
        >
          {isPending ? "..." : "完成"}
        </button>
      ) : (
        <span className="kado-mono shrink-0 text-xs text-[var(--student-muted)]">
          {getTaskStatusText(localStatus)}
        </span>
      )}
    </div>
  );
}