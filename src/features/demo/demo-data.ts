import type { TaskCategory } from "@/lib/constants/categories";
import type { TaskStatus } from "@/lib/constants/status";

export const demoTaskCounts: Record<TaskCategory, string> = {
  homework: "3/3",
  quiz: "1/1",
  todo: "2/4",
  others: "2/2",
};

export const demoCategoryStatus: Record<TaskCategory, TaskStatus> = {
  homework: "green",
  quiz: "green",
  todo: "red",
  others: "green",
};

export const demoTodoItems = [
  {
    id: "todo-1",
    title: "明天交回條",
    status: "red",
  },
  {
    id: "todo-2",
    title: "整理書包",
    status: "green",
  },
  {
    id: "todo-3",
    title: "書費 120 元",
    status: "red",
  },
] as const;

export const demoParentActions = [
  {
    id: "pat",
    icon: "🤝",
    label: "拍拍肩膀",
  },
  {
    id: "energy",
    icon: "🍵",
    label: "補充能量",
  },
  {
    id: "ok",
    icon: "👌",
    label: "收到了解",
  },
] as const;

export const demoTeacherStudents = [
  {
    id: "student-1",
    name: "陳同學",
    red: 0,
    green: 8,
  },
  {
    id: "student-2",
    name: "林同學",
    red: 2,
    green: 6,
  },
  {
    id: "student-3",
    name: "王同學",
    red: 1,
    green: 7,
  },
] as const;