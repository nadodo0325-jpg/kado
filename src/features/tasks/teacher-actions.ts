"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TaskCategory } from "@/lib/constants/categories";

const allowedCategories: TaskCategory[] = [
  "homework",
  "quiz",
  "todo",
  "others",
];

const allowedItemKinds = ["normal", "payment", "form"] as const;

export async function publishTeacherTaskAction(formData: FormData) {
  const supabase = await createClient();

  const category = String(formData.get("category") || "") as TaskCategory;
  const itemKind = String(formData.get("itemKind") || "normal");
  const title = String(formData.get("title") || "").trim();
  const itemsText = String(formData.get("itemsText") || "").trim();

  if (!allowedCategories.includes(category)) {
    redirect("/teacher?error=invalid_category");
  }

  if (!allowedItemKinds.includes(itemKind as never)) {
    redirect("/teacher?error=invalid_item_kind");
  }

  if (!title) {
    redirect("/teacher?error=missing_title");
  }

  const items = itemsText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length === 0) {
    redirect("/teacher?error=missing_items");
  }

  const { data, error } = await supabase.rpc("create_teacher_task", {
    p_class_id: null,
    p_category: category,
    p_title: title,
    p_items: items,
    p_item_kind: itemKind,
  });

  if (error || !data || data.length === 0) {
    console.error("publishTeacherTaskAction error:", error);
    redirect("/teacher?error=publish_failed");
  }

  revalidatePath("/teacher");
  revalidatePath("/student");
  revalidatePath("/parent");

  redirect("/teacher?published=1");
}

export async function confirmStudentTaskStatusAction(formData: FormData) {
  const supabase = await createClient();

  const statusId = String(formData.get("statusId") || "");

  if (!statusId) {
    redirect("/teacher?filter=incomplete&error=confirm_failed");
  }

  const { error } = await supabase.rpc("teacher_confirm_student_task_status", {
    p_status_id: statusId,
  });

  if (error) {
    console.error("confirmStudentTaskStatusAction error:", error);
    redirect("/teacher?filter=incomplete&error=confirm_failed");
  }

  revalidatePath("/teacher");
  revalidatePath("/student");
  revalidatePath("/parent");

  redirect("/teacher?filter=incomplete&confirmed=1");
}