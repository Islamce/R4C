"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ClientApiError, clientApi } from "../lib/client-api";
import type { MessageKey } from "../lib/i18n";
import type {
  ProjectDetailPayload,
  ProjectRecord,
  ProgressStatus,
  ReviewProgressPayload,
  SessionUser,
  SubmitProgressPayload,
  WbsNodeRecord,
  WbsProgressUpdateRecord,
} from "../lib/types";
import { useI18n } from "./I18nProvider";
import { EmptyState, ErrorState, LoadingState } from "./StatePrimitives";

type Notice = { tone: "success" | "error"; key: MessageKey } | null;
type ReviewDrafts = Record<string, string>;

const statusKeys: Record<ProgressStatus, MessageKey> = {
  SUBMITTED: "progress.status.SUBMITTED",
  APPROVED: "progress.status.APPROVED",
  REJECTED: "progress.status.REJECTED",
};

const statusIcons: Record<ProgressStatus, string> = {
  SUBMITTED: "…",
  APPROVED: "✓",
  REJECTED: "×",
};

function optionalText(value: string): { value?: string; error?: MessageKey } {
  const trimmed = value.trim();
  if (!trimmed) return {};
  if (trimmed.length < 3) return { error: "progress.validation.textShort" };
  if (trimmed.length > 2000) return { error: "progress.validation.textLong" };
  return { value: trimmed };
}

export function ProgressWorkspace() {
  const { t, locale } = useI18n();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectId, setProjectId] = useState("");
  const [wbs, setWbs] = useState<WbsNodeRecord[]>([]);
  const [wbsNodeId, setWbsNodeId] = useState("");
  const [history, setHistory] = useState<WbsProgressUpdateRecord[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingWbs, setLoadingWbs] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [initialFailed, setInitialFailed] = useState(false);
  const [historyFailed, setHistoryFailed] = useState(false);
  const [submitPercent, setSubmitPercent] = useState("");
  const [submitNote, setSubmitNote] = useState("");
  const [submitWorking, setSubmitWorking] = useState(false);
  const [reviewWorkingId, setReviewWorkingId] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<ReviewDrafts>({});
  const [notice, setNotice] = useState<Notice>(null);

  const canRead = Boolean(user?.permissions.includes("progress:read"));
  const canSubmit = Boolean(user?.permissions.includes("progress:submit"));
  const canReview = Boolean(user?.permissions.includes("progress:review"));

  const loadInitial = useCallback(async () => {
    setLoadingInitial(true);
    setInitialFailed(false);
    try {
      const [session, projectRows] = await Promise.all([
        clientApi<{ user: SessionUser }>("/api/session"),
        clientApi<ProjectRecord[]>("/api/projects"),
      ]);
      setUser(session.user);
      setProjects(projectRows);
      setProjectId((current) =>
        current && projectRows.some((project) => project.id === current)
          ? current
          : projectRows[0]?.id ?? "",
      );
    } catch {
      setInitialFailed(true);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  const loadWbs = useCallback(async () => {
    if (!projectId) {
      setWbs([]);
      setWbsNodeId("");
      return;
    }
    setLoadingWbs(true);
    setHistory([]);
    setHistoryFailed(false);
    setNotice(null);
    try {
      const detail = await clientApi<ProjectDetailPayload>(
        `/api/projects/${encodeURIComponent(projectId)}`,
      );
      setWbs(detail.wbs);
      setWbsNodeId((current) =>
        current && detail.wbs.some((node) => node.id === current)
          ? current
          : detail.wbs[0]?.id ?? "",
      );
    } catch {
      setHistoryFailed(true);
      setWbs([]);
      setWbsNodeId("");
    } finally {
      setLoadingWbs(false);
    }
  }, [projectId]);

  const loadHistory = useCallback(async () => {
    if (!wbsNodeId || !canRead) {
      setHistory([]);
      return;
    }
    setLoadingHistory(true);
    setHistoryFailed(false);
    try {
      const rows = await clientApi<WbsProgressUpdateRecord[]>(
        `/api/wbs/${encodeURIComponent(wbsNodeId)}/progress`,
      );
      setHistory(rows);
    } catch {
      setHistoryFailed(true);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [canRead, wbsNodeId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    void loadWbs();
  }, [loadWbs]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const selectedProject = projects.find((project) => project.id === projectId);
  const selectedNode = wbs.find((node) => node.id === wbsNodeId);
  const approvedCount = useMemo(
    () => history.filter((update) => update.status === "APPROVED").length,
    [history],
  );
  const pendingCount = useMemo(
    () => history.filter((update) => update.status === "SUBMITTED").length,
    [history],
  );

  const localeTag = locale === "ar" ? "ar-SA" : "en-GB";
  const numberFormatter = new Intl.NumberFormat(localeTag, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const dateFormatter = new Intl.DateTimeFormat(localeTag, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  function formatPercent(value: string) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? `${numberFormatter.format(numeric)}%` : "—";
  }

  async function submitProgress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const percent = Number(submitPercent);
    if (submitPercent.trim() === "" || !Number.isFinite(percent) || percent < 0 || percent > 100) {
      setNotice({ tone: "error", key: "progress.validation.percent" });
      return;
    }
    const note = optionalText(submitNote);
    if (note.error) {
      setNotice({ tone: "error", key: note.error });
      return;
    }
    if (!wbsNodeId) return;

    const payload: SubmitProgressPayload = {
      percent,
      ...(note.value ? { note: note.value } : {}),
    };
    setSubmitWorking(true);
    try {
      await clientApi(`/api/wbs/${encodeURIComponent(wbsNodeId)}/progress`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSubmitPercent("");
      setSubmitNote("");
      setNotice({ tone: "success", key: "progress.submitSuccess" });
      await loadHistory();
    } catch {
      setNotice({ tone: "error", key: "progress.submitFailed" });
    } finally {
      setSubmitWorking(false);
    }
  }

  async function reviewProgress(
    update: WbsProgressUpdateRecord,
    decision: ReviewProgressPayload["decision"],
  ) {
    setNotice(null);
    const comment = optionalText(reviewDrafts[update.id] ?? "");
    if (comment.error) {
      setNotice({ tone: "error", key: comment.error });
      return;
    }
    const payload: ReviewProgressPayload = {
      decision,
      ...(comment.value ? { comment: comment.value } : {}),
    };
    setReviewWorkingId(update.id);
    try {
      await clientApi(`/api/progress/${encodeURIComponent(update.id)}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      setReviewDrafts((current) => ({ ...current, [update.id]: "" }));
      setNotice({
        tone: "success",
        key: decision === "APPROVED" ? "progress.approveSuccess" : "progress.rejectSuccess",
      });
      await loadHistory();
    } catch (error) {
      if (error instanceof ClientApiError && error.status === 409) {
        setNotice({ tone: "error", key: "progress.reviewConflict" });
        await loadHistory();
      } else {
        setNotice({ tone: "error", key: "progress.reviewFailed" });
      }
    } finally {
      setReviewWorkingId(null);
    }
  }

  return (
    <main className="workspace-page progress-page">
      <header className="page-heading progress-page-heading">
        <div>
          <p className="eyebrow">{t("progress.eyebrow")}</p>
          <h1>{t("progress.title")}</h1>
          <p>{t("progress.subtitle")}</p>
        </div>
      </header>

      {loadingInitial ? <LoadingState /> : null}
      {!loadingInitial && initialFailed ? <ErrorState onRetry={loadInitial} /> : null}
      {!loadingInitial && !initialFailed && projects.length === 0 ? (
        <EmptyState
          titleKey="progress.noProjectsTitle"
          messageKey="progress.noProjectsMessage"
          action={
            <Link className="button button-primary" href="/projects">
              {t("progress.openProjects")}
            </Link>
          }
        />
      ) : null}

      {!loadingInitial && !initialFailed && projects.length > 0 ? (
        <>
          <section className="progress-controls" aria-label={t("progress.selectionTitle")}>
            <label>
              <span>{t("progress.projectLabel")}</span>
              <select
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setWbsNodeId("");
                }}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} · {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t("progress.wbsLabel")}</span>
              <select
                value={wbsNodeId}
                onChange={(event) => {
                  setWbsNodeId(event.target.value);
                  setNotice(null);
                }}
                disabled={loadingWbs || wbs.length === 0}
              >
                {wbs.length === 0 ? (
                  <option value="">{t("progress.wbsPlaceholder")}</option>
                ) : null}
                {wbs.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.code} · {node.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => void loadHistory()}
              disabled={!wbsNodeId || loadingHistory || !canRead}
            >
              {t("progress.refresh")}
            </button>
          </section>

          <section className="progress-access-band" aria-label={t("progress.accessTitle")}>
            <div>
              <span>{t("progress.accessTitle")}</span>
              <strong>{user?.displayName ?? user?.email}</strong>
            </div>
            <div className="permission-list">
              <span className={`permission-chip ${canSubmit ? "permission-granted" : "permission-denied"}`}>
                <span aria-hidden="true">{canSubmit ? "✓" : "—"}</span>
                {t(canSubmit ? "progress.permission.submitGranted" : "progress.permission.submitDenied")}
              </span>
              <span className={`permission-chip ${canReview ? "permission-granted" : "permission-denied"}`}>
                <span aria-hidden="true">{canReview ? "✓" : "—"}</span>
                {t(canReview ? "progress.permission.reviewGranted" : "progress.permission.reviewDenied")}
              </span>
            </div>
          </section>

          {notice ? (
            <section
              className={notice.tone === "success" ? "success-banner" : "inline-alert"}
              role={notice.tone === "error" ? "alert" : "status"}
            >
              <strong>{t(notice.key)}</strong>
            </section>
          ) : null}

          {loadingWbs ? <LoadingState /> : null}
          {!loadingWbs && historyFailed && wbs.length === 0 ? <ErrorState onRetry={loadWbs} /> : null}
          {!loadingWbs && !historyFailed && wbs.length === 0 ? (
            <EmptyState titleKey="progress.noWbsTitle" messageKey="progress.noWbsMessage" />
          ) : null}

          {!loadingWbs && wbsNodeId ? (
            <div className="progress-workspace-grid">
              <aside className="progress-command-column">
                <section className="progress-context-card">
                  <p className="eyebrow">{t("progress.selectionTitle")}</p>
                  <h2>{selectedNode?.name}</h2>
                  <dl>
                    <div>
                      <dt>{t("progress.projectLabel")}</dt>
                      <dd>{selectedProject?.code}</dd>
                    </div>
                    <div>
                      <dt>{t("progress.wbsCode")}</dt>
                      <dd>{selectedNode?.code}</dd>
                    </div>
                    <div>
                      <dt>{t("progress.pendingCount")}</dt>
                      <dd>{numberFormatter.format(pendingCount)}</dd>
                    </div>
                    <div>
                      <dt>{t("progress.approvedCount")}</dt>
                      <dd>{numberFormatter.format(approvedCount)}</dd>
                    </div>
                  </dl>
                </section>

                {canSubmit ? (
                  <section className="progress-submit-card">
                    <div className="panel-heading">
                      <span className="governance-number" aria-hidden="true">01</span>
                      <div>
                        <h2>{t("progress.submitTitle")}</h2>
                        <p>{t("progress.submitSubtitle")}</p>
                      </div>
                    </div>
                    <form className="progress-form" onSubmit={submitProgress}>
                      <label>
                        <span>{t("progress.percentLabel")}</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          inputMode="decimal"
                          value={submitPercent}
                          onChange={(event) => setSubmitPercent(event.target.value)}
                          required
                        />
                        <small>{t("progress.percentHint")}</small>
                      </label>
                      <label>
                        <span>{t("progress.noteLabel")}</span>
                        <textarea
                          rows={5}
                          maxLength={2000}
                          value={submitNote}
                          onChange={(event) => setSubmitNote(event.target.value)}
                        />
                        <small>{t("progress.optionalTextHint")}</small>
                      </label>
                      <button className="button button-primary" type="submit" disabled={submitWorking}>
                        {t(submitWorking ? "progress.submitting" : "progress.submitAction")}
                      </button>
                    </form>
                  </section>
                ) : (
                  <section className="progress-readonly-card">
                    <span aria-hidden="true">i</span>
                    <div>
                      <h2>{t("progress.submitUnavailableTitle")}</h2>
                      <p>{t("progress.submitUnavailableMessage")}</p>
                    </div>
                  </section>
                )}
              </aside>

              <section className="progress-history-section">
                <header className="section-heading">
                  <div>
                    <p className="eyebrow">{t("progress.timelineEyebrow")}</p>
                    <h2>{t("progress.timelineTitle")}</h2>
                    <p>{t("progress.timelineSubtitle")}</p>
                  </div>
                </header>

                {!canRead ? (
                  <section className="progress-readonly-card">
                    <span aria-hidden="true">!</span>
                    <div>
                      <h2>{t("progress.readUnavailableTitle")}</h2>
                      <p>{t("progress.readUnavailableMessage")}</p>
                    </div>
                  </section>
                ) : null}
                {canRead && loadingHistory ? <LoadingState /> : null}
                {canRead && !loadingHistory && historyFailed ? <ErrorState onRetry={loadHistory} /> : null}
                {canRead && !loadingHistory && !historyFailed && history.length === 0 ? (
                  <EmptyState
                    titleKey="progress.emptyTitle"
                    messageKey={canSubmit ? "progress.emptySubmitMessage" : "progress.emptyReadMessage"}
                  />
                ) : null}

                {canRead && !loadingHistory && !historyFailed && history.length > 0 ? (
                  <ol className="progress-timeline">
                    {history.map((update) => {
                      const working = reviewWorkingId === update.id;
                      return (
                        <li className={`progress-event progress-event-${update.status.toLowerCase()}`} key={update.id}>
                          <span className="timeline-marker" aria-hidden="true">
                            {statusIcons[update.status]}
                          </span>
                          <article>
                            <header className="progress-event-header">
                              <div>
                                <strong className="progress-percent" dir="ltr">
                                  {formatPercent(update.percent)}
                                </strong>
                                <span className={`progress-status status-${update.status.toLowerCase()}`}>
                                  <span aria-hidden="true">{statusIcons[update.status]}</span>
                                  {t(statusKeys[update.status])}
                                </span>
                              </div>
                              <time dateTime={update.reportedAt}>{dateFormatter.format(new Date(update.reportedAt))}</time>
                            </header>

                            <dl className="progress-event-facts">
                              <div>
                                <dt>{t("progress.reportedBy")}</dt>
                                <dd>{update.reportedBy.displayName}</dd>
                              </div>
                              <div>
                                <dt>{t("progress.reviewedBy")}</dt>
                                <dd>{update.reviewedBy?.displayName ?? t("common.notAvailable")}</dd>
                              </div>
                              <div>
                                <dt>{t("progress.reviewedAt")}</dt>
                                <dd>
                                  {update.reviewedAt
                                    ? dateFormatter.format(new Date(update.reviewedAt))
                                    : t("common.notAvailable")}
                                </dd>
                              </div>
                            </dl>

                            {update.note ? (
                              <div className="progress-note">
                                <strong>{t("progress.reportNote")}</strong>
                                <p>{update.note}</p>
                              </div>
                            ) : null}
                            {update.reviewComment ? (
                              <div className="progress-review-comment">
                                <strong>{t("progress.reviewComment")}</strong>
                                <p>{update.reviewComment}</p>
                              </div>
                            ) : null}

                            {canReview && update.status === "SUBMITTED" ? (
                              <div className="progress-review-panel">
                                <label>
                                  <span>{t("progress.reviewCommentLabel")}</span>
                                  <textarea
                                    rows={3}
                                    maxLength={2000}
                                    value={reviewDrafts[update.id] ?? ""}
                                    onChange={(event) =>
                                      setReviewDrafts((current) => ({
                                        ...current,
                                        [update.id]: event.target.value,
                                      }))
                                    }
                                  />
                                  <small>{t("progress.optionalTextHint")}</small>
                                </label>
                                <div className="review-actions">
                                  <button
                                    className="button button-primary"
                                    type="button"
                                    disabled={working}
                                    onClick={() => void reviewProgress(update, "APPROVED")}
                                  >
                                    <span aria-hidden="true">✓</span>
                                    {t("progress.approveAction")}
                                  </button>
                                  <button
                                    className="button button-secondary button-reject"
                                    type="button"
                                    disabled={working}
                                    onClick={() => void reviewProgress(update, "REJECTED")}
                                  >
                                    <span aria-hidden="true">×</span>
                                    {t("progress.rejectAction")}
                                  </button>
                                </div>
                              </div>
                            ) : null}

                            {update.status === "APPROVED" ? (
                              <div className="progress-cost-loop">
                                <div>
                                  <strong>{t("progress.costLoopTitle")}</strong>
                                  <p>{t("progress.costLoopMessage")}</p>
                                </div>
                                <Link
                                  className="button button-secondary"
                                  href={`/cost-control?projectId=${encodeURIComponent(projectId)}`}
                                >
                                  {t("progress.viewCostImpact")}
                                </Link>
                              </div>
                            ) : null}
                          </article>
                        </li>
                      );
                    })}
                  </ol>
                ) : null}
              </section>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
