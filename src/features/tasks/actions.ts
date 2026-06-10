"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function completeTaskItem(taskItemId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "not_authenticated",
    };
  }

  const { data, error } = await supabase.rpc("complete_my_task_item", {
    p_task_item_id: taskItemId,
  });

  if (error) {
    console.error("completeTaskItem error:", error);

    return {
      ok: false,
      message: "update_failed",
    };
  }

  if (!data || data.length === 0) {
    console.error("completeTaskItem no rows updated:", {
      userId: user.id,
      taskItemId,
    });

    return {
      ok: false,
      message: "no_rows_updated",
    };
  }

  return {
    ok: true,
  };
}

export async function completeTaskItemAction(taskItemId: string) {
  const result = await completeTaskItem(taskItemId);

  if (result.ok) {
    revalidatePath("/student");
    revalidatePath("/parent");
  }

  return result;
}

export async function completeTaskItemSilentAction(taskItemId: string) {
  return completeTaskItem(taskItemId);
}