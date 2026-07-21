"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { clientApi } from "../lib/client-api";
import type { MessageKey } from "../lib/i18n";
import type {
  ProjectDetailPayload,
  ProjectStatus,
  WbsNodeRecord,
} from "../lib/types";
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

function WbsBranch({
  node,
  byParent,
  depth,
}: {
  node: WbsNodeRecord;
  byParent: Map<string | null, WbsNodeRecord[]>;
  depth: number;
}) {
  const { t, locale } = useI18n();
  const children = byParent.get(node.id) ?? [];
  const progress = node.progressUpdates[0]?.percent;
  const formatter = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    maximumFractionDigits: 1,
  });

  return (
    <li className="wbs-node" data-depth={depth}>
      <div className="wbs-node-card">
        <div className="wbs-node-rail" aria-hidden="true">
          <span />
        </div>
        <div className="wbs-node-main">
          <div>
            <code>{node.code}</code>
            <h3>{node.name}</h3>
          </div>
          <dl className="wbs-metrics">
            <div>
              <dt>{t("project.progress")}</dt>
              <dd>{progress ? `${formatter.format(Number(progress))}%` : t("common.notAvailable")}</dd>
            </div>
            <div>
              <dt>{t("project.children")}</dt>
              <dd>{node._count.children}</dd>
            </div>
            <div>
              <dt>{t("project.workItems")}</dt>
              <dd>{node._count.workItems}</dd>
            </div>
            <div>
              <dt>{t("project.bimLinks")}</dt>
              <dd>{node._count.bimLinks}</dd>
            </div>
          </dl>
        </div>
      </div>
      {children.length ? (
        <ul className="wbs-children">
          {children.map((child) => (
            <WbsBranch key={child.id} node={child} byParent={byParent} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ProjectDetail({ projectId }: { projectId: string }) {
  const { t, locale } = useI18n();
  const [payload, setPayload] = useState<ProjectDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setPayload(await clientApi<ProjectDetailPayload>(`/api/projects/${projectId}`));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const byParent = useMemo(() => {
    const index = new Map<string | null, WbsNodeRecord[]>();
    for (const node of payload?.wbs ?? []) {
      const siblings = index.get(node.parentId) ?? [];
      siblings.push(node);
      index.set(node.parentId, siblings);
    }
    return index;
  }, [payload]);

  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    dateStyle: "medium",
  });

  if (loading) return <main className="workspace-page"><LoadingState /></main>;
  if (failed || !payload) return <main className="workspace-page"><ErrorState onRetry={load} /></main>;

  const { project, wbs } = payload;
  const roots = byParent.get(null) ?? [];
  const date = (value: string | null) =>
    value ? dateFormatter.format(new Date(value)) : t("common.notAvailable");

  return (
    <main className="workspace-page">
      <Link className="text-link back-link" href="/projects">
        {t("project.back")}
      </Link>
      <section className="project-hero-card">
        <div className="governance-rail hero-rail" aria-hidden="true">
          <span>{project.code}</span>
          <i />
        </div>
        <div className="project-hero-content">
          <div className="project-card-topline">
            <p className="eyebrow">{t("project.eyebrow")}</p>
            <StatusBadge status={project.status} />
          </div>
          <h1>{project.name}</h1>
          <p className="project-description">
            {project.description || t("common.notAvailable")}
          </p>
          <dl className="project-facts">
            <div>
              <dt>{t("project.start")}</dt>
              <dd>{date(project.startDate)}</dd>
            </div>
            <div>
              <dt>{t("project.target")}</dt>
              <dd>{date(project.targetDate)}</dd>
            </div>
            <div>
              <dt>{t("project.updated")}</dt>
              <dd>{date(project.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="wbs-section">
        <header className="section-heading">
          <div>
            <h2>{t("project.wbsTitle")}</h2>
            <p>{t("project.wbsSubtitle")}</p>
          </div>
          <span className="count-chip">{wbs.length}</span>
        </header>
        {wbs.length === 0 ? (
          <EmptyState
            titleKey="project.wbsEmptyTitle"
            messageKey="project.wbsEmptyMessage"
          />
        ) : (
          <ul className="wbs-tree">
            {roots.map((node) => (
              <WbsBranch key={node.id} node={node} byParent={byParent} depth={0} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
