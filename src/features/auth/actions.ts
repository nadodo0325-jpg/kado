"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/kado";

const allowedRoles: UserRole[] = ["student", "parent", "teacher"];

function redirectByRole(role: UserRole) {
  if (role === "student") {
    redirect("/student");
  }

  if (role === "parent") {
    redirect("/parent");
  }

  if (role === "teacher") {
    redirect("/teacher");
  }

  redirect("/login?error=invalid_role");
}

export async function registerAction(formData: FormData) {
  const supabase = await createClient();

  const displayName = String(formData.get("displayName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "") as UserRole;

  if (!displayName || !email || !password || !allowedRoles.includes(role)) {
    redirect("/register?error=missing_fields");
  }

  if (password.length < 6) {
    redirect("/register?error=password_too_short");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        role,
      },
    },
  });

  if (error || !data.user) {
    redirect("/register?error=signup_failed");
  }

  redirect("/login?registered=1");
}

export async function loginAction(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=missing_fields");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect("/login?error=login_failed");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile || !allowedRoles.includes(profile.role)) {
    redirect("/login?error=profile_not_found");
  }

  redirectByRole(profile.role);
}

export async function logoutAction() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login?logged_out=1");
}