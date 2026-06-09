"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedInteractions = ["pat", "energy", "ok", "praise"] as const;

export async function sendParentInteractionAction(formData: FormData) {
  const supabase = await createClient();

  const studentId = String(formData.get("studentId") || "");
  const interactionType = String(formData.get("interactionType") || "");
  const category = String(formData.get("category") || "todo");

  if (!studentId || !allowedInteractions.includes(interactionType as never)) {
    redirect(`/parent?category=${category}&interaction=failed`);
  }

  const { error } = await supabase.rpc("create_parent_interaction", {
    p_student_id: studentId,
    p_interaction_type: interactionType,
  });

  if (error) {
    console.error("sendParentInteractionAction error:", error);
    redirect(`/parent?category=${category}&interaction=failed`);
  }

  revalidatePath("/parent");
  revalidatePath("/student");

  redirect(`/parent?category=${category}&interaction=sent`);
}

export async function acknowledgeParentTaskItemAction(formData: FormData) {
  const supabase = await createClient();

  const studentId = String(formData.get("studentId") || "");
  const taskItemId = String(formData.get("taskItemId") || "");
  const category = String(formData.get("category") || "todo");

  if (!studentId || !taskItemId) {
    redirect(`/parent?category=${category}&interaction=failed`);
  }

  const { error } = await supabase.rpc("parent_acknowledge_task_item", {
    p_student_id: studentId,
    p_task_item_id: taskItemId,
  });

  if (error) {
    console.error("acknowledgeParentTaskItemAction error:", error);
    redirect(`/parent?category=${category}&interaction=failed`);
  }

  revalidatePath("/parent");
  revalidatePath("/student");

  redirect(`/parent?category=${category}&interaction=sent`);
}