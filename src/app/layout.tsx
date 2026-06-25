import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSV to JSON — Converter",
  description: "Upload a CSV file and instantly convert it to a clean JSON array. Download, copy, or preview your data.",
  keywords: ["csv", "json", "converter", "excel", "data", "transform"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
