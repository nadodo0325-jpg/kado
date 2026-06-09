"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TaskCategory } from "@/lib/constants/categories";
import type { MoodStatus, StudentStatus } from "@/lib/constants/status";
import { createClient } from "@/lib/supabase/server";

const allowedMoods: MoodStatus[] = [
  "high_energy",
  "stable",
  "tired",
  "low_pressure",
];

const allowedStudentStatuses: StudentStatus[] = ["moving", "home", "flow"];

const allowedCategories: TaskCategory[] = [
  "homework",
  "quiz",
  "todo",
  "others",
];

function normalizeCategory(value: string): TaskCategory {
  return allowedCategories.includes(value as TaskCategory)
    ? (value as TaskCategory)
    : "todo";
}

/**
 * 舊版表單用 action：保留給原本 form action 使用。
 * 會 revalidate + redirect，所以手機會比較卡。
 */
export async function setMoodCheckinAction(formData: FormData) {
  const supabase = await createClient();

  const mood = String(formData.get("mood") || "") as MoodStatus;
  const category = normalizeCategory(String(formData.get("category") || "todo"));

  if (!allowedMoods.includes(mood)) {
    redirect(`/student?category=${category}&mood=failed`);
  }

  const { error } = await supabase.rpc("set_my_mood_checkin", {
    p_mood: mood,
  });

  if (error) {
    console.error("setMoodCheckinAction error:", error);
    redirect(`/student?category=${category}&mood=failed`);
  }

  revalidatePath("/student");

  redirect(`/student?category=${category}&mood=updated`);
}

/**
 * 新版手機順版 action：只寫入 Supabase，不刷新、不 redirect。
 */
export async function setMoodCheckinSilentAction(formData: FormData) {
  const supabase = await createClient();

  const mood = String(formData.get("mood") || "") as MoodStatus;

  if (!allowedMoods.includes(mood)) {
    return {
      ok: false,
      error: "INVALID_MOOD",
    };
  }

  const { error } = await supabase.rpc("set_my_mood_checkin", {
    p_mood: mood,
  });

  if (error) {
    console.error("setMoodCheckinSilentAction error:", error);

    return {
      ok: false,
      error: "DATABASE_ERROR",
    };
  }

  return {
    ok: true,
  };
}

/**
 * 舊版表單用 action：保留給原本 form action 使用。
 * 會 revalidate + redirect，所以手機會比較卡。
 */
export async function setStudentStatusAction(formData: FormData) {
  const supabase = await createClient();

  const studentStatus = String(
    formData.get("studentStatus") || ""
  ) as StudentStatus;

  const category = normalizeCategory(String(formData.get("category") || "todo"));

  if (!allowedStudentStatuses.includes(studentStatus)) {
    redirect(`/student?category=${category}&student_status=failed`);
  }

  const { error } = await supabase.rpc("set_my_student_status", {
    p_status: studentStatus,
  });

  if (error) {
    console.error("setStudentStatusAction error:", error);
    redirect(`/student?category=${category}&student_status=failed`);
  }

  revalidatePath("/student");
  revalidatePath("/parent");

  redirect(`/student?category=${category}&student_status=updated`);
}

/**
 * 新版手機順版 action：只寫入 Supabase，不刷新、不 redirect。
 */
export async function setStudentStatusSilentAction(formData: FormData) {
  const supabase = await createClient();

  const studentStatus = String(
    formData.get("studentStatus") || ""
  ) as StudentStatus;

  if (!allowedStudentStatuses.includes(studentStatus)) {
    return {
      ok: false,
      error: "INVALID_STUDENT_STATUS",
    };
  }

  const { error } = await supabase.rpc("set_my_student_status", {
    p_status: studentStatus,
  });

  if (error) {
    console.error("setStudentStatusSilentAction error:", error);

    return {
      ok: false,
      error: "DATABASE_ERROR",
    };
  }

  return {
    ok: true,
  };
}