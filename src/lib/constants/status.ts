export const TASK_STATUS = {
  red: {
    label: "未完成",
    color: "red",
    symbol: "🔴",
  },
  green: {
    label: "已完成",
    color: "green",
    symbol: "🟢",
  },
  processing: {
    label: "處理中",
    color: "yellow",
    symbol: "🟡",
  },
} as const;

export const MOOD_STATUS = {
  high_energy: {
    label: "高能",
    icon: "⚡",
  },
  stable: {
    label: "穩定",
    icon: "🔋",
  },
  tired: {
    label: "疲憊",
    icon: "💤",
  },
  low_pressure: {
    label: "低氣壓",
    icon: "🌧️",
  },
} as const;

export const STUDENT_STATUS = {
  moving: {
    label: "移動中",
    icon: "🚌",
  },
  home: {
    label: "已歸位",
    icon: "🏠",
  },
  flow: {
    label: "心流模式",
    icon: "🌙",
  },
} as const;

export type TaskStatus = keyof typeof TASK_STATUS;
export type MoodStatus = keyof typeof MOOD_STATUS;
export type StudentStatus = keyof typeof STUDENT_STATUS;