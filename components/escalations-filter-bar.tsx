"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toIsoOrUndefined, toLocalDateTimeInput } from "@/lib/format";
import type { EscalationResolutionStatus } from "@/lib/types";

const STATUS_OPTIONS: Array<{
  value: EscalationResolutionStatus;
  label: string;
}> = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function EscalationsFilterBar({
  initialStatus,
  initialQueryId,
  initialFrom,
  initialTo,
  size,
}: {
  initialStatus?: EscalationResolutionStatus;
  initialQueryId?: string;
  initialFrom?: string;
  initialTo?: string;
  size: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(initialStatus ?? "ALL");
  const [queryId, setQueryId] = useState<string>(initialQueryId ?? "");
  const [fromLocal, setFromLocal] = useState<string>(() =>
    toLocalDateTimeInput(initialFrom)
  );
  const [toLocal, setToLocal] = useState<string>(() =>
    toLocalDateTimeInput(initialTo)
  );

  function applyFilters(
    nextStatus: string,
    nextQueryId: string,
    nextFromLocal: string,
    nextToLocal: string
  ) {
    const sp = new URLSearchParams();
    sp.set("page", "0");
    sp.set("size", String(size));
    if (nextStatus !== "ALL") sp.set("status", nextStatus);
    if (nextQueryId.trim()) sp.set("query_id", nextQueryId.trim());
    const fromIso = toIsoOrUndefined(nextFromLocal);
    const toIso = toIsoOrUndefined(nextToLocal);
    if (fromIso) sp.set("from", fromIso);
    if (toIso) sp.set("to", toIso);
    router.push(`/escalations?${sp.toString()}`);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    applyFilters(status, queryId, fromLocal, toLocal);
  }

  function handleReset() {
    setStatus("ALL");
    setQueryId("");
    setFromLocal("");
    setToLocal("");
    router.push(`/escalations?page=0&size=${size}`);
  }

  const hasFilters =
    status !== "ALL" ||
    queryId.trim() !== "" ||
    fromLocal !== "" ||
    toLocal !== "";

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 border border-border bg-card p-3 items-end"
    >
      <div className="flex flex-col gap-1">
        <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Status
        </label>
        <Select
          value={status}
          onValueChange={(val) => {
            const next = val ?? "ALL";
            setStatus(next);
            applyFilters(next, queryId, fromLocal, toLocal);
          }}
        >
          <SelectTrigger className="h-8 w-full font-mono text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="esc-filter-query-id"
          className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
        >
          Query ID
        </label>
        <Input
          id="esc-filter-query-id"
          value={queryId}
          onChange={(e) => setQueryId(e.target.value)}
          placeholder="Exact query_id..."
          className="h-8 font-mono text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="esc-filter-from"
          className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
        >
          From
        </label>
        <Input
          id="esc-filter-from"
          type="datetime-local"
          value={fromLocal}
          onChange={(e) => setFromLocal(e.target.value)}
          className="h-8 font-mono text-xs"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="esc-filter-to"
          className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
        >
          To
        </label>
        <Input
          id="esc-filter-to"
          type="datetime-local"
          value={toLocal}
          onChange={(e) => setToLocal(e.target.value)}
          className="h-8 font-mono text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" className="flex-1 gap-1.5">
          <Search className="size-3.5" />
          <span>Apply</span>
        </Button>
        {hasFilters && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleReset}
            aria-label="Reset filters"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        )}
      </div>
    </form>
  );
}
