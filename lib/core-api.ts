import { getServerSession, CORE_API_URL, RAG_API_URL } from "./auth";
import type {
  ChatChannel,
  DashboardErrorResponse,
  DocumentMetadataItem,
  ErrorCategory,
  EscalationDetail,
  EscalationItem,
  EscalationResolutionStatus,
  GenerationLogItem,
  GenerationOutcome,
  IngestionLogItem,
  OperatorItem,
  PageResponse,
  PromptVersionDetail,
  PromptVersionSummary,
  QuestionOutcomesAnalyticsResponse,
  SyncStatus,
  UserAclItem,
} from "./types";

export type CoreFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

async function authenticatedGet<T>(
  baseUrl: string,
  serviceName: string,
  path: string
): Promise<CoreFetchResult<T>> {
  const session = await getServerSession();
  if (!session.accessToken) {
    return { ok: false, status: 401, message: "Authentication required." };
  }

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = (await res
        .json()
        .catch(() => null)) as DashboardErrorResponse | null;
      return {
        ok: false,
        status: res.status,
        message: err?.message ?? `Upstream returned ${res.status}`,
      };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      status: 503,
      message: `${serviceName} is unreachable.`,
    };
  }
}

function coreGet<T>(path: string): Promise<CoreFetchResult<T>> {
  return authenticatedGet<T>(CORE_API_URL, "Core service", path);
}

function ragGet<T>(path: string): Promise<CoreFetchResult<T>> {
  return authenticatedGet<T>(RAG_API_URL, "RAG service", path);
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      sp.set(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function fetchIngestionLogs(params: {
  page?: number;
  size?: number;
  from?: string;
  to?: string;
  status?: SyncStatus;
  document_id?: string;
}) {
  return coreGet<PageResponse<IngestionLogItem>>(
    `/api/v1/dash/logs/ingestion${buildQuery(params)}`
  );
}

export function fetchGenerationLogs(params: {
  page?: number;
  size?: number;
  from?: string;
  to?: string;
  outcome?: GenerationOutcome;
  error_category?: ErrorCategory;
}) {
  return coreGet<PageResponse<GenerationLogItem>>(
    `/api/v1/dash/logs/generation${buildQuery(params)}`
  );
}

export function fetchQuestionOutcomeAnalytics(params: {
  from?: string;
  to?: string;
  channel?: ChatChannel;
}) {
  return coreGet<QuestionOutcomesAnalyticsResponse>(
    `/api/v1/dash/analytics/outcomes${buildQuery(params)}`
  );
}

export function fetchPromptOutcomeAnalytics(
  promptVersionId: string,
  params: {
    from?: string;
    to?: string;
    channel?: ChatChannel;
  }
) {
  return coreGet<QuestionOutcomesAnalyticsResponse>(
    `/api/v1/dash/analytics/prompts/${encodeURIComponent(promptVersionId)}/outcomes${buildQuery(params)}`
  );
}

export function fetchPromptVersions(page = 0, size = 20) {
  return ragGet<PageResponse<PromptVersionSummary>>(
    `/api/v1/dash/prompts${buildQuery({ page, size })}`
  );
}

export function fetchPromptVersionDetail(promptVersionId: string) {
  return ragGet<PromptVersionDetail>(
    `/api/v1/dash/prompts/${encodeURIComponent(promptVersionId)}`
  );
}

export function fetchDocuments(page = 0, size = 20) {
  return coreGet<PageResponse<DocumentMetadataItem>>(
    `/api/v1/dash/documents${buildQuery({ page, size })}`
  );
}

export function fetchUsers(page = 0, size = 20) {
  return coreGet<PageResponse<UserAclItem>>(
    `/api/v1/dash/users${buildQuery({ page, size })}`
  );
}

export function fetchOperators(page = 0, size = 20) {
  return coreGet<PageResponse<OperatorItem>>(
    `/api/v1/dash/operators${buildQuery({ page, size })}`
  );
}

export function fetchEscalations(params: {
  page?: number;
  size?: number;
  status?: EscalationResolutionStatus;
  query_id?: string;
  from?: string;
  to?: string;
}) {
  return coreGet<PageResponse<EscalationItem>>(
    `/api/v1/dash/escalations${buildQuery(params)}`
  );
}

export function fetchEscalationDetail(id: string) {
  return coreGet<EscalationDetail>(
    `/api/v1/dash/escalations/${encodeURIComponent(id)}`
  );
}
