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

export type TeacherClassInfo = {
  classId: string;
  className: string;
  classCode: string;
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
  apply_start_date: string | null;
  apply_end_date: string | null;
};

export type TeacherDashboardData = {
  profile: KadoUser;
  classId: string | null;
  className: string | null;
  classCode: string | null;
  classStudents: TeacherClassStudent[];
  students: TeacherStudentSummary[];
  publishedTasks: PublishedTaskSummary[];
  rows: TeacherDashboardRow[];
  allRows: TeacherDashboardRow[];
};

type TeacherClassRpcRow = {
  id: string;
  class_name: string;
  class_code: string;
  teacher_id: string;
};

type TeacherClassStudentRpcRow = {
  student_id: string;
  student_name: string;
  email: string | null;
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

function getRowApplyStartDateKey(row: TeacherDashboardRow) {
  return row.apply_start_date ?? getTaipeiDateKey(row.item_created_at);
}

function getRowApplyEndDateKey(row: TeacherDashboardRow) {
  return row.apply_end_date ?? getRowApplyStartDateKey(row);
}

function isDateInRowApplyRange(row: TeacherDashboardRow, dateKey: string) {
  const startDateKey = getRowApplyStartDateKey(row);
  const endDateKey = getRowApplyEndDateKey(row);

  return dateKey >= startDateKey && dateKey <= endDateKey;
}

function filterTodayRows(rows: TeacherDashboardRow[]) {
  const todayKey = getTodayTaipeiDateKey();

  return rows.filter((row) => isDateInRowApplyRange(row, todayKey));
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

function mergeClassStudents({
  officialStudents,
  rowStudents,
}: {
  officialStudents: TeacherClassStudent[];
  rowStudents: TeacherClassStudent[];
}) {
  const studentMap = new Map<string, TeacherClassStudent>();

  officialStudents.forEach((student) => {
    studentMap.set(student.studentId, student);
  });

  rowStudents.forEach((student) => {
    if (!studentMap.has(student.studentId)) {
      studentMap.set(student.studentId, student);
      return;
    }

    const existing = studentMap.get(student.studentId);

    if (existing && !existing.email && student.email) {
      existing.email = student.email;
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

async function getOrCreateTeacherClass(): Promise<TeacherClassInfo | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_or_create_my_teacher_class",
    {
      p_class_name: null,
    }
  );

  if (error || !data || data.length === 0) {
    console.error("get_or_create_my_teacher_class error:", error);
    return null;
  }

  const teacherClass = data[0] as TeacherClassRpcRow;

  return {
    classId: teacherClass.id,
    className: teacherClass.class_name,
    classCode: teacherClass.class_code,
  };
}

async function getTeacherClassStudentsByRpc(): Promise<TeacherClassStudent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_my_teacher_class_students");

  if (error || !data) {
    if (error) {
      console.error("get_my_teacher_class_students error:", error);
    }

    return [];
  }

  return (data as TeacherClassStudentRpcRow[])
    .map((student) => ({
      studentId: student.student_id,
      studentName: student.student_name,
      email: student.email,
    }))
    .sort((a, b) => a.studentName.localeCompare(b.studentName, "zh-TW"));
}

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  const teacherClass = await getOrCreateTeacherClass();

  const { data, error } = await supabase.rpc("get_my_teacher_dashboard_rows");

  const allRows =
    error || !data || data.length === 0 ? [] : (data as TeacherDashboardRow[]);

  if (error) {
    console.error("get_my_teacher_dashboard_rows error:", error);
  }

  const todayRows = filterTodayRows(allRows);
  const rowStudents = buildClassStudentsFromRows(allRows);
  const officialStudents = await getTeacherClassStudentsByRpc();

  const classStudents = mergeClassStudents({
    officialStudents,
    rowStudents,
  });

  return {
    profile,
    classId: teacherClass?.classId ?? allRows[0]?.class_id ?? null,
    className: teacherClass?.className ?? allRows[0]?.class_name ?? null,
    classCode: teacherClass?.classCode ?? null,
    classStudents,
    students: buildStudentSummaries(todayRows),
    publishedTasks: buildPublishedTaskSummaries(allRows),
    rows: todayRows,
    allRows,
  };
}