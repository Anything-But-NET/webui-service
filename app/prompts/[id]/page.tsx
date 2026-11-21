import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AnalyticsDashboardView } from "@/components/analytics-dashboard-view";
import { AnalyticsFilterBar } from "@/components/analytics-filter-bar";
import { CopyButton } from "@/components/copy-button";
import { ErrorPanel } from "@/components/error-panel";
import { PageHeader, TableSkeleton } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchPromptOutcomeAnalytics,
  fetchPromptVersionDetail,
} from "@/lib/core-api";
import { formatDateTime, singleParam } from "@/lib/format";
import type { ChatChannel } from "@/lib/types";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const VALID_CHANNELS = new Set<ChatChannel>(["SLACK", "TEAMS"]);

function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

async function PromptDetailContent({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const rawChannel = singleParam(sp.channel);
  const channel =
    rawChannel && VALID_CHANNELS.has(rawChannel as ChatChannel)
      ? (rawChannel as ChatChannel)
      : undefined;
  const from = singleParam(sp.from);
  const to = singleParam(sp.to);

  const [detailResult, analyticsResult] = await Promise.all([
    fetchPromptVersionDetail(id),
    fetchPromptOutcomeAnalytics(id, { from, to, channel }),
  ]);

  if (!detailResult.ok) {
    if (detailResult.status === 401) redirect("/login");
    return (
      <ErrorPanel status={detailResult.status} message={detailResult.message} />
    );
  }

  const prompt = detailResult.data;
  const metadataEntries = Object.entries(prompt.metadata ?? {});
  const filterKey = `${id}|${channel ?? ""}|${from ?? ""}|${to ?? ""}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={prompt.id}
        description={`Created ${formatDateTime(prompt.created_at)}`}
        actions={
          <div className="flex items-center gap-2">
            <CopyButton value={prompt.id} label="Copy ID" />
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/prompts" />}
              className="gap-1.5"
            >
              <ArrowLeft className="size-3.5" />
              <span>All Prompts</span>
            </Button>
          </div>
        }
      />

      {/* Prompt Template & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-medium">
              System Prompt
            </CardTitle>
            <CopyButton value={prompt.prompt_text} label="Copy Prompt" />
          </CardHeader>
          <CardContent>
            <pre className="bg-background border border-border p-4 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
              {prompt.prompt_text}
            </pre>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metadataEntries.length === 0 ? (
              <p className="font-mono text-xs text-muted-foreground">
                No metadata attached.
              </p>
            ) : (
              <dl className="divide-y divide-border border border-border bg-background">
                {metadataEntries.map(([key, val]) => (
                  <div
                    key={key}
                    className="px-3 py-2 flex items-start justify-between gap-3"
                  >
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {key}
                    </dt>
                    <dd className="font-mono text-xs text-foreground text-right break-all">
                      {formatMetadataValue(val)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prompt-Scoped Outcome Analytics */}
      <div className="flex flex-col gap-4 pt-2 border-t border-border">
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          Scoped Outcome Analytics
        </h2>

        <AnalyticsFilterBar
          key={filterKey}
          initialChannel={channel}
          initialFrom={from}
          initialTo={to}
        />

        {analyticsResult.ok ? (
          <AnalyticsDashboardView data={analyticsResult.data} />
        ) : (
          <ErrorPanel
            status={analyticsResult.status}
            message={analyticsResult.message}
          />
        )}
      </div>
    </div>
  );
}

export default function PromptDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<TableSkeleton rows={6} />}>
      <PromptDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
