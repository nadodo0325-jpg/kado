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

export type TeacherClassStudent = {
  studentId: string;
  studentName: string;
  email: string | null;
};

export type PublishedTaskSummary = {
  taskId: string;
  taskTitle: string;
  category: TaskCategory;
  itemKind: "normal" | "payment" | "form";
  itemCount: number;
  itemTitles: string[];
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
  classStudents: TeacherClassStudent[];
  students: TeacherStudentSummary[];
  publishedTasks: PublishedTaskSummary[];
  rows: TeacherDashboardRow[];
  allRows: TeacherDashboardRow[];
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

function filterTodayRows(rows: TeacherDashboardRow[]) {
  const todayKey = getTodayTaipeiDateKey();

  return rows.filter(
    (row) => getTaipeiDateKey(row.item_created_at) === todayKey
  );
}

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

function buildClassStudentsFromRows(
  rows: TeacherDashboardRow[]
): TeacherClassStudent[] {
  const studentMap = new Map<string, TeacherClassStudent>();

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

function buildPublishedTaskSummaries(
  rows: TeacherDashboardRow[]
): PublishedTaskSummary[] {
  const taskMap = new Map<
    string,
    PublishedTaskSummary & {
      itemIds: Set<string>;
      itemTitleMap: Map<string, string>;
    }
  >();

  rows.forEach((row) => {
    const existing = taskMap.get(row.task_id);

    if (!existing) {
      const itemTitleMap = new Map<string, string>();
      itemTitleMap.set(row.task_item_id, row.item_title);

      taskMap.set(row.task_id, {
        taskId: row.task_id,
        taskTitle: row.task_title,
        category: row.category,
        itemKind: row.item_kind,
        itemCount: 1,
        itemIds: new Set([row.task_item_id]),
        itemTitleMap,
        itemTitles: [row.item_title],
        red: row.status === "red" ? 1 : 0,
        green: row.status === "green" ? 1 : 0,
        processing: row.status === "processing" ? 1 : 0,
        total: 1,
        createdAt: row.item_created_at,
      });

      return;
    }

    existing.itemIds.add(row.task_item_id);
    existing.itemTitleMap.set(row.task_item_id, row.item_title);
    existing.itemCount = existing.itemIds.size;
    existing.itemTitles = Array.from(existing.itemTitleMap.values());

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
    .map(({ itemIds, itemTitleMap, ...task }) => task)
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
      classStudents: [],
      students: [],
      publishedTasks: [],
      rows: [],
      allRows: [],
    };
  }

  const allRows = data as TeacherDashboardRow[];
  const todayRows = filterTodayRows(allRows);
  const classStudents = buildClassStudentsFromRows(allRows);

  return {
    profile,
    className: allRows[0]?.class_name ?? null,
    classStudents,
    students: buildStudentSummaries(todayRows),
    publishedTasks: buildPublishedTaskSummaries(allRows),
    rows: todayRows,
    allRows,
  };
}