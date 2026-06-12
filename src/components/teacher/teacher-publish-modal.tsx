"use client";

import { useState } from "react";
import { ContactBookParserPanel } from "@/components/teacher/contact-book-parser-panel";
import { QuickPublishPanel } from "@/components/teacher/quick-publish-panel";
import type { TeacherClassStudent } from "@/features/tasks/teacher-queries";

export function TeacherPublishModal({
  published,
  error,
  classStudents,
}: {
  published: boolean;
  error: string | null;
  classStudents: TeacherClassStudent[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="kado-transition shrink-0 bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        ＋ 新增任務
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-4">
          <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden border border-[var(--kado-border)] bg-white">
            <div className="shrink-0 border-b border-[var(--kado-border)] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">新增任務</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--kado-muted)]">
                    可發布給全班，也可指定單一或多位學生。
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="kado-transition shrink-0 border border-[var(--kado-border)] px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                >
                  關閉
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                <div className="min-w-0">
                  <QuickPublishPanel
                    published={published}
                    error={error}
                    classStudents={classStudents}
                  />
                </div>

                <div className="min-w-0">
                  <ContactBookParserPanel classStudents={classStudents} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}