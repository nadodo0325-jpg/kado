import { requireRole } from "@/features/auth/queries";
import type { TaskCategory } from "@/lib/constants/categories";
import type { TaskStatus } from "@/lib/constants/status";
import { createClient } from "@/lib/supabase/server";
import type { KadoUser } from "@/types/kado";

export type TeacherStudentSummary = {
  studentId: string;
  studentName: string;
  red: number;
  green: number;
  processing: number;
  total: number;
};

export type PublishedTaskSummary = {
  taskId: string;
  taskTitle: string;
  category: TaskCategory;
  itemKind: "normal" | "payment" | "form";
  itemCount: number;
  red: number;
  green: number;
  processing: number;
  total: number;
  createdAt: string;
};

export type TeacherDashboardRow = {
  class_id: string;
  class_name: string;
  student_id: string;
  student_name: string;
  status_id: string;
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

export type TeacherDashboardData = {
  profile: KadoUser;
  className: string | null;
  students: TeacherStudentSummary[];
  publishedTasks: PublishedTaskSummary[];
  rows: TeacherDashboardRow[];
};

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

    if (row.status === "red") {
      existing.red += 1;
    }

    if (row.status === "green") {
      existing.green += 1;
    }

    if (row.status === "processing") {
      existing.processing += 1;
    }

    existing.total += 1;
  });

  return Array.from(studentMap.values());
}
function buildPublishedTaskSummaries(
  rows: TeacherDashboardRow[]
): PublishedTaskSummary[] {
  const taskMap = new Map<
    string,
    PublishedTaskSummary & { itemIds: Set<string> }
  >();

  rows.forEach((row) => {
    const existing = taskMap.get(row.task_id);

    if (!existing) {
      taskMap.set(row.task_id, {
        taskId: row.task_id,
        taskTitle: row.task_title,
        category: row.category,
        itemKind: row.item_kind,
        itemCount: 1,
        itemIds: new Set([row.task_item_id]),
        red: row.status === "red" ? 1 : 0,
        green: row.status === "green" ? 1 : 0,
        processing: row.status === "processing" ? 1 : 0,
        total: 1,
        createdAt: row.item_created_at,
      });

      return;
    }

    existing.itemIds.add(row.task_item_id);
    existing.itemCount = existing.itemIds.size;

    if (row.status === "red") {
      existing.red += 1;
    }

    if (row.status === "green") {
      existing.green += 1;
    }

    if (row.status === "processing") {
      existing.processing += 1;
    }

    existing.total += 1;

    if (row.item_created_at > existing.createdAt) {
      existing.createdAt = row.item_created_at;
    }
  });

  return Array.from(taskMap.values())
    .map(({ itemIds, ...task }) => task)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_my_teacher_dashboard_rows");

  if (error || !data || data.length === 0) {
    return {
      profile,
      className: null,
      students: [],
      publishedTasks: [],
      rows: [],
    };
  }

  const rows = data as TeacherDashboardRow[];

  return {
    profile,
    className: rows[0]?.class_name ?? null,
    students: buildStudentSummaries(rows),
    publishedTasks: buildPublishedTaskSummaries(rows),
    rows,
  };
}