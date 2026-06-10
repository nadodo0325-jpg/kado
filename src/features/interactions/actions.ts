"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedInteractions = ["pat", "energy", "ok", "praise"] as const;

type ParentInteractionType = (typeof allowedInteractions)[number];

function isAllowedInteraction(value: string): value is ParentInteractionType {
  return allowedInteractions.includes(value as ParentInteractionType);
}

async function createParentInteraction(studentId: string, interactionType: string) {
  const supabase = await createClient();

  if (!studentId || !isAllowedInteraction(interactionType)) {
    return {
      ok: false,
      message: "invalid_interaction",
    };
  }

  const { error } = await supabase.rpc("create_parent_interaction", {
    p_student_id: studentId,
    p_interaction_type: interactionType,
  });

  if (error) {
    console.error("createParentInteraction error:", error);

    return {
      ok: false,
      message: "create_failed",
    };
  }

  return {
    ok: true,
  };
}

async function acknowledgeParentTaskItem(studentId: string, taskItemId: string) {
  const supabase = await createClient();

  if (!studentId || !taskItemId) {
    return {
      ok: false,
      message: "missing_fields",
    };
  }

  const { error } = await supabase.rpc("parent_acknowledge_task_item", {
    p_student_id: studentId,
    p_task_item_id: taskItemId,
  });

  if (error) {
    console.error("acknowledgeParentTaskItem error:", error);

    return {
      ok: false,
      message: "acknowledge_failed",
    };
  }

  return {
    ok: true,
  };
}

export async function sendParentInteractionAction(formData: FormData) {
  const studentId = String(formData.get("studentId") || "");
  const interactionType = String(formData.get("interactionType") || "");
  const category = String(formData.get("category") || "todo");

  const result = await createParentInteraction(studentId, interactionType);

  if (!result.ok) {
    redirect(`/parent?category=${category}&interaction=failed`);
  }

  revalidatePath("/parent");
  revalidatePath("/student");

  redirect(`/parent?category=${category}&interaction=sent`);
}

export async function sendParentInteractionSilentAction(formData: FormData) {
  const studentId = String(formData.get("studentId") || "");
  const interactionType = String(formData.get("interactionType") || "");

  return createParentInteraction(studentId, interactionType);
}

export async function acknowledgeParentTaskItemAction(formData: FormData) {
  const studentId = String(formData.get("studentId") || "");
  const taskItemId = String(formData.get("taskItemId") || "");
  const category = String(formData.get("category") || "todo");

  const result = await acknowledgeParentTaskItem(studentId, taskItemId);

  if (!result.ok) {
    redirect(`/parent?category=${category}&interaction=failed`);
  }

  revalidatePath("/parent");
  revalidatePath("/student");

  redirect(`/parent?category=${category}&interaction=sent`);
}

export async function acknowledgeParentTaskItemSilentAction(formData: FormData) {
  const studentId = String(formData.get("studentId") || "");
  const taskItemId = String(formData.get("taskItemId") || "");

  return acknowledgeParentTaskItem(studentId, taskItemId);
}