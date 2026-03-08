/**
 * Minimize a full name to "FirstName L." format for privacy.
 */
export function minimizeName(firstName: string, lastName: string): string {
  const first = firstName?.trim() || "Unknown";
  const lastInitial = lastName?.trim()?.[0];
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

/**
 * Safely log errors without exposing sensitive data.
 * Strips user data from error objects before logging.
 */
export function safeLogError(context: string, error: unknown): void {
  if (import.meta.env.PROD) {
    // In production, log only the context string
    console.error(context);
    return;
  }
  // In development, log more detail but still avoid raw objects
  console.error(context, error instanceof Error ? error.message : "Unknown error");
}
