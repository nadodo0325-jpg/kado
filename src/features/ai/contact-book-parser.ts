import type { TaskCategory } from "@/lib/constants/categories";

export type ParsedContactBookDraft = {
  id: string;
  category: TaskCategory;
  itemKind: "normal" | "payment" | "form";
  title: string;
  itemsText: string;
};

function guessCategory(text: string): TaskCategory {
  if (text.includes("考") || text.toLowerCase().includes("quiz")) {
    return "quiz";
  }

  if (
    text.includes("帶") ||
    text.includes("繳") ||
    text.includes("回條") ||
    text.includes("同意書") ||
    text.includes("費") ||
    text.includes("元")
  ) {
    return "todo";
  }

  if (
    text.includes("作業") ||
    text.includes("講義") ||
    text.includes("習作") ||
    text.includes("雜誌") ||
    text.includes("句子仿寫")
  ) {
    return "homework";
  }

  return "others";
}

function guessItemKind(text: string): "normal" | "payment" | "form" {
  if (text.includes("費") || text.includes("元") || text.includes("$")) {
    return "payment";
  }

  if (text.includes("回條") || text.includes("同意書") || text.includes("簽名")) {
    return "form";
  }

  return "normal";
}

function cleanLine(line: string) {
  return line
    .replace(/^[-・*]\s*/, "")
    .replace(/^今日作業[:：]\s*/, "")
    .replace(/^明日小考[:：]\s*/, "")
    .replace(/^小考[:：]\s*/, "")
    .replace(/^作業[:：]\s*/, "")
    .replace(/^待辦[:：]\s*/, "")
    .trim();
}

function buildTitle(
  category: TaskCategory,
  itemKind: "normal" | "payment" | "form"
) {
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();

  if (itemKind === "payment") {
    return `${month}/${date} 費用通知`;
  }

  if (itemKind === "form") {
    return `${month}/${date} 回條通知`;
  }

  const titleMap: Record<TaskCategory, string> = {
    homework: `${month}/${date} 作業看板`,
    quiz: `${month}/${date} 小考提醒`,
    todo: `${month}/${date} 待辦事項`,
    others: `${month}/${date} 其他事項`,
  };

  return titleMap[category];
}

export function parseContactBookText(rawText: string): ParsedContactBookDraft[] {
  const lines = rawText
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);

  const groupMap = new Map<string, string[]>();

  lines.forEach((line) => {
    const category = guessCategory(line);
    const itemKind = guessItemKind(line);
    const key = `${category}:${itemKind}`;

    const existing = groupMap.get(key) ?? [];
    existing.push(line);
    groupMap.set(key, existing);
  });

  return Array.from(groupMap.entries()).map(([key, items], index) => {
    const [category, itemKind] = key.split(":") as [
      TaskCategory,
      "normal" | "payment" | "form",
    ];

    return {
      id: `draft-${index + 1}`,
      category,
      itemKind,
      title: buildTitle(category, itemKind),
      itemsText: items.join("\n"),
    };
  });
}