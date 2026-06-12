"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

function getJoinClassErrorCode(message: string | undefined) {
  if (!message) return "join_failed";

  if (message.includes("class_code_not_found")) {
    return "invalid_code";
  }

  if (message.includes("student_only")) {
    return "student_only";
  }

  if (message.includes("not_authenticated")) {
    return "not_authenticated";
  }

  return "join_failed";
}

export async function joinClassByCodeAction(formData: FormData) {
  await requireRole("student");

  const classCode = String(formData.get("classCode") ?? "")
    .trim()
    .toUpperCase();

  if (!classCode) {
    redirect("/student?join_error=missing_code");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("join_class_by_code", {
    p_class_code: classCode,
  });

  if (error) {
    console.error("join_class_by_code error:", error);

    const errorCode = getJoinClassErrorCode(error.message);

    redirect(`/student?join_error=${errorCode}`);
  }

  revalidatePath("/student");
  redirect("/student?joined=1");
}