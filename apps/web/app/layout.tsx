import type { ReactNode } from "react";
import "./styles.css";

export const metadata = {
  title: "R4C",
  description: "Real Estate Development Control Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
