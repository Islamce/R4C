"use client";

import type { ReactNode } from "react";
import { useI18n } from "./I18nProvider";
import type { MessageKey } from "../lib/i18n";

export function LoadingState() {
  const { t } = useI18n();
  return (
    <section className="state-card" aria-live="polite" aria-busy="true">
      <span className="state-spinner" aria-hidden="true" />
      <div>
        <h2>{t("state.loadingTitle")}</h2>
        <p>{t("state.loadingMessage")}</p>
      </div>
    </section>
  );
}

export function EmptyState({
  titleKey,
  messageKey,
  action,
}: {
  titleKey: MessageKey;
  messageKey: MessageKey;
  action?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <section className="state-card state-card-empty">
      <span className="state-marker" aria-hidden="true">0</span>
      <div>
        <h2>{t(titleKey)}</h2>
        <p>{t(messageKey)}</p>
        {action ? <div className="state-action">{action}</div> : null}
      </div>
    </section>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <section className="state-card state-card-error" role="alert">
      <span className="state-marker" aria-hidden="true">!</span>
      <div>
        <h2>{t("state.errorTitle")}</h2>
        <p>{t("state.errorMessage")}</p>
        <button className="button button-secondary" type="button" onClick={onRetry}>
          {t("common.retry")}
        </button>
      </div>
    </section>
  );
}
