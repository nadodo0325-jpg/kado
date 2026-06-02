import { createClient } from "@/lib/supabase/server";

export type StudentInteraction = {
  id: string;
  parent_id: string;
  parent_name: string;
  interaction_type: "pat" | "energy" | "ok";
  created_at: string;
};

export async function getStudentRecentInteractions(): Promise<
  StudentInteraction[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_my_student_recent_interactions"
  );

  if (error || !data) {
    return [];
  }

  return data as StudentInteraction[];
}