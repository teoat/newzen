import React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "../styles/forensic-theme.css"
import ClientProviders from "./components/ClientProviders"
import ProjectGate from "./components/ProjectGate"
import SidebarConditional from "./components/SidebarConditional"
import TopNav from "../components/TopNav"
import GlobalTools from "../components/GlobalTools"
import PerformanceTracker from "./components/PerformanceTracker"
import ErrorBoundary from "../components/ErrorBoundary"
import SentryErrorBoundary from "../components/SentryErrorBoundary"
import ServiceWorkerRegister from "./components/ServiceWorkerRegister"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const mono = Inter({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: "Zenith | Forensic Intelligence Platform",
  description: "Advanced AI-powered forensic analysis for financial investigations",
  // Sentry trace context for distributed tracing
  other: {
    "sentry-trace": process.env.NEXT_PUBLIC_SENTRY_TRACE || "",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${mono.variable} antialiased font-sans bg-slate-950`}
      >
        <ServiceWorkerRegister />
        <ClientProviders>
          <PerformanceTracker />
          <ProjectGate>
            <div className="flex flex-col min-h-screen">
              <TopNav />
              <div className="flex flex-1 pt-16 overflow-hidden">
                <SidebarConditional />
                <main className="flex-1 overflow-y-auto relative">
                  <SentryErrorBoundary>
                    {children}
                  </SentryErrorBoundary>
                </main>
              </div>
            </div>
            <GlobalTools />
          </ProjectGate>
        </ClientProviders>
      </body>
    </html>
  );
}
