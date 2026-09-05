import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReconCore — AI Finance Controller",
  description: "Run the books and the cash position with evidence-backed reconciliation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
