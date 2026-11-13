import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearAuthCookies, verifySameOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return NextResponse.json(
      { error_code: "FORBIDDEN", message: "Invalid request origin" },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  clearAuthCookies(cookieStore);

  return NextResponse.json({ ok: true });
}
