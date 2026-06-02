import type { TaskCategory } from "@/lib/constants/categories";
import type { MoodStatus, StudentStatus, TaskStatus } from "@/lib/constants/status";

export type UserRole = "teacher" | "student" | "parent";

export type KadoUser = {
  id: string;
  role: UserRole;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  aura_color: MoodStatus;
  current_status: StudentStatus;
  created_at: string;
  updated_at: string;
};

export type KadoClass = {
  id: string;
  teacher_id: string;
  class_name: string;
  class_code: string;
  created_at: string;
};

export type KadoTask = {
  id: string;
  teacher_id: string;
  class_id: string;
  category: TaskCategory;
  title: string;
  created_at: string;
};

export type KadoTaskItem = {
  id: string;
  task_id: string;
  title: string;
  due_at: string | null;
  item_kind: "normal" | "payment" | "form";
  teacher_force_chat: boolean;
  created_at: string;
};

export type StudentTaskStatus = {
  id: string;
  student_id: string;
  task_item_id: string;
  status: TaskStatus;
  updated_at: string;
};