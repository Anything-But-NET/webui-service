import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorPanel } from "@/components/error-panel";
import { EscalationsFilterBar } from "@/components/escalations-filter-bar";
import { PageHeader, TableSkeleton } from "@/components/page-shell";
import { PaginationBar } from "@/components/pagination-bar";
import {
  ChatChannelBadge,
  EscalationStatusBadge,
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
import { fetchEscalations } from "@/lib/core-api";
import {
  formatDateTime,
  parsePageParam,
  parseSizeParam,
  singleParam,
} from "@/lib/format";
import type { EscalationResolutionStatus } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const VALID_STATUSES = new Set<EscalationResolutionStatus>([
  "PENDING",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
]);

async function EscalationsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = parsePageParam(sp.page, 0);
  const size = parseSizeParam(sp.size, 20);
  const rawStatus = singleParam(sp.status);
  const status =
    rawStatus && VALID_STATUSES.has(rawStatus as EscalationResolutionStatus)
      ? (rawStatus as EscalationResolutionStatus)
      : undefined;
  const query_id = singleParam(sp.query_id);

  const result = await fetchEscalations({ page, size, status, query_id });
  if (!result.ok) {
    if (result.status === 401) redirect("/login");
    return <ErrorPanel status={result.status} message={result.message} />;
  }

  const data = result.data;
  const filterKey = `${status ?? ""}|${query_id ?? ""}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Escalations" />

      <EscalationsFilterBar
        key={filterKey}
        initialStatus={status}
        initialQueryId={query_id}
        size={size}
      />

      <div className="border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-muted/40">
              <TableHead className="px-4">Question</TableHead>
              <TableHead className="px-4">Requester</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="px-4">Channel</TableHead>
              <TableHead className="px-4">Reason</TableHead>
              <TableHead className="px-4">Confidence</TableHead>
              <TableHead className="px-4">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No escalations match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-4 max-w-sm">
                    <Link
                      href={`/escalations/${item.id}`}
                      className="block font-medium text-foreground hover:text-brand truncate transition-colors"
                      title={item.question_text}
                    >
                      {item.question_text}
                    </Link>
                    <div className="font-mono text-[11px] text-muted-foreground truncate">
                      {item.query_id}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-foreground">
                    {item.requester_email}
                  </TableCell>
                  <TableCell className="px-4">
                    <EscalationStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="px-4">
                    <ChatChannelBadge channel={item.channel} />
                  </TableCell>
                  <TableCell className="px-4">
                    <ReasonCodeBadge reasonCode={item.reason_code} />
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs tabular-nums">
                    {item.confidence_score != null ? (
                      <span className="text-foreground">
                        {item.confidence_score.toFixed(3)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not scored</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(item.created_at)}
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

export default function EscalationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <EscalationsContent searchParams={searchParams} />
    </Suspense>
  );
}
