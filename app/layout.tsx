import "./globals.css";
import type { Metadata, Viewport } from "next";
import PWA from "@/components/PWA";

export const metadata: Metadata = {
  title: "Training Ledger",
  description: "A personal, condition-aware training and nutrition companion.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Ledger" },
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32" }, { url: "/icons/icon-192.png", sizes: "192x192" }],
    apple: "/icons/apple-touch-icon.png",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#101113",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}<PWA /></body>
    </html>
  );
}
