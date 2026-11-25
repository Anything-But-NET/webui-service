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
} from "@/lib/auth";
import type {
  DashboardErrorResponse,
  EscalationItem,
  EscalationResolutionStatus,
} from "@/lib/types";

interface EscalationStatusPayload {
  status?: EscalationResolutionStatus;
}

const VALID_STATUSES = new Set<EscalationResolutionStatus>([
  "PENDING",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
]);

async function resolveAccessToken(): Promise<string | null> {
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { error_code: "FORBIDDEN", message: "Invalid request origin" },
      { status: 403 }
    );
  }

  const { id } = await context.params;

  let body: EscalationStatusPayload;
  try {
    body = (await request.json()) as EscalationStatusPayload;
  } catch {
    return NextResponse.json(
      { error_code: "BAD_REQUEST", message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (!body.status || !VALID_STATUSES.has(body.status)) {
    return NextResponse.json(
      { error_code: "BAD_REQUEST", message: "Invalid escalation status" },
      { status: 400 }
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
    upstream = await fetch(
      `${CORE_API_URL}/api/v1/dash/escalations/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: body.status }),
        cache: "no-store",
      }
    );
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
        message: errorBody?.message ?? "Failed to update escalation status",
      },
      { status: upstream.status }
    );
  }

  const updated = (await upstream.json()) as EscalationItem;
  return NextResponse.json(updated);
}
