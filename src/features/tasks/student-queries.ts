import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

export type JoinedClass = {
  classId: string;
  className: string;
  classCode: string;
  teacherId: string;
  teacherName: string;
  joinedAt: string;
};

type ClassStudentRow = {
  class_id: string;
  created_at: string;
};

type ClassRow = {
  id: string;
  class_name: string;
  class_code: string;
  teacher_id: string;
};

type TeacherRow = {
  id: string;
  display_name: string;
};

export async function getMyJoinedClasses(): Promise<JoinedClass[]> {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const { data: memberships, error: membershipError } = await supabase
    .from("class_students")
    .select("class_id, created_at")
    .eq("student_id", profile.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (membershipError || !memberships || memberships.length === 0) {
    if (membershipError) {
      console.error("getMyJoinedClasses class_students error:", membershipError);
    }

    return [];
  }

  const membershipRows = memberships as ClassStudentRow[];
  const classIds = Array.from(
    new Set(membershipRows.map((membership) => membership.class_id))
  );

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, class_name, class_code, teacher_id")
    .in("id", classIds);

  if (classesError || !classes || classes.length === 0) {
    if (classesError) {
      console.error("getMyJoinedClasses classes error:", classesError);
    }

    return [];
  }

  const classRows = classes as ClassRow[];
  const teacherIds = Array.from(
    new Set(classRows.map((classRow) => classRow.teacher_id))
  );

  const { data: teachers, error: teachersError } = await supabase
    .from("users")
    .select("id, display_name")
    .in("id", teacherIds);

  if (teachersError || !teachers) {
    if (teachersError) {
      console.error("getMyJoinedClasses teachers error:", teachersError);
    }

    return [];
  }

  const teacherMap = new Map(
    (teachers as TeacherRow[]).map((teacher) => [
      teacher.id,
      teacher.display_name,
    ])
  );

  const membershipMap = new Map(
    membershipRows.map((membership) => [
      membership.class_id,
      membership.created_at,
    ])
  );

  return classRows
    .map((classRow) => ({
      classId: classRow.id,
      className: classRow.class_name,
      classCode: classRow.class_code,
      teacherId: classRow.teacher_id,
      teacherName: teacherMap.get(classRow.teacher_id) ?? "未命名老師",
      joinedAt: membershipMap.get(classRow.id) ?? new Date().toISOString(),
    }))
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
}