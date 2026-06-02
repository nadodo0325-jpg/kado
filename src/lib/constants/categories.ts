export const TASK_CATEGORIES = [
  {
    key: "homework",
    label: "作業",
    icon: "✏️",
  },
  {
    key: "quiz",
    label: "小考",
    icon: "💯",
  },
  {
    key: "todo",
    label: "待辦事項",
    icon: "📝",
  },
  {
    key: "others",
    label: "其他",
    icon: "💡",
  },
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number]["key"];