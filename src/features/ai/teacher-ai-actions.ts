"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedParseModes = ["free_rules", "byok"] as const;
const allowedOcrModes = ["manual_text", "browser_ocr", "byok_vision"] as const;

export async function updateTeacherAiPreferencesAction(formData: FormData) {
  const supabase = await createClient();

  const parseMode = String(formData.get("parseMode") || "free_rules");
  const ocrMode = String(formData.get("ocrMode") || "manual_text");

  if (!allowedParseModes.includes(parseMode as never)) {
    redirect("/teacher/ai-settings?error=invalid_parse_mode");
  }

  if (!allowedOcrModes.includes(ocrMode as never)) {
    redirect("/teacher/ai-settings?error=invalid_ocr_mode");
  }

  const { error } = await supabase.rpc("set_my_teacher_ai_preferences", {
    p_parse_mode: parseMode,
    p_ocr_mode: ocrMode,
  });

  if (error) {
    console.error("updateTeacherAiPreferencesAction error:", error);
    redirect("/teacher/ai-settings?error=save_failed");
  }

  revalidatePath("/teacher/ai-settings");

  redirect("/teacher/ai-settings?saved=1");
}