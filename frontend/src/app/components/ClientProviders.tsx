'use client';

// import { SessionProvider, useSession } from "next-auth/react"; // Removed for Clerk migration
import { ToastProvider } from "@/components/ui/toast";
import { ForensicNotificationProvider } from "../../components/ForensicNotificationProvider";
import React, { useEffect } from "react";
import { setForensicSessionSecret } from "../../lib/crypto";

// SessionInitializer was used for setting forensic encryption keys. 
// We can migrate this logic to a useEffect inside the main layout or a new auth wrapper if needed.
// For now, removing the direct dependency on next-auth SessionProvider.

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ForensicNotificationProvider>
          {children}
        </ForensicNotificationProvider>
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
