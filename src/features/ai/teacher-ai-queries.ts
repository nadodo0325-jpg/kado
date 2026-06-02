import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

export type TeacherAiPreferences = {
  parseMode: "free_rules" | "byok";
  ocrMode: "manual_text" | "browser_ocr" | "byok_vision";
};

const defaultPreferences: TeacherAiPreferences = {
  parseMode: "free_rules",
  ocrMode: "manual_text",
};

export async function getTeacherAiPreferences(): Promise<TeacherAiPreferences> {
  await requireRole("teacher");

  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_my_teacher_ai_preferences"
  );

  if (error || !data || data.length === 0) {
    return defaultPreferences;
  }

  const row = data[0];

  return {
    parseMode: row.parse_mode ?? "free_rules",
    ocrMode: row.ocr_mode ?? "manual_text",
  };
}