"use client";

import { useMemo, useState } from "react";
import { StatusDot } from "@/components/common/status-dot";
import { SwipeTaskItem } from "@/components/student/swipe-task-item";
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

  const selectedGroups = useMemo(
    () => groups.filter((group) => group.category === selectedCategory),
    [groups, selectedCategory]
  );

  function handleCategoryClick(category: TaskCategory) {
    setSelectedCategory(category);

    const url = new URL(window.location.href);
    url.searchParams.set("category", category);
    window.history.replaceState(null, "", `${url.pathname}?${url.search}`);
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
              onClick={() => handleCategoryClick(category.key)}
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
            </button>
          );
        })}
      </section>

      <CategoryTaskPanel
        category={selectedCategory}
        groups={selectedGroups}
      />
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