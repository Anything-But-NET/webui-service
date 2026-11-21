import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { ErrorPanel } from "@/components/error-panel";
import { PageHeader, TableSkeleton } from "@/components/page-shell";
import { PaginationBar } from "@/components/pagination-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchPromptVersions } from "@/lib/core-api";
import {
  formatDateTime,
  parsePageParam,
  parseSizeParam,
} from "@/lib/format";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function PromptsListContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = parsePageParam(sp.page, 0);
  const size = parseSizeParam(sp.size, 20);

  const result = await fetchPromptVersions(page, size);

  if (!result.ok) {
    if (result.status === 401) redirect("/login");
    return <ErrorPanel status={result.status} message={result.message} />;
  }

  const data = result.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Prompt Versions" />

      <div className="border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-muted/40">
              <TableHead className="px-4">Prompt Version ID</TableHead>
              <TableHead className="px-4">Created At</TableHead>
              <TableHead className="px-4 text-right">Inspect</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No prompt versions found.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((prompt) => (
                <TableRow key={prompt.id}>
                  <TableCell className="px-4 font-mono text-xs text-foreground">
                    <Link
                      href={`/prompts/${prompt.id}`}
                      className="hover:text-brand transition-colors"
                    >
                      {prompt.id}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                    {formatDateTime(prompt.created_at)}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <Link
                      href={`/prompts/${prompt.id}`}
                      className="inline-flex items-center gap-1 font-mono text-xs text-brand hover:underline"
                    >
                      <span>Details & Metrics</span>
                      <ArrowUpRight className="size-3.5" />
                    </Link>
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

export default function PromptsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<TableSkeleton rows={6} />}>
      <PromptsListContent searchParams={searchParams} />
    </Suspense>
  );
}
