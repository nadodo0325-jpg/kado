"use client";

import { useRef } from "react";
import { setMoodCheckinAction } from "@/features/status/actions";
import type { TaskCategory } from "@/lib/constants/categories";
import { MOOD_STATUS, type MoodStatus } from "@/lib/constants/status";

const moodKeys: MoodStatus[] = [
  "high_energy",
  "stable",
  "tired",
  "low_pressure",
];

type MoodCheckinPanelProps = {
  currentMood: MoodStatus | null;
  selectedCategory: TaskCategory;
  result?: string;
};

export function MoodCheckinPanel({
  currentMood,
  selectedCategory,
  result,
}: MoodCheckinPanelProps) {
  const activeMoodRef = useRef<MoodStatus | null>(currentMood);
  const requestIdRef = useRef(0);
  const statusRef = useRef<HTMLParagraphElement | null>(null);
  const helperRef = useRef<HTMLParagraphElement | null>(null);
  const inputRefs = useRef<Partial<Record<MoodStatus, HTMLInputElement | null>>>(
    {}
  );

  function setHelperText(type: "idle" | "saving" | "updated" | "failed") {
    const status = statusRef.current;
    const helper = helperRef.current;

    if (status) {
      status.textContent =
        type === "saving"
          ? "SAVING"
          : activeMoodRef.current
            ? "DONE"
            : "REQUIRED";
    }

    if (!helper) {
      return;
    }

    if (type === "saving") {
      helper.textContent = "正在背景儲存，不影響你繼續操作。";
      helper.className = "mt-1 text-xs text-[var(--student-muted)]";
      return;
    }

    if (type === "updated") {
      helper.textContent = "今日心情氣象已更新。";
      helper.className = "mt-1 text-xs text-green-400";
      return;
    }

    if (type === "failed") {
      helper.textContent = "更新失敗，已還原上一個狀態。";
      helper.className = "mt-1 text-xs text-red-400";
      return;
    }

    helper.textContent = "每天第一次進入時，先選一個今天的狀態。";
    helper.className = "mt-1 text-xs text-[var(--student-muted)]";
  }

  function rollbackMood(previousMood: MoodStatus | null) {
    activeMoodRef.current = previousMood;

    moodKeys.forEach((key) => {
      const input = inputRefs.current[key];

      if (input) {
        input.checked = key === previousMood;
      }
    });
  }

  function handleMoodChange(moodKey: MoodStatus) {
    if (activeMoodRef.current === moodKey) {
      return;
    }

    const previousMood = activeMoodRef.current;
    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;
    activeMoodRef.current = moodKey;
    setHelperText("saving");

    window.setTimeout(() => {
      void saveMood(moodKey, previousMood, requestId);
    }, 0);
  }

  async function saveMood(
    moodKey: MoodStatus,
    previousMood: MoodStatus | null,
    requestId: number
  ) {
    try {
      const formData = new FormData();
      formData.set("mood", moodKey);
      formData.set("category", selectedCategory);

      await setMoodCheckinAction(formData);

      if (requestIdRef.current !== requestId) {
        return;
      }

      setHelperText("updated");
    } catch {
      if (requestIdRef.current !== requestId) {
        return;
      }

      rollbackMood(previousMood);
      setHelperText("failed");
    }
  }

  const initialHelperText =
    result === "updated"
      ? "今日心情氣象已更新。"
      : result === "failed"
        ? "更新失敗，請稍後再試。"
        : "每天第一次進入時，先選一個今天的狀態。";

  const initialHelperClass =
    result === "updated"
      ? "mt-1 text-xs text-green-400"
      : result === "failed"
        ? "mt-1 text-xs text-red-400"
        : "mt-1 text-xs text-[var(--student-muted)]";

  return (
    <section className="mt-5 border border-[var(--student-border)]">
      <div className="flex items-center justify-between border-b border-[var(--student-border)] px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold">今日能量 Check-in</h2>
          <p ref={helperRef} className={initialHelperClass}>
            {initialHelperText}
          </p>
        </div>

        <p
          ref={statusRef}
          className="kado-mono text-xs text-[var(--student-muted)]"
        >
          {currentMood ? "DONE" : "REQUIRED"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
        {moodKeys.map((moodKey) => {
          const mood = MOOD_STATUS[moodKey];
          const isSelected = currentMood === moodKey;

          return (
            <label key={moodKey} className="block touch-manipulation">
              <input
                ref={(element) => {
                  inputRefs.current[moodKey] = element;
                }}
                type="radio"
                name="student-mood-checkin"
                value={moodKey}
                defaultChecked={isSelected}
                onChange={() => handleMoodChange(moodKey)}
                className="peer sr-only"
              />

              <span className="block w-full border border-[var(--student-border)] px-3 py-3 text-left peer-checked:border-green-500 peer-checked:bg-[var(--green-soft)]">
                <span className="block text-lg">{mood.icon}</span>
                <span className="mt-2 block text-xs text-[var(--student-muted)]">
                  {mood.label}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}