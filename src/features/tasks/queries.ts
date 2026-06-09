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

function filterTodayRows(rows: StudentDashboardRow[]) {
  const todayKey = getTodayTaipeiDateKey();

  return rows.filter(
    (row) => getTaipeiDateKey(row.item_created_at) === todayKey
  );
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
        status: item.status === "green" ? "green" : "red",
        items: [item],
      });

      return;
    }

    existingGroup.items.push(item);
    existingGroup.status = existingGroup.items.every(
      (groupItem) => groupItem.status === "green"
    )
      ? "green"
      : "red";
  });

  return Array.from(groupMap.values());
}

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_my_student_dashboard_rows");

  if (error || !data || data.length === 0) {
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