import { supabase } from "@/lib/supabase";

export async function isEmailProUser(email: string) {
  const { data, error } = await supabase.rpc("is_email_pro_user", {
    p_email: email,
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}
