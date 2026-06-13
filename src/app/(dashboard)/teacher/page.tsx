import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { TaipeiClock } from "@/components/common/taipei-clock";
import { PageHeader } from "@/components/layout/page-header";
import { TeacherDashboardClient } from "@/components/teacher/teacher-dashboard-client";
import { TeacherPublishModal } from "@/components/teacher/teacher-publish-modal";
import {
  getTeacherDashboardData,
} from "@/features/tasks/teacher-queries";
import {
  TASK_CATEGORIES,
  type TaskCategory,
} from "@/lib/constants/categories";

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

function getDefaultCategory(): TaskCategory {
  return "homework";
}

function isTaskCategory(value: string | undefined): value is TaskCategory {
  return TASK_CATEGORIES.some((category) => category.key === value);
}

function isDateKey(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
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

export default async function TeacherPage({ searchParams }: TeacherPageProps) {
  const params = (await searchParams) ?? {};
  const published = params.published === "1";
  const confirmed = params.confirmed === "1";
  const deleted = params.deleted === "1";
  const error = params.error ? errorMessages[params.error] : null;

  const selectedCategory: TaskCategory = isTaskCategory(params.category)
    ? params.category
    : getDefaultCategory();

  const todayKey = getTodayTaipeiDateKey();

  const selectedDateKey = isDateKey(params.date) ? params.date : todayKey;
  const showIncomplete = params.filter === "incomplete";

  const dashboardData = await getTeacherDashboardData();
  const { profile, className, classCode, allRows, classStudents } =
    dashboardData;

  return (
    <main className="teacher-shell text-[17px]">
      <section className="mx-auto min-h-screen w-full max-w-6xl px-4 py-5">
        <PageHeader
          eyebrow="TEACHER"
          title={`${profile.display_name} 的教師工作台`}
          right={
            <div className="grid w-full grid-cols-3 gap-2">
              <div className="col-span-3 flex min-h-[96px] items-center justify-center border border-[var(--kado-border)] px-3 py-4 text-center [&_*]:text-center [&_*]:text-2xl [&_*]:font-semibold sm:[&_*]:text-3xl">
                <TaipeiClock />
              </div>

              <div className="[&>button]:h-full [&>button]:w-full [&>button]:px-2 [&>button]:py-3 [&>button]:text-center [&>button]:text-base sm:[&>button]:text-lg">
                <TeacherPublishModal
                  published={published}
                  error={error}
                  classStudents={classStudents}
                />
              </div>

              <Link
                href="/teacher/ai-settings"
                className="kado-transition flex h-full items-center justify-center border border-[var(--kado-border)] px-2 py-3 text-center text-base font-semibold hover:bg-zinc-50 sm:text-lg"
              >
                AI 設定
              </Link>

              <div className="h-full [&>form]:h-full [&_button]:h-full [&_button]:w-full [&_button]:px-2 [&_button]:py-3 [&_button]:text-base sm:[&_button]:text-lg">
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

        <TeacherDashboardClient
          classNameValue={className}
          classCode={classCode}
          allRows={allRows}
          classStudents={classStudents}
          initialCategory={selectedCategory}
          initialDateKey={selectedDateKey}
          initialShowIncomplete={showIncomplete}
        />
      </section>
    </main>
  );
}