'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { ToastProvider } from "../../ui/toast";
import { ForensicNotificationProvider } from "../../components/ForensicNotificationProvider";
import React, { useEffect } from "react";
import { setForensicSessionSecret } from "../../lib/crypto";

function SessionInitializer({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  
  useEffect(() => {
    if (session?.accessToken) {
      setForensicSessionSecret(session.accessToken);
    }
  }, [session]);

  return <>{children}</>;
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionInitializer>
        <ToastProvider>
          <ForensicNotificationProvider>
            {children}
          </ForensicNotificationProvider>
        </ToastProvider>
      </SessionInitializer>
    </SessionProvider>
  );
}
