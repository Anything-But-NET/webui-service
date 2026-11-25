"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EscalationResolutionStatus } from "@/lib/types";

const STATUS_OPTIONS: Array<{
  value: EscalationResolutionStatus;
  label: string;
}> = [
  { value: "PENDING", label: "PENDING" },
  { value: "IN_PROGRESS", label: "IN_PROGRESS" },
  { value: "RESOLVED", label: "RESOLVED" },
  { value: "CLOSED", label: "CLOSED" },
  { value: "CANCELLED", label: "CANCELLED" },
];

export function EscalationsFilterBar({
  initialStatus,
  initialQueryId,
  size,
}: {
  initialStatus?: EscalationResolutionStatus;
  initialQueryId?: string;
  size: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(initialStatus ?? "ALL");
  const [queryId, setQueryId] = useState<string>(initialQueryId ?? "");

  function applyFilters(nextStatus: string, nextQueryId: string) {
    const sp = new URLSearchParams();
    sp.set("page", "0");
    sp.set("size", String(size));
    if (nextStatus !== "ALL") sp.set("status", nextStatus);
    if (nextQueryId.trim()) sp.set("query_id", nextQueryId.trim());
    router.push(`/escalations?${sp.toString()}`);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    applyFilters(status, queryId);
  }

  function handleReset() {
    setStatus("ALL");
    setQueryId("");
    router.push(`/escalations?page=0&size=${size}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 border border-border bg-card p-3"
    >
      <div className="flex flex-col gap-1 min-w-40">
        <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Status
        </label>
        <Select
          value={status}
          onValueChange={(val) => {
            const next = val ?? "ALL";
            setStatus(next);
            applyFilters(next, queryId);
          }}
        >
          <SelectTrigger className="h-8 font-mono text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-48 max-w-xs">
        <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Query ID
        </label>
        <Input
          value={queryId}
          onChange={(e) => setQueryId(e.target.value)}
          placeholder="Exact query_id..."
          className="h-8 font-mono text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" variant="secondary">
          Apply
        </Button>
        {(status !== "ALL" || queryId.trim() !== "") && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleReset}
          >
            Reset
          </Button>
        )}
      </div>
    </form>
  );
}
