"use client";

import { useMemo, useState } from "react";
import { publishTeacherTaskAction } from "@/features/tasks/teacher-actions";
import type { TeacherClassStudent } from "@/features/tasks/teacher-queries";
import {
  TASK_CATEGORIES,
  type TaskCategory,
} from "@/lib/constants/categories";

type TargetScope = "class" | "students";
type ApplyDateMode = "today" | "through_sunday" | "custom";

function getTaipeiDateKey() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(dateKey: string, dayCount: number) {
  const [yearText = "", monthText = "", dayText = ""] = dateKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + dayCount);

  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function getSundayDateKey(dateKey: string) {
  const [yearText = "", monthText = "", dayText = ""] = dateKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  const date = new Date(Date.UTC(year, month - 1, day));
  const weekDay = date.getUTCDay();
  const daysUntilSunday = (7 - weekDay) % 7;

  return addDaysToDateKey(dateKey, daysUntilSunday);
}

function getTaipeiMonthDay() {
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${month}/${day}`;
}

function getAutoTitleCategoryLabel(categoryKey: TaskCategory) {
  if (categoryKey === "quiz") return "小考提醒";
  if (categoryKey === "todo") return "待辦事項";
  if (categoryKey === "others") return "其他提醒";

  const meta = TASK_CATEGORIES.find((category) => category.key === categoryKey);
  return meta?.label ?? "任務";
}

function getAutoTaskTitle(categoryKey: TaskCategory) {
  return `${getTaipeiMonthDay()} ${getAutoTitleCategoryLabel(categoryKey)}`;
}

function normalizeCategory(category: string): TaskCategory {
  const matched = TASK_CATEGORIES.find((item) => item.key === category);
  return matched?.key ?? "homework";
}

function getStudentIdsJson(studentIds: string[]) {
  return JSON.stringify(studentIds);
}

function getApplyDateRange({
  mode,
  customStartDate,
  customEndDate,
}: {
  mode: ApplyDateMode;
  customStartDate: string;
  customEndDate: string;
}) {
  const todayKey = getTaipeiDateKey();

  if (mode === "through_sunday") {
    return {
      applyStartDate: todayKey,
      applyEndDate: getSundayDateKey(todayKey),
    };
  }

  if (mode === "custom") {
    return {
      applyStartDate: customStartDate || todayKey,
      applyEndDate: customEndDate || customStartDate || todayKey,
    };
  }

  return {
    applyStartDate: todayKey,
    applyEndDate: todayKey,
  };
}

function formatDateRangeLabel(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return startDate;
  }

  return `${startDate} ~ ${endDate}`;
}

export function QuickPublishPanel({
  published,
  error,
  classStudents,
}: {
  published: boolean;
  error: string | null;
  classStudents: TeacherClassStudent[];
}) {
  const todayKey = getTaipeiDateKey();

  const [selectedCategory, setSelectedCategory] =
    useState<TaskCategory>("homework");
  const [targetScope, setTargetScope] = useState<TargetScope>("class");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [applyDateMode, setApplyDateMode] =
    useState<ApplyDateMode>("today");
  const [customStartDate, setCustomStartDate] = useState(todayKey);
  const [customEndDate, setCustomEndDate] = useState(todayKey);

  const autoTitle = useMemo(() => {
    return getAutoTaskTitle(selectedCategory);
  }, [selectedCategory]);

  const selectedStudentIdsJson = useMemo(() => {
    return getStudentIdsJson(selectedStudentIds);
  }, [selectedStudentIds]);

  const applyDateRange = useMemo(() => {
    return getApplyDateRange({
      mode: applyDateMode,
      customStartDate,
      customEndDate,
    });
  }, [applyDateMode, customStartDate, customEndDate]);

  const isTargetingStudents = targetScope === "students";
  const isApplyDateInvalid =
    applyDateRange.applyEndDate < applyDateRange.applyStartDate;
  const isSubmitDisabled =
    isApplyDateInvalid ||
    (isTargetingStudents && selectedStudentIds.length === 0);

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((currentIds) => {
      if (currentIds.includes(studentId)) {
        return currentIds.filter((id) => id !== studentId);
      }

      return [...currentIds, studentId];
    });
  }

  function selectAllStudents() {
    setSelectedStudentIds(classStudents.map((student) => student.studentId));
  }

  function clearStudents() {
    setSelectedStudentIds([]);
  }

  return (
    <section
      id="publish-task"
      className="border border-[var(--kado-border)] bg-white"
    >
      <div className="border-b border-[var(--kado-border)] px-4 py-3">
        <p className="text-sm font-semibold">快速發布</p>
        <p className="mt-1 text-xs leading-5 text-[var(--kado-muted)]">
          每一行會變成一個任務細項，可發布給全班或指定學生。
        </p>
      </div>

      <form action={publishTeacherTaskAction}>
        <input type="hidden" name="targetScope" value={targetScope} />
        <input
          type="hidden"
          name="studentIdsJson"
          value={selectedStudentIdsJson}
        />
        <input
          type="hidden"
          name="applyStartDate"
          value={applyDateRange.applyStartDate}
        />
        <input
          type="hidden"
          name="applyEndDate"
          value={applyDateRange.applyEndDate}
        />

        <div className="border-b border-[var(--kado-border)] p-4">
          <label className="text-sm font-medium" htmlFor="task-category">
            任務分類
          </label>

          <select
            id="task-category"
            name="category"
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(normalizeCategory(event.target.value))
            }
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

        <div className="border-b border-[var(--kado-border)] p-4">
          <p className="text-sm font-medium">任務適用日期</p>

          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setApplyDateMode("today")}
              className={
                applyDateMode === "today"
                  ? "border border-zinc-950 bg-zinc-950 px-3 py-3 text-left text-sm font-semibold text-white"
                  : "border border-[var(--kado-border)] px-3 py-3 text-left text-sm font-semibold hover:bg-zinc-50"
              }
            >
              今日
              <span className="mt-1 block text-xs font-normal opacity-70">
                只套用今天
              </span>
            </button>

            <button
              type="button"
              onClick={() => setApplyDateMode("through_sunday")}
              className={
                applyDateMode === "through_sunday"
                  ? "border border-zinc-950 bg-zinc-950 px-3 py-3 text-left text-sm font-semibold text-white"
                  : "border border-[var(--kado-border)] px-3 py-3 text-left text-sm font-semibold hover:bg-zinc-50"
              }
            >
              今日到本週日
              <span className="mt-1 block text-xs font-normal opacity-70">
                適合週末聯絡簿
              </span>
            </button>

            <button
              type="button"
              onClick={() => setApplyDateMode("custom")}
              className={
                applyDateMode === "custom"
                  ? "border border-zinc-950 bg-zinc-950 px-3 py-3 text-left text-sm font-semibold text-white"
                  : "border border-[var(--kado-border)] px-3 py-3 text-left text-sm font-semibold hover:bg-zinc-50"
              }
            >
              自訂日期
              <span className="mt-1 block text-xs font-normal opacity-70">
                自訂起訖範圍
              </span>
            </button>
          </div>

          {applyDateMode === "custom" ? (
            <div className="mt-3 grid gap-3 border border-[var(--kado-border)] bg-zinc-50 p-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-[var(--kado-muted)]">
                  開始日期
                </span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                  className="mt-2 w-full border border-[var(--kado-border)] bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-[var(--kado-muted)]">
                  結束日期
                </span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                  className="mt-2 w-full border border-[var(--kado-border)] bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                />
              </label>
            </div>
          ) : null}

          <div className="mt-3 border border-[var(--kado-border)] bg-zinc-50 px-3 py-3">
            <p className="kado-mono text-[11px] text-[var(--kado-muted)]">
              APPLY DATE RANGE
            </p>
            <p className="mt-1 text-sm font-semibold">
              {formatDateRangeLabel(
                applyDateRange.applyStartDate,
                applyDateRange.applyEndDate
              )}
            </p>
          </div>

          {isApplyDateInvalid ? (
            <p className="mt-3 text-xs text-red-500">
              結束日期不能早於開始日期。
            </p>
          ) : null}
        </div>

        <div className="border-b border-[var(--kado-border)] p-4">
          <p className="text-sm font-medium">發送對象</p>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTargetScope("class")}
              className={
                targetScope === "class"
                  ? "border border-zinc-950 bg-zinc-950 px-3 py-3 text-left text-sm font-semibold text-white"
                  : "border border-[var(--kado-border)] px-3 py-3 text-left text-sm font-semibold hover:bg-zinc-50"
              }
            >
              全班
              <span className="mt-1 block text-xs font-normal opacity-70">
                發給班上所有學生
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTargetScope("students")}
              className={
                targetScope === "students"
                  ? "border border-zinc-950 bg-zinc-950 px-3 py-3 text-left text-sm font-semibold text-white"
                  : "border border-[var(--kado-border)] px-3 py-3 text-left text-sm font-semibold hover:bg-zinc-50"
              }
            >
              指定學生
              <span className="mt-1 block text-xs font-normal opacity-70">
                可選單一或多位學生
              </span>
            </button>
          </div>

          {isTargetingStudents ? (
            <div className="mt-3 border border-[var(--kado-border)] bg-zinc-50 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="kado-mono text-xs text-[var(--kado-muted)]">
                  SELECTED {selectedStudentIds.length} / {classStudents.length}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllStudents}
                    className="border border-[var(--kado-border)] px-2 py-1 text-xs font-semibold hover:bg-white"
                  >
                    全選
                  </button>

                  <button
                    type="button"
                    onClick={clearStudents}
                    className="border border-[var(--kado-border)] px-2 py-1 text-xs font-semibold hover:bg-white"
                  >
                    清空
                  </button>
                </div>
              </div>

              {classStudents.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {classStudents.map((student) => (
                    <label
                      key={student.studentId}
                      className="flex cursor-pointer items-start gap-2 border border-[var(--kado-border)] bg-white px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(
                          student.studentId
                        )}
                        onChange={() => toggleStudent(student.studentId)}
                        className="mt-1"
                      />

                      <span>
                        <span className="block font-medium">
                          {student.studentName}
                        </span>
                        {student.email ? (
                          <span className="block text-xs text-[var(--kado-muted)]">
                            {student.email}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--kado-muted)]">
                  目前沒有可選學生。請先確認班級已有學生。
                </p>
              )}
            </div>
          ) : null}
        </div>

        <div className="p-4">
          {published ? (
            <div className="mb-4 border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700">
              任務已發布。
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <input type="hidden" name="title" value={autoTitle} />

          <div className="mb-4 border border-[var(--kado-border)] bg-zinc-50 px-3 py-3">
            <p className="kado-mono text-[11px] text-[var(--kado-muted)]">
              系統自動看板標題
            </p>
            <p className="mt-1 text-sm font-semibold">{autoTitle}</p>
          </div>

          <label className="block text-sm font-medium" htmlFor="task-content">
            任務細項
          </label>

          <textarea
            id="task-content"
            name="itemsText"
            className="mt-2 min-h-32 w-full resize-none border border-[var(--kado-border)] p-3 text-sm outline-none focus:border-zinc-500"
            placeholder={"化學講義 p31~53\n英文單字 10 個\n國文作文"}
          />

          {isSubmitDisabled ? (
            <p className="mt-3 text-xs text-red-500">
              {isApplyDateInvalid
                ? "請確認任務適用日期。"
                : "請至少選擇一位學生，或改為發送給全班。"}
            </p>
          ) : null}

          <div className="mt-4 border-t border-[var(--kado-border)] pt-4">
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="kado-transition w-full bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              立即發佈
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}