"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function completeTaskItemAction(taskItemId: string) {
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
    console.error("completeTaskItemAction error:", error);

    return {
      ok: false,
      message: "update_failed",
    };
  }

  if (!data || data.length === 0) {
    console.error("completeTaskItemAction no rows updated:", {
      userId: user.id,
      taskItemId,
    });

    return {
      ok: false,
      message: "no_rows_updated",
    };
  }

  revalidatePath("/student");

  return {
    ok: true,
  };
}