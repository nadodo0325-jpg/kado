"use client";

import { useMemo, useState } from "react";
import { publishTeacherTaskDraftsAction } from "@/features/tasks/teacher-actions";
import type { TeacherClassStudent } from "@/features/tasks/teacher-queries";
import {
  parseContactBookText,
  type ParsedContactBookDraft,
} from "@/features/ai/contact-book-parser";
import {
  TASK_CATEGORIES,
  type TaskCategory,
} from "@/lib/constants/categories";

const itemKindOptions = [
  { key: "normal", label: "一般任務" },
  { key: "payment", label: "費用" },
  { key: "form", label: "回條" },
] as const;

type DraftItemKind = (typeof itemKindOptions)[number]["key"];
type TargetScope = "class" | "students";

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

function getCategoryTitleLabel(category: TaskCategory) {
  if (category === "quiz") return "小考提醒";
  if (category === "todo") return "待辦事項";
  if (category === "others") return "其他提醒";

  const meta = TASK_CATEGORIES.find((item) => item.key === category);
  return meta?.label ?? "任務";
}

function getCategoryDisplayLabel(category: TaskCategory) {
  const meta = TASK_CATEGORIES.find((item) => item.key === category);
  return meta ? `${meta.icon} ${meta.label}` : category;
}

function getItemKindDisplayLabel(itemKind: DraftItemKind) {
  const matched = itemKindOptions.find((item) => item.key === itemKind);
  return matched?.label ?? itemKind;
}

function getAutoTaskTitle(category: TaskCategory) {
  return `${getTaipeiMonthDay()} ${getCategoryTitleLabel(category)}`;
}

function normalizeDraftCategory(category: string): TaskCategory {
  const matched = TASK_CATEGORIES.find((item) => item.key === category);
  return matched?.key ?? "todo";
}

function normalizeItemKind(itemKind: string): DraftItemKind {
  const matched = itemKindOptions.find((item) => item.key === itemKind);
  return matched?.key ?? "normal";
}

function getItemCount(itemsText: string) {
  return itemsText
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function getStudentIdsJson(studentIds: string[]) {
  return JSON.stringify(studentIds);
}

export function ContactBookParserPanel({
  classStudents,
}: {
  classStudents: TeacherClassStudent[];
}) {
  const [rawText, setRawText] = useState("");
  const [drafts, setDrafts] = useState<ParsedContactBookDraft[]>([]);
  const [targetScope, setTargetScope] = useState<TargetScope>("class");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const previewDrafts = useMemo(() => {
    return drafts.map((draft) => {
      const autoTitle = getAutoTaskTitle(draft.category);
      const itemCount = getItemCount(draft.itemsText);

      return {
        id: draft.id,
        title: autoTitle,
        category: draft.category,
        categoryLabel: getCategoryDisplayLabel(draft.category),
        itemKind: draft.itemKind,
        itemKindLabel: getItemKindDisplayLabel(draft.itemKind),
        itemsText: draft.itemsText,
        itemCount,
      };
    });
  }, [drafts]);

  const publishableDrafts = previewDrafts.filter(
    (draft) => draft.itemCount > 0
  );

  const draftsJson = useMemo(() => {
    return JSON.stringify(
      publishableDrafts.map((draft) => ({
        title: draft.title,
        category: draft.category,
        itemKind: draft.itemKind,
        itemsText: draft.itemsText,
      }))
    );
  }, [publishableDrafts]);

  const selectedStudentIdsJson = useMemo(() => {
    return getStudentIdsJson(selectedStudentIds);
  }, [selectedStudentIds]);

  const isTargetingStudents = targetScope === "students";
  const isSubmitDisabled =
    publishableDrafts.length === 0 ||
    (isTargetingStudents && selectedStudentIds.length === 0);

  function parseText() {
    const nextDrafts = parseContactBookText(rawText);
    setDrafts(nextDrafts);
  }

  function updateDraftCategory(draftId: string, category: string) {
    setDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              category: normalizeDraftCategory(category),
            }
          : draft
      )
    );
  }

  function updateDraftItemKind(draftId: string, itemKind: string) {
    setDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              itemKind: normalizeItemKind(itemKind),
            }
          : draft
      )
    );
  }

  function updateDraftItemsText(draftId: string, itemsText: string) {
    setDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        draft.id === draftId
          ? {
              ...draft,
              itemsText,
            }
          : draft
      )
    );
  }

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
    <section className="border border-[var(--kado-border)] bg-white">
      <div className="border-b border-[var(--kado-border)] px-4 py-3">
        <p className="text-sm font-semibold">免費聯絡簿拆解前置版</p>
        <p className="mt-1 text-xs leading-5 text-[var(--kado-muted)]">
          拆解後可一鍵發送給全班，也可指定單一或多位學生。
        </p>
      </div>

      <div className="p-4">
        <label className="text-sm font-medium" htmlFor="contact-book-text">
          聯絡簿文字
        </label>

        <textarea
          id="contact-book-text"
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          className="mt-2 min-h-28 w-full resize-none border border-[var(--kado-border)] p-3 text-sm outline-none focus:border-zinc-500"
          placeholder={
            "數學講義 P.45\n英文雜誌 L3 句子仿寫\n明日英文小考 L6\n書費 120 元\n校外教學同意書"
          }
        />

        <div className="mt-4 border-t border-[var(--kado-border)] pt-4">
          <button
            type="button"
            onClick={parseText}
            className="kado-transition w-full border border-[var(--kado-border)] px-4 py-3 text-sm font-semibold hover:bg-zinc-50"
          >
            拆成多張任務草稿
          </button>
        </div>

        {drafts.length > 0 ? (
          <div className="mt-4 border-t border-[var(--kado-border)] pt-4">
            <div className="border border-[var(--kado-border)] bg-zinc-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">發送前預覽</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--kado-muted)]">
                    這裡會即時反映老師修改後的分類、類型與任務細項。
                  </p>
                </div>

                <p className="kado-mono shrink-0 text-xs text-[var(--kado-muted)]">
                  READY {publishableDrafts.length} / DRAFTS {drafts.length}
                </p>
              </div>

              <div className="mt-3 border border-[var(--kado-border)] bg-white p-3">
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
                        SELECTED {selectedStudentIds.length} /{" "}
                        {classStudents.length}
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

              <div className="mt-3 space-y-2">
                {previewDrafts.map((draft, index) => (
                  <div
                    key={draft.id}
                    className="border border-[var(--kado-border)] bg-white px-3 py-3"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold">
                        {index + 1}. {draft.title}
                      </p>

                      <p className="kado-mono text-xs text-[var(--kado-muted)]">
                        {draft.categoryLabel} / {draft.itemKindLabel} / ITEMS{" "}
                        {draft.itemCount}
                      </p>
                    </div>

                    <div className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-700">
                      {draft.itemsText.trim() || "尚未填寫任務細項"}
                    </div>
                  </div>
                ))}
              </div>

              {isTargetingStudents && selectedStudentIds.length === 0 ? (
                <p className="mt-3 text-xs text-red-500">
                  請至少選擇一位學生，或改為發送給全班。
                </p>
              ) : null}

              <form action={publishTeacherTaskDraftsAction} className="mt-4">
                <input type="hidden" name="draftsJson" value={draftsJson} />
                <input type="hidden" name="targetScope" value={targetScope} />
                <input
                  type="hidden"
                  name="studentIdsJson"
                  value={selectedStudentIdsJson}
                />

                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="kado-transition w-full bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  立即發佈
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {drafts.length > 0 ? (
          <div className="mt-4 space-y-3 border-t border-[var(--kado-border)] pt-4">
            <p className="kado-mono text-xs text-[var(--kado-muted)]">
              EDIT DRAFTS {drafts.length}
            </p>

            {drafts.map((draft, index) => {
              const autoTitle = getAutoTaskTitle(draft.category);

              return (
                <article
                  key={draft.id}
                  className="border border-[var(--kado-border)] p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">草稿 {index + 1}</p>
                    <p className="kado-mono shrink-0 text-xs text-[var(--kado-muted)]">
                      {draft.category.toUpperCase()} /{" "}
                      {draft.itemKind.toUpperCase()}
                    </p>
                  </div>

                  <div className="mb-4 border border-[var(--kado-border)] bg-zinc-50 px-3 py-3">
                    <p className="kado-mono text-[11px] text-[var(--kado-muted)]">
                      系統自動看板標題
                    </p>
                    <p className="mt-1 text-sm font-semibold">{autoTitle}</p>
                  </div>

                  <label
                    className="text-sm font-medium"
                    htmlFor={`${draft.id}-category`}
                  >
                    任務分類
                  </label>

                  <select
                    id={`${draft.id}-category`}
                    value={draft.category}
                    onChange={(event) =>
                      updateDraftCategory(draft.id, event.target.value)
                    }
                    className="mt-2 w-full border border-[var(--kado-border)] bg-white px-3 py-3 text-sm outline-none focus:border-zinc-500"
                  >
                    {TASK_CATEGORIES.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.icon} {item.label}
                      </option>
                    ))}
                  </select>

                  <label
                    className="mt-4 block text-sm font-medium"
                    htmlFor={`${draft.id}-kind`}
                  >
                    任務類型
                  </label>

                  <select
                    id={`${draft.id}-kind`}
                    value={draft.itemKind}
                    onChange={(event) =>
                      updateDraftItemKind(draft.id, event.target.value)
                    }
                    className="mt-2 w-full border border-[var(--kado-border)] bg-white px-3 py-3 text-sm outline-none focus:border-zinc-500"
                  >
                    {itemKindOptions.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <label
                    className="mt-4 block text-sm font-medium"
                    htmlFor={`${draft.id}-items`}
                  >
                    任務細項
                  </label>

                  <textarea
                    id={`${draft.id}-items`}
                    value={draft.itemsText}
                    onChange={(event) =>
                      updateDraftItemsText(draft.id, event.target.value)
                    }
                    className="mt-2 min-h-24 w-full resize-none border border-[var(--kado-border)] p-3 text-sm outline-none focus:border-zinc-500"
                  />

                  <p className="mt-3 text-xs leading-5 text-[var(--kado-muted)]">
                    修改後會同步更新上方「發送前預覽」，確認無誤後請按「立即發佈」。
                  </p>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}