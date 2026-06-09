"use client";

import { useState, useTransition } from "react";
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

type LocalResult = "idle" | "saving" | "updated" | "failed";

export function MoodCheckinPanel({
  currentMood,
  selectedCategory,
  result,
}: MoodCheckinPanelProps) {
  const [selectedMood, setSelectedMood] = useState<MoodStatus | null>(
    currentMood
  );

  const [localResult, setLocalResult] = useState<LocalResult>(() => {
    if (result === "updated") {
      return "updated";
    }

    if (result === "failed") {
      return "failed";
    }

    return "idle";
  });

  const [isPending, startTransition] = useTransition();

  function handleMoodClick(moodKey: MoodStatus) {
    if (isPending && selectedMood === moodKey) {
      return;
    }

    const previousMood = selectedMood;

    setSelectedMood(moodKey);
    setLocalResult("saving");

    startTransition(() => {
      void saveMood(moodKey, previousMood);
    });
  }

  async function saveMood(moodKey: MoodStatus, previousMood: MoodStatus | null) {
    try {
      const formData = new FormData();
      formData.set("mood", moodKey);
      formData.set("category", selectedCategory);

      await setMoodCheckinAction(formData);

      setLocalResult("updated");
    } catch {
      setSelectedMood(previousMood);
      setLocalResult("failed");
    }
  }

  return (
    <section className="mt-5 border border-[var(--student-border)]">
      <div className="flex items-center justify-between border-b border-[var(--student-border)] px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold">今日能量 Check-in</h2>
          <p className="mt-1 text-xs text-[var(--student-muted)]">
            每天第一次進入時，先選一個今天的狀態。
          </p>
        </div>

        <p className="kado-mono text-xs text-[var(--student-muted)]">
          {localResult === "saving"
            ? "SAVING"
            : selectedMood
              ? "DONE"
              : "REQUIRED"}
        </p>
      </div>

      {localResult === "saving" ? (
        <div className="border-b border-[var(--student-border)] px-3 py-2 text-xs text-[var(--student-muted)]">
          正在儲存今日心情氣象...
        </div>
      ) : null}

      {localResult === "updated" ? (
        <div className="border-b border-[var(--student-border)] px-3 py-2 text-xs text-green-400">
          今日心情氣象已更新。
        </div>
      ) : null}

      {localResult === "failed" ? (
        <div className="border-b border-[var(--student-border)] px-3 py-2 text-xs text-red-400">
          更新失敗，請稍後再試。
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
        {moodKeys.map((moodKey) => {
          const mood = MOOD_STATUS[moodKey];
          const isSelected = selectedMood === moodKey;
          const isSavingThisMood = localResult === "saving" && isSelected;

          return (
            <button
              key={moodKey}
              type="button"
              aria-pressed={isSelected}
              onPointerDown={() => handleMoodClick(moodKey)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  handleMoodClick(moodKey);
                }
              }}
              className={
                isSelected
                  ? "w-full border border-green-500 bg-[var(--green-soft)] px-3 py-3 text-left touch-manipulation"
                  : "w-full border border-[var(--student-border)] px-3 py-3 text-left touch-manipulation hover:bg-[var(--student-card)]"
              }
            >
              <span className="block text-lg">{mood.icon}</span>
              <span className="mt-2 block text-xs text-[var(--student-muted)]">
                {isSavingThisMood ? "儲存中..." : mood.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}