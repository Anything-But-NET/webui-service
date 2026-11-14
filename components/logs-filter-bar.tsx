"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import type {
  ErrorCategory,
  GenerationOutcome,
  SyncStatus,
} from "@/lib/types";

const SYNC_STATUSES: SyncStatus[] = [
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED_FETCH",
  "FAILED_PARSE",
  "FAILED_STORAGE",
];

const GENERATION_OUTCOMES: GenerationOutcome[] = ["SUCCESS", "FAILURE"];

const ERROR_CATEGORIES: ErrorCategory[] = [
  "VALIDATION_ERROR",
  "RETRIEVAL_TIMEOUT",
  "VECTOR_DB_UNAVAILABLE",
  "LLM_PROVIDER_ERROR",
  "INTERNAL_ERROR",
  "INTERNAL_CONNECTION_ERROR",
];

const ALL_VALUE = "__ALL__";

export function IngestionFilterBar({
  initialStatus,
  initialDocumentId,
  initialFrom,
  initialTo,
  size,
}: {
  initialStatus?: SyncStatus;
  initialDocumentId?: string;
  initialFrom?: string;
  initialTo?: string;
  size: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState<string>(initialStatus ?? ALL_VALUE);
  const [documentId, setDocumentId] = useState<string>(initialDocumentId ?? "");
  const [fromLocal, setFromLocal] = useState<string>(() =>
    toLocalDateTimeInput(initialFrom)
  );
  const [toLocal, setToLocal] = useState<string>(() =>
    toLocalDateTimeInput(initialTo)
  );

  function handleApply(e: FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    sp.set("page", "0");
    sp.set("size", String(size));
    if (status !== ALL_VALUE) sp.set("status", status);
    if (documentId.trim()) sp.set("document_id", documentId.trim());
    const fromIso = toIsoOrUndefined(fromLocal);
    const toIso = toIsoOrUndefined(toLocal);
    if (fromIso) sp.set("from", fromIso);
    if (toIso) sp.set("to", toIso);
    router.push(`${pathname}?${sp.toString()}`);
  }

  function handleReset() {
    setStatus(ALL_VALUE);
    setDocumentId("");
    setFromLocal("");
    setToLocal("");
    router.push(pathname);
  }

  return (
    <form
      onSubmit={handleApply}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 border border-border bg-card p-4 items-end"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Status
        </label>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value ?? ALL_VALUE)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
            {SYNC_STATUSES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filter-document-id"
          className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          Document ID
        </label>
        <Input
          id="filter-document-id"
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
          placeholder="doc-123"
          className="font-mono text-xs"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filter-from"
          className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          From
        </label>
        <Input
          id="filter-from"
          type="datetime-local"
          value={fromLocal}
          onChange={(e) => setFromLocal(e.target.value)}
          className="font-mono text-xs"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="filter-to"
          className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          To
        </label>
        <Input
          id="filter-to"
          type="datetime-local"
          value={toLocal}
          onChange={(e) => setToLocal(e.target.value)}
          className="font-mono text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" className="flex-1 gap-1.5">
          <Search className="size-3.5" />
          <span>Filter</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          aria-label="Reset filters"
        >
          <RotateCcw className="size-3.5" />
        </Button>
      </div>
    </form>
  );
}

export function GenerationFilterBar({
  initialOutcome,
  initialErrorCategory,
  initialFrom,
  initialTo,
  size,
}: {
  initialOutcome?: GenerationOutcome;
  initialErrorCategory?: ErrorCategory;
  initialFrom?: string;
  initialTo?: string;
  size: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [outcome, setOutcome] = useState<string>(initialOutcome ?? ALL_VALUE);
  const [errorCategory, setErrorCategory] = useState<string>(
    initialErrorCategory ?? ALL_VALUE
  );
  const [fromLocal, setFromLocal] = useState<string>(() =>
    toLocalDateTimeInput(initialFrom)
  );
  const [toLocal, setToLocal] = useState<string>(() =>
    toLocalDateTimeInput(initialTo)
  );

  function handleApply(e: FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    sp.set("page", "0");
    sp.set("size", String(size));
    if (outcome !== ALL_VALUE) sp.set("outcome", outcome);
    if (errorCategory !== ALL_VALUE) sp.set("error_category", errorCategory);
    const fromIso = toIsoOrUndefined(fromLocal);
    const toIso = toIsoOrUndefined(toLocal);
    if (fromIso) sp.set("from", fromIso);
    if (toIso) sp.set("to", toIso);
    router.push(`${pathname}?${sp.toString()}`);
  }

  function handleReset() {
    setOutcome(ALL_VALUE);
    setErrorCategory(ALL_VALUE);
    setFromLocal("");
    setToLocal("");
    router.push(pathname);
  }

  return (
    <form
      onSubmit={handleApply}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 border border-border bg-card p-4 items-end"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Outcome
        </label>
        <Select
          value={outcome}
          onValueChange={(value) => setOutcome(value ?? ALL_VALUE)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All outcomes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All outcomes</SelectItem>
            {GENERATION_OUTCOMES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Error Category
        </label>
        <Select
          value={errorCategory}
          onValueChange={(value) => setErrorCategory(value ?? ALL_VALUE)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All categories</SelectItem>
            {ERROR_CATEGORIES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="gen-filter-from"
          className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          From
        </label>
        <Input
          id="gen-filter-from"
          type="datetime-local"
          value={fromLocal}
          onChange={(e) => setFromLocal(e.target.value)}
          className="font-mono text-xs"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="gen-filter-to"
          className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          To
        </label>
        <Input
          id="gen-filter-to"
          type="datetime-local"
          value={toLocal}
          onChange={(e) => setToLocal(e.target.value)}
          className="font-mono text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" className="flex-1 gap-1.5">
          <Search className="size-3.5" />
          <span>Filter</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          aria-label="Reset filters"
        >
          <RotateCcw className="size-3.5" />
        </Button>
      </div>
    </form>
  );
}
