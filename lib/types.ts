export type SyncStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED_FETCH"
  | "FAILED_PARSE"
  | "FAILED_STORAGE";

export type GenerationOutcome =
  | "ANSWERED"
  | "SAFE_NO_ANSWER"
  | "ESCALATED"
  | "FAILURE";

export type ChatChannel = "SLACK" | "TEAMS";

export type QuestionOutcomeReasonCode = "LOW_CONFIDENCE" | "EMPTY_RETRIEVAL";

export type ErrorCategory =
  | "VALIDATION_ERROR"
  | "RETRIEVAL_TIMEOUT"
  | "VECTOR_DB_UNAVAILABLE"
  | "LLM_PROVIDER_ERROR"
  | "INTERNAL_ERROR"
  | "INTERNAL_CONNECTION_ERROR";

export type OperatorAuthority =
  | "LOGS"
  | "METADATA"
  | "USERS"
  | "OPERATORS"
  | "ANALYTICS"
  | "PROMPTS"
  | "ESCALATIONS";

export type EscalationResolutionStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";

export type OperatorStatus = "ACTIVE" | "BLOCKED";

export type DashboardErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export interface TokensResponse {
  access_token: string;
  access_expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

export interface DashboardErrorResponse {
  error_code: DashboardErrorCode;
  message: string;
  timestamp: string;
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

export interface IngestionLogItem {
  id: string;
  document_id: string;
  status: SyncStatus;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface GenerationLogItem {
  id: string;
  query_id: string;
  channel: ChatChannel | null;
  outcome: GenerationOutcome;
  reason_code: QuestionOutcomeReasonCode | null;
  error_category: ErrorCategory | null;
  confidence_score: number | null;
  latency_ms: number | null;
  prompt_version_id: string | null;
  escalation_id?: string | null;
  resolution_status?: EscalationResolutionStatus | null;
  created_at: string;
  updated_at: string | null;
}

export interface EscalationCitation {
  title: string | null;
  url: string | null;
  document_id: string;
  chunk_id: string;
  score: number;
}

export interface EscalationItem {
  id: string;
  query_id: string;
  requester_email: string;
  question_text: string;
  status: EscalationResolutionStatus;
  resolution_text: string | null;
  resolution_updated_at: string | null;
  resolved_by_operator_id: string | null;
  channel: ChatChannel | null;
  reason_code: QuestionOutcomeReasonCode | null;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface EscalationStatusHistoryItem {
  id: string;
  from_status: EscalationResolutionStatus | null;
  to_status: EscalationResolutionStatus;
  changed_by_operator_id: string | null;
  changed_at: string;
}

export interface EscalationDetail extends EscalationItem {
  source_references: EscalationCitation[];
  status_history: EscalationStatusHistoryItem[];
}

export interface DocumentMetadataItem {
  document_id: string;
  source_system: string | null;
  title: string | null;
  url: string | null;
  last_updated: string | null;
  last_sync_at: string;
}

export interface UserAclItem {
  email: string;
  allowed_groups: string[];
  last_updated: string | null;
  last_sync_at: string;
}

export interface OperatorItem {
  id: string;
  email: string;
  authorities: OperatorAuthority[];
  status: OperatorStatus;
  last_refreshed_at: string;
  last_updated_at: string;
  created_at: string;
}

export interface SessionUser {
  email: string;
  authorities: OperatorAuthority[];
  status: OperatorStatus;
}

export interface OutcomeCount {
  outcome: GenerationOutcome;
  count: number;
}

export interface ReasonCodeCount {
  reason_code: QuestionOutcomeReasonCode;
  count: number;
}

export interface ErrorCategoryCount {
  error_category: ErrorCategory;
  count: number;
}

export interface ChannelCount {
  channel: ChatChannel;
  count: number;
}

export interface ConfidenceBuckets {
  high: number;
  medium: number;
  low: number;
}

export interface DailyOutcomePoint {
  date: string;
  total_questions: number;
  outcome_counts: OutcomeCount[];
}

export interface QuestionOutcomesAnalyticsResponse {
  from: string | null;
  to: string | null;
  total_questions: number;
  outcome_counts: OutcomeCount[];
  avg_confidence_score: number | null;
  confidence_buckets: ConfidenceBuckets;
  avg_latency_ms: number | null;
  p95_latency_ms: number | null;
  reason_code_counts: ReasonCodeCount[];
  error_category_counts: ErrorCategoryCount[];
  channel_counts: ChannelCount[];
  daily_trend: DailyOutcomePoint[];
}

export interface PromptVersionSummary {
  id: string;
  created_at: string;
}

export interface PromptVersionDetail {
  id: string;
  prompt_text: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
