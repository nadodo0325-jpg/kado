import { LogoutButton } from "@/components/auth/logout-button";
import { SectionCard } from "@/components/common/section-card";
import { StatusDot } from "@/components/common/status-dot";
import { PageHeader } from "@/components/layout/page-header";
import { TaipeiClock } from "@/components/common/taipei-clock";
import {
  confirmStudentTaskStatusAction,
  publishTeacherTaskAction,
} from "@/features/tasks/teacher-actions";
import {
  getTeacherDashboardData,
  type PublishedTaskSummary,
  type TeacherDashboardRow,
  type TeacherStudentSummary,
} from "@/features/tasks/teacher-queries";
import { TASK_CATEGORIES } from "@/lib/constants/categories";
import type { TaskStatus } from "@/lib/constants/status";
import { ContactBookParserPanel } from "@/components/teacher/contact-book-parser-panel";

const errorMessages: Record<string, string> = {
  invalid_category: "請選擇正確的任務分類。",
  invalid_item_kind: "請選擇正確的任務類型。",
  missing_title: "請輸入任務看板標題。",
  missing_items: "請至少輸入一個任務細項。",
  publish_failed: "發布失敗，請確認班級已建立且班上有學生。",
  confirm_failed: "確認完成失敗，請確認該項目是書費或回條。",
};

type TeacherPageProps = {
  searchParams?: Promise<{
    published?: string;
    confirmed?: string;
    error?: string;
    filter?: string;
    taskRange?: string;
  }>;
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
function getCategoryMeta(categoryKey: string) {
  return TASK_CATEGORIES.find((category) => category.key === categoryKey);
}

function getItemKindLabel(itemKind: PublishedTaskSummary["itemKind"]) {
  if (itemKind === "payment") {
    return "費用";
  }

  if (itemKind === "form") {
    return "回條";
  }

  return "一般";
}

function getTaipeiDateKey(dateString: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(dateString));

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function getTodayTaipeiDateKey() {
  return getTaipeiDateKey(new Date().toISOString());
}

function getTaipeiDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-");

  return `${year}/${month}/${day}`;
}

function getVisiblePublishedTasks(
  tasks: PublishedTaskSummary[],
  taskRange: "today" | "month"
) {
  if (taskRange === "month") {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    return tasks.filter(
      (task) => new Date(task.createdAt).getTime() >= thirtyDaysAgo
    );
  }

  const todayKey = getTodayTaipeiDateKey();

  return tasks.filter((task) => getTaipeiDateKey(task.createdAt) === todayKey);
}

function groupPublishedTasksByDate(tasks: PublishedTaskSummary[]) {
  const dateMap = new Map<string, PublishedTaskSummary[]>();

  tasks.forEach((task) => {
    const dateKey = getTaipeiDateKey(task.createdAt);
    const existing = dateMap.get(dateKey) ?? [];

    existing.push(task);
    dateMap.set(dateKey, existing);
  });

  return Array.from(dateMap.entries())
    .map(([dateKey, dateTasks]) => ({
      dateKey,
      dateLabel: getTaipeiDateLabel(dateKey),
      tasks: dateTasks,
    }))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

export default async function TeacherPage({ searchParams }: TeacherPageProps) {
  const params = await searchParams;
  const published = params?.published === "1";
  const confirmed = params?.confirmed === "1";
  const error = params?.error ? errorMessages[params.error] : null;
  const showIncomplete = params?.filter === "incomplete";
  const taskRange = params?.taskRange === "month" ? "month" : "today";

  const { profile, className, students, publishedTasks, rows } =
  await getTeacherDashboardData();

  const incompleteRows = rows.filter((row) => row.status !== "green");
  const visiblePublishedTasks = getVisiblePublishedTasks(
  publishedTasks,
  taskRange
);

const publishedTaskDateGroups = groupPublishedTasksByDate(visiblePublishedTasks);

  return (
    <main className="teacher-shell">
      <section className="mx-auto min-h-screen w-full max-w-6xl px-4 py-5">
        <PageHeader
          eyebrow="TEACHER"
          title={`${profile.display_name} 的教師發布中心`}
          right={
            <div className="flex items-center gap-2">
              <TaipeiClock />
              
              <a
               href="/teacher/ai-settings"
               className="kado-transition border border-[var(--kado-border)] px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
              >
               AI 設定
              </a>

              <a
               href="#publish-task"
               className="kado-transition bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
              新增任務
              </a>

              <LogoutButton />
            </div>
          }        
        />
        {confirmed ? (
         <div className="mt-4 border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700">
           已確認完成，該項目已轉為綠燈。
         </div>
        ) : null}

        <section className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <SectionCard>
            <div className="border-b border-[var(--kado-border)] px-4 py-3">
              <p className="text-sm font-semibold">快速發布</p>
              <p className="mt-1 text-xs text-[var(--kado-muted)]">
                每一行會變成一個任務細項，發布後全班學生預設紅燈。
              </p>
            </div>

            <form id="publish-task" action={publishTeacherTaskAction}>
              <div className="border-b border-[var(--kado-border)] p-4">
                <label className="text-sm font-medium" htmlFor="task-category">
                  任務分類
                </label>

                <select
                  id="task-category"
                  name="category"
                  defaultValue="homework"
                  className="mt-2 w-full border border-[var(--kado-border)] bg-white px-3 py-3 text-sm outline-none focus:border-zinc-500"
                >
                 {TASK_CATEGORIES.map((category) => (
                   <option key={category.key} value={category.key}>
                     {category.icon} {category.label}
                   </option>
                 ))}
               </select>

               <label className="mt-4 block text-sm font-medium" htmlFor="item-kind">
                  任務類型
               </label>

               <select
                 id="item-kind"
                 name="itemKind"
                 defaultValue="normal"
                 className="mt-2 w-full border border-[var(--kado-border)] bg-white px-3 py-3 text-sm outline-none focus:border-zinc-500"
               >
                <option value="normal">一般任務｜學生自主完成</option>
                <option value="payment">費用｜家長收到了解後轉黃燈</option>
                <option value="form">回條｜教師確認後轉綠燈</option>
              </select>
            </div>

              <div className="p-4">
                {published ? (
                  <div className="mb-4 border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700">
                    任務已發布到班級。
                  </div>
                ) : null}

                {error ? (
                  <div className="mb-4 border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
                    {error}
                  </div>
                ) : null}

                <label className="text-sm font-medium" htmlFor="task-title">
                  任務看板標題
                </label>
                <input
                  id="task-title"
                  name="title"
                  className="mt-2 w-full border border-[var(--kado-border)] px-3 py-3 text-sm outline-none focus:border-zinc-500"
                  placeholder="例如：5/20 作業看板"
                />

                <label
                  className="mt-4 block text-sm font-medium"
                  htmlFor="task-content"
                >
                  任務細項
                </label>
                <textarea
                  id="task-content"
                  name="itemsText"
                  className="mt-2 min-h-32 w-full resize-none border border-[var(--kado-border)] p-3 text-sm outline-none focus:border-zinc-500"
                  placeholder={"數學講義 P.45\n英文雜誌 L3 句子仿寫"}
                />

                <button
                  type="submit"
                  className="kado-transition mt-3 w-full bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  發布到全班
                </button>
              </div>
            </form>
          </SectionCard>

          <ContactBookParserPanel />

          <SectionCard>
            <div className="flex items-center justify-between border-b border-[var(--kado-border)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold">班級狀態</p>
                <p className="mt-1 text-xs text-[var(--kado-muted)]">
                  {className
                    ? "即時統計學生紅綠燈狀態。"
                    : "目前尚未建立班級或任務資料。"}
                </p>
              </div>

              <p className="kado-mono text-xs text-[var(--kado-muted)]">
                {className ?? "NO CLASS"}
              </p>
            </div>

            {students.length > 0 ? (
              <div className="divide-y divide-[var(--kado-border)]">
                {students.map((student) => (
                  <StudentStatusRow key={student.studentId} student={student} />
                ))}
              </div>
            ) : (
              <div className="px-4 py-8">
                <p className="text-sm text-[var(--kado-muted)]">
                  目前沒有學生任務資料。建立班級、加入學生並發布任務後，這裡會顯示統計。
                </p>
              </div>
            )}

            <div className="border-t border-[var(--kado-border)] p-4">
              {showIncomplete ? (
                <a
                  href="/teacher"
                  className="kado-transition block w-full border border-[var(--kado-border)] px-4 py-3 text-center text-sm font-semibold hover:bg-zinc-50"
                >
                  回到全部狀態
                </a>
              ) : (
                <a
                  href="/teacher?filter=incomplete"
                  className="kado-transition block w-full border border-[var(--kado-border)] px-4 py-3 text-center text-sm font-semibold hover:bg-zinc-50"
                >
                  篩選未完成名單
                </a>
              )}
            </div>
          </SectionCard>
        </section>
        <PublishedTaskList 
          dateGroups={publishedTaskDateGroups}
          taskRange={taskRange}
        />

        {showIncomplete ? (
          <IncompleteList rows={incompleteRows} />
        ) : null}
      </section>
    </main>
  );
}
function PublishedTaskList({
  dateGroups,
  taskRange,
}: {
  dateGroups: {
    dateKey: string;
    dateLabel: string;
    tasks: PublishedTaskSummary[];
  }[];
  taskRange: "today" | "month";
}) {
  const totalCount = dateGroups.reduce(
    (count, group) => count + group.tasks.length,
    0
  );

  return (
    <section className="mt-5 border border-[var(--kado-border)] bg-white">
      <div className="flex flex-col gap-3 border-b border-[var(--kado-border)] px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold">已發布任務</p>
          <p className="mt-1 text-xs text-[var(--kado-muted)]">
            預設只顯示今日任務，歷史紀錄保留近 30 天方便月考前回看。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/teacher"
            className={
              taskRange === "today"
                ? "kado-transition border border-zinc-950 bg-zinc-950 px-3 py-2 text-xs font-semibold text-white"
                : "kado-transition border border-[var(--kado-border)] px-3 py-2 text-xs font-semibold hover:bg-zinc-50"
            }
          >
            今日
          </a>

          <a
            href="/teacher?taskRange=month"
            className={
              taskRange === "month"
                ? "kado-transition border border-zinc-950 bg-zinc-950 px-3 py-2 text-xs font-semibold text-white"
                : "kado-transition border border-[var(--kado-border)] px-3 py-2 text-xs font-semibold hover:bg-zinc-50"
            }
          >
            近 30 天
          </a>

          <p className="kado-mono text-xs text-[var(--kado-muted)]">
            COUNT {totalCount}
          </p>
        </div>
      </div>

      {dateGroups.length > 0 ? (
        <div className="divide-y divide-[var(--kado-border)]">
          {dateGroups.map((group) => (
            <div key={group.dateKey}>
              <div className="border-b border-[var(--kado-border)] bg-zinc-50 px-4 py-2">
                <p className="kado-mono text-xs font-semibold text-[var(--kado-muted)]">
                  {group.dateLabel}
                </p>
              </div>

              <div className="divide-y divide-[var(--kado-border)]">
                {group.tasks.map((task) => {
                  const categoryMeta = getCategoryMeta(task.category);

                  return (
                    <div
                      key={task.taskId}
                      className="grid gap-3 px-4 py-3 lg:grid-cols-[1.2fr_0.8fr_auto]"
                    >
                      <div>
                        <p className="text-sm font-medium">{task.taskTitle}</p>
                        <p className="kado-mono mt-1 text-xs text-[var(--kado-muted)]">
                          {new Date(task.createdAt).toLocaleTimeString("zh-TW", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Taipei",
                          })}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="border border-[var(--kado-border)] px-2 py-1 text-xs">
                          {categoryMeta?.icon}{" "}
                          {categoryMeta?.label ?? task.category}
                        </span>

                        <span className="border border-[var(--kado-border)] px-2 py-1 text-xs">
                          {getItemKindLabel(task.itemKind)}
                        </span>

                        <span className="kado-mono border border-[var(--kado-border)] px-2 py-1 text-xs text-[var(--kado-muted)]">
                          ITEMS {task.itemCount}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-right">
                        <p className="kado-mono text-xs text-red-500">
                          RED {task.red}
                        </p>
                        <p className="kado-mono text-xs text-yellow-600">
                          PENDING {task.processing}
                        </p>
                        <p className="kado-mono text-xs text-green-600">
                          GREEN {task.green}
                        </p>
                        <p className="kado-mono text-xs text-[var(--kado-muted)]">
                          TOTAL {task.total}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8">
          <p className="text-sm text-[var(--kado-muted)]">
            {taskRange === "today"
              ? "今日尚未發布任務。若要查看之前的任務，請切換到近 30 天。"
              : "近 30 天內沒有發布任務紀錄。"}
          </p>
        </div>
      )}
    </section>
  );
}

function StudentStatusRow({ student }: { student: TeacherStudentSummary }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3">
      <div>
        <p className="text-sm font-medium">{student.studentName}</p>
        <p className="kado-mono mt-1 text-xs text-[var(--kado-muted)]">
          TOTAL {student.total}
        </p>
      </div>

      <p className="kado-mono text-xs text-red-500">RED {student.red}</p>

      <p className="kado-mono text-xs text-green-600">
        GREEN {student.green}
      </p>

      <p className="kado-mono text-xs text-yellow-600">
        PENDING {student.processing}
      </p>
    </div>
  );
}

function IncompleteList({ rows }: { rows: TeacherDashboardRow[] }) {
  return (
    <section className="mt-4 border border-[var(--kado-border)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--kado-border)] px-4 py-3">
        <div>
          <p className="text-sm font-semibold">未完成名單</p>
          <p className="mt-1 text-xs text-[var(--kado-muted)]">
            顯示目前仍是紅燈或黃燈的任務細項。
          </p>
        </div>

        <p className="kado-mono text-xs text-red-500">COUNT {rows.length}</p>
      </div>

      {rows.length > 0 ? (
        <div className="divide-y divide-[var(--kado-border)]">
          {rows.map((row) => (
            <div
              key={row.status_id}
              className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <p className="text-sm font-medium">{row.student_name}</p>
                <p className="kado-mono mt-1 text-xs text-[var(--kado-muted)]">
                  {row.category.toUpperCase()}
                </p>
              </div>

              <div>
                <p className="text-sm">{row.item_title}</p>
                <p className="mt-1 text-xs text-[var(--kado-muted)]">
                  {row.task_title}
                </p>
              </div>

              <div className="flex items-center gap-2 md:justify-end">
  <StatusDot status={toDotStatus(row.status)} />
  <span className="kado-mono text-xs text-[var(--kado-muted)]">
    {row.status.toUpperCase()}
  </span>

  {row.item_kind === "payment" || row.item_kind === "form" ? (
    <form action={confirmStudentTaskStatusAction}>
      <input type="hidden" name="statusId" value={row.status_id} />

      <button
        type="submit"
        className="kado-transition border border-[var(--kado-border)] px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50"
      >
        確認完成
      </button>
    </form>
  ) : (
    <span className="kado-mono text-xs text-[var(--kado-muted)]">
      WAIT
    </span>
  )}
</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8">
          <p className="text-sm text-[var(--kado-muted)]">
            目前沒有未完成項目，全班都是綠燈。
          </p>
        </div>
      )}
    </section>
  );
}