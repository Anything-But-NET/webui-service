import { NextResponse } from "next/server";
import { proxyCoreMutation } from "@/lib/bff";
import type { EscalationDetail, EscalationResolutionStatus } from "@/lib/types";

interface EscalationResponsePayload {
  resolution_text?: unknown;
  status?: EscalationResolutionStatus | null;
}

const MAX_RESPONSE_LENGTH = 20_000;

const VALID_TARGET_STATUSES = new Set<EscalationResolutionStatus>([
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
]);

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let body: EscalationResponsePayload;
  try {
    body = (await request.json()) as EscalationResponsePayload;
  } catch {
    return NextResponse.json(
      { error_code: "BAD_REQUEST", message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const resolutionText =
    typeof body.resolution_text === "string" ? body.resolution_text.trim() : "";

  if (!resolutionText) {
    return NextResponse.json(
      { error_code: "BAD_REQUEST", message: "Expert response must not be empty" },
      { status: 400 }
    );
  }

  if (resolutionText.length > MAX_RESPONSE_LENGTH) {
    return NextResponse.json(
      {
        error_code: "BAD_REQUEST",
        message: `Expert response must be ${MAX_RESPONSE_LENGTH} characters or fewer`,
      },
      { status: 400 }
    );
  }

  if (
    body.status !== undefined &&
    body.status !== null &&
    !VALID_TARGET_STATUSES.has(body.status)
  ) {
    return NextResponse.json(
      { error_code: "BAD_REQUEST", message: "Invalid target escalation status" },
      { status: 400 }
    );
  }

  return proxyCoreMutation<EscalationDetail>({
    request,
    upstreamPath: `/api/v1/dash/escalations/${encodeURIComponent(id)}/response`,
    method: "PUT",
    body: {
      resolution_text: resolutionText,
      ...(body.status ? { status: body.status } : {}),
    },
    fallbackErrorMessage: "Failed to save expert response",
  });
}
