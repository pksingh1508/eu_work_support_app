type ClerkErrorLike = {
  errors?: Array<{ message?: string; longMessage?: string }>;
  message?: string;
};

export function getAuthErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const clerkError = error as ClerkErrorLike;
  const firstError = clerkError.errors?.[0];

  return firstError?.longMessage ?? firstError?.message ?? clerkError.message ?? fallback;
}

