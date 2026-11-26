import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { ErrorPanel } from "@/components/error-panel";
import { EscalationResponseForm } from "@/components/escalation-response-form";
import { EscalationStatusActions } from "@/components/escalation-status-actions";
import { TableSkeleton } from "@/components/page-shell";
import {
  ChatChannelBadge,
  EscalationStatusBadge,
  ReasonCodeBadge,
} from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchEscalationDetail } from "@/lib/core-api";
import { formatDateTime } from "@/lib/format";

async function EscalationDetailContent({ id }: { id: string }) {
  const result = await fetchEscalationDetail(id);
  if (!result.ok) {
    if (result.status === 401) redirect("/login");
    return <ErrorPanel status={result.status} message={result.message} />;
  }

  const esc = result.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link
            href="/escalations"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Escalations</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-normal tracking-tight text-foreground">
              Escalation Detail
            </h1>
            <EscalationStatusBadge status={esc.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Query ID: {esc.query_id}</span>
              <CopyButton value={esc.query_id} label="Copy query ID" />
            </div>
            <div className="flex items-center gap-2">
              <span>Escalation ID: {esc.id.slice(0, 8)}</span>
              <CopyButton value={esc.id} label="Copy escalation ID" />
            </div>
          </div>
        </div>

        <EscalationStatusActions
          escalationId={esc.id}
          currentStatus={esc.status}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Question
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {esc.question_text}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Context
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 font-mono text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Requester</span>
              <span className="text-foreground truncate">
                {esc.requester_email}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Channel</span>
              <ChatChannelBadge channel={esc.channel} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Reason</span>
              <ReasonCodeBadge reasonCode={esc.reason_code} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Confidence</span>
              <span className="text-foreground tabular-nums">
                {esc.confidence_score != null
                  ? esc.confidence_score.toFixed(3)
                  : "Not scored"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Created</span>
              <span className="text-foreground">
                {formatDateTime(esc.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Updated</span>
              <span className="text-foreground">
                {formatDateTime(esc.updated_at)}
              </span>
            </div>
            {esc.resolved_at && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Resolved</span>
                <span className="text-foreground">
                  {formatDateTime(esc.resolved_at)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EscalationResponseForm
        escalationId={esc.id}
        currentStatus={esc.status}
        initialResolutionText={esc.resolution_text}
        resolutionUpdatedAt={esc.resolution_updated_at}
        resolvedByOperatorId={esc.resolved_by_operator_id}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-medium">
            Source References ({esc.source_references.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {esc.source_references.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">
              No source references attached.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {esc.source_references.map((ref) => (
                <div
                  key={`${ref.document_id}-${ref.chunk_id}`}
                  className="py-2.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm text-foreground truncate">
                      {ref.title ?? ref.document_id}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      doc: {ref.document_id} · chunk: {ref.chunk_id} · score:{" "}
                      {ref.score.toFixed(3)}
                    </div>
                  </div>
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-brand hover:underline"
                    >
                      <span>Open</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-medium">
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {esc.status_history.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">
              No status transitions recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {esc.status_history.map((entry) => (
                <div
                  key={entry.id}
                  className="py-2.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3 font-mono text-xs"
                >
                  <div className="flex items-center gap-2">
                    {entry.from_status ? (
                      <>
                        <EscalationStatusBadge status={entry.from_status} />
                        <span className="text-muted-foreground">→</span>
                      </>
                    ) : null}
                    <EscalationStatusBadge status={entry.to_status} />
                    {entry.changed_by_operator_id && (
                      <span className="text-muted-foreground">
                        by {entry.changed_by_operator_id.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    {formatDateTime(entry.changed_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default async function EscalationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<TableSkeleton rows={5} />}>
      <EscalationDetailContent id={id} />
    </Suspense>
  );
}
