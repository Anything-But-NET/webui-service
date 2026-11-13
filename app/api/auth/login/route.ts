import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  CORE_API_URL,
  decodeAccessToken,
  setAuthCookies,
  verifySameOrigin,
} from "@/lib/auth";
import type { DashboardErrorResponse, TokensResponse } from "@/lib/types";

interface LoginPayload {
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { error_code: "FORBIDDEN", message: "Invalid request origin" },
      { status: 403 }
    );
  }

  let body: LoginPayload;
  try {
    body = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json(
      { error_code: "BAD_REQUEST", message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error_code: "BAD_REQUEST", message: "Email and password are required" },
      { status: 400 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${CORE_API_URL}/api/v1/dash/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error_code: "INTERNAL_ERROR", message: "Authentication service unavailable" },
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
        error_code: errorBody?.error_code ?? "UNAUTHORIZED",
        message: errorBody?.message ?? "Invalid credentials",
      },
      { status: upstream.status }
    );
  }

  const tokens = (await upstream.json()) as TokensResponse;
  const decoded = decodeAccessToken(tokens.access_token);
  if (!decoded) {
    return NextResponse.json(
      { error_code: "INTERNAL_ERROR", message: "Malformed access token from backend" },
      { status: 502 }
    );
  }

  const cookieStore = await cookies();
  setAuthCookies(cookieStore, tokens);

  return NextResponse.json({ user: decoded.user });
}
