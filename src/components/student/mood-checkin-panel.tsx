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

function getMoodButtonClass(isSelected: boolean) {
  return isSelected
    ? "w-full border border-green-500 bg-[var(--green-soft)] px-3 py-3 text-left touch-manipulation"
    : "w-full border border-[var(--student-border)] px-3 py-3 text-left touch-manipulation hover:bg-[var(--student-card)]";
}

export function MoodCheckinPanel({
  currentMood,
  selectedCategory,
  result,
}: MoodCheckinPanelProps) {
  const activeMoodRef = useRef<MoodStatus | null>(currentMood);
  const pendingRef = useRef(false);

  const buttonRefs = useRef<
    Partial<Record<MoodStatus, HTMLButtonElement | null>>
  >({});

  const labelRefs = useRef<Partial<Record<MoodStatus, HTMLSpanElement | null>>>(
    {}
  );

  const statusRef = useRef<HTMLParagraphElement | null>(null);
  const messageRef = useRef<HTMLDivElement | null>(null);

  function setMessage(type: "idle" | "saving" | "updated" | "failed") {
    const status = statusRef.current;
    const message = messageRef.current;

    if (status) {
      if (type === "saving") {
        status.textContent = "SAVING";
      } else if (activeMoodRef.current) {
        status.textContent = "DONE";
      } else {
        status.textContent = "REQUIRED";
      }
    }

    if (!message) {
      return;
    }

    if (type === "saving") {
      message.textContent = "正在儲存今日心情氣象...";
      message.className =
        "border-b border-[var(--student-border)] px-3 py-2 text-xs text-[var(--student-muted)]";
      message.hidden = false;
      return;
    }

    if (type === "updated") {
      message.textContent = "今日心情氣象已更新。";
      message.className =
        "border-b border-[var(--student-border)] px-3 py-2 text-xs text-green-400";
      message.hidden = false;
      return;
    }

    if (type === "failed") {
      message.textContent = "更新失敗，請稍後再試。";
      message.className =
        "border-b border-[var(--student-border)] px-3 py-2 text-xs text-red-400";
      message.hidden = false;
      return;
    }

    message.hidden = true;
  }

  function paintMood(moodKey: MoodStatus | null) {
    activeMoodRef.current = moodKey;

    moodKeys.forEach((key) => {
      const button = buttonRefs.current[key];
      const label = labelRefs.current[key];
      const isSelected = key === moodKey;

      if (button) {
        button.className = getMoodButtonClass(isSelected);
        button.setAttribute("aria-pressed", String(isSelected));
      }

      if (label) {
        label.textContent = MOOD_STATUS[key].label;
      }
    });
  }

  function handleMoodClick(moodKey: MoodStatus) {
    const previousMood = activeMoodRef.current;

    paintMood(moodKey);
    setMessage("saving");

    const selectedLabel = labelRefs.current[moodKey];
    if (selectedLabel) {
      selectedLabel.textContent = "儲存中...";
    }

    if (pendingRef.current) {
      return;
    }

    pendingRef.current = true;

    window.setTimeout(() => {
      void saveMood(moodKey, previousMood);
    }, 0);
  }

  async function saveMood(moodKey: MoodStatus, previousMood: MoodStatus | null) {
    try {
      const formData = new FormData();
      formData.set("mood", moodKey);
      formData.set("category", selectedCategory);

      await setMoodCheckinAction(formData);

      const selectedLabel = labelRefs.current[moodKey];
      if (selectedLabel) {
        selectedLabel.textContent = MOOD_STATUS[moodKey].label;
      }

      setMessage("updated");
    } catch {
      paintMood(previousMood);
      setMessage("failed");
    } finally {
      pendingRef.current = false;
    }
  }

  const initialMessageType =
    result === "updated" || result === "failed" ? result : "idle";

  return (
    <section className="mt-5 border border-[var(--student-border)]">
      <div className="flex items-center justify-between border-b border-[var(--student-border)] px-3 py-2">
        <div>
          <h2 className="text-sm font-semibold">今日能量 Check-in</h2>
          <p className="mt-1 text-xs text-[var(--student-muted)]">
            每天第一次進入時，先選一個今天的狀態。
          </p>
        </div>

        <p
          ref={statusRef}
          className="kado-mono text-xs text-[var(--student-muted)]"
        >
          {currentMood ? "DONE" : "REQUIRED"}
        </p>
      </div>

      <div
        ref={messageRef}
        hidden={initialMessageType === "idle"}
        className={
          initialMessageType === "updated"
            ? "border-b border-[var(--student-border)] px-3 py-2 text-xs text-green-400"
            : initialMessageType === "failed"
              ? "border-b border-[var(--student-border)] px-3 py-2 text-xs text-red-400"
              : "border-b border-[var(--student-border)] px-3 py-2 text-xs text-[var(--student-muted)]"
        }
      >
        {initialMessageType === "updated"
          ? "今日心情氣象已更新。"
          : initialMessageType === "failed"
            ? "更新失敗，請稍後再試。"
            : ""}
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
        {moodKeys.map((moodKey) => {
          const mood = MOOD_STATUS[moodKey];
          const isSelected = currentMood === moodKey;

          return (
            <button
              key={moodKey}
              ref={(element) => {
                buttonRefs.current[moodKey] = element;
              }}
              type="button"
              aria-pressed={isSelected}
              onPointerDown={() => handleMoodClick(moodKey)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  handleMoodClick(moodKey);
                }
              }}
              className={getMoodButtonClass(isSelected)}
            >
              <span className="block text-lg">{mood.icon}</span>
              <span
                ref={(element) => {
                  labelRefs.current[moodKey] = element;
                }}
                className="mt-2 block text-xs text-[var(--student-muted)]"
              >
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}