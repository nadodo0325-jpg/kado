"use client";

import { useEffect, useState } from "react";
import { MOOD_STATUS, STUDENT_STATUS } from "@/lib/constants/status";
import type { MoodStatus, StudentStatus } from "@/lib/constants/status";

const statusLabels: Record<StudentStatus, string> = {
  moving: "返家中",
  home: "到家了",
  flow: "開始唸書",
};

type StudentLiveSummaryProps = {
  initialMood: MoodStatus;
  initialStatus: StudentStatus | string | null | undefined;
};

function normalizeStatus(
  value: StudentStatus | string | null | undefined
): StudentStatus | null {
  if (value === "moving" || value === "home" || value === "flow") {
    return value;
  }

  return null;
}

export function StudentLiveSummary({
  initialMood,
  initialStatus,
}: StudentLiveSummaryProps) {
  const [moodKey, setMoodKey] = useState<MoodStatus>(initialMood);
  const [statusKey, setStatusKey] = useState<StudentStatus | null>(
    normalizeStatus(initialStatus)
  );

  useEffect(() => {
    function handleMoodChange(event: Event) {
      const customEvent = event as CustomEvent<{ mood: MoodStatus }>;

      if (customEvent.detail?.mood) {
        setMoodKey(customEvent.detail.mood);
      }
    }

    function handleStatusChange(event: Event) {
      const customEvent = event as CustomEvent<{ status: StudentStatus }>;

      if (customEvent.detail?.status) {
        setStatusKey(customEvent.detail.status);
      }
    }

    window.addEventListener("kado:mood-change", handleMoodChange);
    window.addEventListener("kado:student-status-change", handleStatusChange);

    return () => {
      window.removeEventListener("kado:mood-change", handleMoodChange);
      window.removeEventListener(
        "kado:student-status-change",
        handleStatusChange
      );
    };
  }, []);

  const mood = MOOD_STATUS[moodKey];
  const status = statusKey ? STUDENT_STATUS[statusKey] : null;

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="border border-[var(--student-border)] px-3 py-2 text-right">
        <p className="kado-mono text-xs text-[var(--student-muted)]">
          心情狀態
        </p>
        <p className="text-sm">
          {mood.icon} {mood.label}
        </p>
      </div>

      <div className="border border-[var(--student-border)] px-3 py-2 text-right">
        <p className="kado-mono text-xs text-[var(--student-muted)]">
          學生狀態
        </p>
        <p className="text-sm">
          {status ? `${status.icon} ${statusLabels[statusKey!]}` : "尚未選擇"}
        </p>
      </div>
    </div>
  );
}