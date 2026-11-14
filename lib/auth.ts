import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { cookies } from "next/headers";
import { connection } from "next/server";
import type {
  DashboardErrorResponse,
  OperatorAuthority,
  OperatorStatus,
  SessionUser,
  TokensResponse,
} from "./types";

export const ACCESS_COOKIE = "dash_access_token";
export const REFRESH_COOKIE = "dash_refresh_token";
export const CORE_API_URL = process.env.CORE_API_URL ?? "http://localhost:8080";

interface RawAccessClaims {
  sub?: string;
  status?: OperatorStatus;
  authorities?: OperatorAuthority[];
  exp?: number;
}

const VALID_AUTHORITIES = new Set<OperatorAuthority>([
  "LOGS",
  "METADATA",
  "USERS",
  "OPERATORS",
]);

function baseCookieOptions(maxAge: number): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function setAuthCookies(
  cookieStore: ReadonlyRequestCookies,
  tokens: TokensResponse
): void {
  cookieStore.set(
    ACCESS_COOKIE,
    tokens.access_token,
    baseCookieOptions(tokens.access_expires_in)
  );
  cookieStore.set(
    REFRESH_COOKIE,
    tokens.refresh_token,
    baseCookieOptions(tokens.refresh_expires_in)
  );
}

export function clearAuthCookies(cookieStore: ReadonlyRequestCookies): void {
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export function decodeAccessToken(token: string): {
  user: SessionUser;
  expired: boolean;
} | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const claims = JSON.parse(json) as RawAccessClaims;

    if (!claims.sub || !claims.status) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    const expired = typeof claims.exp === "number" && claims.exp <= nowSec + 10;
    const authorities = Array.isArray(claims.authorities)
      ? claims.authorities.filter((a): a is OperatorAuthority =>
          VALID_AUTHORITIES.has(a)
        )
      : [];

    return {
      user: {
        email: claims.sub,
        status: claims.status,
        authorities,
      },
      expired,
    };
  } catch {
    return null;
  }
}

export type RefreshResult =
  | { ok: true; tokens: TokensResponse; user: SessionUser }
  | { ok: false; status: number; error: DashboardErrorResponse | null };

export async function refreshWithCore(
  refreshToken: string
): Promise<RefreshResult> {
  try {
    const res = await fetch(`${CORE_API_URL}/api/v1/dash/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });

    if (!res.ok) {
      const error = (await res
        .json()
        .catch(() => null)) as DashboardErrorResponse | null;
      return { ok: false, status: res.status, error };
    }

    const tokens = (await res.json()) as TokensResponse;
    const decoded = decodeAccessToken(tokens.access_token);
    if (!decoded) {
      return { ok: false, status: 500, error: null };
    }

    return { ok: true, tokens, user: decoded.user };
  } catch {
    return { ok: false, status: 503, error: null };
  }
}

export interface ServerSessionState {
  user: SessionUser | null;
  accessToken: string | null;
  needsCookieRefresh: boolean;
}

/**
 * Resolves the active session for Server Components without mutating cookies
 * (Next.js forbids cookie writes during RSC render; Client syncs via /api/auth/me).
 */
export async function getServerSession(): Promise<ServerSessionState> {
  await connection();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    const decoded = decodeAccessToken(accessToken);
    if (decoded && !decoded.expired && decoded.user.status === "ACTIVE") {
      return {
        user: decoded.user,
        accessToken,
        needsCookieRefresh: false,
      };
    }
  }

  if (refreshToken) {
    const refreshed = await refreshWithCore(refreshToken);
    if (refreshed.ok && refreshed.user.status === "ACTIVE") {
      return {
        user: refreshed.user,
        accessToken: refreshed.tokens.access_token,
        needsCookieRefresh: true,
      };
    }
  }

  return { user: null, accessToken: null, needsCookieRefresh: false };
}

/**
 * Lightweight CSRF protection for BFF mutation Route Handlers when using SameSite=Lax cookies.
 */
export function verifySameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
