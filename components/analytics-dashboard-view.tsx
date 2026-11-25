import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  GenerationOutcome,
  QuestionOutcomesAnalyticsResponse,
} from "@/lib/types";

const OUTCOME_ORDER: GenerationOutcome[] = [
  "ANSWERED",
  "SAFE_NO_ANSWER",
  "ESCALATED",
  "FAILURE",
];

const OUTCOME_TEXT_CLASS: Record<GenerationOutcome, string> = {
  ANSWERED: "text-success",
  SAFE_NO_ANSWER: "text-warning",
  ESCALATED: "text-brand",
  FAILURE: "text-destructive",
};

const OUTCOME_BAR_CLASS: Record<GenerationOutcome, string> = {
  ANSWERED: "bg-success",
  SAFE_NO_ANSWER: "bg-warning",
  ESCALATED: "bg-brand",
  FAILURE: "bg-destructive",
};

const OUTCOME_LABEL: Record<GenerationOutcome, string> = {
  ANSWERED: "Answered",
  SAFE_NO_ANSWER: "Safe No-Answer",
  ESCALATED: "Escalated",
  FAILURE: "Failure",
};

function pct(part: number, total: number): string {
  if (total <= 0) return "0.0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function pctNum(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (part / total) * 100));
}

function formatMs(value: number | null): string {
  if (value == null) return "Not recorded";
  return `${Math.round(value).toLocaleString("en-US")} ms`;
}

function formatShortDate(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[1]}/${parts[2]}`;
}

export function AnalyticsDashboardView({
  data,
}: {
  data: QuestionOutcomesAnalyticsResponse;
}) {
  const outcomeMap = new Map<GenerationOutcome, number>();
  for (const item of data.outcome_counts) {
    outcomeMap.set(item.outcome, item.count);
  }

  const total = data.total_questions;
  const answeredCount = outcomeMap.get("ANSWERED") ?? 0;

  const buckets = data.confidence_buckets;
  const totalConfidenceScored = buckets.high + buckets.medium + buckets.low;

  const maxDailyTotal = data.daily_trend.reduce(
    (max, day) => Math.max(max, day.total_questions),
    0
  );

  return (
    <div className="flex flex-col gap-4">
      {total > 0 && total < 20 && (
        <div className="border border-border bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground">
          Small sample: {total} {total === 1 ? "question" : "questions"} in
          this scope ({totalConfidenceScored} scored). Percentages and
          percentiles may fluctuate.
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Total Questions
            </span>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-3xl font-semibold tabular-nums text-foreground">
              {total.toLocaleString("en-US")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Answer Rate
            </span>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-3xl font-semibold tabular-nums text-foreground">
              {pct(answeredCount, total)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Avg Confidence
            </span>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-3xl font-semibold tabular-nums text-foreground">
              {data.avg_confidence_score != null
                ? data.avg_confidence_score.toFixed(3)
                : "Not scored"}
            </div>
            {total > 0 && (
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                {totalConfidenceScored} of {total} scored
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Latency (Avg / P95)
            </span>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-semibold tabular-nums text-foreground">
              {formatMs(data.avg_latency_ms)}
              <span className="text-muted-foreground font-normal mx-1.5">/</span>
              {formatMs(data.p95_latency_ms)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outcomes + Daily Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="h-2 w-full bg-muted flex overflow-hidden">
              {total > 0 &&
                OUTCOME_ORDER.map((outcome) => {
                  const count = outcomeMap.get(outcome) ?? 0;
                  if (count === 0) return null;
                  return (
                    <div
                      key={outcome}
                      className={`${OUTCOME_BAR_CLASS[outcome]} h-full`}
                      style={{ width: `${pctNum(count, total)}%` }}
                      title={`${OUTCOME_LABEL[outcome]}: ${count} (${pct(count, total)})`}
                    />
                  );
                })}
            </div>

            <div className="divide-y divide-border">
              {OUTCOME_ORDER.map((outcome) => {
                const count = outcomeMap.get(outcome) ?? 0;
                return (
                  <div
                    key={outcome}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2 font-mono text-xs"
                  >
                    <span className={OUTCOME_TEXT_CLASS[outcome]}>
                      {OUTCOME_LABEL[outcome]}
                    </span>
                    <div className="flex items-baseline gap-3 tabular-nums">
                      <span className="text-foreground font-semibold">
                        {count.toLocaleString("en-US")}
                      </span>
                      <span className="text-muted-foreground w-12 text-right">
                        {pct(count, total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-medium">
                Daily Trend (UTC)
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {OUTCOME_ORDER.map((outcome) => (
                  <span key={outcome} className="flex items-center gap-1.5">
                    <span
                      className={`inline-block size-2 ${OUTCOME_BAR_CLASS[outcome]}`}
                    />
                    {OUTCOME_LABEL[outcome]}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end">
            {data.daily_trend.length === 0 ? (
              <div className="h-44 border border-dashed border-border flex items-center justify-center text-xs font-mono text-muted-foreground">
                No data
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="h-44 border-b border-border flex items-end gap-1.5 pt-4 overflow-x-auto">
                  {data.daily_trend.map((point) => {
                    const dayOutcomes = new Map<GenerationOutcome, number>();
                    for (const oc of point.outcome_counts) {
                      dayOutcomes.set(oc.outcome, oc.count);
                    }
                    const barHeightPct =
                      maxDailyTotal > 0
                        ? Math.max(4, (point.total_questions / maxDailyTotal) * 100)
                        : 0;
                    const tooltip = [
                      `${point.date} (${point.total_questions})`,
                      ...OUTCOME_ORDER.map(
                        (o) => `${OUTCOME_LABEL[o]}: ${dayOutcomes.get(o) ?? 0}`
                      ),
                    ].join("\n");

                    return (
                      <div
                        key={point.date}
                        title={tooltip}
                        className="group flex-1 min-w-7 h-full flex flex-col items-center justify-end gap-1"
                      >
                        <span className="font-mono text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                          {point.total_questions}
                        </span>
                        <div
                          className="w-full max-w-10 flex flex-col-reverse overflow-hidden"
                          style={{ height: `${barHeightPct}%` }}
                        >
                          {OUTCOME_ORDER.map((outcome) => {
                            const cnt = dayOutcomes.get(outcome) ?? 0;
                            if (cnt === 0) return null;
                            return (
                              <div
                                key={outcome}
                                className={`w-full ${OUTCOME_BAR_CLASS[outcome]}`}
                                style={{
                                  height: `${pctNum(cnt, point.total_questions)}%`,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {data.daily_trend.map((point) => (
                    <div
                      key={point.date}
                      className="flex-1 min-w-7 text-center font-mono text-[10px] text-muted-foreground truncate"
                    >
                      {formatShortDate(point.date)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Confidence
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              { label: "High  >= 0.70", count: buckets.high, bar: "bg-success" },
              { label: "Medium  0.40 – 0.70", count: buckets.medium, bar: "bg-warning" },
              { label: "Low  < 0.40", count: buckets.low, bar: "bg-destructive" },
            ].map((row) => (
              <div key={row.label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="tabular-nums text-foreground">
                    {row.count.toLocaleString("en-US")}{" "}
                    <span className="text-muted-foreground">
                      ({pct(row.count, totalConfidenceScored)})
                    </span>
                  </span>
                </div>
                <div className="h-1 w-full bg-muted overflow-hidden">
                  <div
                    className={`${row.bar} h-full`}
                    style={{
                      width: `${pctNum(row.count, totalConfidenceScored)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.channel_counts.length === 0 ? (
              <span className="font-mono text-xs text-muted-foreground">—</span>
            ) : (
              data.channel_counts.map((item) => (
                <div key={item.channel} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-foreground">{item.channel}</span>
                    <span className="tabular-nums text-foreground">
                      {item.count.toLocaleString("en-US")}{" "}
                      <span className="text-muted-foreground">
                        ({pct(item.count, total)})
                      </span>
                    </span>
                  </div>
                  <div className="h-1 w-full bg-muted overflow-hidden">
                    <div
                      className="bg-foreground/70 h-full"
                      style={{ width: `${pctNum(item.count, total)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Reasons & Errors
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.reason_code_counts.length === 0 &&
            data.error_category_counts.length === 0 ? (
              <span className="font-mono text-xs text-muted-foreground">—</span>
            ) : (
              <div className="divide-y divide-border font-mono text-xs">
                {data.reason_code_counts.map((item) => (
                  <div
                    key={item.reason_code}
                    className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
                  >
                    <span className="text-muted-foreground">
                      {item.reason_code}
                    </span>
                    <span className="text-foreground font-semibold tabular-nums">
                      {item.count.toLocaleString("en-US")}
                    </span>
                  </div>
                ))}
                {data.error_category_counts.map((item) => (
                  <div
                    key={item.error_category}
                    className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
                  >
                    <span className="text-destructive">
                      {item.error_category}
                    </span>
                    <span className="text-foreground font-semibold tabular-nums">
                      {item.count.toLocaleString("en-US")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
