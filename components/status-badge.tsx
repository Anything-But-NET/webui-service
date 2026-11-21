import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  ChatChannel,
  ErrorCategory,
  GenerationOutcome,
  OperatorAuthority,
  OperatorStatus,
  QuestionOutcomeReasonCode,
  SyncStatus,
} from "@/lib/types";

type Tone = "success" | "warning" | "destructive" | "info" | "brand" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  success: "border border-success/40 bg-success/10 text-success px-1.5 py-0.5",
  warning: "border border-warning/40 bg-warning/10 text-warning px-1.5 py-0.5",
  destructive:
    "border border-destructive/40 bg-destructive/10 text-destructive px-1.5 py-0.5",
  info: "border border-info/40 bg-info/10 text-info px-1.5 py-0.5",
  brand: "border border-brand/40 bg-brand/10 text-brand px-1.5 py-0.5",
  muted:
    "border border-border bg-muted/60 text-muted-foreground px-1.5 py-0.5",
};

function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string;
  tone: Tone;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-mono", TONE_CLASSES[tone], className)}
    >
      {label}
    </Badge>
  );
}

const SYNC_STATUS_TONE: Record<SyncStatus, Tone> = {
  COMPLETED: "success",
  IN_PROGRESS: "info",
  FAILED_FETCH: "destructive",
  FAILED_PARSE: "warning",
  FAILED_STORAGE: "destructive",
};

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  return <StatusBadge label={status} tone={SYNC_STATUS_TONE[status]} />;
}

const GENERATION_OUTCOME_TONE: Record<GenerationOutcome, Tone> = {
  ANSWERED: "success",
  SAFE_NO_ANSWER: "warning",
  ESCALATED: "brand",
  FAILURE: "destructive",
};

export function GenerationOutcomeBadge({
  outcome,
}: {
  outcome: GenerationOutcome;
}) {
  return (
    <StatusBadge label={outcome} tone={GENERATION_OUTCOME_TONE[outcome]} />
  );
}

const REASON_CODE_TONE: Record<QuestionOutcomeReasonCode, Tone> = {
  LOW_CONFIDENCE: "warning",
  EMPTY_RETRIEVAL: "info",
};

export function ReasonCodeBadge({
  reasonCode,
}: {
  reasonCode: QuestionOutcomeReasonCode | null;
}) {
  if (!reasonCode) {
    return <span className="text-xs text-muted-foreground font-mono">—</span>;
  }
  return <StatusBadge label={reasonCode} tone={REASON_CODE_TONE[reasonCode]} />;
}

const CHANNEL_TONE: Record<ChatChannel, Tone> = {
  SLACK: "info",
  TEAMS: "brand",
};

export function ChatChannelBadge({
  channel,
}: {
  channel: ChatChannel | null;
}) {
  if (!channel) {
    return <span className="text-xs text-muted-foreground font-mono">—</span>;
  }
  return <StatusBadge label={channel} tone={CHANNEL_TONE[channel]} />;
}

export function ErrorCategoryBadge({
  category,
}: {
  category: ErrorCategory | null;
}) {
  if (!category) {
    return <span className="text-xs text-muted-foreground font-mono">—</span>;
  }
  return <StatusBadge label={category} tone="warning" />;
}

export function OperatorStatusBadge({ status }: { status: OperatorStatus }) {
  return (
    <StatusBadge
      label={status}
      tone={status === "ACTIVE" ? "success" : "destructive"}
    />
  );
}

export function AuthorityBadge({
  authority,
}: {
  authority: OperatorAuthority;
}) {
  return <StatusBadge label={authority} tone="brand" />;
}
