import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { I18nProvider } from "../components/I18nProvider";
import {
  dictionaries,
  directionFor,
  normalizeLocale,
} from "../lib/i18n";
import { LOCALE_COOKIE } from "../lib/server-session";
import "@fontsource/noto-kufi-arabic/400.css";
import "@fontsource/noto-kufi-arabic/500.css";
import "@fontsource/noto-kufi-arabic/600.css";
import "@fontsource/noto-kufi-arabic/700.css";
import "./styles.css";

export const metadata = {
  title: "R4C",
  description: "Real Estate Development Control Platform",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  const locale = normalizeLocale(store.get(LOCALE_COOKIE)?.value);
  const direction = directionFor(locale);

  return (
    <html lang={locale} dir={direction}>
      <body>
        <I18nProvider
          locale={locale}
          direction={direction}
          messages={dictionaries[locale]}
        >
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
