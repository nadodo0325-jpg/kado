import { requireRole } from "@/features/auth/queries";
import { TASK_CATEGORIES, type TaskCategory } from "@/lib/constants/categories";
import type { TaskStatus } from "@/lib/constants/status";
import { createClient } from "@/lib/supabase/server";
import type { KadoUser } from "@/types/kado";
import type {
  CategorySummary,
  DashboardTaskGroup,
  DashboardTaskItem,
} from "./types";

type StudentDashboardData = {
  profile: KadoUser;
  groups: DashboardTaskGroup[];
  summaries: CategorySummary[];
};

type StudentDashboardRow = {
  status_id: string;
  student_id: string;
  task_item_id: string;
  status: TaskStatus;
  updated_at: string;
  task_id: string;
  task_title: string;
  category: TaskCategory;
  item_title: string;
  due_at: string | null;
  item_kind: "normal" | "payment" | "form";
  item_created_at: string;
  apply_start_date: string | null;
  apply_end_date: string | null;
};

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

function getRowApplyStartDateKey(row: StudentDashboardRow) {
  return row.apply_start_date ?? getTaipeiDateKey(row.item_created_at);
}

function getRowApplyEndDateKey(row: StudentDashboardRow) {
  return row.apply_end_date ?? getRowApplyStartDateKey(row);
}

function isDateInRowApplyRange(row: StudentDashboardRow, dateKey: string) {
  const startDateKey = getRowApplyStartDateKey(row);
  const endDateKey = getRowApplyEndDateKey(row);

  return dateKey >= startDateKey && dateKey <= endDateKey;
}

function filterTodayRows(rows: StudentDashboardRow[]) {
  const todayKey = getTodayTaipeiDateKey();

  return rows.filter((row) => isDateInRowApplyRange(row, todayKey));
}

function buildEmptySummaries(): CategorySummary[] {
  return TASK_CATEGORIES.map((category) => ({
    category: category.key,
    status: "green",
    completed: 0,
    total: 0,
  }));
}

function buildSummaries(groups: DashboardTaskGroup[]): CategorySummary[] {
  return TASK_CATEGORIES.map((category) => {
    const items = groups
      .filter((group) => group.category === category.key)
      .flatMap((group) => group.items);

    const total = items.length;
    const completed = items.filter((item) => item.status === "green").length;
    const hasRed = items.some((item) => item.status === "red");
    const hasProcessing = items.some((item) => item.status === "processing");

    return {
      category: category.key,
      status: hasRed ? "red" : hasProcessing ? "processing" : "green",
      completed,
      total,
    };
  });
}

function getGroupStatus(items: DashboardTaskItem[]): TaskStatus {
  if (items.some((item) => item.status === "red")) {
    return "red";
  }

  if (items.some((item) => item.status === "processing")) {
    return "processing";
  }

  return "green";
}

function buildGroups(rows: StudentDashboardRow[]): DashboardTaskGroup[] {
  const groupMap = new Map<string, DashboardTaskGroup>();

  rows.forEach((row) => {
    const item: DashboardTaskItem = {
      id: row.task_item_id,
      title: row.item_title,
      status: row.status,
      dueAt: row.due_at,
      itemKind: row.item_kind,
    };

    const existingGroup = groupMap.get(row.task_id);

    if (!existingGroup) {
      groupMap.set(row.task_id, {
        taskId: row.task_id,
        category: row.category,
        title: row.task_title,
        status: item.status,
        items: [item],
      });

      return;
    }

    existingGroup.items.push(item);
    existingGroup.status = getGroupStatus(existingGroup.items);
  });

  return Array.from(groupMap.values());
}

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_my_student_dashboard_rows");

  if (error || !data || data.length === 0) {
    if (error) {
      console.error("get_my_student_dashboard_rows error:", error);
    }

    return {
      profile,
      groups: [],
      summaries: buildEmptySummaries(),
    };
  }

  const rows = filterTodayRows(data as StudentDashboardRow[]);
  const groups = buildGroups(rows);

  return {
    profile,
    groups,
    summaries: buildSummaries(groups),
  };
}