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

function normalizeCategory(value: string) {
  return allowedCategories.includes(value as TaskCategory) ? value : "todo";
}

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

export async function setStudentStatusAction(formData: FormData) {
  const supabase = await createClient();

  const studentStatus = String(formData.get("studentStatus") || "") as StudentStatus;
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