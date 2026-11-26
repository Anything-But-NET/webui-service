import { NextResponse } from "next/server";
import { proxyCoreMutation } from "@/lib/bff";
import type { EscalationItem, EscalationResolutionStatus } from "@/lib/types";

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  return proxyCoreMutation<EscalationItem>({
    request,
    upstreamPath: `/api/v1/dash/escalations/${encodeURIComponent(id)}/status`,
    method: "PATCH",
    body: { status: body.status },
    fallbackErrorMessage: "Failed to update escalation status",
  });
}
