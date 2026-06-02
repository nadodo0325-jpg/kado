"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusDot } from "@/components/common/status-dot";
import { completeTaskItemAction } from "@/features/tasks/actions";
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

export function SwipeTaskItem({
  taskItemId,
  status,
  title,
}: SwipeTaskItemProps) {
  const router = useRouter();
  const [startX, setStartX] = useState<number | null>(null);
  const [moveX, setMoveX] = useState(0);
  const [optimisticStatus, setOptimisticStatus] = useState<TaskStatus>(status);
  const [isPending, startTransition] = useTransition();

  const isDone = optimisticStatus === "green";

  function completeTask() {
    if (isDone || isPending) {
      return;
    }

    setOptimisticStatus("green");

    startTransition(async () => {
      const result = await completeTaskItemAction(taskItemId);

      if (!result.ok) {
        setOptimisticStatus(status);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div
      className="relative overflow-hidden border-b border-[var(--student-border)] last:border-b-0"
      onPointerDown={(event) => {
        if (isDone) return;
        setStartX(event.clientX);
      }}
      onPointerMove={(event) => {
        if (startX === null || isDone) return;

        const diff = Math.max(0, event.clientX - startX);
        setMoveX(Math.min(diff, 96));
      }}
      onPointerUp={() => {
        if (moveX >= 80) {
          completeTask();
        }

        setStartX(null);
        setMoveX(0);
      }}
      onPointerCancel={() => {
        setStartX(null);
        setMoveX(0);
      }}
    >
      <div className="absolute inset-y-0 left-0 flex items-center bg-[var(--green-soft)] px-3 text-xs text-green-400">
        放開完成
      </div>

      <div
        className="kado-transition relative flex touch-pan-y items-center justify-between bg-[var(--student-bg)] px-3 py-3"
        style={{
          transform: `translateX(${moveX}px)`,
        }}
      >
        <div className="flex items-center gap-3">
          <StatusDot status={toDotStatus(optimisticStatus)} />
          <p className="text-sm">{title}</p>
        </div>

        <button
          type="button"
          onClick={completeTask}
          disabled={isDone || isPending}
          className="kado-mono text-xs text-[var(--student-muted)] disabled:opacity-60"
        >
          {isDone ? "GREEN" : isPending ? "..." : "SWIPE"}
        </button>
      </div>
    </div>
  );
}