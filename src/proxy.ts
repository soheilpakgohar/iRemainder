import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionOptions } from "iron-session";

interface AppSession {
  loggedIn?: boolean;
  exp?: number;
}

// Duplicated session config (middleware can't import server-only `next/headers`).
const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "iremainder_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  },
  ttl: 60 * 60 * 24 * 7,
};

// Paths that don't require authentication.
const PUBLIC_PATHS = ["/login"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  const res = NextResponse.next();
  const session = await getIronSession<AppSession>(req, res, sessionOptions);

  const valid =
    session.loggedIn === true &&
    (!session.exp || Date.now() < session.exp);

  if (!valid && !isPublic) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in hitting /login → bounce to home.
  if (valid && isPublic) {
    const homeUrl = req.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return res;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
