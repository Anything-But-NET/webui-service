import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ErrorPanel } from "@/components/error-panel";
import { OperatorStatusButton } from "@/components/operator-status-button";
import { PageHeader, TableSkeleton } from "@/components/page-shell";
import { PaginationBar } from "@/components/pagination-bar";
import {
  AuthorityBadge,
  OperatorStatusBadge,
} from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchOperators } from "@/lib/core-api";
import { getServerSession } from "@/lib/auth";
import { formatDateTime, parsePageParam, parseSizeParam } from "@/lib/format";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function OperatorsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = parsePageParam(sp.page, 0);
  const size = parseSizeParam(sp.size, 20);

  const [result, session] = await Promise.all([
    fetchOperators(page, size),
    getServerSession(),
  ]);
  if (!result.ok) {
    if (result.status === 401) redirect("/login");
    return <ErrorPanel status={result.status} message={result.message} />;
  }

  const data = result.data;
  const currentEmail = session.user?.email;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard Operators" />

      <div className="border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-muted/40">
              <TableHead className="px-4">Email</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="px-4">Authorities</TableHead>
              <TableHead className="px-4">Last Refreshed</TableHead>
              <TableHead className="px-4">Created</TableHead>
              <TableHead className="px-4 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No operators found.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="px-4 font-mono text-xs text-foreground">
                    <span>{op.email}</span>
                    {currentEmail === op.email && (
                      <span className="ml-2 border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        You
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <OperatorStatusBadge status={op.status} />
                  </TableCell>
                  <TableCell className="px-4 whitespace-normal">
                    {op.authorities.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {op.authorities.map((auth) => (
                          <AuthorityBadge key={auth} authority={auth} />
                        ))}
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        NONE
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                    {formatDateTime(op.last_refreshed_at)}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                    {formatDateTime(op.created_at)}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <OperatorStatusButton
                      operatorId={op.id}
                      operatorEmail={op.email}
                      currentStatus={op.status}
                    />
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

export default function OperatorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <OperatorsContent searchParams={searchParams} />
    </Suspense>
  );
}
