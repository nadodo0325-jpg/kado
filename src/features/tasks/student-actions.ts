"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";

type ClassRow = {
  id: string;
  class_name: string;
  class_code: string;
  teacher_id: string;
};

function normalizeClassCode(value: string) {
  return value.trim().toUpperCase();
}

export async function joinClassByCodeAction(formData: FormData) {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const classCode = normalizeClassCode(String(formData.get("classCode") ?? ""));

  if (!classCode) {
    redirect("/student?join_error=missing_code");
  }

  const { data: classRow, error: classError } = await supabase
    .from("classes")
    .select("id, class_name, class_code, teacher_id")
    .ilike("class_code", classCode)
    .maybeSingle();

  if (classError) {
    console.error("joinClassByCodeAction classes error:", classError);
    redirect("/student?join_error=join_failed");
  }

  if (!classRow) {
    redirect("/student?join_error=invalid_code");
  }

  const targetClass = classRow as ClassRow;

  const { error: insertError } = await supabase
    .from("class_students")
    .upsert(
      {
        class_id: targetClass.id,
        student_id: profile.id,
        status: "active",
      },
      {
        onConflict: "class_id,student_id",
      }
    );

  if (insertError) {
    console.error("joinClassByCodeAction class_students error:", insertError);
    redirect("/student?join_error=join_failed");
  }

  revalidatePath("/student");
  revalidatePath("/teacher");

  redirect("/student?joined=1");
}