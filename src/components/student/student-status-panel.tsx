"use client";

import { useRef } from "react";
import { setStudentStatusSilentAction } from "@/features/status/actions";
import type { TaskCategory } from "@/lib/constants/categories";
import { STUDENT_STATUS, type StudentStatus } from "@/lib/constants/status";

const statusKeys: StudentStatus[] = ["moving", "home", "flow"];

type StudentStatusPanelProps = {
  currentStatus: StudentStatus | string | null | undefined;
  selectedCategory: TaskCategory;
  result?: string;
};

export function StudentStatusPanel({
  currentStatus,
  selectedCategory,
  result,
}: StudentStatusPanelProps) {
  const initialStatus = statusKeys.includes(currentStatus as StudentStatus)
    ? (currentStatus as StudentStatus)
    : null;

  const activeStatusRef = useRef<StudentStatus | null>(initialStatus);
  const requestIdRef = useRef(0);
  const helperRef = useRef<HTMLParagraphElement | null>(null);
  const inputRefs = useRef<
    Partial<Record<StudentStatus, HTMLInputElement | null>>
  >({});

  function setHelperText(type: "idle" | "saving" | "updated" | "failed") {
    const helper = helperRef.current;

    if (!helper) {
      return;
    }

    if (type === "saving") {
      helper.textContent = "正在背景更新狀態，不影響你繼續操作。";
      helper.className = "mt-2 text-xs text-[var(--student-muted)]";
      return;
    }

    if (type === "updated") {
      helper.textContent = "目前狀態已更新。";
      helper.className = "mt-2 text-xs text-green-400";
      return;
    }

    if (type === "failed") {
      helper.textContent = "狀態更新失敗，已還原上一個狀態。";
      helper.className = "mt-2 text-xs text-red-400";
      return;
    }

    helper.textContent = "選擇你現在的學習狀態。";
    helper.className = "mt-2 text-xs text-[var(--student-muted)]";
  }

  function rollbackStatus(previousStatus: StudentStatus | null) {
    activeStatusRef.current = previousStatus;

    statusKeys.forEach((key) => {
      const input = inputRefs.current[key];

      if (input) {
        input.checked = key === previousStatus;
      }
    });
  }

  function paintStatus(statusKey: StudentStatus) {
    statusKeys.forEach((key) => {
      const input = inputRefs.current[key];

      if (input) {
        input.checked = key === statusKey;
      }
    });

    activeStatusRef.current = statusKey;
  }

  function handleStatusSelect(statusKey: StudentStatus) {
    if (activeStatusRef.current === statusKey) {
      return;
    }

    const previousStatus = activeStatusRef.current;
    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;

    paintStatus(statusKey);
    setHelperText("saving");

    window.setTimeout(() => {
      void saveStatus(statusKey, previousStatus, requestId);
    }, 0);
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

      rollbackStatus(previousStatus);
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
      ? "mt-2 text-xs text-green-400"
      : result === "failed"
        ? "mt-2 text-xs text-red-400"
        : "mt-2 text-xs text-[var(--student-muted)]";

  return (
    <section className="mt-5">
      <div className="grid grid-cols-3 gap-2">
        {statusKeys.map((statusKey) => {
          const item = STUDENT_STATUS[statusKey];
          const isSelected = initialStatus === statusKey;

          return (
            <label
              key={statusKey}
              className="block touch-manipulation"
              onPointerDown={() => handleStatusSelect(statusKey)}
            >
              <input
                ref={(element) => {
                  inputRefs.current[statusKey] = element;
                }}
                type="radio"
                name="student-current-status"
                value={statusKey}
                defaultChecked={isSelected}
                onChange={() => handleStatusSelect(statusKey)}
                className="peer sr-only"
              />

              <span className="block w-full border border-[var(--student-border)] px-3 py-3 text-left peer-checked:border-green-500 peer-checked:bg-[var(--green-soft)]">
                <span className="block text-lg">{item.icon}</span>
                <span className="mt-2 block text-xs text-[var(--student-muted)]">
                  {item.label}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <p ref={helperRef} className={initialHelperClass}>
        {initialHelperText}
      </p>
    </section>
  );
}