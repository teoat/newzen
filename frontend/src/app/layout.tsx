import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from '@clerk/nextjs'
import { MockClerkProvider } from './components/MockClerkProvider'
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
import { OfflineIndicator } from "../components/OfflineIndicator"
import { SimulationBanner } from "../components/SimulationBanner"

export const metadata: Metadata = {
// ... (rest of metadata remains same)
}

import AppLayout from "./components/AppLayout"
import SessionInitializer from "./components/SessionInitializer"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isTest = process.env.NEXT_PUBLIC_APP_ENV === 'test';
  const Provider = isTest ? MockClerkProvider : ClerkProvider;

  return (
    <Provider>
      <SessionInitializer />
      <html lang="en" suppressHydrationWarning>
        <body className="bg-slate-950 text-slate-50 antialiased font-sans">
          <div id="zenith-app-root">
            <ClientProviders>
              <ProjectGate>
                <AppLayout>
                  {children}
                </AppLayout>
              </ProjectGate>
            </ClientProviders>
          </div>
          <OfflineIndicator />
          <SimulationBanner />
        </body>
      </html>
    </Provider>
  );
}
