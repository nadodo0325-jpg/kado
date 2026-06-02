import type { TaskCategory } from "@/lib/constants/categories";
import type { TaskStatus } from "@/lib/constants/status";

export type DashboardTaskItem = {
  id: string;
  title: string;
  status: TaskStatus;
  dueAt: string | null;
  itemKind: "normal" | "payment" | "form";
};

export type DashboardTaskGroup = {
  taskId: string;
  category: TaskCategory;
  title: string;
  status: TaskStatus;
  items: DashboardTaskItem[];
};

export type CategorySummary = {
  category: TaskCategory;
  status: TaskStatus;
  completed: number;
  total: number;
};