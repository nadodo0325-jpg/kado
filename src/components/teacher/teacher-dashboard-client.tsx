"use client";

import { useMemo, useState } from "react";
import { SectionCard } from "@/components/common/section-card";
import { StatusDot } from "@/components/common/status-dot";
import {
  confirmStudentTaskStatusAction,
  deleteTeacherTaskItemAction,
} from "@/features/tasks/teacher-actions";
import type {
  TeacherClassStudent,
  TeacherDashboardRow,
} from "@/features/tasks/teacher-queries";
import {
  TASK_CATEGORIES,
  type TaskCategory,
} from "@/lib/constants/categories";
import type { TaskStatus } from "@/lib/constants/status";

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

type StudentCategoryStatus = StatusCount & {
  studentId: string;
  studentName: string;
  email: string | null;
  status: TaskStatus | "none";
  incompleteCount: number;
};

type StudentIncompleteGroup = {
  studentId: string;
  studentName: string;
  rows: TeacherDashboardRow[];
  incompleteCount: number;
};

type TeacherDashboardClientProps = {
  classNameValue: string | null;
  classCode: string | null;
  allRows: TeacherDashboardRow[];
  classStudents: TeacherClassStudent[];
  initialCategory: TaskCategory;
  initialDateKey: string;
  initialShowIncomplete: boolean;
};

function toDotStatus(status: TaskStatus): "red" | "green" | "yellow" {
  if (status === "green") return "green";
  if (status === "processing") return "yellow";
  return "red";
}

function getStudentDisplayStatus(status: TaskStatus | "none") {
  if (status === "green") {
    return {
      label: "綠燈",
      className: "text-green-600",
    };
  }

  if (status === "processing") {
    return {
      label: "黃燈",
      className: "text-yellow-600",
    };
  }

  if (status === "red") {
    return {
      label: "紅燈",
      className: "text-red-500",
    };
  }

  return {
    label: "無任務",
    className: "text-[var(--kado-muted)]",
  };
}

function getCategoryMeta(categoryKey: string) {
  return TASK_CATEGORIES.find((category) => category.key === categoryKey);
}

function getItemKindLabel(
  itemKind: "normal" | "payment" | "form" | "mixed"
) {
  if (itemKind === "payment") return "費用";
  if (itemKind === "form") return "回條";
  if (itemKind === "mixed") return "混合";
  return "一般";
}

function getStatusRank(status: TaskStatus | "none") {
  if (status === "red") return 4;
  if (status === "processing") return 3;
  if (status === "green") return 2;
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

function getRowApplyStartDateKey(row: TeacherDashboardRow) {
  return row.apply_start_date ?? getTaipeiDateKey(row.item_created_at);
}

function getRowApplyEndDateKey(row: TeacherDashboardRow) {
  return row.apply_end_date ?? getRowApplyStartDateKey(row);
}

function isDateInRowApplyRange(row: TeacherDashboardRow, dateKey: string) {
  const startDateKey = getRowApplyStartDateKey(row);
  const endDateKey = getRowApplyEndDateKey(row);

  return dateKey >= startDateKey && dateKey <= endDateKey;
}

function filterRowsByDate(rows: TeacherDashboardRow[], dateKey: string) {
  return rows.filter((row) => isDateInRowApplyRange(row, dateKey));
}

function filterRowsByCategory(
  rows: TeacherDashboardRow[],
  category: TaskCategory
) {
  return rows.filter((row) => row.category === category);
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

function buildBaseStudents({
  classStudents,
  rows,
}: {
  classStudents: TeacherClassStudent[];
  rows: TeacherDashboardRow[];
}) {
  const studentMap = new Map<
    string,
    {
      studentId: string;
      studentName: string;
      email: string | null;
    }
  >();

  classStudents.forEach((student) => {
    studentMap.set(student.studentId, {
      studentId: student.studentId,
      studentName: student.studentName,
      email: student.email,
    });
  });

  rows.forEach((row) => {
    if (!studentMap.has(row.student_id)) {
      studentMap.set(row.student_id, {
        studentId: row.student_id,
        studentName: row.student_name,
        email: null,
      });
    }
  });

  return Array.from(studentMap.values()).sort((a, b) =>
    a.studentName.localeCompare(b.studentName, "zh-TW")
  );
}

function buildSelectedCategoryStudentStatuses({
  rows,
  classStudents,
  selectedCategory,
}: {
  rows: TeacherDashboardRow[];
  classStudents: TeacherClassStudent[];
  selectedCategory: TaskCategory;
}): StudentCategoryStatus[] {
  const baseStudents = buildBaseStudents({
    classStudents,
    rows,
  });

  const selectedCategoryRows = filterRowsByCategory(rows, selectedCategory);
  const studentMap = new Map<string, StudentCategoryStatus>();

  baseStudents.forEach((student) => {
    studentMap.set(student.studentId, {
      studentId: student.studentId,
      studentName: student.studentName,
      email: student.email,
      status: "none",
      red: 0,
      processing: 0,
      green: 0,
      total: 0,
      incompleteCount: 0,
    });
  });

  selectedCategoryRows.forEach((row) => {
    const existing = studentMap.get(row.student_id);

    if (!existing) {
      studentMap.set(row.student_id, {
        studentId: row.student_id,
        studentName: row.student_name,
        email: null,
        status: row.status,
        red: row.status === "red" ? 1 : 0,
        processing: row.status === "processing" ? 1 : 0,
        green: row.status === "green" ? 1 : 0,
        total: 1,
        incompleteCount: row.status === "green" ? 0 : 1,
      });

      return;
    }

    existing.status =
      existing.status === "none"
        ? row.status
        : mergeStatus(existing.status, row.status);

    if (row.status === "red") existing.red += 1;
    if (row.status === "processing") existing.processing += 1;
    if (row.status === "green") existing.green += 1;
    if (row.status !== "green") existing.incompleteCount += 1;

    existing.total += 1;
  });

  return Array.from(studentMap.values()).sort((a, b) => {
    if (b.incompleteCount !== a.incompleteCount) {
      return b.incompleteCount - a.incompleteCount;
    }

    if (getStatusRank(b.status) !== getStatusRank(a.status)) {
      return getStatusRank(b.status) - getStatusRank(a.status);
    }

    return a.studentName.localeCompare(b.studentName, "zh-TW");
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
  selectedCategory: TaskCategory,
  selectedDateKey: string
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
      const dateKey = selectedDateKey;
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
  const days: CalendarDay[] = [];
  const now = new Date();

  for (let index = 0; index < 10; index += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - index);

    const dateKey = getTaipeiDateKey(date.toISOString());

    if (days.some((day) => day.dateKey === dateKey)) {
      continue;
    }

    const taskIds = new Set(
      allRows
        .filter((row) => isDateInRowApplyRange(row, dateKey))
        .map((row) => row.task_id)
    );

    days.push({
      dateKey,
      label: getTaipeiShortDateLabel(dateKey),
      taskCount: taskIds.size,
      isSelected: selectedDateKey === dateKey,
      isToday: todayKey === dateKey,
    });
  }

  return days;
}

function buildIncompleteGroups(
  rows: TeacherDashboardRow[]
): StudentIncompleteGroup[] {
  const groupMap = new Map<string, StudentIncompleteGroup>();

  rows.forEach((row) => {
    const existing = groupMap.get(row.student_id);

    if (!existing) {
      groupMap.set(row.student_id, {
        studentId: row.student_id,
        studentName: row.student_name,
        rows: [row],
        incompleteCount: 1,
      });

      return;
    }

    existing.rows.push(row);
    existing.incompleteCount += 1;
  });

  return Array.from(groupMap.values()).sort((a, b) => {
    if (b.incompleteCount !== a.incompleteCount) {
      return b.incompleteCount - a.incompleteCount;
    }

    return a.studentName.localeCompare(b.studentName, "zh-TW");
  });
}

export function TeacherDashboardClient({
  classNameValue,
  classCode,
  allRows,
  classStudents,
  initialCategory,
  initialDateKey,
  initialShowIncomplete,
}: TeacherDashboardClientProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<TaskCategory>(initialCategory);
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);
  const [showIncomplete, setShowIncomplete] = useState(initialShowIncomplete);

  const selectedDateRows = useMemo(
    () => filterRowsByDate(allRows, selectedDateKey),
    [allRows, selectedDateKey]
  );

  const selectedCategoryRows = useMemo(
    () => filterRowsByCategory(selectedDateRows, selectedCategory),
    [selectedDateRows, selectedCategory]
  );

  const incompleteRows = useMemo(
    () => selectedCategoryRows.filter((row) => row.status !== "green"),
    [selectedCategoryRows]
  );

  return (
    <>
      <TeacherClassCodePanel
        classNameValue={classNameValue}
        classCode={classCode}
        classStudents={classStudents}
      />

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <TeacherTaskBoard
          rows={selectedDateRows}
          allRows={allRows}
          selectedCategory={selectedCategory}
          selectedDateKey={selectedDateKey}
          onSelectCategory={(category) => {
            setSelectedCategory(category);
            setShowIncomplete(false);
          }}
          onSelectDate={(dateKey) => {
            setSelectedDateKey(dateKey);
            setShowIncomplete(false);
          }}
        />

        <ClassStatusPanel
          classNameValue={classNameValue}
          rows={selectedDateRows}
          classStudents={classStudents}
          selectedCategory={selectedCategory}
          showIncomplete={showIncomplete}
          onToggleIncomplete={() => {
            setShowIncomplete((current) => !current);
          }}
        />
      </section>

      {showIncomplete ? (
        <IncompleteList
          rows={incompleteRows}
          selectedCategory={selectedCategory}
        />
      ) : null}
    </>
  );
}

function TeacherClassCodePanel({
  classNameValue,
  classCode,
  classStudents,
}: {
  classNameValue: string | null;
  classCode: string | null;
  classStudents: TeacherClassStudent[];
}) {
  return (
    <section className="mt-5 border border-[var(--kado-border)] bg-white">
      <div className="grid gap-4 p-4 xl:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-xl font-semibold">班級代碼</p>
          <p className="mt-1 text-base leading-7 text-[var(--kado-muted)]">
            請把這組代碼給學生。學生登入後輸入代碼，就會加入你的班級。
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="text-sm font-semibold text-[var(--kado-muted)]">
                {classNameValue ?? "我的班級"}
              </span>

              <input
                readOnly
                value={classCode ?? "尚未產生班級代碼"}
                className="mt-2 w-full border border-[var(--kado-border)] bg-zinc-50 px-4 py-3 text-xl font-semibold tracking-[0.18em] outline-none"
              />
            </label>

            <div className="border border-[var(--kado-border)] px-4 py-3 text-center">
              <p className="kado-mono text-xs text-[var(--kado-muted)]">
                STUDENTS
              </p>
              <p className="mt-1 text-xl font-semibold">
                {classStudents.length}
              </p>
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-[var(--kado-muted)]">
            目前先用手動選取複製。之後再補「一鍵複製」與「重新產生代碼」按鈕。
          </p>
        </div>

        <div className="border border-[var(--kado-border)]">
          <div className="flex items-center justify-between border-b border-[var(--kado-border)] px-3 py-3">
            <p className="text-base font-semibold">已加入學生</p>
            <p className="kado-mono text-xs text-[var(--kado-muted)]">
              COUNT {classStudents.length}
            </p>
          </div>

          {classStudents.length > 0 ? (
            <div className="max-h-[180px] divide-y divide-[var(--kado-border)] overflow-y-auto overscroll-contain">
              {classStudents.map((student) => (
                <div
                  key={student.studentId}
                  className="grid grid-cols-[1fr_auto] gap-3 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium">
                      {student.studentName}
                    </p>

                    {student.email ? (
                      <p className="mt-1 truncate text-xs text-[var(--kado-muted)]">
                        {student.email}
                      </p>
                    ) : null}
                  </div>

                  <p className="kado-mono text-xs text-[var(--kado-muted)]">
                    ACTIVE
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-6">
              <p className="text-base text-[var(--kado-muted)]">
                目前還沒有學生加入。請先讓測試學生輸入班級代碼。
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TeacherTaskBoard({
  rows,
  allRows,
  selectedCategory,
  selectedDateKey,
  onSelectCategory,
  onSelectDate,
}: {
  rows: TeacherDashboardRow[];
  allRows: TeacherDashboardRow[];
  selectedCategory: TaskCategory;
  selectedDateKey: string;
  onSelectCategory: (category: TaskCategory) => void;
  onSelectDate: (dateKey: string) => void;
}) {
  const todayKey = getTodayTaipeiDateKey();
  const categorySummaries = buildCategorySummaries(rows);
  const selectedCategoryMeta = getCategoryMeta(selectedCategory);
  const taskCards = buildTaskCards(rows, selectedCategory, selectedDateKey);
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
              ｜點分類查看已發布任務細項與該分類學生燈號。
            </p>
          </div>

          {!isToday ? (
            <button
              type="button"
              onClick={() => onSelectDate(todayKey)}
              className="kado-transition border border-[var(--kado-border)] px-3 py-2 text-center text-base font-semibold hover:bg-zinc-50"
            >
              回到今日
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-4 border-b border-[var(--kado-border)]">
        {categorySummaries.map((summary) => {
          const categoryMeta = getCategoryMeta(summary.category);
          const isSelected = selectedCategory === summary.category;

          return (
            <button
              key={summary.category}
              type="button"
              onClick={() => onSelectCategory(summary.category)}
              className={
                isSelected
                  ? "border-r border-[var(--kado-border)] bg-zinc-950 px-1 py-4 text-center text-white last:border-r-0 sm:px-2"
                  : "border-r border-[var(--kado-border)] px-1 py-4 text-center hover:bg-zinc-50 last:border-r-0 sm:px-2"
              }
            >
              <div className="flex items-center justify-center">
                <span className="text-2xl">{categoryMeta?.icon}</span>
              </div>

              <p className="mt-2 text-[13px] font-semibold leading-tight sm:text-lg">
                {categoryMeta?.label ?? summary.category}
              </p>
            </button>
          );
        })}
      </div>

      <div className="border-b border-[var(--kado-border)] px-4 py-4">
        <div>
          <p className="text-xl font-semibold">
            {selectedCategoryMeta?.icon}{" "}
            {selectedCategoryMeta?.label ?? selectedCategory}
          </p>
          <p className="mt-1 text-base leading-7 text-[var(--kado-muted)]">
            左側只顯示已發布任務與任務細項；右側顯示此分類的全班學生燈號。
          </p>
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
              這個日期的「{selectedCategoryMeta?.label}」沒有已發布任務。
            </p>
          </div>
        )}
      </div>

      <TaskCalendarLog
        calendarDays={calendarDays}
        onSelectDate={onSelectDate}
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
      <div className="border-b border-[var(--kado-border)] px-3 py-3">
        <p className="text-lg font-semibold">{task.taskTitle}</p>

        <p className="kado-mono mt-1 text-sm text-[var(--kado-muted)]">
          {new Date(task.createdAt).toLocaleTimeString("zh-TW", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Taipei",
          })}{" "}
          / {getItemKindLabel(task.itemKind)} / ITEMS {task.itemCount}
        </p>
      </div>

      <div className="divide-y divide-[var(--kado-border)]">
        {task.itemLines.map((item) => (
          <div
            key={item.itemKey}
            className="flex items-center justify-between gap-3 px-3 py-3"
          >
            <p className="min-w-0 flex-1 truncate text-base">{item.title}</p>

            <form action={deleteTeacherTaskItemAction} className="shrink-0">
              <input type="hidden" name="taskItemId" value={item.taskItemId} />
              <input type="hidden" name="dateKey" value={selectedDateKey} />
              <input type="hidden" name="category" value={selectedCategory} />

              <button
                type="submit"
                className="kado-transition border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
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
  onSelectDate,
}: {
  calendarDays: CalendarDay[];
  onSelectDate: (dateKey: string) => void;
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
          <button
            key={day.dateKey}
            type="button"
            onClick={() => onSelectDate(day.dateKey)}
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
          </button>
        ))}
      </div>
    </div>
  );
}

function ClassStatusPanel({
  classNameValue,
  rows,
  classStudents,
  selectedCategory,
  showIncomplete,
  onToggleIncomplete,
}: {
  classNameValue: string | null;
  rows: TeacherDashboardRow[];
  classStudents: TeacherClassStudent[];
  selectedCategory: TaskCategory;
  showIncomplete: boolean;
  onToggleIncomplete: () => void;
}) {
  const selectedCategoryMeta = getCategoryMeta(selectedCategory);
  const selectedCategoryRows = filterRowsByCategory(rows, selectedCategory);
  const students = buildSelectedCategoryStudentStatuses({
    rows,
    classStudents,
    selectedCategory,
  });

  const incompleteTotal = selectedCategoryRows.filter(
    (row) => row.status !== "green"
  ).length;

  return (
    <SectionCard>
      <div className="flex items-center justify-between border-b border-[var(--kado-border)] px-4 py-4">
        <div>
          <p className="text-xl font-semibold">班級狀態與學生名單</p>
          <p className="mt-1 text-base leading-7 text-[var(--kado-muted)]">
            {selectedCategoryMeta?.icon}{" "}
            {selectedCategoryMeta?.label ?? selectedCategory}｜全班學生燈號
          </p>
        </div>

        <p className="kado-mono text-sm text-[var(--kado-muted)]">
          {classNameValue ?? "NO CLASS"}
        </p>
      </div>

      {students.length > 0 ? (
        <div className="max-h-[360px] divide-y divide-[var(--kado-border)] overflow-y-auto overscroll-contain">
          {students.map((student) => (
            <StudentCategoryStatusRow
              key={`${selectedCategory}-${student.studentId}`}
              student={student}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-8">
          <p className="text-base text-[var(--kado-muted)]">
            目前沒有學生資料。建立班級、加入學生並發布任務後，這裡會顯示統計。
          </p>
        </div>
      )}

      <div className="border-t border-[var(--kado-border)] p-4">
        <button
          type="button"
          onClick={onToggleIncomplete}
          className="kado-transition block w-full border border-[var(--kado-border)] px-4 py-3 text-center text-base font-semibold hover:bg-zinc-50"
        >
          {showIncomplete
            ? "回到此分類全部學生狀態"
            : `篩選此分類未完成名單${
                incompleteTotal > 0 ? `（${incompleteTotal} 項）` : ""
              }`}
        </button>
      </div>
    </SectionCard>
  );
}

function StudentCategoryStatusRow({
  student,
}: {
  student: StudentCategoryStatus;
}) {
  const displayStatus = getStudentDisplayStatus(student.status);

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-base font-medium">{student.studentName}</p>

        {student.email ? (
          <p className="mt-1 truncate text-xs text-[var(--kado-muted)]">
            {student.email}
          </p>
        ) : null}

        <p className="kado-mono mt-1 text-xs text-[var(--kado-muted)]">
          未完成 {student.incompleteCount} / 總計 {student.total}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        {student.status === "none" ? null : (
          <StatusDot status={toDotStatus(student.status)} />
        )}

        <span
          className={`kado-mono text-sm font-semibold ${displayStatus.className}`}
        >
          {displayStatus.label}
        </span>
      </div>
    </div>
  );
}

function IncompleteList({
  rows,
  selectedCategory,
}: {
  rows: TeacherDashboardRow[];
  selectedCategory: TaskCategory;
}) {
  const selectedCategoryMeta = getCategoryMeta(selectedCategory);
  const groups = buildIncompleteGroups(rows);

  return (
    <section className="mt-5 border border-[var(--kado-border)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--kado-border)] px-4 py-4">
        <div>
          <p className="text-xl font-semibold">
            {selectedCategoryMeta?.icon}{" "}
            {selectedCategoryMeta?.label ?? selectedCategory}未完成名單
          </p>
          <p className="mt-1 text-base leading-7 text-[var(--kado-muted)]">
            只顯示目前選取分類的紅燈與黃燈項目，依未完成項目數由多到少排列。
          </p>
        </div>

        <p className="kado-mono text-sm text-red-500">COUNT {rows.length}</p>
      </div>

      {groups.length > 0 ? (
        <div className="divide-y divide-[var(--kado-border)]">
          {groups.map((group) => (
            <article key={group.studentId} className="px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">
                    {group.studentName}
                  </p>
                  <p className="kado-mono mt-1 text-xs text-red-500">
                    未完成 {group.incompleteCount} 項
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {group.rows.map((row) => (
                  <div
                    key={row.status_id}
                    className="grid gap-3 border border-[var(--kado-border)] px-3 py-3 md:grid-cols-[1fr_auto]"
                  >
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

                      {row.item_kind === "payment" ||
                      row.item_kind === "form" ? (
                        <form action={confirmStudentTaskStatusAction}>
                          <input
                            type="hidden"
                            name="statusId"
                            value={row.status_id}
                          />

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
            </article>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8">
          <p className="text-base text-[var(--kado-muted)]">
            目前這個分類沒有未完成項目。
          </p>
        </div>
      )}
    </section>
  );
}