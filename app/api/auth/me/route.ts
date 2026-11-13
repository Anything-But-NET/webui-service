import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  clearAuthCookies,
  decodeAccessToken,
  REFRESH_COOKIE,
  refreshWithCore,
  setAuthCookies,
} from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    const decoded = decodeAccessToken(accessToken);
    if (decoded && !decoded.expired) {
      return NextResponse.json({ user: decoded.user });
    }
  }

  if (refreshToken) {
    const refreshed = await refreshWithCore(refreshToken);
    if (refreshed.ok) {
      setAuthCookies(cookieStore, refreshed.tokens);
      return NextResponse.json({ user: refreshed.user });
    }
  }

  clearAuthCookies(cookieStore);
  return NextResponse.json(
    { error_code: "UNAUTHORIZED", message: "Not authenticated" },
    { status: 401 }
  );
}
