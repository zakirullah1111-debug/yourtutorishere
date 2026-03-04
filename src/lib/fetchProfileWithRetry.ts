import { supabase } from "@/integrations/supabase/client";

export async function fetchProfileWithRetry(
  userId: string,
  maxRetries = 5,
  delayMs = 800
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) return data;

    if (attempt < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

export async function fetchUserRoleWithRetry(
  userId: string,
  maxRetries = 5,
  delayMs = 800
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.role) return data.role;

    if (attempt < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return "student"; // fallback
}

export async function checkTutorProfileComplete(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("tutors")
    .select("profile_complete")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.profile_complete === true;
}
