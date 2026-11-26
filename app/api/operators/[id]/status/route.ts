import { NextResponse } from "next/server";
import { proxyCoreMutation } from "@/lib/bff";
import type { OperatorItem, OperatorStatus } from "@/lib/types";

interface StatusPayload {
  status?: OperatorStatus;
}

const VALID_STATUSES = new Set<OperatorStatus>(["ACTIVE", "BLOCKED"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let body: StatusPayload;
  try {
    body = (await request.json()) as StatusPayload;
  } catch {
    return NextResponse.json(
      { error_code: "BAD_REQUEST", message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (!body.status || !VALID_STATUSES.has(body.status)) {
    return NextResponse.json(
      { error_code: "BAD_REQUEST", message: "Status must be ACTIVE or BLOCKED" },
      { status: 400 }
    );
  }

  return proxyCoreMutation<OperatorItem>({
    request,
    upstreamPath: `/api/v1/dash/operators/${encodeURIComponent(id)}/status`,
    method: "PATCH",
    body: { status: body.status },
    fallbackErrorMessage: "Failed to update operator status",
  });
}
