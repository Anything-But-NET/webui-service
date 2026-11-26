"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  DashboardErrorResponse,
  EscalationResolutionStatus,
} from "@/lib/types";

const NEXT_ACTIONS: Record<
  EscalationResolutionStatus,
  Array<{ status: EscalationResolutionStatus; label: string; variant: "default" | "outline" | "destructive" }>
> = {
  PENDING: [
    { status: "IN_PROGRESS", label: "Start Work", variant: "default" },
    { status: "RESOLVED", label: "Mark Resolved", variant: "outline" },
    { status: "CANCELLED", label: "Cancel", variant: "destructive" },
  ],
  IN_PROGRESS: [
    { status: "RESOLVED", label: "Mark Resolved", variant: "default" },
    { status: "CLOSED", label: "Close", variant: "outline" },
    { status: "CANCELLED", label: "Cancel", variant: "destructive" },
  ],
  RESOLVED: [{ status: "CLOSED", label: "Close", variant: "outline" }],
  CLOSED: [],
  CANCELLED: [],
};

export function EscalationStatusActions({
  escalationId,
  currentStatus,
}: {
  escalationId: string;
  currentStatus: EscalationResolutionStatus;
}) {
  const router = useRouter();
  const [updatingTo, setUpdatingTo] =
    useState<EscalationResolutionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = NEXT_ACTIONS[currentStatus] ?? [];
  if (actions.length === 0) {
    return null;
  }

  async function handleTransition(targetStatus: EscalationResolutionStatus) {
    setError(null);
    setUpdatingTo(targetStatus);
    try {
      const response = await fetch(
        `/api/escalations/${encodeURIComponent(escalationId)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetStatus }),
        }
      );

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as
          | Partial<DashboardErrorResponse>
          | null;
        setError(err?.message ?? `Update failed (${response.status})`);
        return;
      }

      router.refresh();
    } catch {
      setError("Network error while updating status");
    } finally {
      setUpdatingTo(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.status}
            variant={action.variant}
            size="sm"
            disabled={updatingTo !== null}
            onClick={() => void handleTransition(action.status)}
            className="gap-1.5"
          >
            {updatingTo === action.status && (
              <Loader2 className="size-3.5 animate-spin" />
            )}
            <span>{action.label}</span>
          </Button>
        ))}
      </div>
      {error && (
        <span className="font-mono text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
