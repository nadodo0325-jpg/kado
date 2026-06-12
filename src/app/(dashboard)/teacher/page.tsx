import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { SectionCard } from "@/components/common/section-card";
import { StatusDot } from "@/components/common/status-dot";
import { TaipeiClock } from "@/components/common/taipei-clock";
import { PageHeader } from "@/components/layout/page-header";
import { TeacherPublishModal } from "@/components/teacher/teacher-publish-modal";
import {
  confirmStudentTaskStatusAction,
  deleteTeacherTaskItemAction,
} from "@/features/tasks/teacher-actions";
import {
  getTeacherDashboardData,
  type TeacherDashboardRow,
  type TeacherStudentSummary,
} from "@/features/tasks/teacher-queries";
import {
  TASK_CATEGORIES,
  type TaskCategory,
} from "@/lib/constants/categories";
import type { TaskStatus } from "@/lib/constants/status";

const errorMessages: Record<string, string> = {
  invalid_category: "請選擇正確的任務分類。",
  invalid_item_kind: "請選擇正確的任務類型。",
  missing_title: "系統產生任務標題失敗，請重新整理後再試。",
  missing_items: "請至少輸入一個任務細項。",
  missing_students: "請至少選擇一位學生，或改為發送給全班。",
  publish_failed: "發布失敗，請確認班級已建立且班上有學生。",
  confirm_failed: "確認完成失敗，請確認該項目是書費或回條。",
  delete_failed: "刪除任務失敗，請確認該任務仍存在且屬於你的班級。",
};

type TeacherPageProps = {
  searchParams?: Promise<{
    published?: string;
    confirmed?: string;
    deleted?: string;
    error?: string;
    filter?: string;
    category?: string;
    date?: string;
  }>;
};

type StatusCount = {
  red: number;
  processing: number;
  green: number;
  total: number;
};

type TeacherCategorySummary = StatusCount & {
  category: TaskCategory;
  status: TaskStatus;
  taskCount: number;
  itemCount: number;
};

type TeacherTaskItemLine = StatusCount & {
  itemKey: string;
  taskItemId: string;
  title: string;
  status: TaskStatus;
};

type TeacherTaskCard = StatusCount & {
  taskKey: string;
  taskTitle: string;
  category: TaskCategory;
  itemKind: "normal" | "payment" | "form" | "mixed";
  itemLines: TeacherTaskItemLine[];
  itemCount: number;
  createdAt: string;
  status: TaskStatus;
};

type CalendarDay = {
  dateKey: string;
  label: string;
  taskCount: number;
  isSelected: boolean;
  isToday: boolean;
};

function toDotStatus(status: TaskStatus): "red" | "green" | "yellow" {
  if (status === "green") return "green";
  if (status === "processing") return "yellow";
  return "red";
}

function getCategoryMeta(categoryKey: string) {
  return TASK_CATEGORIES.find((category) => category.key === categoryKey);
}

function getDefaultCategory(): TaskCategory {
  return "homework";
}

function isTaskCategory(value: string | undefined): value is TaskCategory {
  return TASK_CATEGORIES.some((category) => category.key === value);
}

function isDateKey(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getItemKindLabel(
  itemKind: "normal" | "payment" | "form" | "mixed"
) {
  if (itemKind === "payment") return "費用";
  if (itemKind === "form") return "回條";
  if (itemKind === "mixed") return "混合";
  return "一般";
}

function getStatusRank(status: TaskStatus) {
  if (status === "red") return 3;
  if (status === "processing") return 2;
  return 1;
}

function mergeStatus(current: TaskStatus | undefined, next: TaskStatus) {
  if (!current) return next;
  return getStatusRank(next) > getStatusRank(current) ? next : current;
}

function getStatusFromCount(count: StatusCount): TaskStatus {
  if (count.red > 0) return "red";
  if (count.processing > 0) return "processing";
  return "green";
}

function getPeopleStatusCount(rows: TeacherDashboardRow[]): StatusCount {
  const studentStatusMap = new Map<string, TaskStatus>();

  rows.forEach((row) => {
    const currentStatus = studentStatusMap.get(row.student_id);
    studentStatusMap.set(
      row.student_id,
      mergeStatus(currentStatus, row.status)
    );
  });

  const count: StatusCount = {
    red: 0,
    processing: 0,
    green: 0,
    total: studentStatusMap.size,
  };

  studentStatusMap.forEach((status) => {
    if (status === "red") count.red += 1;
    if (status === "processing") count.processing += 1;
    if (status === "green") count.green += 1;
  });

  return count;
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
  const [year = "", month = "", day = ""] = dateKey.split("-");
  return `${year}/${month}/${day}`;
}

function getTaipeiShortDateLabel(dateKey: string) {
  const [, month = "", day = ""] = dateKey.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function getBoardCategoryTitle(categoryKey: TaskCategory) {
  if (categoryKey === "quiz") return "小考提醒";
  if (categoryKey === "todo") return "待辦事項";
  if (categoryKey === "others") return "其他提醒";

  const categoryMeta = getCategoryMeta(categoryKey);
  return categoryMeta?.label ?? "任務";
}

function getMergedBoardTitle(dateKey: string, category: TaskCategory) {
  return `${getTaipeiShortDateLabel(dateKey)} ${getBoardCategoryTitle(
    category
  )}`;
}

function getMergedItemKind(
  rows: TeacherDashboardRow[]
): "normal" | "payment" | "form" | "mixed" {
  const itemKinds = new Set(rows.map((row) => row.item_kind));

  if (itemKinds.size > 1) {
    return "mixed";
  }

  return rows[0]?.item_kind ?? "normal";
}

function filterRowsByDate(rows: TeacherDashboardRow[], dateKey: string) {
  return rows.filter((row) => getTaipeiDateKey(row.item_created_at) === dateKey);
}

function buildStudentSummaries(
  rows: TeacherDashboardRow[]
): TeacherStudentSummary[] {
  const studentMap = new Map<string, TeacherStudentSummary>();

  rows.forEach((row) => {
    const existing = studentMap.get(row.student_id);

    if (!existing) {
      studentMap.set(row.student_id, {
        studentId: row.student_id,
        studentName: row.student_name,
        red: row.status === "red" ? 1 : 0,
        green: row.status === "green" ? 1 : 0,
        processing: row.status === "processing" ? 1 : 0,
        total: 1,
      });

      return;
    }

    if (row.status === "red") existing.red += 1;
    if (row.status === "green") existing.green += 1;
    if (row.status === "processing") existing.processing += 1;

    existing.total += 1;
  });

  return Array.from(studentMap.values());
}

function buildCategorySummaries(
  rows: TeacherDashboardRow[]
): TeacherCategorySummary[] {
  return TASK_CATEGORIES.map((category) => {
    const categoryRows = rows.filter((row) => row.category === category.key);
    const count = getPeopleStatusCount(categoryRows);

    return {
      category: category.key,
      red: count.red,
      processing: count.processing,
      green: count.green,
      total: count.total,
      status: getStatusFromCount(count),
      taskCount: new Set(categoryRows.map((row) => row.task_id)).size,
      itemCount: new Set(categoryRows.map((row) => row.task_item_id)).size,
    };
  });
}

function buildTaskItemLines(rows: TeacherDashboardRow[]): TeacherTaskItemLine[] {
  const itemMap = new Map<
    string,
    {
      itemKey: string;
      taskItemId: string;
      title: string;
      rows: TeacherDashboardRow[];
      createdAt: string;
    }
  >();

  rows.forEach((row) => {
    const itemKey = row.task_item_id;
    const existing = itemMap.get(itemKey);

    if (!existing) {
      itemMap.set(itemKey, {
        itemKey,
        taskItemId: row.task_item_id,
        title: row.item_title,
        rows: [row],
        createdAt: row.item_created_at,
      });

      return;
    }

    existing.rows.push(row);

    if (row.item_created_at > existing.createdAt) {
      existing.createdAt = row.item_created_at;
    }
  });

  return Array.from(itemMap.values())
    .map((item) => {
      const count = getPeopleStatusCount(item.rows);

      return {
        itemKey: item.itemKey,
        taskItemId: item.taskItemId,
        title: item.title,
        red: count.red,
        processing: count.processing,
        green: count.green,
        total: count.total,
        status: getStatusFromCount(count),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, "zh-TW"));
}

function buildTaskCards(
  rows: TeacherDashboardRow[],
  selectedCategory: TaskCategory
): TeacherTaskCard[] {
  const taskMap = new Map<
    string,
    {
      taskKey: string;
      dateKey: string;
      category: TaskCategory;
      rows: TeacherDashboardRow[];
      createdAt: string;
    }
  >();

  rows
    .filter((row) => row.category === selectedCategory)
    .forEach((row) => {
      const dateKey = getTaipeiDateKey(row.item_created_at);
      const taskKey = `${dateKey}::${row.category}`;
      const existing = taskMap.get(taskKey);

      if (!existing) {
        taskMap.set(taskKey, {
          taskKey,
          dateKey,
          category: row.category,
          rows: [row],
          createdAt: row.item_created_at,
        });

        return;
      }

      existing.rows.push(row);

      if (row.item_created_at > existing.createdAt) {
        existing.createdAt = row.item_created_at;
      }
    });

  return Array.from(taskMap.values())
    .map((task) => {
      const count = getPeopleStatusCount(task.rows);
      const itemLines = buildTaskItemLines(task.rows);

      return {
        taskKey: task.taskKey,
        taskTitle: getMergedBoardTitle(task.dateKey, task.category),
        category: task.category,
        itemKind: getMergedItemKind(task.rows),
        itemLines,
        itemCount: itemLines.length,
        createdAt: task.createdAt,
        red: count.red,
        processing: count.processing,
        green: count.green,
        total: count.total,
        status: getStatusFromCount(count),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function buildCalendarDays(
  allRows: TeacherDashboardRow[],
  selectedDateKey: string
): CalendarDay[] {
  const todayKey = getTodayTaipeiDateKey();
  const dateTaskMap = new Map<string, Set<string>>();

  allRows.forEach((row) => {
    const dateKey = getTaipeiDateKey(row.item_created_at);
    const existing = dateTaskMap.get(dateKey) ?? new Set<string>();

    existing.add(row.task_id);
    dateTaskMap.set(dateKey, existing);
  });

  const days: CalendarDay[] = [];
  const now = new Date();

  for (let index = 0; index < 10; index += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);

    const dateKey = getTaipeiDateKey(date.toISOString());

    if (days.some((day) => day.dateKey === dateKey)) {
      continue;
    }

    days.push({
      dateKey,
      label: getTaipeiShortDateLabel(dateKey),
      taskCount: dateTaskMap.get(dateKey)?.size ?? 0,
      isSelected: selectedDateKey === dateKey,
      isToday: todayKey === dateKey,
    });
  }

  return days;
}

function buildTeacherHref({
  dateKey,
  category,
  filter,
}: {
  dateKey: string;
  category: TaskCategory;
  filter?: string;
}) {
  const params = new URLSearchParams();

  params.set("date", dateKey);
  params.set("category", category);

  if (filter) {
    params.set("filter", filter);
  }

  return `/teacher?${params.toString()}`;
}

export default async function TeacherPage({ searchParams }: TeacherPageProps) {
  const params = (await searchParams) ?? {};
  const published = params.published === "1";
  const confirmed = params.confirmed === "1";
  const deleted = params.deleted === "1";
  const error = params.error ? errorMessages[params.error] : null;

  const selectedCategory: TaskCategory = isTaskCategory(params.category)
    ? params.category
    : getDefaultCategory();

  const todayKey: string = getTodayTaipeiDateKey();

  const selectedDateKey: string = isDateKey(params.date)
    ? params.date
    : todayKey;

  const showIncomplete = params.filter === "incomplete";

  const dashboardData = await getTeacherDashboardData();
  const { profile, className, allRows } = dashboardData;

  const selectedDateRows = filterRowsByDate(allRows, selectedDateKey);
  const selectedDateStudents = buildStudentSummaries(selectedDateRows);
  const incompleteRows = selectedDateRows.filter(
    (row) => row.status !== "green"
  );

  return (
    <main className="teacher-shell text-[17px]">
      <section className="mx-auto min-h-screen w-full max-w-6xl px-4 py-5">
        <PageHeader
          eyebrow="TEACHER"
          title={`${profile.display_name} 的教師工作台`}
          right={
            <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
              <TaipeiClock />

              <TeacherPublishModal
                published={published}
                error={error}
                classStudents={dashboardData.classStudents}
              />

              <Link
                href="/teacher/ai-settings"
                className="kado-transition shrink-0 border border-[var(--kado-border)] px-4 py-2 text-base font-semibold hover:bg-zinc-50"
              >
                AI 設定
              </Link>

              <div className="shrink-0">
                <LogoutButton />
              </div>
            </div>
          }
        />

        {confirmed ? (
          <div className="mt-4 border border-green-200 bg-green-50 px-3 py-3 text-base text-green-700">
            已確認完成，該項目已轉為綠燈。
          </div>
        ) : null}

        {deleted ? (
          <div className="mt-4 border border-green-200 bg-green-50 px-3 py-3 text-base text-green-700">
            任務已刪除。
          </div>
        ) : null}

        {published ? (
          <div className="mt-4 border border-green-200 bg-green-50 px-3 py-3 text-base text-green-700">
            任務已發布到班級。
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 border border-red-200 bg-red-50 px-3 py-3 text-base text-red-600">
            {error}
          </div>
        ) : null}

        <section className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <TeacherTaskBoard
            rows={selectedDateRows}
            allRows={allRows}
            selectedCategory={selectedCategory}
            selectedDateKey={selectedDateKey}
          />

          <ClassStatusPanel
            classNameValue={className}
            students={selectedDateStudents}
            showIncomplete={showIncomplete}
            selectedDateKey={selectedDateKey}
            selectedCategory={selectedCategory}
          />
        </section>

        {showIncomplete ? <IncompleteList rows={incompleteRows} /> : null}
      </section>
    </main>
  );
}

function TeacherTaskBoard({
  rows,
  allRows,
  selectedCategory,
  selectedDateKey,
}: {
  rows: TeacherDashboardRow[];
  allRows: TeacherDashboardRow[];
  selectedCategory: TaskCategory;
  selectedDateKey: string;
}) {
  const todayKey = getTodayTaipeiDateKey();
  const categorySummaries = buildCategorySummaries(rows);
  const selectedCategoryMeta = getCategoryMeta(selectedCategory);
  const selectedSummary =
    categorySummaries.find((summary) => summary.category === selectedCategory) ??
    {
      category: selectedCategory,
      red: 0,
      processing: 0,
      green: 0,
      total: 0,
      status: "green" as TaskStatus,
      taskCount: 0,
      itemCount: 0,
    };

  const taskCards = buildTaskCards(rows, selectedCategory);
  const calendarDays = buildCalendarDays(allRows, selectedDateKey);
  const isToday = selectedDateKey === todayKey;

  return (
    <section className="border border-[var(--kado-border)] bg-white">
      <div className="border-b border-[var(--kado-border)] px-4 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-semibold">
              {isToday ? "今日四大類任務看板" : "任務日曆誌"}
            </p>
            <p className="mt-1 text-base leading-7 text-[var(--kado-muted)]">
              {getTaipeiDateLabel(selectedDateKey)}
              ｜點分類查看任務細項與紅綠燈人數。
            </p>
          </div>

          {!isToday ? (
            <Link
              href={buildTeacherHref({
                dateKey: todayKey,
                category: selectedCategory,
              })}
              scroll={false}
              className="kado-transition border border-[var(--kado-border)] px-3 py-2 text-center text-base font-semibold hover:bg-zinc-50"
            >
              回到今日
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-[var(--kado-border)] sm:grid-cols-4">
        {categorySummaries.map((summary) => {
          const categoryMeta = getCategoryMeta(summary.category);
          const isSelected = selectedCategory === summary.category;

          return (
            <Link
              key={summary.category}
              href={buildTeacherHref({
                dateKey: selectedDateKey,
                category: summary.category,
              })}
              scroll={false}
              className={
                isSelected
                  ? "border-r border-t border-[var(--kado-border)] bg-zinc-950 px-2 py-4 text-center text-white first:border-t-0 sm:border-t-0"
                  : "border-r border-t border-[var(--kado-border)] px-2 py-4 text-center hover:bg-zinc-50 first:border-t-0 sm:border-t-0"
              }
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{categoryMeta?.icon}</span>
                <StatusDot status={toDotStatus(summary.status)} />
              </div>

              <p className="mt-2 text-lg font-semibold leading-tight">
                {categoryMeta?.label ?? summary.category}
              </p>

              <div
                className={
                  isSelected
                    ? "kado-mono mt-2 space-y-1 text-sm text-white/75"
                    : "kado-mono mt-2 space-y-1 text-sm text-[var(--kado-muted)]"
                }
              >
                <p>RED {summary.red} 人</p>
                <p>GREEN {summary.green} 人</p>
                <p>TASK {summary.taskCount}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="border-b border-[var(--kado-border)] px-4 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xl font-semibold">
              {selectedCategoryMeta?.icon}{" "}
              {selectedCategoryMeta?.label ?? selectedCategory}
            </p>
            <p className="mt-1 text-base leading-7 text-[var(--kado-muted)]">
              {selectedSummary.total === 0
                ? "這一天此分類沒有任務。"
                : `共 ${selectedSummary.total} 位學生有此分類任務。`}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 text-right">
            <p className="kado-mono text-sm text-red-500">
              RED {selectedSummary.red}
            </p>
            <p className="kado-mono text-sm text-yellow-600">
              PENDING {selectedSummary.processing}
            </p>
            <p className="kado-mono text-sm text-green-600">
              GREEN {selectedSummary.green}
            </p>
            <p className="kado-mono text-sm text-[var(--kado-muted)]">
              TOTAL {selectedSummary.total}
            </p>
          </div>
        </div>

        {taskCards.length > 0 ? (
          <div className="mt-4 space-y-3">
            {taskCards.map((task) => (
              <TeacherTaskCardView
                key={task.taskKey}
                task={task}
                selectedDateKey={selectedDateKey}
                selectedCategory={selectedCategory}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 border border-[var(--kado-border)] px-3 py-6">
            <p className="text-base text-[var(--kado-muted)]">
              這個日期的「{selectedCategoryMeta?.label}」沒有任務。
            </p>
          </div>
        )}
      </div>

      <TaskCalendarLog
        calendarDays={calendarDays}
        selectedCategory={selectedCategory}
      />
    </section>
  );
}

function TeacherTaskCardView({
  task,
  selectedDateKey,
  selectedCategory,
}: {
  task: TeacherTaskCard;
  selectedDateKey: string;
  selectedCategory: TaskCategory;
}) {
  return (
    <article className="border border-[var(--kado-border)]">
      <div className="flex flex-col gap-3 border-b border-[var(--kado-border)] px-3 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <StatusDot status={toDotStatus(task.status)} />
            <p className="text-lg font-semibold">{task.taskTitle}</p>
          </div>

          <p className="kado-mono mt-1 text-sm text-[var(--kado-muted)]">
            {new Date(task.createdAt).toLocaleTimeString("zh-TW", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Taipei",
            })}{" "}
            / {getItemKindLabel(task.itemKind)} / ITEMS {task.itemCount}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 text-right">
          <p className="kado-mono text-sm text-red-500">RED {task.red}</p>
          <p className="kado-mono text-sm text-yellow-600">
            PENDING {task.processing}
          </p>
          <p className="kado-mono text-sm text-green-600">
            GREEN {task.green}
          </p>
          <p className="kado-mono text-sm text-[var(--kado-muted)]">
            TOTAL {task.total}
          </p>
        </div>
      </div>

      <div className="divide-y divide-[var(--kado-border)]">
        {task.itemLines.map((item) => (
          <div
            key={item.itemKey}
            className="grid gap-3 px-3 py-3 md:grid-cols-[1fr_auto_auto]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <StatusDot status={toDotStatus(item.status)} />
              <p className="min-w-0 truncate text-base">{item.title}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 text-right">
              <p className="kado-mono text-sm text-red-500">RED {item.red}</p>
              <p className="kado-mono text-sm text-yellow-600">
                PENDING {item.processing}
              </p>
              <p className="kado-mono text-sm text-green-600">
                GREEN {item.green}
              </p>
              <p className="kado-mono text-sm text-[var(--kado-muted)]">
                TOTAL {item.total}
              </p>
            </div>

            <form
              action={deleteTeacherTaskItemAction}
              className="md:justify-self-end"
            >
              <input type="hidden" name="taskItemId" value={item.taskItemId} />
              <input type="hidden" name="dateKey" value={selectedDateKey} />
              <input type="hidden" name="category" value={selectedCategory} />

              <button
                type="submit"
                className="kado-transition border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                刪除
              </button>
            </form>
          </div>
        ))}
      </div>
    </article>
  );
}

function TaskCalendarLog({
  calendarDays,
  selectedCategory,
}: {
  calendarDays: CalendarDay[];
  selectedCategory: TaskCategory;
}) {
  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xl font-semibold">任務日曆誌</p>
          <p className="mt-1 text-base leading-7 text-[var(--kado-muted)]">
            保留近 10 天任務紀錄，點日期查看當天四大類任務。
          </p>
        </div>

        <p className="kado-mono text-sm text-[var(--kado-muted)]">10 DAYS</p>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {calendarDays.map((day) => (
          <Link
            key={day.dateKey}
            href={buildTeacherHref({
              dateKey: day.dateKey,
              category: selectedCategory,
            })}
            scroll={false}
            className={
              day.isSelected
                ? "border border-zinc-950 bg-zinc-950 px-2 py-3 text-center text-white"
                : "border border-[var(--kado-border)] px-2 py-3 text-center hover:bg-zinc-50"
            }
          >
            <p className="text-base font-semibold">{day.label}</p>
            <p
              className={
                day.isSelected
                  ? "kado-mono mt-1 text-xs text-white/75"
                  : "kado-mono mt-1 text-xs text-[var(--kado-muted)]"
              }
            >
              {day.taskCount > 0 ? `${day.taskCount} 任務` : "無任務"}
            </p>
            {day.isToday ? (
              <p
                className={
                  day.isSelected
                    ? "kado-mono mt-1 text-xs text-white/60"
                    : "kado-mono mt-1 text-xs text-[var(--kado-muted)]"
                }
              >
                TODAY
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

function ClassStatusPanel({
  classNameValue,
  students,
  showIncomplete,
  selectedDateKey,
  selectedCategory,
}: {
  classNameValue: string | null;
  students: TeacherStudentSummary[];
  showIncomplete: boolean;
  selectedDateKey: string;
  selectedCategory: TaskCategory;
}) {
  return (
    <SectionCard>
      <div className="flex items-center justify-between border-b border-[var(--kado-border)] px-4 py-4">
        <div>
          <p className="text-xl font-semibold">班級狀態與學生名單</p>
          <p className="mt-1 text-base leading-7 text-[var(--kado-muted)]">
            {classNameValue
              ? "即時統計學生紅綠燈狀態。"
              : "目前尚未建立班級或任務資料。"}
          </p>
        </div>

        <p className="kado-mono text-sm text-[var(--kado-muted)]">
          {classNameValue ?? "NO CLASS"}
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
          <p className="text-base text-[var(--kado-muted)]">
            目前沒有學生任務資料。建立班級、加入學生並發布任務後，這裡會顯示統計。
          </p>
        </div>
      )}

      <div className="border-t border-[var(--kado-border)] p-4">
        {showIncomplete ? (
          <Link
            href={buildTeacherHref({
              dateKey: selectedDateKey,
              category: selectedCategory,
            })}
            scroll={false}
            className="kado-transition block w-full border border-[var(--kado-border)] px-4 py-3 text-center text-base font-semibold hover:bg-zinc-50"
          >
            回到全部狀態
          </Link>
        ) : (
          <Link
            href={buildTeacherHref({
              dateKey: selectedDateKey,
              category: selectedCategory,
              filter: "incomplete",
            })}
            scroll={false}
            className="kado-transition block w-full border border-[var(--kado-border)] px-4 py-3 text-center text-base font-semibold hover:bg-zinc-50"
          >
            篩選未完成名單
          </Link>
        )}
      </div>
    </SectionCard>
  );
}

function StudentStatusRow({ student }: { student: TeacherStudentSummary }) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3">
      <div>
        <p className="text-base font-medium">{student.studentName}</p>
        <p className="kado-mono mt-1 text-sm text-[var(--kado-muted)]">
          TOTAL {student.total}
        </p>
      </div>

      <p className="kado-mono text-sm text-red-500">RED {student.red}</p>

      <p className="kado-mono text-sm text-green-600">
        GREEN {student.green}
      </p>

      <p className="kado-mono text-sm text-yellow-600">
        PENDING {student.processing}
      </p>
    </div>
  );
}

function IncompleteList({ rows }: { rows: TeacherDashboardRow[] }) {
  return (
    <section className="mt-5 border border-[var(--kado-border)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--kado-border)] px-4 py-4">
        <div>
          <p className="text-xl font-semibold">未完成名單</p>
          <p className="mt-1 text-base leading-7 text-[var(--kado-muted)]">
            顯示目前仍是紅燈或黃燈的任務細項。
          </p>
        </div>

        <p className="kado-mono text-sm text-red-500">COUNT {rows.length}</p>
      </div>

      {rows.length > 0 ? (
        <div className="divide-y divide-[var(--kado-border)]">
          {rows.map((row) => (
            <div
              key={row.status_id}
              className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <p className="text-base font-medium">{row.student_name}</p>
                <p className="kado-mono mt-1 text-sm text-[var(--kado-muted)]">
                  {row.category.toUpperCase()}
                </p>
              </div>

              <div>
                <p className="text-base">{row.item_title}</p>
                <p className="mt-1 text-sm text-[var(--kado-muted)]">
                  {row.task_title}
                </p>
              </div>

              <div className="flex items-center gap-2 md:justify-end">
                <StatusDot status={toDotStatus(row.status)} />

                <span className="kado-mono text-sm text-[var(--kado-muted)]">
                  {row.status.toUpperCase()}
                </span>

                {row.item_kind === "payment" || row.item_kind === "form" ? (
                  <form action={confirmStudentTaskStatusAction}>
                    <input type="hidden" name="statusId" value={row.status_id} />

                    <button
                      type="submit"
                      className="kado-transition border border-[var(--kado-border)] px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                    >
                      確認完成
                    </button>
                  </form>
                ) : (
                  <span className="kado-mono text-sm text-[var(--kado-muted)]">
                    WAIT
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8">
          <p className="text-base text-[var(--kado-muted)]">
            目前沒有未完成項目，全班都是綠燈。
          </p>
        </div>
      )}
    </section>
  );
}