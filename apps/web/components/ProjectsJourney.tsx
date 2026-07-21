"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { clientApi } from "../lib/client-api";
import type { MessageKey } from "../lib/i18n";
import type { ProjectRecord, ProjectStatus } from "../lib/types";
import { useI18n } from "./I18nProvider";
import { EmptyState, ErrorState, LoadingState } from "./StatePrimitives";

function StatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useI18n();
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span aria-hidden="true" />
      {t(`status.${status}` as MessageKey)}
    </span>
  );
}

export function ProjectsJourney() {
  const { t, locale } = useI18n();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setProjects(await clientApi<ProjectRecord[]>("/api/projects"));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setFailed(false);
    setCreated(false);
    const form = new FormData(event.currentTarget);
    const payload = {
      code: String(form.get("code") ?? ""),
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? "") || undefined,
      startDate: String(form.get("startDate") ?? "") || undefined,
      targetDate: String(form.get("targetDate") ?? "") || undefined,
    };
    try {
      const project = await clientApi<ProjectRecord>("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      setProjects((current) => [
        { ...project, _count: { wbsNodes: 0, workItems: 0 } },
        ...current,
      ]);
      setCreated(true);
      setShowCreate(false);
      event.currentTarget.reset();
    } catch {
      setFailed(true);
    } finally {
      setCreating(false);
    }
  }

  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    dateStyle: "medium",
  });

  return (
    <main className="workspace-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">{t("projects.eyebrow")}</p>
          <h1>{t("projects.title")}</h1>
          <p>{t("projects.subtitle")}</p>
        </div>
        <button
          className="button button-primary"
          type="button"
          onClick={() => setShowCreate((current) => !current)}
        >
          {t("projects.new")}
        </button>
      </header>

      {showCreate ? (
        <section className="create-panel">
          <div className="panel-heading">
            <span className="governance-number" aria-hidden="true">NEW</span>
            <h2>{t("projects.createTitle")}</h2>
          </div>
          <form className="project-form" onSubmit={createProject}>
            <label>
              <span>{t("projects.code")}</span>
              <input name="code" type="text" minLength={2} maxLength={30} required />
            </label>
            <label>
              <span>{t("projects.name")}</span>
              <input name="name" type="text" minLength={2} maxLength={160} required />
            </label>
            <label className="field-wide">
              <span>{t("projects.description")}</span>
              <textarea name="description" rows={3} />
            </label>
            <label>
              <span>{t("projects.startDate")}</span>
              <input name="startDate" type="date" />
            </label>
            <label>
              <span>{t("projects.targetDate")}</span>
              <input name="targetDate" type="date" />
            </label>
            <div className="form-actions field-wide">
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setShowCreate(false)}
              >
                {t("common.cancel")}
              </button>
              <button className="button button-primary" type="submit" disabled={creating}>
                {creating ? t("projects.submitting") : t("projects.submit")}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {created ? <div className="success-banner">{t("projects.createSuccess")}</div> : null}
      {loading ? <LoadingState /> : null}
      {!loading && failed ? <ErrorState onRetry={load} /> : null}
      {!loading && !failed && projects.length === 0 ? (
        <EmptyState
          titleKey="projects.emptyTitle"
          messageKey="projects.emptyMessage"
          action={
            <button className="button button-primary" type="button" onClick={() => setShowCreate(true)}>
              {t("projects.emptyAction")}
            </button>
          }
        />
      ) : null}

      {!loading && !failed && projects.length > 0 ? (
        <section className="project-grid">
          {projects.map((project, index) => (
            <article className="project-card" key={project.id}>
              <div className="governance-rail" aria-hidden="true">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <i />
              </div>
              <div className="project-card-body">
                <div className="project-card-topline">
                  <code>{project.code}</code>
                  <StatusBadge status={project.status} />
                </div>
                <h2>{project.name}</h2>
                <p>{project.description || t("common.notAvailable")}</p>
                <dl className="project-metrics">
                  <div>
                    <dt>{t("projects.wbsCount")}</dt>
                    <dd>{project._count?.wbsNodes ?? 0}</dd>
                  </div>
                  <div>
                    <dt>{t("projects.workItemCount")}</dt>
                    <dd>{project._count?.workItems ?? 0}</dd>
                  </div>
                  <div>
                    <dt>{t("projects.updated")}</dt>
                    <dd>{dateFormatter.format(new Date(project.updatedAt))}</dd>
                  </div>
                </dl>
                <Link className="button button-secondary card-link" href={`/projects/${project.id}`}>
                  {t("projects.open")}
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
