"use client";

import { useState } from "react";
import { publishTeacherTaskAction } from "@/features/tasks/teacher-actions";
import {
  parseContactBookText,
  type ParsedContactBookDraft,
} from "@/features/ai/contact-book-parser";
import { TASK_CATEGORIES } from "@/lib/constants/categories";

const itemKindOptions = [
  { key: "normal", label: "一般任務" },
  { key: "payment", label: "費用" },
  { key: "form", label: "回條" },
] as const;

export function ContactBookParserPanel() {
  const [rawText, setRawText] = useState("");
  const [drafts, setDrafts] = useState<ParsedContactBookDraft[]>([]);

  function parseText() {
    const nextDrafts = parseContactBookText(rawText);
    setDrafts(nextDrafts);
  }

  return (
    <section className="mt-4 border border-[var(--kado-border)] bg-white">
      <div className="border-b border-[var(--kado-border)] px-4 py-3">
        <p className="text-sm font-semibold">免費聯絡簿拆解前置版</p>
        <p className="mt-1 text-xs leading-5 text-[var(--kado-muted)]">
          先不調用付費 AI。老師貼上聯絡簿文字後，系統會用規則拆成多張任務草稿。
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
          placeholder={"數學講義 P.45\n英文雜誌 L3 句子仿寫\n明日英文小考 L6\n書費 120 元\n校外教學同意書"}
        />

        <button
          type="button"
          onClick={parseText}
          className="kado-transition mt-3 w-full border border-[var(--kado-border)] px-4 py-3 text-sm font-semibold hover:bg-zinc-50"
        >
          拆成多張任務草稿
        </button>

        {drafts.length > 0 ? (
          <div className="mt-4 space-y-3 border-t border-[var(--kado-border)] pt-4">
            <p className="kado-mono text-xs text-[var(--kado-muted)]">
              DRAFTS {drafts.length}
            </p>

            {drafts.map((draft, index) => (
              <form
                key={draft.id}
                action={publishTeacherTaskAction}
                className="border border-[var(--kado-border)] p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">草稿 {index + 1}</p>
                  <p className="kado-mono text-xs text-[var(--kado-muted)]">
                    {draft.category.toUpperCase()} / {draft.itemKind.toUpperCase()}
                  </p>
                </div>

                <label
                  className="text-sm font-medium"
                  htmlFor={`${draft.id}-category`}
                >
                  任務分類
                </label>
                <select
                  id={`${draft.id}-category`}
                  name="category"
                  defaultValue={draft.category}
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
                  name="itemKind"
                  defaultValue={draft.itemKind}
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
                  htmlFor={`${draft.id}-title`}
                >
                  任務看板標題
                </label>
                <input
                  id={`${draft.id}-title`}
                  name="title"
                  defaultValue={draft.title}
                  className="mt-2 w-full border border-[var(--kado-border)] px-3 py-3 text-sm outline-none focus:border-zinc-500"
                />

                <label
                  className="mt-4 block text-sm font-medium"
                  htmlFor={`${draft.id}-items`}
                >
                  任務細項
                </label>
                <textarea
                  id={`${draft.id}-items`}
                  name="itemsText"
                  defaultValue={draft.itemsText}
                  className="mt-2 min-h-24 w-full resize-none border border-[var(--kado-border)] p-3 text-sm outline-none focus:border-zinc-500"
                />

                <button
                  type="submit"
                  className="kado-transition mt-3 w-full bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  發布這張草稿
                </button>
              </form>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}