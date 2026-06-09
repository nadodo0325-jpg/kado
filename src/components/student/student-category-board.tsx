"use client";

import { useMemo, useState, useTransition } from "react";
import { StatusDot } from "@/components/common/status-dot";
import { completeTaskItemAction } from "@/features/tasks/actions";
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
  if (status === "green") {
    return "green";
  }

  if (status === "processing") {
    return "yellow";
  }

  return "red";
}

function getCategoryLabel(categoryKey: TaskCategory) {
  return TASK_CATEGORIES.find((category) => category.key === categoryKey);
}

function getTaskStatusText(status: TaskStatus) {
  if (status === "green") {
    return "DONE";
  }

  if (status === "processing") {
    return "PENDING";
  }

  return "TODO";
}

function getCategoryButtonClass(isSelected: boolean) {
  return isSelected
    ? "border-r border-b border-[var(--student-border)] bg-[var(--student-card)] p-4 text-left touch-manipulation"
    : "border-r border-b border-[var(--student-border)] p-4 text-left touch-manipulation";
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

  const selectedGroups = useMemo(() => {
    return groups.filter((group) => group.category === selectedCategory);
  }, [groups, selectedCategory]);

  function handleCategoryChange(category: TaskCategory) {
    if (category === selectedCategory) {
      return;
    }

    setSelectedCategory(category);
  }

  return (
    <>
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
            <button
              key={category.key}
              type="button"
              onPointerDown={() => handleCategoryChange(category.key)}
              className={getCategoryButtonClass(isSelected)}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{category.icon}</span>
                <StatusDot status={toDotStatus(status)} />
              </div>

              <p className="mt-5 text-sm font-semibold">{category.label}</p>
              <p className="kado-mono mt-1 text-xs text-[var(--student-muted)]">
                {completed}/{total}
              </p>
            </button>
          );
        })}
      </section>

      <CategoryTaskPanel category={selectedCategory} groups={selectedGroups} />
    </>
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

            <p className="kado-mono text-xs text-[var(--student-muted)]">
              TODAY
            </p>
          </div>

          {group.items.map((item) => (
            <LightTaskRow
              key={item.id}
              taskItemId={item.id}
              title={item.title}
              status={item.status}
            />
          ))}
        </section>
      ))}
    </section>
  );
}

function LightTaskRow({
  taskItemId,
  title,
  status,
}: {
  taskItemId: string;
  title: string;
  status: TaskStatus;
}) {
  const [localStatus, setLocalStatus] = useState<TaskStatus>(status);
  const [isPending, startTransition] = useTransition();

  const canComplete = localStatus === "red";

  function handleComplete() {
    if (!canComplete || isPending) {
      return;
    }

    setLocalStatus("green");

    startTransition(async () => {
      const result = await completeTaskItemAction(taskItemId);

      if (!result.ok) {
        setLocalStatus(status);
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
          onPointerDown={handleComplete}
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