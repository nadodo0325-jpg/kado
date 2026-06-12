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
type AllowedItemKind = (typeof allowedItemKinds)[number];

type PublishTargetScope = "class" | "students";

function isAllowedItemKind(value: string): value is AllowedItemKind {
  return allowedItemKinds.includes(value as AllowedItemKind);
}

function isSafeDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeTargetScope(value: string): PublishTargetScope {
  return value === "students" ? "students" : "class";
}

function normalizeStudentIdsJson(rawValue: FormDataEntryValue | null) {
  const rawText = String(rawValue ?? "").trim();

  if (!rawText) {
    return [];
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(rawText);
  } catch (error) {
    console.error("normalizeStudentIdsJson parse error:", error);
    return [];
  }

  if (!Array.isArray(parsedValue)) {
    return [];
  }

  return parsedValue
    .map((studentId) =>
      typeof studentId === "string" ? studentId.trim() : ""
    )
    .filter(Boolean);
}

function buildTeacherRedirectPath(
  formData: FormData,
  extraParams: Record<string, string> = {}
) {
  const params = new URLSearchParams();

  const dateKey = String(formData.get("dateKey") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  if (isSafeDateKey(dateKey)) {
    params.set("date", dateKey);
  }

  if (allowedCategories.includes(category as TaskCategory)) {
    params.set("category", category);
  }

  Object.entries(extraParams).forEach(([key, value]) => {
    params.set(key, value);
  });

  const query = params.toString();

  return query ? `/teacher?${query}` : "/teacher";
}

async function publishTaskByTarget({
  supabase,
  category,
  title,
  items,
  itemKind,
  targetScope,
  studentIds,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  category: TaskCategory;
  title: string;
  items: string[];
  itemKind: AllowedItemKind;
  targetScope: PublishTargetScope;
  studentIds: string[];
}) {
  if (targetScope === "students") {
    if (studentIds.length === 0) {
      return {
        ok: false,
        reason: "missing_students",
      };
    }

    const { data, error } = await supabase.rpc(
      "create_teacher_task_for_students",
      {
        p_category: category,
        p_title: title,
        p_items: items,
        p_item_kind: itemKind,
        p_student_ids: studentIds,
      }
    );

    if (error || !data || data.length === 0) {
      console.error("publishTaskByTarget targeted error:", {
        error,
        category,
        title,
        itemKind,
        studentIds,
      });

      return {
        ok: false,
        reason: "publish_failed",
      };
    }

    return {
      ok: true,
      reason: null,
    };
  }

  const { data, error } = await supabase.rpc("create_teacher_task", {
    p_class_id: null,
    p_category: category,
    p_title: title,
    p_items: items,
    p_item_kind: itemKind,
  });

  if (error || !data || data.length === 0) {
    console.error("publishTaskByTarget class error:", {
      error,
      category,
      title,
      itemKind,
    });

    return {
      ok: false,
      reason: "publish_failed",
    };
  }

  return {
    ok: true,
    reason: null,
  };
}

export async function publishTeacherTaskAction(formData: FormData) {
  const supabase = await createClient();

  const category = String(formData.get("category") || "") as TaskCategory;
  const itemKind = String(formData.get("itemKind") || "normal");
  const title = String(formData.get("title") || "").trim();
  const itemsText = String(formData.get("itemsText") || "").trim();
  const targetScope = normalizeTargetScope(
    String(formData.get("targetScope") || "class")
  );
  const studentIds = normalizeStudentIdsJson(formData.get("studentIdsJson"));

  if (!allowedCategories.includes(category)) {
    redirect("/teacher?error=invalid_category");
  }

  if (!isAllowedItemKind(itemKind)) {
    redirect("/teacher?error=invalid_item_kind");
  }

  if (!title) {
    redirect("/teacher?error=missing_title");
  }

  const items = itemsText
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length === 0) {
    redirect("/teacher?error=missing_items");
  }

  const result = await publishTaskByTarget({
    supabase,
    category,
    title,
    items,
    itemKind,
    targetScope,
    studentIds,
  });

  if (!result.ok) {
    redirect(`/teacher?error=${result.reason ?? "publish_failed"}`);
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

export async function deleteTeacherTaskItemAction(formData: FormData) {
  const supabase = await createClient();

  const taskItemId = String(formData.get("taskItemId") ?? "").trim();

  if (!taskItemId) {
    redirect(buildTeacherRedirectPath(formData, { error: "delete_failed" }));
  }

  const { error } = await supabase.rpc("delete_teacher_task_item", {
    p_task_item_id: taskItemId,
  });

  if (error) {
    console.error("deleteTeacherTaskItemAction error:", error);
    redirect(buildTeacherRedirectPath(formData, { error: "delete_failed" }));
  }

  revalidatePath("/teacher");
  revalidatePath("/student");
  revalidatePath("/parent");

  redirect(buildTeacherRedirectPath(formData, { deleted: "1" }));
}

type BulkContactBookDraft = {
  title: string;
  category: TaskCategory;
  itemKind: AllowedItemKind;
  itemsText: string;
};

function normalizeBulkDraft(rawDraft: unknown): BulkContactBookDraft | null {
  if (!rawDraft || typeof rawDraft !== "object") {
    return null;
  }

  const draft = rawDraft as Record<string, unknown>;

  const title = typeof draft.title === "string" ? draft.title.trim() : "";
  const rawCategory =
    typeof draft.category === "string" ? draft.category : "";
  const rawItemKind =
    typeof draft.itemKind === "string" ? draft.itemKind : "";
  const itemsText =
    typeof draft.itemsText === "string" ? draft.itemsText.trim() : "";

  if (!title || !itemsText) {
    return null;
  }

  if (!allowedCategories.includes(rawCategory as TaskCategory)) {
    return null;
  }

  if (!isAllowedItemKind(rawItemKind)) {
    return null;
  }

  return {
    title,
    category: rawCategory as TaskCategory,
    itemKind: rawItemKind,
    itemsText,
  };
}

function getBulkDraftItems(itemsText: string) {
  return itemsText
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function publishTeacherTaskDraftsAction(formData: FormData) {
  const draftsJson = String(formData.get("draftsJson") ?? "");
  const targetScope = normalizeTargetScope(
    String(formData.get("targetScope") || "class")
  );
  const studentIds = normalizeStudentIdsJson(formData.get("studentIdsJson"));

  let parsedDrafts: unknown;

  try {
    parsedDrafts = JSON.parse(draftsJson);
  } catch (error) {
    console.error("publishTeacherTaskDraftsAction parse error:", error);
    redirect("/teacher?error=missing_items");
  }

  if (!Array.isArray(parsedDrafts)) {
    redirect("/teacher?error=missing_items");
  }

  const drafts = parsedDrafts
    .map((draft) => normalizeBulkDraft(draft))
    .filter((draft): draft is BulkContactBookDraft => Boolean(draft));

  if (drafts.length === 0) {
    redirect("/teacher?error=missing_items");
  }

  if (targetScope === "students" && studentIds.length === 0) {
    redirect("/teacher?error=missing_students");
  }

  const supabase = await createClient();

  for (const draft of drafts) {
    const items = getBulkDraftItems(draft.itemsText);

    if (items.length === 0) {
      redirect("/teacher?error=missing_items");
    }

    const result = await publishTaskByTarget({
      supabase,
      category: draft.category,
      title: draft.title,
      items,
      itemKind: draft.itemKind,
      targetScope,
      studentIds,
    });

    if (!result.ok) {
      redirect(`/teacher?error=${result.reason ?? "publish_failed"}`);
    }
  }

  revalidatePath("/teacher");
  revalidatePath("/student");
  revalidatePath("/parent");

  redirect("/teacher?published=1");
}