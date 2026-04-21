import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Providers } from "./providers";
import { ServiceWorkerRegister } from "./sw-register";

export const metadata: Metadata = {
  title: "Meeting Room Reservation",
  description: "Progressive Web Application for meeting room reservation",
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
          <ServiceWorkerRegister />
          <Header />
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}