import type { Metadata } from "next";
import "../provly-tokens.rem.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Provly Records",
  description:
    "Create, view, and delete job records scoped to the signed-in user.",
};

const fontsHref =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link href={fontsHref} rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
