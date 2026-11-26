"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RotateCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import type {
  DashboardErrorResponse,
  EscalationDetail,
  EscalationResolutionStatus,
} from "@/lib/types";

const MAX_RESPONSE_LENGTH = 20_000;

export function EscalationResponseForm({
  escalationId,
  currentStatus,
  initialResolutionText,
  resolutionUpdatedAt,
  resolvedByOperatorId,
}: {
  escalationId: string;
  currentStatus: EscalationResolutionStatus;
  initialResolutionText: string | null;
  resolutionUpdatedAt: string | null;
  resolvedByOperatorId: string | null;
}) {
  const router = useRouter();
  const [edited, setEdited] = useState<{
    base: string | null;
    value: string;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittingMode, setSubmittingMode] = useState<"draft" | "resolve" | null>(null);
  const [failedMode, setFailedMode] = useState<"draft" | "resolve" | null>(null);

  const text =
    edited && edited.base === initialResolutionText
      ? edited.value
      : (initialResolutionText ?? "");

  const isTerminal = currentStatus === "CLOSED" || currentStatus === "CANCELLED";
  const isResolved = currentStatus === "RESOLVED";
  const isSubmitting = submittingMode !== null;

  async function submitResponse(mode: "draft" | "resolve") {
    const trimmed = text.trim();
    if (!trimmed) {
      setValidationError("Please enter an expert response before saving.");
      setSuccessMessage(null);
      return;
    }
    if (trimmed.length > MAX_RESPONSE_LENGTH) {
      setValidationError(
        `Response must be ${MAX_RESPONSE_LENGTH.toLocaleString("en-US")} characters or fewer.`
      );
      setSuccessMessage(null);
      return;
    }

    setValidationError(null);
    setServerError(null);
    setSuccessMessage(null);
    setFailedMode(null);
    setSubmittingMode(mode);

    const targetStatus: EscalationResolutionStatus | undefined =
      mode === "resolve" ? "RESOLVED" : undefined;

    try {
      const response = await fetch(
        `/api/escalations/${encodeURIComponent(escalationId)}/response`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resolution_text: trimmed,
            ...(targetStatus ? { status: targetStatus } : {}),
          }),
        }
      );

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as
          | Partial<DashboardErrorResponse>
          | null;
        setServerError(err?.message ?? `Failed to save response (${response.status})`);
        setFailedMode(mode);
        return;
      }

      const updated = (await response.json()) as EscalationDetail;
      setEdited({
        base: initialResolutionText,
        value: updated.resolution_text ?? trimmed,
      });

      if (mode === "resolve" && currentStatus !== "RESOLVED") {
        setSuccessMessage("Response saved and escalation marked as RESOLVED.");
      } else if (currentStatus === "RESOLVED") {
        setSuccessMessage("Expert response updated.");
      } else {
        setSuccessMessage("Draft response saved.");
      }

      router.refresh();
    } catch {
      setServerError("Network error while saving expert response.");
      setFailedMode(mode);
    } finally {
      setSubmittingMode(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-medium">
          Expert Response
        </CardTitle>
        <div className="font-mono text-[11px] text-muted-foreground">
          {resolutionUpdatedAt ? (
            <span>
              Last saved {formatDateTime(resolutionUpdatedAt)}
              {resolvedByOperatorId ? ` · by ${resolvedByOperatorId.slice(0, 8)}` : ""}
            </span>
          ) : (
            <span>No response recorded yet</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isTerminal ? (
          <div className="flex flex-col gap-2">
            {initialResolutionText ? (
              <div className="border border-border bg-background p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {initialResolutionText}
              </div>
            ) : (
              <p className="font-mono text-xs text-muted-foreground">
                No expert response was recorded before this escalation was marked {currentStatus}.
              </p>
            )}
            <p className="font-mono text-[11px] text-muted-foreground">
              Terminal status ({currentStatus}): response editing is locked.
            </p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitResponse("resolve");
            }}
            className="flex flex-col gap-4"
          >
            {serverError && (
              <div
                role="alert"
                className="border border-destructive/60 bg-destructive/10 px-3 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-destructive"
              >
                <span>{serverError}</span>
                {failedMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={isSubmitting}
                    onClick={() => void submitResponse(failedMode)}
                    className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/20"
                  >
                    <RotateCw className="size-3" />
                    <span>Retry</span>
                  </Button>
                )}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="border border-success/40 bg-success/10 px-3 py-2.5 flex items-center gap-2 text-xs text-success"
              >
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <Field data-invalid={Boolean(validationError)}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="expert-resolution-text">
                  Prepared Answer / Resolution Notes
                </FieldLabel>
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {text.trim().length.toLocaleString("en-US")} /{" "}
                  {MAX_RESPONSE_LENGTH.toLocaleString("en-US")}
                </span>
              </div>
              <Textarea
                id="expert-resolution-text"
                value={text}
                onChange={(e) => {
                  setEdited({
                    base: initialResolutionText,
                    value: e.target.value,
                  });
                  if (validationError) setValidationError(null);
                  if (successMessage) setSuccessMessage(null);
                }}
                aria-invalid={Boolean(validationError)}
                placeholder="Write a clear, verified answer for the employee using the question context and source references above..."
                disabled={isSubmitting}
                className="min-h-36 border-input bg-background px-3 py-2.5 text-sm leading-relaxed focus-visible:border-ring"
              />
              {validationError && <FieldError>{validationError}</FieldError>}
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-muted-foreground">
                {isResolved
                  ? "This escalation is RESOLVED. You can refine the response before closing."
                  : "Save a draft to keep working or save and mark as RESOLVED."}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {!isResolved && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => void submitResponse("draft")}
                    className="gap-1.5"
                  >
                    {submittingMode === "draft" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    <span>Save Draft</span>
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  {submittingMode === "resolve" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  <span>{isResolved ? "Update Response" : "Save & Resolve"}</span>
                </Button>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
