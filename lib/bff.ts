import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  clearAuthCookies,
  CORE_API_URL,
  decodeAccessToken,
  REFRESH_COOKIE,
  refreshWithCore,
  setAuthCookies,
  verifySameOrigin,
} from "./auth";
import type { DashboardErrorResponse } from "./types";

export async function resolveAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    const decoded = decodeAccessToken(accessToken);
    if (decoded && !decoded.expired) {
      return accessToken;
    }
  }

  if (refreshToken) {
    const refreshed = await refreshWithCore(refreshToken);
    if (refreshed.ok) {
      setAuthCookies(cookieStore, refreshed.tokens);
      return refreshed.tokens.access_token;
    }
  }

  clearAuthCookies(cookieStore);
  return null;
}

export async function proxyCoreMutation<TResponse>({
  request,
  upstreamPath,
  method,
  body,
  fallbackErrorMessage,
}: {
  request: Request;
  upstreamPath: string;
  method: "PATCH" | "PUT" | "POST";
  body: unknown;
  fallbackErrorMessage: string;
}): Promise<NextResponse> {
  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { error_code: "FORBIDDEN", message: "Invalid request origin" },
      { status: 403 }
    );
  }

  const accessToken = await resolveAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error_code: "UNAUTHORIZED", message: "Session expired" },
      { status: 401 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${CORE_API_URL}${upstreamPath}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error_code: "INTERNAL_ERROR", message: "Core service unavailable" },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    let errorBody: Partial<DashboardErrorResponse> | null = null;
    try {
      errorBody = (await upstream.json()) as Partial<DashboardErrorResponse>;
    } catch {
      errorBody = null;
    }

    return NextResponse.json(
      {
        error_code: errorBody?.error_code ?? "INTERNAL_ERROR",
        message: errorBody?.message ?? fallbackErrorMessage,
      },
      { status: upstream.status }
    );
  }

  const updated = (await upstream.json()) as TResponse;
  return NextResponse.json(updated);
}
