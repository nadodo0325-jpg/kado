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

type JoinedClassRpcRow = {
  class_id: string;
  class_name: string;
  class_code: string;
  teacher_id: string;
  teacher_name: string;
  joined_at: string;
};

export async function getMyJoinedClasses(): Promise<JoinedClass[]> {
  await requireRole("student");

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_my_joined_classes");

  if (error || !data) {
    if (error) {
      console.error("get_my_joined_classes error:", error);
    }

    return [];
  }

  return (data as JoinedClassRpcRow[]).map((row) => ({
    classId: row.class_id,
    className: row.class_name,
    classCode: row.class_code,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    joinedAt: row.joined_at,
  }));
}