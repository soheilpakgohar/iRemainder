import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export interface AppSession {
  loggedIn?: boolean;
  // Unix ms expiry — we re-check on every protected request so a leaked
  // cookie can't be used forever even if it's still signature-valid.
  exp?: number;
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "iremainder_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  },
  ttl: SESSION_TTL_SECONDS,
};

/** Read or create the session from the request cookie. Server-only. */
export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<AppSession>(cookieStore, sessionOptions);
  return session;
}

/** True if the request carries a valid, non-expired operator session. */
export async function isLoggedIn(): Promise<boolean> {
  const session = await getSession();
  if (!session.loggedIn) return false;
  if (session.exp && Date.now() > session.exp) return false;
  return true;
}

/** Create a fresh logged-in session. */
export async function createSession() {
  const session = await getSession();
  session.loggedIn = true;
  session.exp = Date.now() + SESSION_TTL_SECONDS * 1000;
  await session.save();
}

/** Destroy the session (logout). */
export async function destroySession() {
  const session = await getSession();
  session.destroy();
}
