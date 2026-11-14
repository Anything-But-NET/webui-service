import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ErrorPanel } from "@/components/error-panel";
import { IngestionFilterBar } from "@/components/logs-filter-bar";
import { PageHeader, TableSkeleton } from "@/components/page-shell";
import { PaginationBar } from "@/components/pagination-bar";
import { SyncStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchIngestionLogs } from "@/lib/core-api";
import {
  formatDateTime,
  parsePageParam,
  parseSizeParam,
  singleParam,
} from "@/lib/format";
import type { SyncStatus } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const VALID_SYNC_STATUSES = new Set<SyncStatus>([
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED_FETCH",
  "FAILED_PARSE",
  "FAILED_STORAGE",
]);

async function IngestionLogsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = parsePageParam(sp.page, 0);
  const size = parseSizeParam(sp.size, 20);
  const rawStatus = singleParam(sp.status);
  const status =
    rawStatus && VALID_SYNC_STATUSES.has(rawStatus as SyncStatus)
      ? (rawStatus as SyncStatus)
      : undefined;
  const document_id = singleParam(sp.document_id);
  const from = singleParam(sp.from);
  const to = singleParam(sp.to);

  const result = await fetchIngestionLogs({
    page,
    size,
    status,
    document_id,
    from,
    to,
  });

  if (!result.ok) {
    if (result.status === 401) redirect("/login");
    return <ErrorPanel status={result.status} message={result.message} />;
  }

  const data = result.data;
  const filterKey = `${status ?? ""}|${document_id ?? ""}|${from ?? ""}|${to ?? ""}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Pipeline Telemetry"
        title="Ingestion Logs"
        description="Document synchronization executions, statuses, and ingestion errors."
      />

      <IngestionFilterBar
        key={filterKey}
        initialStatus={status}
        initialDocumentId={document_id}
        initialFrom={from}
        initialTo={to}
        size={size}
      />

      <div className="border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-muted/40">
              <TableHead className="px-4">Document ID</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="px-4">Started</TableHead>
              <TableHead className="px-4">Finished</TableHead>
              <TableHead className="px-4">Error Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No ingestion logs match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="px-4 font-mono text-xs text-foreground">
                    {log.document_id}
                  </TableCell>
                  <TableCell className="px-4">
                    <SyncStatusBadge status={log.status} />
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                    {formatDateTime(log.started_at)}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                    {formatDateTime(log.finished_at)}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-destructive/90 max-w-md whitespace-normal break-words">
                    {log.error_message ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
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

export default function IngestionLogsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <IngestionLogsContent searchParams={searchParams} />
    </Suspense>
  );
}
