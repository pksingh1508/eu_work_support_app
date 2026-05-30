import { publicSupabase } from "@/lib/supabase";

const PRO_EMAIL_CHECK_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

export async function isEmailProUser(email: string) {
  const { data, error } = await withTimeout(
    Promise.resolve(
      publicSupabase.rpc("is_email_pro_user", {
        p_email: email,
      }),
    ),
    PRO_EMAIL_CHECK_TIMEOUT_MS,
    "Unable to check account verification right now.",
  );

  if (error) {
    throw error;
  }

  return Boolean(data);
}
