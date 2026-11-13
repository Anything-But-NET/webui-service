export type SyncStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED_FETCH"
  | "FAILED_PARSE"
  | "FAILED_STORAGE";

export type GenerationOutcome = "SUCCESS" | "FAILURE";

export type ErrorCategory =
  | "VALIDATION_ERROR"
  | "RETRIEVAL_TIMEOUT"
  | "VECTOR_DB_UNAVAILABLE"
  | "LLM_PROVIDER_ERROR"
  | "INTERNAL_ERROR"
  | "INTERNAL_CONNECTION_ERROR";

export type OperatorAuthority = "LOGS" | "METADATA" | "USERS" | "OPERATORS";

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
  outcome: GenerationOutcome;
  error_category: ErrorCategory | null;
  confidence_score: number | null;
  created_at: string;
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
