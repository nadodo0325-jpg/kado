"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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

function countNotGreenItems(groups: DashboardTaskGroup[]) {
  return groups
    .flatMap((group) => group.items)
    .filter((item) => item.status !== "green").length;
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
  const [showAllGreen, setShowAllGreen] = useState(false);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const localSummaries = useMemo(() => {
    return buildCategorySummaries(localGroups, summaries);
  }, [localGroups, summaries]);

  const selectedGroups = useMemo(() => {
    return localGroups.filter((group) => group.category === selectedCategory);
  }, [localGroups, selectedCategory]);

  const remainingNotGreenCount = useMemo(() => {
    return countNotGreenItems(localGroups);
  }, [localGroups]);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

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

  function showTodayAllGreenCelebration() {
  setShowAllGreen(true);

  if (celebrationTimerRef.current) {
    clearTimeout(celebrationTimerRef.current);
  }
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
        remainingNotGreenCount={remainingNotGreenCount}
        onLocalStatusChange={updateLocalItemStatus}
        onAllGreen={showTodayAllGreenCelebration}
      />

      {showAllGreen ? (
        <TodayAllGreenCelebration onClose={() => setShowAllGreen(false)} />
      ) : null}
    </>
  );
}

function CategoryTaskPanel({
  category,
  groups,
  remainingNotGreenCount,
  onLocalStatusChange,
  onAllGreen,
}: {
  category: TaskCategory;
  groups: DashboardTaskGroup[];
  remainingNotGreenCount: number;
  onLocalStatusChange: (taskItemId: string, nextStatus: TaskStatus) => void;
  onAllGreen: () => void;
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
              remainingNotGreenCount={remainingNotGreenCount}
              onLocalStatusChange={onLocalStatusChange}
              onAllGreen={onAllGreen}
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
  remainingNotGreenCount,
  onLocalStatusChange,
  onAllGreen,
}: {
  taskItemId: string;
  title: string;
  status: TaskStatus;
  remainingNotGreenCount: number;
  onLocalStatusChange: (taskItemId: string, nextStatus: TaskStatus) => void;
  onAllGreen: () => void;
}) {
  const [localStatus, setLocalStatus] = useState<TaskStatus>(status);
  const [isPending, startTransition] = useTransition();

  const canComplete = localStatus === "red";

  function handleComplete() {
    if (!canComplete || isPending) return;

    const previousStatus = localStatus;
    const willBecomeAllGreen = remainingNotGreenCount === 1;

    setLocalStatus("green");
    onLocalStatusChange(taskItemId, "green");

    if (willBecomeAllGreen) {
      onAllGreen();
    }

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

function TodayAllGreenCelebration({ onClose }: { onClose: () => void }) {
  const hearts = [
    { left: "7%", delay: "0s", size: "text-2xl", content: "💗" },
    { left: "18%", delay: "0.4s", size: "text-xl", content: "🫧" },
    { left: "28%", delay: "0.9s", size: "text-3xl", content: "💖" },
    { left: "41%", delay: "0.2s", size: "text-xl", content: "✨" },
    { left: "55%", delay: "0.7s", size: "text-2xl", content: "💕" },
    { left: "67%", delay: "1.1s", size: "text-xl", content: "🫧" },
    { left: "78%", delay: "0.5s", size: "text-3xl", content: "💘" },
    { left: "90%", delay: "0.8s", size: "text-xl", content: "🎉" },
  ];

  const sparkles = [
    { top: "14%", left: "18%", delay: "0s" },
    { top: "18%", left: "76%", delay: "0.25s" },
    { top: "34%", left: "12%", delay: "0.45s" },
    { top: "62%", left: "84%", delay: "0.15s" },
    { top: "78%", left: "20%", delay: "0.65s" },
    { top: "82%", left: "70%", delay: "0.35s" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0b0610] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.55),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.5),_transparent_34%),radial-gradient(circle_at_bottom,_rgba(251,113,133,0.48),_transparent_42%)]" />
      <div className="absolute inset-0 bg-black/20" />

      {hearts.map((item, index) => (
        <span
          key={`heart-${index}`}
          className={`pointer-events-none absolute bottom-[-48px] ${item.size}`}
          style={{
            left: item.left,
            animation: `kado-ig-float 5.2s ease-out ${item.delay} infinite`,
          }}
        >
          {item.content}
        </span>
      ))}

      {sparkles.map((item, index) => (
        <span
          key={`sparkle-${index}`}
          className="pointer-events-none absolute h-2 w-2 rounded-full bg-white"
          style={{
            top: item.top,
            left: item.left,
            animation: `kado-ig-pop 1.45s ease-out ${item.delay} infinite`,
            boxShadow:
              "0 0 18px rgba(255,255,255,0.95), 0 0 32px rgba(244,114,182,0.65)",
          }}
        />
      ))}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-5">
        <div className="grid grid-cols-5 gap-1">
          <div className="h-1 rounded-full bg-white" />
          <div className="h-1 rounded-full bg-white/90" />
          <div className="h-1 rounded-full bg-white/75" />
          <div className="h-1 rounded-full bg-white/55" />
          <div className="h-1 rounded-full bg-white/35" />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="kado-mono text-[11px] tracking-[0.22em] text-white/70">
              KADO STORY
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              今日任務完成
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-lg font-semibold text-white backdrop-blur"
            aria-label="關閉慶祝畫面"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full overflow-hidden rounded-[2rem] border border-white/25 bg-white/15 p-5 text-center shadow-2xl backdrop-blur-md">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/20 text-4xl shadow-xl">
              🎉
            </div>

            <p className="mt-5 kado-mono text-xs tracking-[0.25em] text-pink-100">
              ALL TASKS DONE
            </p>

            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white">
              恭喜完成
              <br />
              今日所有任務
            </h2>

            <p className="mt-4 text-sm leading-6 text-white/82">
              今天的紅燈已經全部清空。
              <br />
              這不是運氣，是你真的有把事情完成 💗
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/20 bg-white/12 px-2 py-3">
                <p className="kado-mono text-[10px] text-white/60">RED</p>
                <p className="mt-1 text-lg font-bold text-white">0</p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/12 px-2 py-3">
                <p className="kado-mono text-[10px] text-white/60">TODAY</p>
                <p className="mt-1 text-lg font-bold text-white">完成</p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/12 px-2 py-3">
                <p className="kado-mono text-[10px] text-white/60">MOOD</p>
                <p className="mt-1 text-lg font-bold text-white">💖</p>
              </div>
            </div>

            <div className="mt-7 flex justify-center gap-2 text-3xl">
              <span className="animate-bounce">💗</span>
              <span className="animate-bounce [animation-delay:0.1s]">🫧</span>
              <span className="animate-bounce [animation-delay:0.2s]">🎆</span>
              <span className="animate-bounce [animation-delay:0.3s]">💕</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-7 w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-pink-600 shadow-lg"
            >
              太棒了，收下今天的完成感
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes kado-ig-float {
          0% {
            transform: translateY(0) translateX(0) scale(0.82) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          70% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(-116vh) translateX(22px) scale(1.18)
              rotate(18deg);
            opacity: 0;
          }
        }

        @keyframes kado-ig-pop {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          25% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(0.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}