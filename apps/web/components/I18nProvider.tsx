"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale, MessageKey } from "../lib/i18n";

interface I18nContextValue {
  locale: Locale;
  direction: "rtl" | "ltr";
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  direction,
  messages,
  children,
}: {
  locale: Locale;
  direction: "rtl" | "ltr";
  messages: Record<MessageKey, string>;
  children: ReactNode;
}) {
  return (
    <I18nContext.Provider
      value={{ locale, direction, t: (key) => messages[key] }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("I18nProvider is required");
  }
  return context;
}
