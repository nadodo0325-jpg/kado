"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { setStudentStatusSilentAction } from "@/features/status/actions";
import type { TaskCategory } from "@/lib/constants/categories";
import { STUDENT_STATUS, type StudentStatus } from "@/lib/constants/status";

const statusKeys: StudentStatus[] = ["moving", "home", "flow"];

type StudentStatusPanelProps = {
  currentStatus: StudentStatus | string | null | undefined;
  selectedCategory: TaskCategory;
  result?: string;
};

function getValidStatus(
  value: StudentStatus | string | null | undefined
): StudentStatus | null {
  return statusKeys.includes(value as StudentStatus)
    ? (value as StudentStatus)
    : null;
}

function getStatusButtonClass(isSelected: boolean) {
  return isSelected
    ? "w-full border border-green-500 bg-[var(--green-soft)] px-3 py-3 text-left touch-manipulation"
    : "w-full border border-[var(--student-border)] px-3 py-3 text-left touch-manipulation";
}

export function StudentStatusPanel({
  currentStatus,
  selectedCategory,
  result,
}: StudentStatusPanelProps) {
  const initialStatus = getValidStatus(currentStatus);

  const [localStatus, setLocalStatus] = useState<StudentStatus | null>(
    initialStatus
  );

  const requestIdRef = useRef(0);
  const helperRef = useRef<HTMLParagraphElement | null>(null);

  function setHelperText(type: "idle" | "updated" | "failed") {
    const helper = helperRef.current;

    if (!helper) {
      return;
    }

    if (type === "updated") {
      helper.textContent = "目前狀態已更新。";
      helper.className = "mt-2 min-h-4 text-xs text-green-400";
      return;
    }

    if (type === "failed") {
      helper.textContent = "狀態更新失敗，已還原上一個狀態。";
      helper.className = "mt-2 min-h-4 text-xs text-red-400";
      return;
    }

    helper.textContent = "選擇你現在的學習狀態。";
    helper.className = "mt-2 min-h-4 text-xs text-[var(--student-muted)]";
  }

  function handleStatusSelect(statusKey: StudentStatus) {
    if (localStatus === statusKey) {
      return;
    }

    const previousStatus = localStatus;
    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;

    flushSync(() => {
      setLocalStatus(statusKey);
    });

    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        void saveStatus(statusKey, previousStatus, requestId);
      }, 350);
    });
  }

  async function saveStatus(
    statusKey: StudentStatus,
    previousStatus: StudentStatus | null,
    requestId: number
  ) {
    try {
      const formData = new FormData();
      formData.set("studentStatus", statusKey);
      formData.set("category", selectedCategory);

      const response = await setStudentStatusSilentAction(formData);

      if (!response.ok) {
        throw new Error(response.error);
      }

      if (requestIdRef.current !== requestId) {
        return;
      }

      setHelperText("updated");
    } catch {
      if (requestIdRef.current !== requestId) {
        return;
      }

      flushSync(() => {
        setLocalStatus(previousStatus);
      });

      setHelperText("failed");
    }
  }

  const initialHelperText =
    result === "updated"
      ? "目前狀態已更新。"
      : result === "failed"
        ? "狀態更新失敗，請稍後再試。"
        : "選擇你現在的學習狀態。";

  const initialHelperClass =
    result === "updated"
      ? "mt-2 min-h-4 text-xs text-green-400"
      : result === "failed"
        ? "mt-2 min-h-4 text-xs text-red-400"
        : "mt-2 min-h-4 text-xs text-[var(--student-muted)]";

  return (
    <section className="mt-5">
      <div className="grid grid-cols-3 gap-2">
        {statusKeys.map((statusKey) => {
          const item = STUDENT_STATUS[statusKey];
          const isSelected = localStatus === statusKey;

          return (
            <button
              key={statusKey}
              type="button"
              onPointerDown={() => handleStatusSelect(statusKey)}
              className={getStatusButtonClass(isSelected)}
            >
              <span className="block text-lg">{item.icon}</span>
              <span className="mt-2 block text-xs text-[var(--student-muted)]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <p ref={helperRef} className={initialHelperClass}>
        {initialHelperText}
      </p>
    </section>
  );
}