import { createClient } from "@/lib/supabase/server";
import type { MoodStatus } from "@/lib/constants/status";

const allowedMoods: MoodStatus[] = [
  "high_energy",
  "stable",
  "tired",
  "low_pressure",
];

type TodayMoodRow = {
  mood: MoodStatus;
  checkin_date: string;
  created_at: string;
};

export async function getTodayMoodCheckin(): Promise<MoodStatus | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_my_today_mood_checkin");

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[0] as TodayMoodRow;

  if (!allowedMoods.includes(row.mood)) {
    return null;
  }

  return row.mood;
}