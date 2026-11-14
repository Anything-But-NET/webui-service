import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
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
import { fetchDocuments } from "@/lib/core-api";
import { formatDateTime, parsePageParam, parseSizeParam } from "@/lib/format";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function DocumentsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = parsePageParam(sp.page, 0);
  const size = parseSizeParam(sp.size, 20);

  const result = await fetchDocuments(page, size);
  if (!result.ok) {
    if (result.status === 401) redirect("/login");
    return <ErrorPanel status={result.status} message={result.message} />;
  }

  const data = result.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Corpus Metadata"
        title="Documents"
        description="Indexed knowledge base documents synchronized from upstream connectors."
      />

      <div className="border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-muted/40">
              <TableHead className="px-4">Document ID</TableHead>
              <TableHead className="px-4">Title</TableHead>
              <TableHead className="px-4">Source</TableHead>
              <TableHead className="px-4">Last Updated</TableHead>
              <TableHead className="px-4">Last Sync</TableHead>
              <TableHead className="px-4 text-right">URL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No documents indexed yet.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((doc) => (
                <TableRow key={doc.document_id}>
                  <TableCell className="px-4 font-mono text-xs text-foreground">
                    {doc.document_id}
                  </TableCell>
                  <TableCell className="px-4 max-w-xs truncate">
                    {doc.title ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                    {doc.source_system ?? "—"}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                    {formatDateTime(doc.last_updated)}
                  </TableCell>
                  <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                    {formatDateTime(doc.last_sync_at)}
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-brand hover:underline"
                      >
                        <span>Open</span>
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono">
                        —
                      </span>
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

export default function DocumentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <DocumentsContent searchParams={searchParams} />
    </Suspense>
  );
}
