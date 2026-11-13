import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ErrorPanel } from "@/components/error-panel";
import { PageHeader, TableSkeleton } from "@/components/page-shell";
import { PaginationBar } from "@/components/pagination-bar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchUsers } from "@/lib/core-api";
import { formatDateTime, parsePageParam, parseSizeParam } from "@/lib/format";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function UsersContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const page = parsePageParam(sp.page, 0);
  const size = parseSizeParam(sp.size, 20);

  const result = await fetchUsers(page, size);
  if (!result.ok) {
    if (result.status === 401) redirect("/login");
    return <ErrorPanel status={result.status} message={result.message} />;
  }

  const data = result.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Access Control"
        title="Users & ACLs"
        description="Synchronized end-user directory and group permissions."
      />

      <div className="border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-muted/40">
              <TableHead className="px-4">Email</TableHead>
              <TableHead className="px-4">Allowed Groups</TableHead>
              <TableHead className="px-4">Last Updated</TableHead>
              <TableHead className="px-4">Last Sync</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No user ACL records found.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((user) => (
                <TableRow key={user.email}>
                  <TableCell className="px-4 font-mono text-xs text-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="px-4 whitespace-normal">
                    {user.allowed_groups.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {user.allowed_groups.map((group) => (
                          <Badge
                            key={group}
                            variant="outline"
                            className="border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-foreground"
                          >
                            {group}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                    {formatDateTime(user.last_updated)}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                    {formatDateTime(user.last_sync_at)}
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

export default function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <UsersContent searchParams={searchParams} />
    </Suspense>
  );
}
