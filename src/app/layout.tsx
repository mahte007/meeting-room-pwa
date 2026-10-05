import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Providers } from "./providers";
import { UpdatePrompt } from "@/components/pwa/update-prompt";
import { ICON_BACKGROUND } from "@/components/pwa/app-icon";
import { OfflineBanner } from "@/components/layout/offline-banner";

export const metadata: Metadata = {
  title: "Meeting Room Reservation",
  description: "Progressive Web Application for meeting room reservation",
  applicationName: "Meeting Rooms",
  // iOS ignores most of the web manifest and reads these tags instead.
  appleWebApp: {
    capable: true,
    title: "Meeting Rooms",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: ICON_BACKGROUND,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Providers>
          <Header />
          <OfflineBanner />
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          <UpdatePrompt />
        </Providers>
      </body>
    </html>
  );
}