import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { KadoUser, UserRole } from "@/types/kado";

export const dashboardPathByRole: Record<UserRole, string> = {
  student: "/student",
  parent: "/parent",
  teacher: "/teacher",
};

export async function getCurrentProfile(): Promise<KadoUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(
      "id, role, email, display_name, avatar_url, aura_color, current_status, created_at, updated_at"
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return profile as KadoUser;
}

export async function requireRole(role: UserRole) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login?error=auth_required");
  }

  if (profile.role !== role) {
    redirect(dashboardPathByRole[profile.role]);
  }

  return profile;
}

export async function redirectIfAuthenticated() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return;
  }

  redirect(dashboardPathByRole[profile.role]);
}