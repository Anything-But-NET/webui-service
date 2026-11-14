import { getServerSession, CORE_API_URL } from "./auth";
import type {
  DashboardErrorResponse,
  DocumentMetadataItem,
  ErrorCategory,
  GenerationLogItem,
  GenerationOutcome,
  IngestionLogItem,
  OperatorItem,
  PageResponse,
  SyncStatus,
  UserAclItem,
} from "./types";

export type CoreFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

async function coreGet<T>(path: string): Promise<CoreFetchResult<T>> {
  const session = await getServerSession();
  if (!session.accessToken) {
    return { ok: false, status: 401, message: "Authentication required." };
  }

  try {
    const res = await fetch(`${CORE_API_URL}${path}`, {
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
      message: "Core service is unreachable.",
    };
  }
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
