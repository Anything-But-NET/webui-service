import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AnalyticsDashboardView } from "@/components/analytics-dashboard-view";
import { AnalyticsFilterBar } from "@/components/analytics-filter-bar";
import { ErrorPanel } from "@/components/error-panel";
import { PageHeader, TableSkeleton } from "@/components/page-shell";
import { fetchQuestionOutcomeAnalytics } from "@/lib/core-api";
import { singleParam } from "@/lib/format";
import type { ChatChannel } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const VALID_CHANNELS = new Set<ChatChannel>(["SLACK", "TEAMS"]);

async function AnalyticsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const rawChannel = singleParam(sp.channel);
  const channel =
    rawChannel && VALID_CHANNELS.has(rawChannel as ChatChannel)
      ? (rawChannel as ChatChannel)
      : undefined;
  const from = singleParam(sp.from);
  const to = singleParam(sp.to);

  const result = await fetchQuestionOutcomeAnalytics({ from, to, channel });

  if (!result.ok) {
    if (result.status === 401) redirect("/login");
    return <ErrorPanel status={result.status} message={result.message} />;
  }

  const filterKey = `${channel ?? ""}|${from ?? ""}|${to ?? ""}`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Question Outcome Analytics" />

      <AnalyticsFilterBar
        key={filterKey}
        initialChannel={channel}
        initialFrom={from}
        initialTo={to}
      />

      <AnalyticsDashboardView data={result.data} />
    </div>
  );
}

export default function AnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<TableSkeleton rows={6} />}>
      <AnalyticsContent searchParams={searchParams} />
    </Suspense>
  );
}
