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
          {currentMood ? "DONE" : "REQUIRED"}
        </p>
      </div>

      {result === "updated" ? (
        <div className="border-b border-[var(--student-border)] px-3 py-2 text-xs text-green-400">
          今日心情氣象已更新。
        </div>
      ) : null}

      {result === "failed" ? (
        <div className="border-b border-[var(--student-border)] px-3 py-2 text-xs text-red-400">
          更新失敗，請稍後再試。
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
        {moodKeys.map((moodKey) => {
          const mood = MOOD_STATUS[moodKey];
          const isSelected = currentMood === moodKey;

          return (
            <form key={moodKey} action={setMoodCheckinAction}>
              <input type="hidden" name="mood" value={moodKey} />
              <input type="hidden" name="category" value={selectedCategory} />

              <button
                type="submit"
                className={
                  isSelected
                    ? "kado-transition w-full border border-green-500 bg-[var(--green-soft)] px-3 py-3 text-left"
                    : "kado-transition w-full border border-[var(--student-border)] px-3 py-3 text-left hover:bg-[var(--student-card)]"
                }
              >
                <span className="block text-lg">{mood.icon}</span>
                <span className="mt-2 block text-xs text-[var(--student-muted)]">
                  {mood.label}
                </span>
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}