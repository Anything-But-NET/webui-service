import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorPanel } from "@/components/error-panel";
import { GenerationFilterBar } from "@/components/logs-filter-bar";
import { PageHeader, TableSkeleton } from "@/components/page-shell";
import { PaginationBar } from "@/components/pagination-bar";
import {
  ChatChannelBadge,
  ErrorCategoryBadge,
  GenerationOutcomeBadge,
  ReasonCodeBadge,
} from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchGenerationLogs } from "@/lib/core-api";
import {
  formatDateTime,
  parsePageParam,
  parseSizeParam,
  singleParam,
} from "@/lib/format";
import type { ErrorCategory, GenerationOutcome } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const VALID_OUTCOMES = new Set<GenerationOutcome>([
  "ANSWERED",
  "SAFE_NO_ANSWER",
  "ESCALATED",
  "FAILURE",
]);
const VALID_ERROR_CATEGORIES = new Set<ErrorCategory>([
  "VALIDATION_ERROR",
  "RETRIEVAL_TIMEOUT",
  "VECTOR_DB_UNAVAILABLE",
  "LLM_PROVIDER_ERROR",
  "INTERNAL_ERROR",
  "INTERNAL_CONNECTION_ERROR",
]);

async function GenerationLogsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = parsePageParam(sp.page, 0);
  const size = parseSizeParam(sp.size, 20);
  const rawOutcome = singleParam(sp.outcome);
  const outcome =
    rawOutcome && VALID_OUTCOMES.has(rawOutcome as GenerationOutcome)
      ? (rawOutcome as GenerationOutcome)
      : undefined;
  const rawCategory = singleParam(sp.error_category);
  const error_category =
    rawCategory && VALID_ERROR_CATEGORIES.has(rawCategory as ErrorCategory)
      ? (rawCategory as ErrorCategory)
      : undefined;
  const from = singleParam(sp.from);
  const to = singleParam(sp.to);

  const result = await fetchGenerationLogs({
    page,
    size,
    outcome,
    error_category,
    from,
    to,
  });

  if (!result.ok) {
    if (result.status === 401) redirect("/login");
    return <ErrorPanel status={result.status} message={result.message} />;
  }

  const data = result.data;
  const filterKey = `${outcome ?? ""}|${error_category ?? ""}|${from ?? ""}|${to ?? ""}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Generation Logs" />

      <GenerationFilterBar
        key={filterKey}
        initialOutcome={outcome}
        initialErrorCategory={error_category}
        initialFrom={from}
        initialTo={to}
        size={size}
      />

      <div className="border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-muted/40">
              <TableHead className="px-4">Query ID</TableHead>
              <TableHead className="px-4">Channel</TableHead>
              <TableHead className="px-4">Outcome</TableHead>
              <TableHead className="px-4">Reason</TableHead>
              <TableHead className="px-4">Error Category</TableHead>
              <TableHead className="px-4">Confidence</TableHead>
              <TableHead className="px-4">Latency</TableHead>
              <TableHead className="px-4">Prompt</TableHead>
              <TableHead className="px-4">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No generation logs match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="px-4 font-mono text-xs text-foreground">
                    {log.query_id}
                  </TableCell>
                  <TableCell className="px-4">
                    <ChatChannelBadge channel={log.channel} />
                  </TableCell>
                  <TableCell className="px-4">
                    {log.escalation_id ? (
                      <Link
                        href={`/escalations/${log.escalation_id}`}
                        className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                        title="View escalation"
                      >
                        <GenerationOutcomeBadge outcome={log.outcome} />
                      </Link>
                    ) : (
                      <GenerationOutcomeBadge outcome={log.outcome} />
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <ReasonCodeBadge reasonCode={log.reason_code} />
                  </TableCell>
                  <TableCell className="px-4">
                    <ErrorCategoryBadge category={log.error_category} />
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs tabular-nums">
                    {log.confidence_score != null ? (
                      <span className="text-foreground">
                        {log.confidence_score.toFixed(3)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not scored</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs tabular-nums">
                    {log.latency_ms != null ? (
                      <span className="text-foreground">
                        {log.latency_ms.toLocaleString("en-US")} ms
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not recorded</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs">
                    {log.prompt_version_id ? (
                      <Link
                        href={`/prompts/${log.prompt_version_id}`}
                        className="text-brand hover:underline"
                        title={log.prompt_version_id}
                      >
                        {log.prompt_version_id.slice(0, 8)}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationBar
        page={data.page}
        size={data.size}
        totalElements={data.total_elements}
        totalPages={data.total_pages}
      />
    </div>
  );
}

export default function GenerationLogsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <GenerationLogsContent searchParams={searchParams} />
    </Suspense>
  );
}
