import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { isLoggedIn } from "./session";

/**
 * Auth model: a single shared operator password.
 *
 * The plaintext password is NEVER stored. We keep its SHA-256 hash in
 * OPERATOR_PASSWORD_HASH (env). On login we hash the entered password
 * and compare. On success we issue a signed httpOnly session cookie
 * (iron-session). See docs/adr/0001-shared-password-sha256-auth.md.
 */

/** SHA-256 hex digest of an arbitrary string. */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Constant-time-ish string comparison to avoid trivial timing leaks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** Verify an entered password against the env hash. */
export function verifyPassword(entered: string): boolean {
  const expected = process.env.OPERATOR_PASSWORD_HASH;
  if (!expected) return false;
  return safeEqual(sha256Hex(entered), expected);
}

/**
 * Guard for server components and server actions.
 * Redirects to /login if not authenticated.
 */
export async function requireOperator(): Promise<void> {
  const ok = await isLoggedIn();
  if (!ok) redirect("/login");
}
