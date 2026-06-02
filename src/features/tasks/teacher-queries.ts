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

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_my_teacher_dashboard_rows");

  if (error || !data || data.length === 0) {
    return {
      profile,
      className: null,
      students: [],
      rows: [],
    };
  }

  const rows = data as TeacherDashboardRow[];

  return {
    profile,
    className: rows[0]?.class_name ?? null,
    students: buildStudentSummaries(rows),
    rows,
  };
}