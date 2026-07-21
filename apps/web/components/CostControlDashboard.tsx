"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { clientApi } from "../lib/client-api";
import type { MessageKey } from "../lib/i18n";
import type {
  CostControlNode,
  CostControlResponse,
  ProjectRecord,
} from "../lib/types";
import { useI18n } from "./I18nProvider";
import { EmptyState, ErrorState, LoadingState } from "./StatePrimitives";

type SortKey =
  | "code"
  | "name"
  | "budget"
  | "plannedProgress"
  | "actualProgress"
  | "plannedValue"
  | "earnedValue"
  | "actualCost"
  | "committed"
  | "costVariance"
  | "scheduleVariance"
  | "forecastExposure";

type SortDirection = "ascending" | "descending";
type DecimalParts = { sign: -1 | 1; whole: string; fraction: string };
type RatioStyle = CSSProperties & { "--ratio-position": string };

const columns: Array<{
  key: SortKey;
  label: MessageKey;
  kind: "text" | "number" | "money";
}> = [
  { key: "code", label: "cost.table.code", kind: "text" },
  { key: "name", label: "cost.table.name", kind: "text" },
  { key: "budget", label: "cost.table.budget", kind: "money" },
  { key: "plannedProgress", label: "cost.table.plannedProgress", kind: "number" },
  { key: "actualProgress", label: "cost.table.actualProgress", kind: "number" },
  { key: "plannedValue", label: "cost.table.pv", kind: "money" },
  { key: "earnedValue", label: "cost.table.ev", kind: "money" },
  { key: "actualCost", label: "cost.table.ac", kind: "money" },
  { key: "committed", label: "cost.table.committed", kind: "money" },
  { key: "costVariance", label: "cost.table.cv", kind: "money" },
  { key: "scheduleVariance", label: "cost.table.sv", kind: "money" },
  { key: "forecastExposure", label: "cost.table.forecast", kind: "money" },
];

function todayForInput() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function parseDecimal(value: string): DecimalParts {
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) return { sign: 1, whole: "0", fraction: "" };
  const whole = match[2]!.replace(/^0+(?=\d)/, "") || "0";
  const fraction = match[3] ?? "";
  const nonZero = /[1-9]/.test(`${whole}${fraction}`);
  return {
    sign: match[1] === "-" && nonZero ? -1 : 1,
    whole,
    fraction,
  };
}

function compareMagnitude(left: DecimalParts, right: DecimalParts) {
  if (left.whole.length !== right.whole.length) {
    return left.whole.length < right.whole.length ? -1 : 1;
  }
  if (left.whole !== right.whole) return left.whole < right.whole ? -1 : 1;
  const width = Math.max(left.fraction.length, right.fraction.length);
  const leftFraction = left.fraction.padEnd(width, "0");
  const rightFraction = right.fraction.padEnd(width, "0");
  if (leftFraction === rightFraction) return 0;
  return leftFraction < rightFraction ? -1 : 1;
}

function compareDecimalStrings(leftValue: string, rightValue: string) {
  const left = parseDecimal(leftValue);
  const right = parseDecimal(rightValue);
  if (left.sign !== right.sign) return left.sign < right.sign ? -1 : 1;
  const magnitude = compareMagnitude(left, right);
  return left.sign === -1 ? -magnitude : magnitude;
}

function decimalSign(value: string) {
  return compareDecimalStrings(value, "0");
}

function formatDecimalString(value: string, locale: "en" | "ar") {
  const parsed = parseDecimal(value);
  const localeTag = locale === "ar" ? "ar-SA" : "en-GB";
  const integerFormatter = new Intl.NumberFormat(localeTag, {
    maximumFractionDigits: 0,
    useGrouping: true,
  });
  const digitFormatter = new Intl.NumberFormat(localeTag, { useGrouping: false });
  const partsFormatter = new Intl.NumberFormat(localeTag, {
    minimumFractionDigits: 1,
  });
  const decimalSeparator =
    partsFormatter.formatToParts(1.1).find((part) => part.type === "decimal")?.value ?? ".";
  const minusSign =
    partsFormatter.formatToParts(-1).find((part) => part.type === "minusSign")?.value ?? "-";
  const digits = Array.from({ length: 10 }, (_, digit) => digitFormatter.format(digit));
  const localizedFraction = parsed.fraction
    .padEnd(2, "0")
    .split("")
    .map((digit) => digits[Number(digit)] ?? digit)
    .join("");
  const prefix = parsed.sign === -1 ? minusSign : "";
  return `${prefix}${integerFormatter.format(BigInt(parsed.whole))}${decimalSeparator}${localizedFraction}`;
}

function MoneyValue({
  value,
  currency,
  locale,
}: {
  value: string | null;
  currency: string;
  locale: "en" | "ar";
}) {
  if (value === null) return <span className="metric-unavailable">—</span>;
  return (
    <bdi className="money-value" dir="ltr">
      {currency} {formatDecimalString(value, locale)}
    </bdi>
  );
}

function RatioAnchor({
  kind,
  value,
}: {
  kind: "cpi" | "spi";
  value: number | null;
}) {
  const { t, locale } = useI18n();
  const favorable = value !== null && value >= 1;
  const statusKey: MessageKey =
    value === null
      ? "cost.status.notCalculated"
      : kind === "cpi"
        ? favorable
          ? "cost.status.onBudget"
          : "cost.status.overBudget"
        : favorable
          ? "cost.status.onSchedule"
          : "cost.status.behindSchedule";
  const titleKey: MessageKey = kind === "cpi" ? "cost.cpi" : "cost.spi";
  const descriptionKey: MessageKey =
    kind === "cpi" ? "cost.cpiDescription" : "cost.spiDescription";
  const position = value === null ? 50 : Math.max(0, Math.min(100, (value - 0.5) * 100));
  const style: RatioStyle = { "--ratio-position": `${position}%` };
  const ratioFormatter = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <article
      className={`ratio-anchor ${value === null ? "ratio-partial" : favorable ? "ratio-favorable" : "ratio-adverse"}`}
      style={style}
    >
      <div className="ratio-heading">
        <div>
          <p>{t(titleKey)}</p>
          <span>{t(descriptionKey)}</span>
        </div>
        <strong className="ratio-value">
          {value === null ? "—" : ratioFormatter.format(value)}
        </strong>
      </div>
      <div className="ratio-rail" aria-hidden="true">
        <span className="ratio-benchmark" />
        <span className="ratio-marker" />
      </div>
      <div className="ratio-scale" aria-hidden="true">
        <span>0.50</span>
        <strong>{t("cost.benchmark")}</strong>
        <span>1.50</span>
      </div>
      <p className="ratio-status">
        <span aria-hidden="true">{value === null ? "—" : favorable ? "✓" : "!"}</span>
        {t(statusKey)}
      </p>
    </article>
  );
}

function metricTone(value: string | null) {
  if (value === null) return "neutral";
  const sign = decimalSign(value);
  return sign > 0 ? "favorable" : sign < 0 ? "adverse" : "neutral";
}

function nodeNeedsAttention(node: CostControlNode) {
  return (
    decimalSign(node.costVariance) < 0 ||
    decimalSign(node.scheduleVariance) < 0 ||
    compareDecimalStrings(node.forecastExposure, node.budget) > 0
  );
}

export function CostControlDashboard() {
  const { t, locale } = useI18n();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectId, setProjectId] = useState("");
  const [asOf, setAsOf] = useState(todayForInput);
  const [control, setControl] = useState<CostControlResponse | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingControl, setLoadingControl] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "code",
    direction: "ascending",
  });

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setFailed(false);
    try {
      const result = await clientApi<ProjectRecord[]>("/api/projects");
      setProjects(result);
      setProjectId((current) =>
        current && result.some((project) => project.id === current)
          ? current
          : result[0]?.id ?? "",
      );
    } catch {
      setFailed(true);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const loadControl = useCallback(async () => {
    if (!projectId) {
      setControl(null);
      return;
    }
    setLoadingControl(true);
    setFailed(false);
    try {
      const query = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
      setControl(
        await clientApi<CostControlResponse>(
          `/api/projects/${encodeURIComponent(projectId)}/cost-control${query}`,
        ),
      );
    } catch {
      setFailed(true);
      setControl(null);
    } finally {
      setLoadingControl(false);
    }
  }, [asOf, projectId]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    void loadControl();
  }, [loadControl]);

  const sortedNodes = useMemo(() => {
    if (!control) return [];
    const column = columns.find((candidate) => candidate.key === sort.key)!;
    return [...control.nodes].sort((left, right) => {
      const leftValue = left[sort.key];
      const rightValue = right[sort.key];
      let comparison = 0;
      if (column.kind === "money") {
        comparison = compareDecimalStrings(String(leftValue), String(rightValue));
      } else if (column.kind === "number") {
        comparison = Number(leftValue) - Number(rightValue);
      } else {
        comparison = String(leftValue).localeCompare(String(rightValue), locale);
      }
      return sort.direction === "ascending" ? comparison : -comparison;
    });
  }, [control, locale, sort]);

  function toggleSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  }

  const localeTag = locale === "ar" ? "ar-SA" : "en-GB";
  const percentFormatter = new Intl.NumberFormat(localeTag, {
    style: "percent",
    maximumFractionDigits: 1,
  });
  const dateFormatter = new Intl.DateTimeFormat(localeTag, { dateStyle: "medium" });
  const selectedProject = projects.find((project) => project.id === projectId);
  const partial = Boolean(
    control?.summary &&
      (control.summary.cpi === null ||
        control.summary.spi === null ||
        control.summary.estimateAtCompletion === null ||
        control.summary.estimateToComplete === null ||
        control.summary.varianceAtCompletion === null),
  );

  const moneyMetrics = control?.summary
    ? [
        { key: "bac", label: "cost.kpi.bac" as MessageKey, value: control.summary.budgetAtCompletion },
        { key: "pv", label: "cost.kpi.pv" as MessageKey, value: control.summary.plannedValue },
        { key: "ev", label: "cost.kpi.ev" as MessageKey, value: control.summary.earnedValue },
        { key: "ac", label: "cost.kpi.ac" as MessageKey, value: control.summary.actualCost },
        { key: "commitments", label: "cost.kpi.commitments" as MessageKey, value: control.summary.commitments },
        { key: "forecast", label: "cost.kpi.forecastExposure" as MessageKey, value: control.summary.forecastExposure },
        { key: "cv", label: "cost.kpi.cv" as MessageKey, value: control.summary.costVariance, signal: true },
        { key: "sv", label: "cost.kpi.sv" as MessageKey, value: control.summary.scheduleVariance, signal: true },
        { key: "eac", label: "cost.kpi.eac" as MessageKey, value: control.summary.estimateAtCompletion },
        { key: "etc", label: "cost.kpi.etc" as MessageKey, value: control.summary.estimateToComplete },
        { key: "vac", label: "cost.kpi.vac" as MessageKey, value: control.summary.varianceAtCompletion, signal: true },
      ]
    : [];

  return (
    <main className="workspace-page cost-control-page">
      <header className="page-heading cost-page-heading">
        <div>
          <p className="eyebrow">{t("cost.eyebrow")}</p>
          <h1>{t("cost.title")}</h1>
          <p>{t("cost.subtitle")}</p>
        </div>
      </header>

      {loadingProjects ? <LoadingState /> : null}
      {!loadingProjects && failed && !projects.length ? <ErrorState onRetry={loadProjects} /> : null}
      {!loadingProjects && !failed && projects.length === 0 ? (
        <EmptyState
          titleKey="cost.noProjectsTitle"
          messageKey="cost.noProjectsMessage"
          action={
            <Link className="button button-primary" href="/projects">
              {t("cost.goProjects")}
            </Link>
          }
        />
      ) : null}

      {!loadingProjects && projects.length > 0 ? (
        <>
          <section className="cost-controls" aria-label={t("cost.title")}>
            <label>
              <span>{t("cost.projectLabel")}</span>
              <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
                <option value="">{t("cost.projectPlaceholder")}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} · {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t("cost.asOfLabel")}</span>
              <input type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} />
            </label>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => void loadControl()}
              disabled={loadingControl || !projectId}
            >
              {t("cost.reload")}
            </button>
          </section>

          {loadingControl ? <LoadingState /> : null}
          {!loadingControl && failed ? <ErrorState onRetry={loadControl} /> : null}
          {!loadingControl && !failed && control && !control.budget ? (
            <EmptyState titleKey="cost.noBudgetTitle" messageKey="cost.noBudgetMessage" />
          ) : null}

          {!loadingControl && !failed && control?.budget && control.summary ? (
            <>
              <section className="cost-context-strip">
                <div>
                  <span>{t("cost.budgetContext")}</span>
                  <strong>{control.budget.name}</strong>
                </div>
                <dl>
                  <div>
                    <dt>{t("cost.revision")}</dt>
                    <dd>{control.budget.revision}</dd>
                  </div>
                  <div>
                    <dt>{t("cost.asOf")}</dt>
                    <dd>{dateFormatter.format(new Date(control.asOf))}</dd>
                  </div>
                  <div>
                    <dt>{t("cost.projectLabel")}</dt>
                    <dd>{selectedProject?.code ?? "—"}</dd>
                  </div>
                </dl>
              </section>

              <section className="control-axis-section">
                <header className="section-heading">
                  <div>
                    <p className="eyebrow">{t("cost.controlAxisTitle")}</p>
                    <h2>{t("cost.controlAxisTitle")}</h2>
                    <p>{t("cost.controlAxisSubtitle")}</p>
                  </div>
                </header>
                <div className="ratio-pair">
                  <RatioAnchor kind="cpi" value={control.summary.cpi} />
                  <RatioAnchor kind="spi" value={control.summary.spi} />
                </div>
              </section>

              {partial ? (
                <section className="cost-partial-state" role="status">
                  <span aria-hidden="true">i</span>
                  <div>
                    <h2>{t("cost.partialTitle")}</h2>
                    <p>{t("cost.partialMessage")}</p>
                  </div>
                </section>
              ) : null}

              <section className="cost-summary-section">
                <header className="section-heading">
                  <div>
                    <p className="eyebrow">{t("cost.summaryTitle")}</p>
                    <h2>{t("cost.summaryTitle")}</h2>
                    <p>{t("cost.summarySubtitle")}</p>
                  </div>
                </header>
                <div className="cost-metric-grid">
                  {moneyMetrics.map((metric) => {
                    const tone = metric.signal ? metricTone(metric.value) : "neutral";
                    const signalKey: MessageKey =
                      tone === "favorable"
                        ? "cost.metric.favorable"
                        : tone === "adverse"
                          ? "cost.metric.adverse"
                          : "cost.metric.neutral";
                    return (
                      <article className={`cost-metric metric-${tone}`} key={metric.key}>
                        <span>{t(metric.label)}</span>
                        <strong>
                          <MoneyValue
                            value={metric.value}
                            currency={control.budget.currency}
                            locale={locale}
                          />
                        </strong>
                        {metric.signal ? (
                          <small>
                            <span aria-hidden="true">
                              {tone === "favorable" ? "✓" : tone === "adverse" ? "!" : "—"}
                            </span>
                            {t(signalKey)}
                          </small>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="cost-table-section">
                <header className="section-heading">
                  <div>
                    <p className="eyebrow">{t("cost.tableTitle")}</p>
                    <h2>{t("cost.tableTitle")}</h2>
                    <p>{t("cost.tableSubtitle")}</p>
                  </div>
                </header>

                {sortedNodes.length === 0 ? (
                  <EmptyState titleKey="cost.table.emptyTitle" messageKey="cost.table.emptyMessage" />
                ) : (
                  <div className="cost-table-scroll">
                    <table className="cost-table">
                      <thead>
                        <tr>
                          <th scope="col">{t("cost.table.status")}</th>
                          {columns.map((column) => (
                            <th
                              key={column.key}
                              scope="col"
                              aria-sort={sort.key === column.key ? sort.direction : "none"}
                            >
                              <button
                                type="button"
                                onClick={() => toggleSort(column.key)}
                                aria-label={`${t("cost.sortBy")} ${t(column.label)}, ${
                                  sort.key === column.key && sort.direction === "ascending"
                                    ? t("cost.sortDescending")
                                    : t("cost.sortAscending")
                                }`}
                              >
                                {t(column.label)}
                                <span aria-hidden="true">
                                  {sort.key === column.key
                                    ? sort.direction === "ascending"
                                      ? "↑"
                                      : "↓"
                                    : "↕"}
                                </span>
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedNodes.map((node) => {
                          const adverse = nodeNeedsAttention(node);
                          return (
                            <tr className={adverse ? "cost-row-adverse" : ""} key={node.wbsNodeId}>
                              <td data-label={t("cost.table.status")}>
                                <span className={`variance-flag ${adverse ? "variance-adverse" : "variance-clear"}`}>
                                  <span aria-hidden="true">{adverse ? "!" : "✓"}</span>
                                  {t(adverse ? "cost.table.attention" : "cost.table.clear")}
                                </span>
                              </td>
                              <td data-label={t("cost.table.code")}><code>{node.code}</code></td>
                              <td data-label={t("cost.table.name")}><strong>{node.name}</strong></td>
                              <td data-label={t("cost.table.budget")}><MoneyValue value={node.budget} currency={control.budget.currency} locale={locale} /></td>
                              <td data-label={t("cost.table.plannedProgress")}><bdi dir="ltr">{percentFormatter.format(node.plannedProgress / 100)}</bdi></td>
                              <td data-label={t("cost.table.actualProgress")}><bdi dir="ltr">{percentFormatter.format(node.actualProgress / 100)}</bdi></td>
                              <td data-label={t("cost.table.pv")}><MoneyValue value={node.plannedValue} currency={control.budget.currency} locale={locale} /></td>
                              <td data-label={t("cost.table.ev")}><MoneyValue value={node.earnedValue} currency={control.budget.currency} locale={locale} /></td>
                              <td data-label={t("cost.table.ac")}><MoneyValue value={node.actualCost} currency={control.budget.currency} locale={locale} /></td>
                              <td data-label={t("cost.table.committed")}><MoneyValue value={node.committed} currency={control.budget.currency} locale={locale} /></td>
                              <td className={decimalSign(node.costVariance) < 0 ? "cell-adverse" : ""} data-label={t("cost.table.cv")}><MoneyValue value={node.costVariance} currency={control.budget.currency} locale={locale} /></td>
                              <td className={decimalSign(node.scheduleVariance) < 0 ? "cell-adverse" : ""} data-label={t("cost.table.sv")}><MoneyValue value={node.scheduleVariance} currency={control.budget.currency} locale={locale} /></td>
                              <td className={compareDecimalStrings(node.forecastExposure, node.budget) > 0 ? "cell-adverse" : ""} data-label={t("cost.table.forecast")}><MoneyValue value={node.forecastExposure} currency={control.budget.currency} locale={locale} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
