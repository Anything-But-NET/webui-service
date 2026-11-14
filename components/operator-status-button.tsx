"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import type { DashboardErrorResponse, OperatorStatus } from "@/lib/types";

export function OperatorStatusButton({
  operatorId,
  operatorEmail,
  currentStatus,
}: {
  operatorId: string;
  operatorEmail: string;
  currentStatus: OperatorStatus;
}) {
  const router = useRouter();
  const { user } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelf = user?.email === operatorEmail;
  const nextStatus: OperatorStatus =
    currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";

  async function handleToggle() {
    setError(null);
    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/operators/${encodeURIComponent(operatorId)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
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
      setError("Network error while updating operator");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={currentStatus === "ACTIVE" ? "destructive" : "outline"}
        size="xs"
        disabled={isUpdating || isSelf}
        title={isSelf ? "Cannot block your own active session" : undefined}
        onClick={() => void handleToggle()}
        className="gap-1.5"
      >
        {isUpdating ? (
          <Loader2 className="size-3 animate-spin" />
        ) : currentStatus === "ACTIVE" ? (
          <ShieldOff className="size-3" />
        ) : (
          <ShieldCheck className="size-3" />
        )}
        <span>{currentStatus === "ACTIVE" ? "Block" : "Activate"}</span>
      </Button>
      {error && (
        <span className="text-[11px] text-destructive font-mono">{error}</span>
      )}
    </div>
  );
}
