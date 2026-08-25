import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Veltryx Admin",
  description: "Initial administrative shell for Veltryx OS kernel status."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}