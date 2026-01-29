import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ForensicSidebar from "./components/ForensicSidebar";
import Providers from "./components/Providers";
import GlobalTools from "@/components/GlobalTools";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zenith Forensic",
  description: "Enterprise Forensic Accounting Suite",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#020617",
};

import ProjectGate from "./components/ProjectGate";
import { ForensicNotificationProvider } from "@/components/ForensicNotificationProvider";

import ForensicErrorBoundary from "./components/ForensicErrorBoundary";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-slate-950`}
      >
        <Providers>
          <ForensicNotificationProvider>
            <ProjectGate>
              <div className="flex min-h-screen">
                <ForensicSidebar />
                <main className="flex-1 overflow-y-auto">
                   <ForensicErrorBoundary>
                      {children}
                   </ForensicErrorBoundary>
                </main>
              </div>
            </ProjectGate>
            <GlobalTools />
          </ForensicNotificationProvider>
        </Providers>
      </body>
    </html>
  );
}
