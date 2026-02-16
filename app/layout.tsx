import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "S&P 500 Earnings Dashboard",
  description:
    "Real-time S&P 500 earnings tracker — beat/miss/in-line breakdown by sector. Updated weekly from FactSet data.",
  openGraph: {
    title: "S&P 500 Earnings Dashboard",
    description:
      "Real-time S&P 500 earnings tracker — beat/miss/in-line by sector.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
