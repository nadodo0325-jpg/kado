"use client";

import { useRef, useState, useTransition } from "react";
import { StatusDot } from "@/components/common/status-dot";
import { completeTaskItemSilentAction } from "@/features/tasks/actions";
import type { TaskStatus } from "@/lib/constants/status";

type SwipeTaskItemProps = {
  taskItemId: string;
  status: TaskStatus;
  title: string;
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

function getTaskStatusText(status: TaskStatus) {
  if (status === "green") return "DONE";
  if (status === "processing") return "PENDING";
  return "SWIPE";
}

export function SwipeTaskItem({
  taskItemId,
  status,
  title,
}: SwipeTaskItemProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number | null>(null);
  const [moveX, setMoveX] = useState(0);
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus>(status);
  const [isPending, startTransition] = useTransition();

  const canComplete = optimisticStatus === "red";
  const maxDrag = 112;

  function vibrate() {
    if ("vibrate" in window.navigator) {
      window.navigator.vibrate(18);
    }
  }

  function resetSwipe() {
    startXRef.current = null;
    setMoveX(0);
  }

  function completeTask() {
    if (!canComplete || isPending) {
      return;
    }

    const previousStatus = optimisticStatus;

    setOptimisticStatus("green");
    vibrate();

    startTransition(async () => {
      const result = await completeTaskItemSilentAction(taskItemId);

      if (!result.ok) {
        setOptimisticStatus(previousStatus);
      }
    });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!canComplete || isPending) return;

    startXRef.current = event.clientX;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // 部分瀏覽器不支援時忽略，不影響完成任務。
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (startXRef.current === null || !canComplete || isPending) return;

    const diff = Math.max(0, event.clientX - startXRef.current);
    setMoveX(Math.min(diff, maxDrag));
  }

  function handlePointerUp() {
    if (!canComplete || isPending) {
      resetSwipe();
      return;
    }

    const rowWidth = rowRef.current?.offsetWidth ?? 320;
    const threshold = rowWidth * 0.3;

    if (moveX >= threshold) {
      completeTask();
    }

    resetSwipe();
  }

  return (
    <div
      ref={rowRef}
      className="relative overflow-hidden border-b border-[var(--student-border)] last:border-b-0"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={resetSwipe}
    >
      <div className="absolute inset-y-0 left-0 flex items-center bg-[var(--green-soft)] px-3 text-xs text-green-400">
        放開完成
      </div>

      <div
        className="relative flex touch-pan-y items-center justify-between bg-[var(--student-bg)] px-3 py-3 transition-transform duration-150"
        style={{
          transform: canComplete ? `translateX(${moveX}px)` : "translateX(0px)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <StatusDot status={toDotStatus(optimisticStatus)} />
          <p className="truncate text-sm">{title}</p>
        </div>

        <button
          type="button"
          onClick={completeTask}
          disabled={!canComplete || isPending}
          className="kado-mono shrink-0 text-xs text-[var(--student-muted)] disabled:opacity-60"
        >
          {isPending ? "..." : getTaskStatusText(optimisticStatus)}
        </button>
      </div>
    </div>
  );
}