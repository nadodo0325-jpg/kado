"use client";

import { useMemo, useRef, useState, useTransition } from "react";
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
    : "border-r border-b border-[var(--student-border)] p-4 text-left touch-manipulation hover:bg-[var(--student-card)]";
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
  const activeCategoryRef = useRef<TaskCategory>(initialCategory);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const groupsByCategory = useMemo(() => {
    return TASK_CATEGORIES.reduce<Record<TaskCategory, DashboardTaskGroup[]>>(
      (result, category) => {
        result[category.key] = groups.filter(
          (group) => group.category === category.key
        );

        return result;
      },
      {
        homework: [],
        quiz: [],
        todo: [],
        others: [],
      }
    );
  }, [groups]);

  function handleCategoryClick(category: TaskCategory) {
    if (category === activeCategoryRef.current) {
      return;
    }

    activeCategoryRef.current = category;

    TASK_CATEGORIES.forEach((item) => {
      const button = buttonRefs.current[item.key];
      const panel = panelRefs.current[item.key];
      const isSelected = item.key === category;

      if (button) {
        button.className = getCategoryButtonClass(isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
      }

      if (panel) {
        if (isSelected) {
          panel.classList.remove("hidden");
          panel.classList.add("block");
        } else {
          panel.classList.remove("block");
          panel.classList.add("hidden");
        }
      }
    });
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
          const isSelected = initialCategory === category.key;

          return (
            <button
              key={category.key}
              ref={(element) => {
                buttonRefs.current[category.key] = element;
              }}
              type="button"
              aria-pressed={isSelected}
              onPointerDown={() => handleCategoryClick(category.key)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  handleCategoryClick(category.key);
                }
              }}
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

      {TASK_CATEGORIES.map((category) => (
        <div
          key={category.key}
          ref={(element) => {
            panelRefs.current[category.key] = element;
          }}
          className={initialCategory === category.key ? "block" : "hidden"}
        >
          <CategoryTaskPanel
            category={category.key}
            groups={groupsByCategory[category.key]}
          />
        </div>
      ))}
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
              TAP TO COMPLETE
            </p>
          </div>

          {group.items.map((item) => (
            <LightweightTaskItem
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

function LightweightTaskItem({
  taskItemId,
  title,
  status,
}: {
  taskItemId: string;
  title: string;
  status: TaskStatus;
}) {
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus>(status);
  const [isPending, startTransition] = useTransition();

  const isDone = optimisticStatus === "green";
  const canComplete = optimisticStatus === "red";

  function handleComplete() {
    if (!canComplete || isPending) {
      return;
    }

    setOptimisticStatus("green");

    startTransition(async () => {
      const result = await completeTaskItemAction(taskItemId);

      if (!result.ok) {
        setOptimisticStatus(status);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--student-border)] px-3 py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <StatusDot status={toDotStatus(optimisticStatus)} />
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
          {getTaskStatusText(optimisticStatus)}
        </span>
      )}
    </div>
  );
}